import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
  Firestore,
  arrayUnion
} from 'firebase/firestore';

// Tipos
export interface Requirement {
  id?: string;
  name: string;
  status: 'active' | 'completed';
  createdAt: Date | Timestamp;
  tipo?: 'AJU' | 'INC' | 'PRC' | 'PRO' | 'REN' | 'REQ'; // Tipo de requerimiento: Ajuste, Incidencia, Procesos, Proyecto, Reunión, Requerimiento
  codTipo?: string; // Código del tipo
  tieneEstimacion?: boolean; // Indica si tiene un tiempo estimado
  tiempoEstimado?: string; // El tiempo estimado en formato de texto (ej: "2 horas", "3 días")
  userId: string; // ID del usuario propietario del requerimiento
}

export interface CompletionDetails {
  description: string;
  timeSpent: string;
  completedAt: Date;
  // Nuevos campos para detalles de completado
  sentToQA?: boolean;
  deployedToProduction?: boolean;
  tools?: string[];
}

export interface ProgressEntry {
  date: Date;
  description: string;
  timeSpent: string;
  createdAt: Date;
}

export interface Task {
  id?: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  type: 'UI' | 'validación' | 'funcionalidad';
  priority: 'alta' | 'media' | 'baja';
  feedback: string;
  requirementId: string;
  createdAt?: Date;
  updatedAt?: Date;
  completionDetails?: CompletionDetails;
  progress?: ProgressEntry[]; // Historial de progreso diario
}

// Colecciones
const REQUIREMENTS_COLLECTION = 'requirements';
const TASKS_COLLECTION = 'tasks';

