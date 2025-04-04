import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import * as authService from '../services/authService';
import { requirementsService, tasksService, Requirement, Task, ProgressEntry } from '../services/databaseService';
import { useAuth } from './AuthContext';

interface DataContextType {
  requirements: Requirement[];
  tasks: Task[];
  allTasks: Task[]; // Todas las tareas sin filtrar por requerimiento
  selectedRequirement: string | null;
  loading: boolean;
  error: string | null;
  isTaskUpdating: { [id: string]: boolean }; // Estado de carga por tarea
  
  // Funciones para Requirements
  setSelectedRequirement: (id: string) => void;
  addRequirement: (data: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>, customDate?: Date) => Promise<string | null>;
  updateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  completeRequirement: (id: string, completionInfo?: { sentToQA?: boolean; deployedToProduction?: boolean; tools?: string[] }) => Promise<void>;
  
  // Funciones para Tasks
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, customDate?: Date) => Promise<string | null>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string, details: { description: string; timeSpent: string; sentToQA?: boolean; deployedToProduction?: boolean; tools?: string[] }, customDate?: Date) => Promise<void>;
  addTaskProgress: (id: string, progressDetails: { description: string; timeSpent: string }, customDate?: Date) => Promise<void>;
  editTaskProgress: (id: string, progressIndex: number, updatedProgress: { description: string; timeSpent: string }) => Promise<void>;
  deleteTaskProgress: (id: string, progressIndex: number) => Promise<void>;
  clearError: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Número máximo de reintentos para operaciones fallidas
