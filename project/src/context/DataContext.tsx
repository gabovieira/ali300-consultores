import React, { createContext, useContext, useState, useEffect } from 'react';
import { requirementsService, tasksService, Requirement, Task, ProgressEntry } from '../services/databaseService';
import { useAuth } from './AuthContext';

interface DataContextType {
  requirements: Requirement[];
  tasks: Task[];
  allTasks: Task[]; // Todas las tareas sin filtrar por requerimiento
  selectedRequirement: string | null;
  loading: boolean;
  error: string | null;
  
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, signOut } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedRequirement, setSelectedRequirementId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          const allTasksData = await tasksService.getAll();
          const userTasks = allTasksData.filter(task => 
            requirements.some(req => req.id === task.requirementId)
          );
          setAllTasks(userTasks);
          
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
  const addRequirement = async (data: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>, customDate?: Date): Promise<string | null> => {
    if (!currentUser) {
      setError('Debes iniciar sesión para crear un requerimiento');
      return null;
    }

    try {
      console.log('DataContext: Iniciando creación de requerimiento con datos:', data);
      console.log('DataContext: Usuario autenticado:', currentUser);
      
      // Crear objeto limpio del requerimiento (sin undefined)
      const requirementData: Omit<Requirement, 'id' | 'createdAt'> & { createdAt: Date } = {
        name: data.name,
        status: 'active',
        userId: currentUser.uid, // Añadir el ID del usuario actual
        createdAt: customDate || new Date()
      };
      
      // Añadir propiedades opcionales solo si están definidas
      if (data.tipo) {
        requirementData.tipo = data.tipo;
      }
      
      if (data.tieneEstimacion !== undefined) {
        requirementData.tieneEstimacion = data.tieneEstimacion;
        
        // Solo añadir tiempoEstimado si tieneEstimacion es true y hay un valor
        if (data.tieneEstimacion && data.tiempoEstimado) {
          requirementData.tiempoEstimado = data.tiempoEstimado;
        }
      }
      
      console.log('DataContext: Objeto de requerimiento limpio a crear:', requirementData);
      
      // Intentar crear el requerimiento
      const newId = await requirementsService.create(requirementData);
      console.log('DataContext: Requerimiento creado con ID:', newId);
      
      // Crear objeto para el estado local
      const newRequirement: Requirement = {
        id: newId,
        name: data.name,
        status: 'active',
        createdAt: requirementData.createdAt,
        userId: currentUser.uid
      };
      
      // Añadir propiedades opcionales al objeto del estado
      if (data.tipo) {
        newRequirement.tipo = data.tipo;
      }
      
      if (data.tieneEstimacion !== undefined) {
        newRequirement.tieneEstimacion = data.tieneEstimacion;
        
        if (data.tieneEstimacion && data.tiempoEstimado) {
          newRequirement.tiempoEstimado = data.tiempoEstimado;
        }
      }
      
      setRequirements([...requirements, newRequirement]);
      
      if (!selectedRequirement) {
        setSelectedRequirementId(newId);
      }
      
      return newId;
    } catch (err) {
      console.error('Error detallado al crear requisito:', err);
      
      if (err instanceof Error) {
        console.error('Mensaje de error:', err.message);
        console.error('Stack trace:', err.stack);
        setError(`Error al crear el requisito: ${err.message}`);
      } else {
        console.error('Tipo de error desconocido:', typeof err);
        setError('Error al crear el requisito. Por favor, intenta de nuevo.');
      }
      
      return null;
    }
  };

  const updateRequirement = async (id: string, data: Partial<Requirement>) => {
    try {
      await requirementsService.update(id, data);
      setRequirements(
        requirements.map(req => (req.id === id ? { ...req, ...data } : req))
      );
    } catch (err) {
      console.error('Error al actualizar requisito:', err);
      setError('Error al actualizar el requisito. Por favor, intenta de nuevo.');
    }
  };

  const deleteRequirement = async (id: string) => {
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
  };

  // Funciones para Tasks
  const addTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, customDate?: Date) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para crear una tarea');
      return null;
    }

    try {
      const newTask = await tasksService.create(data, customDate);
      // Actualizar la lista de tareas para el requerimiento seleccionado
      if (newTask.requirementId === selectedRequirement) {
        setTasks([...tasks, newTask]);
      }
      // Actualizar la lista de todas las tareas
      setAllTasks([...allTasks, newTask]);
      return newTask.id || null;
    } catch (err) {
      console.error('Error al crear la tarea:', err);
      setError('Error al crear la tarea. Por favor, intenta de nuevo.');
      return null;
    }
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    try {
      await tasksService.updateStatus(id, status);
      
      // Actualizar la lista de tareas para el requerimiento seleccionado
      const updatedTasks = tasks.map(task => 
        task.id === id ? { ...task, status, updatedAt: new Date() } : task
      );
      setTasks(updatedTasks);
      
      // Actualizar la lista de todas las tareas
      const updatedAllTasks = allTasks.map(task => 
        task.id === id ? { ...task, status, updatedAt: new Date() } : task
      );
      setAllTasks(updatedAllTasks);
    } catch (err) {
      console.error('Error al actualizar el estado de la tarea:', err);
      setError('Error al actualizar el estado de la tarea. Por favor, intenta de nuevo.');
    }
  };

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

  const deleteTask = async (id: string) => {
    try {
      await tasksService.remove(id);
      
      // Actualizar la lista de tareas para el requerimiento seleccionado
      setTasks(tasks.filter(task => task.id !== id));
      
      // Actualizar la lista de todas las tareas
      setAllTasks(allTasks.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error al eliminar la tarea:', err);
      setError('Error al eliminar la tarea. Por favor, intenta de nuevo.');
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

  const value: DataContextType = {
    requirements,
    tasks,
    allTasks,
    selectedRequirement,
    loading,
    error,
    setSelectedRequirement,
    addRequirement,
    updateRequirement,
    deleteRequirement,
    completeRequirement,
    addTask,
    updateTaskStatus,
    deleteTask,
    completeTask,
    addTaskProgress
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
}; 