// Función auxiliar para manejar errores
const handleFirestoreError = (operation: string, error: any) => {
  console.error(`Error durante ${operation}:`, error);
  
  // Información detallada sobre el tipo de error
  if (error instanceof Error) {
    console.error(`Tipo de error: ${error.constructor.name}`);
    console.error(`Mensaje: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    
    // Verificar si es un error de permisos de Firestore
    if ('code' in error) {
      const errorCode = (error as any).code;
      console.error(`Código de error: ${errorCode}`);
      
      // Manejar errores específicos de Firestore
      if (errorCode === 'permission-denied') {
        console.error('Error de permisos. Verifica las reglas de seguridad de Firestore.');
        throw new Error('Missing or insufficient permissions.');
      }
      
      if (errorCode === 'not-found') {
        console.error('Documento no encontrado.');
        throw new Error('El documento solicitado no existe.');
      }
      
      if (errorCode === 'unauthenticated') {
        console.error('Usuario no autenticado.');
        throw new Error('Debes iniciar sesión para realizar esta operación.');
      }
    }
  } else {
    console.error('Tipo de error desconocido:', typeof error);
  }
  
  // Re-lanzar el error para que se maneje en el contexto
  throw error;
};

// Servicios para Requirements
export const requirementsService = {
  // Obtener todos los requisitos
  getAll: async (): Promise<Requirement[]> => {
    try {
      console.log(`Obteniendo colección: ${REQUIREMENTS_COLLECTION}`);
      const collectionRef = collection(db, REQUIREMENTS_COLLECTION);
      console.log('Referencia de colección creada');
      
      const querySnapshot = await getDocs(collectionRef);
      console.log(`Documentos obtenidos: ${querySnapshot.size}`);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Procesando documento ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data
        } as Requirement;
      });
    } catch (error) {
      return handleFirestoreError('obtener requisitos', error);
    }
  },

  // Obtener requisitos por userId
  getByUserId: async (userId: string): Promise<Requirement[]> => {
    try {
      console.log(`Obteniendo requisitos para usuario: ${userId}`);
      const q = query(
        collection(db, REQUIREMENTS_COLLECTION), 
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Requisitos obtenidos: ${querySnapshot.size}`);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Requirement[];
    } catch (error) {
      return handleFirestoreError(`obtener requisitos para usuario ${userId}`, error);
    }
  },

  // Obtener un requisito por ID
  getById: async (id: string): Promise<Requirement | null> => {
    try {
      const docRef = doc(db, REQUIREMENTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Requirement;
      } else {
        return null;
      }
    } catch (error) {
      return handleFirestoreError(`obtener requisito ${id}`, error);
    }
  },

  // Crear un nuevo requisito
  create: async (requirement: Omit<Requirement, 'id' | 'createdAt'> & { createdAt?: Date }): Promise<string> => {
    try {
      console.log('databaseService: Intentando crear un nuevo requisito:', JSON.stringify(requirement, null, 2));
      
      // Validaciones adicionales
      if (!requirement.name) {
        const error = new Error('El nombre del requerimiento es obligatorio');
        console.error('databaseService: Error de validación:', error.message);
        throw error;
      }
      
      if (!requirement.userId) {
        const error = new Error('El userId del requerimiento es obligatorio');
        console.error('databaseService: Error de validación:', error.message);
        throw error;
      }
      
      // Verificar la estructura del objeto
      console.log('databaseService: Estructura del requirement:', Object.keys(requirement).join(', '));
      
      // Verificar que cada propiedad exista y sea del tipo correcto
      console.log('databaseService: Tipos de datos:',
        'name:', typeof requirement.name,
        'status:', typeof requirement.status,
        'userId:', typeof requirement.userId,
        'tipo:', typeof requirement.tipo,
        'tieneEstimacion:', typeof requirement.tieneEstimacion,
        'tiempoEstimado:', typeof requirement.tiempoEstimado,
        'createdAt:', requirement.createdAt instanceof Date ? 'Date' : 'undefined'
      );
      
      // Limpiar el objeto para eliminar campos undefined
      const cleanRequirement: any = {};
      
      // Copiar solo propiedades que no sean undefined
      Object.entries(requirement).forEach(([key, value]) => {
        if (value !== undefined && key !== 'createdAt') {
          cleanRequirement[key] = value;
        }
      });
      
      // Añadir el timestamp de creación (usar fecha personalizada si existe)
      if (requirement.createdAt) {
        cleanRequirement.createdAt = requirement.createdAt;
      } else {
        cleanRequirement.createdAt = serverTimestamp();
      }
      
      console.log('databaseService: Objeto limpio a guardar en Firestore:', JSON.stringify(cleanRequirement, null, 2));
      
      // Crear referencia a la colección
      const collectionRef = collection(db, REQUIREMENTS_COLLECTION);
      console.log('databaseService: Referencia de colección creada para:', REQUIREMENTS_COLLECTION);
      
      // Añadir documento
      console.log('databaseService: Intentando addDoc...');
      const docRef = await addDoc(collectionRef, cleanRequirement);
      console.log('databaseService: Requisito creado con ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('databaseService: Error al crear requisito:', error);
      if (error instanceof Error) {
        console.error('databaseService: Mensaje de error:', error.message);
        console.error('databaseService: Stack trace:', error.stack);
      }
      return handleFirestoreError('crear requisito', error);
    }
  },

  // Actualizar un requisito
  update: async (id: string, data: Partial<Requirement>): Promise<void> => {
    try {
      const docRef = doc(db, REQUIREMENTS_COLLECTION, id);
      await updateDoc(docRef, data);
    } catch (error) {
      return handleFirestoreError(`actualizar requisito ${id}`, error);
    }
  },

  // Eliminar un requisito
  delete: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, REQUIREMENTS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      return handleFirestoreError(`eliminar requisito ${id}`, error);
    }
  },

  // Completar un requisito
  complete: async (
    reqId: string,
    completionInfo?: {
      sentToQA?: boolean;
      deployedToProduction?: boolean;
      tools?: string[];
    }
  ): Promise<void> => {
    try {
      const reqRef = doc(db, REQUIREMENTS_COLLECTION, reqId);
      
      await updateDoc(reqRef, {
        status: 'completed',
        completedAt: new Date(),
        sentToQA: completionInfo?.sentToQA || false,
        deployedToProduction: completionInfo?.deployedToProduction || false,
        tools: completionInfo?.tools || [],
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Error al completar el requerimiento:', error);
      throw error;
    }
  }
};

// Servicios para Tasks
export const tasksService = {
  // Obtener todas las tareas
  getAll: async (): Promise<Task[]> => {
    try {
      console.log(`Obteniendo colección: ${TASKS_COLLECTION}`);
      const querySnapshot = await getDocs(collection(db, TASKS_COLLECTION));
      console.log(`Tareas obtenidas: ${querySnapshot.size}`);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    } catch (error) {
      return handleFirestoreError('obtener tareas', error);
    }
  },

  // Obtener tareas por requirementId
  getByRequirementId: async (requirementId: string): Promise<Task[]> => {
    try {
      const q = query(
        collection(db, TASKS_COLLECTION), 
        where("requirementId", "==", requirementId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    } catch (error) {
      return handleFirestoreError(`obtener tareas para requisito ${requirementId}`, error);
    }
  },

  // Obtener una tarea por ID
  getById: async (id: string): Promise<Task | null> => {
    try {
      const docRef = doc(db, TASKS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Task;
      } else {
        return null;
      }
    } catch (error) {
      return handleFirestoreError(`obtener tarea ${id}`, error);
    }
  },

  // Crear una nueva tarea
  create: async (task: Omit<Task, 'id'> & { createdAt?: Date }): Promise<string> => {
    try {
      console.log('-------------------- INICIO CREACIÓN DE TAREA --------------------');
      console.log('databaseService: Intentando crear una nueva tarea:', JSON.stringify(task, null, 2));
      console.log('Tipo de tarea:', task.type, 'Tipo de dato:', typeof task.type);
      console.log('Prioridad de tarea:', task.priority, 'Tipo de dato:', typeof task.priority);
      
      // Validaciones
      if (!task.description) {
        const error = new Error('La descripción de la tarea es obligatoria');
        console.error('databaseService: Error de validación:', error.message);
        throw error;
      }
      
      if (!task.requirementId) {
        const error = new Error('El requirementId de la tarea es obligatorio');
        console.error('databaseService: Error de validación:', error.message);
        throw error;
      }
      
      // Limpiar el objeto para eliminar campos undefined
      const cleanTask: any = {};
      
      // Copiar solo propiedades que no sean undefined
      Object.entries(task).forEach(([key, value]) => {
        if (value !== undefined && key !== 'createdAt') {
          cleanTask[key] = value;
        }
      });
      
      // Añadir el timestamp de creación (usar fecha personalizada si existe)
      if (task.createdAt) {
        cleanTask.createdAt = task.createdAt;
      } else {
        cleanTask.createdAt = serverTimestamp();
      }
      
      console.log('databaseService: Objeto limpio a guardar en Firestore:', JSON.stringify(cleanTask, null, 2));
      
      // Crear referencia a la colección y añadir el documento
      const collectionRef = collection(db, TASKS_COLLECTION);
      console.log('databaseService: Guardando en colección:', TASKS_COLLECTION);
      
      const docRef = await addDoc(collectionRef, cleanTask);
      console.log('databaseService: Tarea creada con ID:', docRef.id);
      console.log('-------------------- FIN CREACIÓN DE TAREA --------------------');
      
      return docRef.id;
    } catch (error) {
      console.error('-------------------- ERROR EN CREACIÓN DE TAREA --------------------');
      console.error('databaseService: Error al crear tarea:', error);
      if (error instanceof Error) {
        console.error('databaseService: Mensaje de error:', error.message);
        console.error('databaseService: Stack trace:', error.stack);
      }
      console.error('-------------------- FIN ERROR CREACIÓN DE TAREA --------------------');
      return handleFirestoreError('crear tarea', error);
    }
  },

  // Actualizar una tarea
  update: async (id: string, data: Partial<Task>): Promise<void> => {
    try {
      const docRef = doc(db, TASKS_COLLECTION, id);
      await updateDoc(docRef, data);
    } catch (error) {
      return handleFirestoreError(`actualizar tarea ${id}`, error);
    }
  },

  // Completar una tarea
  complete: async (id: string, details: Task['completionDetails']): Promise<void> => {
    try {
      const docRef = doc(db, TASKS_COLLECTION, id);
      await updateDoc(docRef, {
        status: 'completed',
        completionDetails: {
          ...details,
          completedAt: serverTimestamp()
        }
      });
    } catch (error) {
      return handleFirestoreError(`completar tarea ${id}`, error);
    }
  },

  // Eliminar una tarea
  delete: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, TASKS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      return handleFirestoreError(`eliminar tarea ${id}`, error);
    }
  },

  // Completar una tarea
  completeTask: async (
    taskId: string, 
    details: { 
      description: string; 
      timeSpent: string;
      sentToQA?: boolean;
      deployedToProduction?: boolean;
      tools?: string[];
      completedAt?: Date;
    }
  ): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const completionDetails = {
        description: details.description,
        timeSpent: details.timeSpent,
        completedAt: details.completedAt || new Date(),
        sentToQA: details.sentToQA || false,
        deployedToProduction: details.deployedToProduction || false,
        tools: details.tools || []
      };
      
      await updateDoc(taskRef, {
        status: 'completed',
        completionDetails,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error al completar la tarea:', error);
      throw error;
    }
  },

  // Añadir progreso diario a una tarea
  addTaskProgress: async (
    taskId: string,
    progressDetails: {
      description: string;
      timeSpent: string;
    },
    customDate?: Date
  ): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('La tarea no existe');
      }
      
      // Si la tarea está en estado pendiente, cambiarla a en-progreso
      if (taskDoc.data().status === 'pending') {
        await updateDoc(taskRef, {
          status: 'in-progress',
          updatedAt: new Date()
        });
      }
      
      // Crear nueva entrada de progreso
      const newProgress: ProgressEntry = {
        date: customDate || new Date(),
        description: progressDetails.description,
        timeSpent: progressDetails.timeSpent,
        createdAt: new Date()
      };
      
      // Obtener progreso actual o inicializar un arreglo vacío
      const currentProgress = taskDoc.data().progress || [];
      
      // Actualizar el documento con la nueva entrada de progreso
      await updateDoc(taskRef, {
        progress: arrayUnion(newProgress),
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Error al añadir progreso a la tarea:', error);
      throw error;
    }
  },

  // Editar un avance específico de una tarea
  editTaskProgress: async (
    taskId: string,
    progressIndex: number,
    updatedProgress: {
      description: string;
      timeSpent: string;
    }
  ): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('La tarea no existe');
      }
      
      const currentTask = taskDoc.data();
      const currentProgress = currentTask.progress || [];
      
      if (progressIndex < 0 || progressIndex >= currentProgress.length) {
        throw new Error('Índice de avance inválido');
      }
      
      // Crear una copia del array de avances
      const updatedProgressArray = [...currentProgress];
      
      // Actualizar el avance específico
      updatedProgressArray[progressIndex] = {
        ...updatedProgressArray[progressIndex],
        description: updatedProgress.description,
        timeSpent: updatedProgress.timeSpent,
        // Mantener fecha original
        date: updatedProgressArray[progressIndex].date,
        createdAt: updatedProgressArray[progressIndex].createdAt,
        // Añadir timestamp de edición
        updatedAt: new Date()
      };
      
      // Actualizar la tarea con el array modificado
      await updateDoc(taskRef, {
        progress: updatedProgressArray,
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Error al editar avance de la tarea:', error);
      throw error;
    }
  },
  
  // Eliminar un avance específico de una tarea
  deleteTaskProgress: async (
    taskId: string,
    progressIndex: number
  ): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('La tarea no existe');
      }
      
      const currentTask = taskDoc.data();
      const currentProgress = currentTask.progress || [];
      
      if (progressIndex < 0 || progressIndex >= currentProgress.length) {
        throw new Error('Índice de avance inválido');
      }
      
      // Eliminar el avance específico
      const updatedProgressArray = currentProgress.filter((_, index) => index !== progressIndex);
      
      // Si era el último avance y la tarea no está completada, cambiar estado a pendiente
      let updates: any = {
        progress: updatedProgressArray,
        updatedAt: new Date()
      };
      
      // Si no quedan avances y la tarea no está completada, cambiar a pendiente
      if (updatedProgressArray.length === 0 && currentTask.status !== 'completed') {
        updates.status = 'pending';
      }
      
      // Actualizar la tarea con el array modificado
      await updateDoc(taskRef, updates);
      
    } catch (error) {
      console.error('Error al eliminar avance de la tarea:', error);
      throw error;
    }
  }
}; 