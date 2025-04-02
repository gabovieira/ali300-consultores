import React, { createContext, useContext, useState, useEffect } from 'react';
import { requirementsService, tasksService, Requirement, Task } from '../services/databaseService';
import { useAuth } from './AuthContext';

interface DataContextType {
  requirements: Requirement[];
  tasks: Task[];
  selectedRequirement: string | null;
  loading: boolean;
  error: string | null;
  
  // Funciones para Requirements
  setSelectedRequirement: (id: string) => void;
  addRequirement: (requirement: { name: string; tipo?: Requirement['tipo']; tieneEstimacion?: boolean; tiempoEstimado?: string }) => Promise<string | undefined>;
  updateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
  completeRequirement: (id: string) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  
  // Funciones para Tasks
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  completeTask: (id: string, details: { description: string; timeSpent: string }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, signOut } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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
          } catch (taskError) {
            console.error('Error al cargar tareas:', taskError);
            // Si hay error al cargar tareas, seguimos con la app pero con lista de tareas vacía
            setTasks([]);
          }
        } else {
          setTasks([]);
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
      if (selectedRequirement && currentUser) {
        try {
          setLoading(true);
          const tasksData = await tasksService.getByRequirementId(selectedRequirement);
          setTasks(tasksData);
          setLoading(false);
        } catch (err) {
          console.error('Error al cargar las tareas:', err);
          setError('Error al cargar las tareas. Por favor, intenta de nuevo.');
          setLoading(false);
        }
      }
    };

    loadTasks();
  }, [selectedRequirement, currentUser]);

  const setSelectedRequirement = (id: string) => {
    setSelectedRequirementId(id);
  };

  // Funciones para Requirements
  const addRequirement = async (requirementData: { name: string; tipo?: Requirement['tipo']; tieneEstimacion?: boolean; tiempoEstimado?: string }) => {
    if (!currentUser) {
      setError('Debes iniciar sesión para crear un requerimiento');
      return;
    }

    try {
      console.log('DataContext: Iniciando creación de requerimiento con datos:', requirementData);
      console.log('DataContext: Usuario autenticado:', currentUser);
      
      // Crear objeto limpio del requerimiento (sin undefined)
      const requirementToCreate: Omit<Requirement, 'id' | 'createdAt'> = {
        name: requirementData.name,
        status: 'active',
        userId: currentUser.uid // Añadir el ID del usuario actual
      };
      
      // Añadir propiedades opcionales solo si están definidas
      if (requirementData.tipo) {
        requirementToCreate.tipo = requirementData.tipo;
      }
      
      if (requirementData.tieneEstimacion !== undefined) {
        requirementToCreate.tieneEstimacion = requirementData.tieneEstimacion;
        
        // Solo añadir tiempoEstimado si tieneEstimacion es true y hay un valor
        if (requirementData.tieneEstimacion && requirementData.tiempoEstimado) {
          requirementToCreate.tiempoEstimado = requirementData.tiempoEstimado;
        }
      }
      
      console.log('DataContext: Objeto de requerimiento limpio a crear:', requirementToCreate);
      
      // Intentar crear el requerimiento
      const newId = await requirementsService.create(requirementToCreate);
      console.log('DataContext: Requerimiento creado con ID:', newId);
      
      // Crear objeto para el estado local
      const newRequirement: Requirement = {
        id: newId,
        name: requirementData.name,
        status: 'active',
        createdAt: new Date(),
        userId: currentUser.uid
      };
      
      // Añadir propiedades opcionales al objeto del estado
      if (requirementData.tipo) {
        newRequirement.tipo = requirementData.tipo;
      }
      
      if (requirementData.tieneEstimacion !== undefined) {
        newRequirement.tieneEstimacion = requirementData.tieneEstimacion;
        
        if (requirementData.tieneEstimacion && requirementData.tiempoEstimado) {
          newRequirement.tiempoEstimado = requirementData.tiempoEstimado;
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
      
      return undefined;
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

  const completeRequirement = async (id: string) => {
    try {
      await requirementsService.update(id, { status: 'completed' });
      setRequirements(
        requirements.map(req => (req.id === id ? { ...req, status: 'completed' } : req))
      );
    } catch (err) {
      console.error('Error al completar requisito:', err);
      setError('Error al completar el requisito. Por favor, intenta de nuevo.');
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
  const addTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      const newId = await tasksService.create(taskData);
      const newTask: Task = {
        id: newId,
        ...taskData
      };
      setTasks([...tasks, newTask]);
    } catch (err) {
      console.error('Error al crear tarea:', err);
      setError('Error al crear la tarea. Por favor, intenta de nuevo.');
    }
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    try {
      await tasksService.update(id, { status });
      setTasks(tasks.map(task => (task.id === id ? { ...task, status } : task)));
    } catch (err) {
      console.error('Error al actualizar estado de tarea:', err);
      setError('Error al actualizar la tarea. Por favor, intenta de nuevo.');
    }
  };

  const completeTask = async (id: string, details: { description: string; timeSpent: string }) => {
    try {
      await tasksService.complete(id, {
        ...details,
        completedAt: new Date()
      });
      setTasks(
        tasks.map(task =>
          task.id === id
            ? {
                ...task,
                status: 'completed',
                completionDetails: {
                  ...details,
                  completedAt: new Date()
                }
              }
            : task
        )
      );
    } catch (err) {
      console.error('Error al completar tarea:', err);
      setError('Error al completar la tarea. Por favor, intenta de nuevo.');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksService.delete(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      setError('Error al eliminar la tarea. Por favor, intenta de nuevo.');
    }
  };

  const value: DataContextType = {
    requirements,
    tasks,
    selectedRequirement,
    loading,
    error,
    setSelectedRequirement,
    addRequirement,
    updateRequirement,
    completeRequirement,
    deleteRequirement,
    addTask,
    updateTaskStatus,
    completeTask,
    deleteTask
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