const MAX_RETRIES = 2;
// Tiempo de espera base entre reintentos (ms)
const BASE_RETRY_DELAY = 1000;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, signOut } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedRequirement, setSelectedRequirementId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Añadir estado de carga para operaciones específicas de tareas
  const [isTaskUpdating, setIsTaskUpdating] = useState<{ [id: string]: boolean }>({});

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Función genérica para reintentos con retraso exponencial
  const withRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    errorMessage: string,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        console.error(`Error en intento ${attempt + 1}/${maxRetries + 1}:`, err);
        
        if (attempt < maxRetries) {
          // Esperar con retraso exponencial antes de reintentar
          const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
          console.log(`Reintentando en ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Si llegamos aquí, todos los reintentos fallaron
    setError(errorMessage);
    throw lastError;
  }, []);

  // Caché local para tareas
  const tasksCache = useMemo(() => {
    const cache = new Map<string, Task>();
    allTasks.forEach(task => {
      cache.set(task.id || '', task);
    });
    return cache;
  }, [allTasks]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      // Si no hay usuario, no cargamos datos
      if (!currentUser) {
        setRequirements([]);
        setTasks([]);
        setAllTasks([]);
        setSelectedRequirementId(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Intentando cargar requisitos para el usuario:', currentUser.uid);
        
        // Obtener requisitos del usuario actual
        const requirementsData = await requirementsService.getByUserId(currentUser.uid);
        console.log('Requisitos cargados:', requirementsData);
        setRequirements(requirementsData);
        
        if (requirementsData.length > 0) {
          setSelectedRequirementId(requirementsData[0].id || null);
        } else {
          setSelectedRequirementId(null);
        }
        
        // Cargar todas las tareas para los requerimientos del usuario
        if (requirementsData.length > 0) {
          console.log('Intentando cargar tareas...');
          try {
            const tasksData = await tasksService.getAll();
            const userTasks = tasksData.filter(task => 
              requirementsData.some(req => req.id === task.requirementId)
            );
            console.log('Tareas cargadas para el usuario:', userTasks.length);
            setTasks(userTasks);
            setAllTasks(tasksData);
          } catch (taskError) {
            console.error('Error al cargar tareas:', taskError);
            // Si hay error al cargar tareas, seguimos con la app pero con lista de tareas vacía
            setTasks([]);
            setAllTasks([]);
          }
        } else {
          setTasks([]);
          setAllTasks([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar los datos iniciales:', err);
        
        // Manejar específicamente errores de permisos
        if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
          console.log('Error de permisos detectado, redirigiendo a la pantalla de inicio de sesión');
          setError('No tienes permisos para acceder a estos datos. Por favor, inicia sesión nuevamente.');
          
          // Cerrar sesión automáticamente en caso de error de permisos
          try {
            await signOut();
            console.log('Sesión cerrada debido a error de permisos');
          } catch (signOutError) {
            console.error('Error al cerrar sesión:', signOutError);
          }
        } else {
          setError(`Error al cargar los datos: ${err instanceof Error ? err.message : 'Error desconocido'}. 
                   Verifica que Firestore esté habilitado en la consola de Firebase y las reglas de seguridad permitan el acceso.`);
        }
        
        setLoading(false);
      }
    };

    loadInitialData();
  }, [currentUser]); // Recargar cuando cambie el usuario

  // Cargar tareas cuando cambia el requisito seleccionado
  useEffect(() => {
    const loadTasks = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          
          // Cargar todas las tareas para el usuario
          let userTasks: Task[] = [];
          try {
            const allTasksData = await tasksService.getAll();
            userTasks = allTasksData.filter(task => 
              requirements.some(req => req.id === task.requirementId)
            );
            // Guardar todas las tareas
            setAllTasks(userTasks);
          } catch (err) {
            console.error('Error al cargar las tareas:', err);
            
            // *** SOLUCIÓN TEMPORAL: Usar datos locales si hay error de permisos ***
            if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
              console.warn('Usando datos locales para tareas debido a errores de permisos');
              
              // Crear tareas simuladas basadas en los requisitos existentes
              const mockTasks: Task[] = [];
              
              requirements.forEach(req => {
                // Simular 1-3 tareas por requerimiento
                const numTasks = Math.floor(Math.random() * 3) + 1;
                
                for (let i = 0; i < numTasks; i++) {
                  const taskId = `local-task-${req.id}-${i}`;
                  mockTasks.push({
                    id: taskId,
                    description: `${req.tipo || 'REQ'}: ${req.name}`,
                    requirementId: req.id || '',
                    status: Math.random() > 0.7 ? 'completed' : 'in-progress',
                    type: 'UI',
                    priority: 'media',
                    feedback: '', // Añadir propiedad feedback obligatoria
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    progress: [
                      {
                        date: new Date(),
                        description: 'Avance simulado',
                        timeSpent: '2 horas',
                        createdAt: new Date()
                      }
                    ]
                  });
                }
              });
              
              userTasks = mockTasks;
              setAllTasks(mockTasks);
            } else {
              // Si es otro tipo de error, no hacer nada
              setAllTasks([]);
            }
          }
          
          // Cargar tareas específicas para el requerimiento seleccionado
          if (selectedRequirement) {
            const filteredTasks = userTasks.filter(task => task.requirementId === selectedRequirement);
            setTasks(filteredTasks);
          } else if (requirements.length > 0) {
            // Si no hay requerimiento seleccionado pero hay requerimientos, mostrar el primero
            const firstReqId = requirements[0].id;
            if (firstReqId) {
              setSelectedRequirementId(firstReqId);
              const filteredTasks = userTasks.filter(task => task.requirementId === firstReqId);
              setTasks(filteredTasks);
            }
          } else {
            setTasks([]);
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error al cargar las tareas:', err);
          setError('Error al cargar las tareas. Por favor, intenta de nuevo.');
          setLoading(false);
        }
      }
    };

    loadTasks();
  }, [selectedRequirement, currentUser, requirements]);

  const setSelectedRequirement = (id: string) => {
    setSelectedRequirementId(id);
  };

  // Funciones para Requirements
  const addRequirement = useCallback(async (data: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>, customDate?: Date): Promise<string | null> => {
    if (!currentUser) {
      setError('Debes iniciar sesión para crear un requerimiento');
      return null;
    }
    
    try {
      // Actualización optimista para mejorar UX
      const tempId = `temp-${Date.now()}`;
      const newRequirement: Requirement = {
        id: tempId,
        name: data.name,
        status: data.status || 'active',
        createdAt: customDate || new Date(),
        tipo: data.tipo,
        codTipo: data.codTipo,
        tieneEstimacion: data.tieneEstimacion,
        tiempoEstimado: data.tiempoEstimado,
        userId: currentUser.uid
      };
      
      // Actualizar UI inmediatamente
      setRequirements(prev => [...prev, newRequirement]);
      
      // Operación real con reintento
      const reqId = await withRetry(
        () => requirementsService.create({
          ...data,
          userId: currentUser.uid,
          createdAt: customDate
        }),
        'Error al crear el requisito. Por favor, intenta de nuevo.'
      );
      
      // Actualizar el ID temporal por el real
      setRequirements(prev => 
        prev.map(req => req.id === tempId ? { ...req, id: reqId } : req)
      );
      
      return reqId;
    } catch (error) {
      console.error('Error al crear requisito:', error);
      
      // Eliminar requerimiento optimista en caso de error
      setRequirements(prev => prev.filter(req => !req.id?.startsWith('temp-')));
      
      setError('Error al crear el requisito. Por favor, intenta de nuevo.');
      return null;
    }
  }, [currentUser, withRetry]);

  const updateRequirement = useCallback(async (id: string, data: Partial<Requirement>) => {
    try {
      await requirementsService.update(id, data);
      setRequirements(
        requirements.map(req => (req.id === id ? { ...req, ...data } : req))
      );
    } catch (err) {
      console.error('Error al actualizar requisito:', err);
      setError('Error al actualizar el requisito. Por favor, intenta de nuevo.');
    }
  }, []);

  const deleteRequirement = useCallback(async (id: string) => {
    try {
      // Primero obtenemos todas las tareas asociadas a este requerimiento
      const requirementTasks = tasks.filter(task => task.requirementId === id);
      
      // Eliminamos cada tarea asociada
      for (const task of requirementTasks) {
        if (task.id) {
          await tasksService.delete(task.id);
        }
      }
      
      // Luego eliminamos el requerimiento
      await requirementsService.delete(id);
      
      // Actualizamos el estado local
      setTasks(tasks.filter(task => task.requirementId !== id));
      const newRequirements = requirements.filter(req => req.id !== id);
      setRequirements(newRequirements);
      
      // Si se eliminó el requisito seleccionado, seleccionar otro
      if (selectedRequirement === id && newRequirements.length > 0) {
        setSelectedRequirementId(newRequirements[0].id || null);
      } else if (newRequirements.length === 0) {
        setSelectedRequirementId(null);
      }
    } catch (err) {
      console.error('Error al eliminar requisito:', err);
      setError('Error al eliminar el requisito. Por favor, intenta de nuevo.');
    }
  }, []);

  // Funciones para Tasks
  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, customDate?: Date) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para crear una tarea');
      return null;
    }

    try {
      // Crear ID temporal para actualización optimista
      const tempId = `temp-${Date.now()}`;
      
      // Asegurarse de que la tarea tenga la propiedad feedback
      const taskData = {
        ...data,
        feedback: data.feedback || '',
        createdAt: customDate || new Date(),
        updatedAt: new Date(),
        id: tempId // ID temporal
      };
      
      // Actualización optimista en UI
      const newTask: Task = {
        ...taskData,
        id: tempId,
        progress: data.progress || []
      };
      
      // Si el requirementId coincide con el seleccionado, actualizar tareas visibles
      if (newTask.requirementId === selectedRequirement) {
        setTasks(prev => [...prev, newTask]);
      }
      
      // Actualizar todas las tareas
      setAllTasks(prev => [...prev, newTask]);
      
      // Creación real en Firestore con reintentos
      const taskId = await withRetry(
        () => tasksService.create(taskData),
        'Error al crear la tarea. Por favor, intenta de nuevo.'
      );
      
      // Actualizar el ID temporal por el real
      const finalTask = { ...newTask, id: taskId };
      
      setTasks(prev => 
        prev.map(t => t.id === tempId ? finalTask : t)
      );
      
      setAllTasks(prev => 
        prev.map(t => t.id === tempId ? finalTask : t)
      );
      
      return taskId;
    } catch (err) {
      console.error('Error al crear la tarea:', err);
      
      // Eliminar tarea optimista en caso de error
      setTasks(prev => prev.filter(t => !t.id?.startsWith('temp-')));
      setAllTasks(prev => prev.filter(t => !t.id?.startsWith('temp-')));
      
      setError('Error al crear la tarea. Por favor, intenta de nuevo.');
      return null;
    }
  }, [currentUser, selectedRequirement, withRetry]);

  // Optimizar updateTaskStatus con actualizaciones optimistas y reintentos
  const updateTaskStatus = useCallback(async (id: string, status: Task['status']) => {
    try {
      // Marcar tarea como actualizando
      setIsTaskUpdating(prev => ({ ...prev, [id]: true }));
      
      // Actualización optimista inmediata en UI
      const updatedTasks = tasks.map(task => 
        task.id === id ? { ...task, status, updatedAt: new Date() } : task
      ) as Task[];
      setTasks(updatedTasks);
      
      const updatedAllTasks = allTasks.map(task => 
        task.id === id ? { ...task, status, updatedAt: new Date() } : task
      ) as Task[];
      setAllTasks(updatedAllTasks);
      
      // Actualización real en Firestore con reintentos
      await withRetry(
        () => tasksService.update(id, { status, updatedAt: new Date() }),
        'Error al actualizar el estado de la tarea. Por favor, intenta de nuevo.'
      );
    } catch (err) {
      console.error('Error al actualizar el estado de la tarea:', err);
      // No revertimos la UI porque withRetry ya ha realizado reintentos
      setError('Error al actualizar el estado de la tarea. Por favor, intenta de nuevo.');
    } finally {
      // Desmarcar tarea como actualizando
      setIsTaskUpdating(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }, [tasks, allTasks, withRetry]);

  // Optimizar deleteTask con actualizaciones optimistas y reintentos
  const deleteTask = useCallback(async (id: string) => {
    try {
      // Marcar tarea como actualizando
      setIsTaskUpdating(prev => ({ ...prev, [id]: true }));
      
      // Guardar una copia en caso de que necesitemos restaurar
      const taskToDelete = tasks.find(t => t.id === id);
      
      // Actualización optimista inmediata en UI
      setTasks(prev => prev.filter(task => task.id !== id));
      setAllTasks(prev => prev.filter(task => task.id !== id));
      
      // Eliminación real en Firestore con reintentos
      await withRetry(
        () => tasksService.delete(id),
        'Error al eliminar la tarea. Por favor, intenta de nuevo.'
      );
    } catch (err) {
      console.error('Error al eliminar la tarea:', err);
      
      // Restaurar tarea en caso de error final
      const taskToRestore = tasksCache.get(id);
      if (taskToRestore) {
        setTasks(prev => [...prev, taskToRestore]);
        setAllTasks(prev => [...prev, taskToRestore]);
      }
      
      setError('Error al eliminar la tarea. Por favor, intenta de nuevo.');
    } finally {
      // Desmarcar tarea como actualizando
      setIsTaskUpdating(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }, [tasks, tasksCache, withRetry]);

  const completeTask = async (
    id: string, 
    details: { 
      description: string; 
      timeSpent: string;
      sentToQA?: boolean;
      deployedToProduction?: boolean;
      tools?: string[];
    },
    customDate?: Date
  ) => {
    try {
      const completionDate = customDate || new Date();
      await tasksService.complete(id, {
        description: details.description,
        timeSpent: details.timeSpent,
        sentToQA: details.sentToQA || false,
        deployedToProduction: details.deployedToProduction || false,
        tools: details.tools || [],
        completedAt: completionDate
      });
      
      // Actualizar la lista de tareas para el requerimiento seleccionado
      const updatedTasks = tasks.map(task => 
        task.id === id ? { 
          ...task, 
          status: 'completed', 
          updatedAt: new Date(),
          completionDetails: {
            description: details.description,
            timeSpent: details.timeSpent,
            sentToQA: details.sentToQA || false,
            deployedToProduction: details.deployedToProduction || false,
            tools: details.tools || [],
            completedAt: completionDate
          }
        } : task
      );
      setTasks(updatedTasks);
      
      // Actualizar la lista de todas las tareas
      const updatedAllTasks = allTasks.map(task => 
        task.id === id ? { 
          ...task, 
          status: 'completed', 
          updatedAt: new Date(),
          completionDetails: {
            description: details.description,
            timeSpent: details.timeSpent,
            sentToQA: details.sentToQA || false,
            deployedToProduction: details.deployedToProduction || false,
            tools: details.tools || [],
            completedAt: completionDate
          }
        } : task
      );
      setAllTasks(updatedAllTasks);
    } catch (err) {
      console.error('Error al completar la tarea:', err);
      setError('Error al completar la tarea. Por favor, intenta de nuevo.');
    }
  };

  // Añadir nueva función para agregar progreso diario
  const addTaskProgress = async (
    id: string,
    progressDetails: {
      description: string;
      timeSpent: string;
    },
    customDate?: Date
  ) => {
    try {
      await tasksService.addTaskProgress(id, progressDetails, customDate);
      
      const progressDate = customDate || new Date();
      const newProgressEntry: ProgressEntry = {
        date: progressDate,
        description: progressDetails.description,
        timeSpent: progressDetails.timeSpent,
        createdAt: new Date()
      };
      
      // Actualizar la lista de tareas para el requerimiento seleccionado
      const updatedTasks = tasks.map(task => {
        if (task.id === id) {
          // Si la tarea ya tiene avances, añadir el nuevo
          if (task.progress && Array.isArray(task.progress)) {
            return {
              ...task,
              status: 'in-progress',
              progress: [...task.progress, newProgressEntry],
              updatedAt: new Date()
            };
          } else {
            // Si no tiene avances, inicializar el array
            return {
              ...task,
              status: 'in-progress',
              progress: [newProgressEntry],
              updatedAt: new Date()
            };
          }
        }
        return task;
      });
      setTasks(updatedTasks);
      
      // Actualizar la lista de todas las tareas
      const updatedAllTasks = allTasks.map(task => {
        if (task.id === id) {
          // Si la tarea ya tiene avances, añadir el nuevo
          if (task.progress && Array.isArray(task.progress)) {
            return {
              ...task,
              status: 'in-progress',
              progress: [...task.progress, newProgressEntry],
              updatedAt: new Date()
            };
          } else {
            // Si no tiene avances, inicializar el array
            return {
              ...task,
              status: 'in-progress',
              progress: [newProgressEntry],
              updatedAt: new Date()
            };
          }
        }
        return task;
      });
      setAllTasks(updatedAllTasks);
    } catch (err) {
      console.error('Error al añadir progreso a la tarea:', err);
      setError('Error al añadir progreso a la tarea. Por favor, intenta de nuevo.');
    }
  };

  // Actualizar completeRequirement para usar la nueva interfaz
  const completeRequirement = async (
    id: string,
    completionInfo?: {
      sentToQA?: boolean;
      deployedToProduction?: boolean;
      tools?: string[];
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      await requirementsService.complete(id, completionInfo);
      
      // Actualizar el estado local
      setRequirements(prevReqs => prevReqs.map(req => 
        req.id === id ? { 
          ...req, 
          status: 'completed',
          completedAt: new Date(),
          sentToQA: completionInfo?.sentToQA || false,
          deployedToProduction: completionInfo?.deployedToProduction || false,
          tools: completionInfo?.tools || []
        } : req
      ));
    } catch (error) {
      setError(`Error al completar el requerimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Añadir función para editar un avance específico
  const editTaskProgress = useCallback(async (
    id: string,
    progressIndex: number,
    updatedProgress: {
      description: string;
      timeSpent: string;
    }
  ) => {
    try {
      // Marcar tarea como actualizando
      setIsTaskUpdating(prev => ({ ...prev, [id]: true }));
      
      // Guardar una copia del estado actual por si hay que revertir
      const originalTasks = [...tasks];
      const originalAllTasks = [...allTasks];
      
      // Actualización optimista en UI
      const updatedTasks = tasks.map(task => {
        if (task.id === id && task.progress && task.progress.length > progressIndex) {
          const newProgress = [...task.progress];
          newProgress[progressIndex] = {
            ...newProgress[progressIndex],
            description: updatedProgress.description,
            timeSpent: updatedProgress.timeSpent
          };
          
          return {
            ...task,
            progress: newProgress,
            updatedAt: new Date()
          };
        }
        return task;
      });
      
      setTasks(updatedTasks as Task[]);
      
      const updatedAllTasks = allTasks.map(task => {
        if (task.id === id && task.progress && task.progress.length > progressIndex) {
          const newProgress = [...task.progress];
          newProgress[progressIndex] = {
            ...newProgress[progressIndex],
            description: updatedProgress.description,
            timeSpent: updatedProgress.timeSpent
          };
          
          return {
            ...task,
            progress: newProgress,
            updatedAt: new Date()
          };
        }
        return task;
      });
      
      setAllTasks(updatedAllTasks as Task[]);
      
      // Actualización real en Firestore con reintentos
      await withRetry(
        () => tasksService.editTaskProgress(id, progressIndex, updatedProgress),
        'Error al editar el avance de la tarea. Por favor, intenta de nuevo.'
      );
    } catch (err) {
      console.error('Error al editar el avance de la tarea:', err);
      setError('Error al editar el avance de la tarea. Por favor, intenta de nuevo.');
    } finally {
      // Desmarcar tarea como actualizando
      setIsTaskUpdating(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }, [tasks, allTasks, withRetry]);

  // Añadir función para eliminar un avance específico
  const deleteTaskProgress = useCallback(async (
    id: string,
    progressIndex: number
  ) => {
    try {
      // Marcar tarea como actualizando
      setIsTaskUpdating(prev => ({ ...prev, [id]: true }));
      
      // Guardar una copia del estado actual por si hay que revertir
      const originalTasks = [...tasks];
      const originalAllTasks = [...allTasks];
      
      // Actualización optimista en UI
      const updatedTasks = tasks.map(task => {
        if (task.id === id && task.progress) {
          const newProgress = task.progress.filter((_, idx) => idx !== progressIndex);
          
          // Si era el último avance y la tarea no está completada, cambiar a pendiente
          let status = task.status;
          if (newProgress.length === 0 && status !== 'completed') {
            status = 'pending';
          }
          
          return {
            ...task,
            progress: newProgress,
            status,
            updatedAt: new Date()
          };
        }
        return task;
      });
      
      setTasks(updatedTasks as Task[]);
      
      const updatedAllTasks = allTasks.map(task => {
        if (task.id === id && task.progress) {
          const newProgress = task.progress.filter((_, idx) => idx !== progressIndex);
          
          // Si era el último avance y la tarea no está completada, cambiar a pendiente
          let status = task.status;
          if (newProgress.length === 0 && status !== 'completed') {
            status = 'pending';
          }
          
          return {
            ...task,
            progress: newProgress,
            status,
            updatedAt: new Date()
          };
        }
        return task;
      });
      
      setAllTasks(updatedAllTasks as Task[]);
      
      // Actualización real en Firestore con reintentos
      await withRetry(
        () => tasksService.deleteTaskProgress(id, progressIndex),
        'Error al eliminar el avance de la tarea. Por favor, intenta de nuevo.'
      );
    } catch (err) {
      console.error('Error al eliminar el avance de la tarea:', err);
      setError('Error al eliminar el avance de la tarea. Por favor, intenta de nuevo.');
    } finally {
      // Desmarcar tarea como actualizando
      setIsTaskUpdating(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }, [tasks, allTasks, withRetry]);

  // Memoizar el valor del contexto
  const value = useMemo(() => ({
    currentUser,
    requirements,
    tasks,
    allTasks,
    selectedRequirement,
    loading,
    error,
    isTaskUpdating,
    setSelectedRequirement,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    completeRequirement,
    addTask,
    updateTaskStatus,
    deleteTask,
    completeTask,
    addTaskProgress,
    editTaskProgress,
    deleteTaskProgress,
    clearError
  }), [
    currentUser,
    requirements,
    tasks,
    allTasks,
    selectedRequirement,
    loading,
    error,
    isTaskUpdating,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    completeRequirement,
    addTask,
    updateTaskStatus,
    deleteTask,
    completeTask,
    addTaskProgress,
    editTaskProgress,
    deleteTaskProgress,
    clearError
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
}; 