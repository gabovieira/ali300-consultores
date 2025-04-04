import React, { useState } from 'react';
import { 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlignLeft, 
  Tag, 
  BarChart, 
  Calendar, 
  User, 
  LogOut,
  Pencil,
  TrashIcon,
  Plus,
  ChevronRight,
  FileText,
  Clock4,
  CheckSquare,
  AlertCircle,
  BarChart3,
  Users,
  Trash2,
  ChevronLeft,
  ListTodo,
  Edit,
  Briefcase,
  Calendar as CalendarIcon,
  Save
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { Requirement, Task } from './services/databaseService';
import { WorkTimeTracker } from './components/WorkTimeTracker';
import Icon from './components/Icon';
import AuthScreen from './components/AuthScreen';
import WelcomePage from './components/WelcomePage';
import CalendarComponent from './components/Calendar';

function App() {
  const { currentUser, signOut, updateProfile } = useAuth();
  const { 
    requirements, 
    tasks, 
    allTasks,
    selectedRequirement,
    loading,
    error,
    setSelectedRequirement,
    addRequirement,
    completeRequirement,
    addTask,
    updateTaskStatus,
    completeTask,
    deleteTask,
    updateRequirement,
    deleteRequirement,
    addTaskProgress
  } = useData();

  // Si no hay usuario autenticado, mostrar la página de bienvenida en lugar de la pantalla de autenticación
  if (!currentUser) {
    return <WelcomePage />;
  }

  // Estado para la fecha seleccionada en el calendario
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedTaskForCompletion, setSelectedTaskForCompletion] = useState<string | null>(null);
  const [completionDetails, setCompletionDetails] = useState({
    description: '',
    timeSpent: '',
    sentToQA: false,
    deployedToProduction: false,
    tools: [] as string[],
    useCustomDate: false,
    customDate: new Date().toISOString().split('T')[0]
  });
  const [activeView, setActiveView] = useState<'all' | 'pending' | 'completed' | 'dashboard'>('dashboard');
  const [showNewRequirementModal, setShowNewRequirementModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEditRequirementModal, setShowEditRequirementModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [requirementToEdit, setRequirementToEdit] = useState<Requirement | null>(null);
  const [newRequirement, setNewRequirement] = useState({ 
    name: '',
    tipo: 'REQ' as 'AJU' | 'INC' | 'PRC' | 'PRO' | 'REN' | 'REQ',
    tieneEstimacion: false,
    tiempoEstimado: '',
    useCustomDate: false,
    customDate: new Date().toISOString().split('T')[0]
  });
  const [newTask, setNewTask] = useState({
    description: '',
    type: 'UI' as Task['type'],
    priority: 'media' as Task['priority'],
    feedback: '',
    useCustomDate: false,
    customDate: new Date().toISOString().split('T')[0]
  });
  const [profileData, setProfileData] = useState<{
    company: string;
    area: string;
    developerLevel: string;
    adiestramiento: boolean;
    horasAdiestramiento: number;
    fullName: string;
    documentId: string;
    age: number;
    phone: string;
    position: string;
    startDate: string;
  }>({
    company: currentUser?.userData?.company || '',
    area: currentUser?.userData?.area || '',
    developerLevel: currentUser?.userData?.developerLevel || 'junior',
    adiestramiento: currentUser?.userData?.adiestramiento || false,
    horasAdiestramiento: currentUser?.userData?.horasAdiestramiento || 0,
    fullName: currentUser?.userData?.fullName || '',
    documentId: currentUser?.userData?.documentId || '',
    age: currentUser?.userData?.age || 0,
    phone: currentUser?.userData?.phone || '',
    position: currentUser?.userData?.position || '',
    startDate: currentUser?.userData?.startDate ? 
      (typeof currentUser.userData.startDate === 'string' ? 
        currentUser.userData.startDate.split('T')[0] : 
        new Date(currentUser.userData.startDate).toISOString().split('T')[0]) : 
      ''
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState<string | null>(null);
  const [progressDetails, setProgressDetails] = useState({
    description: '',
    timeSpent: '',
    useCustomDate: false,
    customDate: new Date().toISOString().split('T')[0]
  });
  const [availableTools, setAvailableTools] = useState([
    'Forma (.fmb)', 'Package (.pks)', 'Package Body (.pkb)', 'Trigger (.trg)', 
    'Procedure (.prc)', 'Script (ALTER)', 'Script (UPDATE)', 'Script (INSERT)', 
    'Script (DELETE)', 'Función (.fnc)', 'Reporte (.rdf)'
  ]);
  const [newTool, setNewTool] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleAddNewRequirement = async () => {
    if (!newRequirement.name.trim()) {
      alert('Por favor introduce un nombre para el requerimiento');
      return;
    }
    
    console.log('Iniciando creación de nuevo requerimiento:', {
      name: newRequirement.name,
      tipo: newRequirement.tipo,
      tieneEstimacion: newRequirement.tieneEstimacion,
      tiempoEstimado: newRequirement.tieneEstimacion ? newRequirement.tiempoEstimado : undefined,
      useCustomDate: newRequirement.useCustomDate,
      customDate: newRequirement.customDate,
      currentUser: currentUser
    });
    
    try {
      const reqData = {
        name: newRequirement.name,
        tipo: newRequirement.tipo,
        tieneEstimacion: newRequirement.tieneEstimacion,
        tiempoEstimado: newRequirement.tieneEstimacion ? newRequirement.tiempoEstimado : undefined,
        status: 'active' as 'active' | 'completed',
        userId: currentUser.uid
      };
      
      // Si se usa fecha personalizada, convertirla a objeto Date asegurándose de usar la fecha local correcta
      const customDate = newRequirement.useCustomDate ? (() => {
        // Crear una fecha local correcta a partir de la fecha seleccionada
        const [year, month, day] = newRequirement.customDate.split('-').map(Number);
        return new Date(year, month - 1, day); // Restamos 1 al mes porque en JavaScript los meses van de 0 a 11
      })() : undefined;
      
      const reqId = await addRequirement(reqData, customDate);
      
      console.log('Requerimiento creado con éxito, ID:', reqId);
      
      // Seleccionar automáticamente el nuevo requerimiento creado
      if (reqId) {
        setSelectedRequirement(reqId);
        // Cambiar a la vista de todas las tareas para ver el requerimiento creado
        setActiveView('all');
      }
      
      setNewRequirement({ 
        name: '',
        tipo: 'REQ',
        tieneEstimacion: false,
        tiempoEstimado: '',
        useCustomDate: false,
        customDate: new Date().toISOString().split('T')[0]
      });
      setShowNewRequirementModal(false);
    } catch (err) {
      console.error('Error al crear requerimiento desde App.tsx:', err);
      alert('Error al crear el requerimiento. Por favor, inténtalo de nuevo.');
      // El error ya se manejará en el DataContext
    }
  };

  const handleAddNewTask = async () => {
    console.log('Iniciando creación de nueva tarea para el requerimiento:', selectedRequirement);
    
    if (!selectedRequirement) {
      console.error('Error: No hay requerimiento seleccionado');
      alert('Por favor selecciona un requerimiento primero');
      return;
    }
    
    if (!newTask.description.trim()) {
      console.error('Error: La descripción de la tarea está vacía');
      alert('Por favor introduce una descripción para la tarea');
      return;
    }
    
    try {
      console.log('Datos de la tarea a crear:', {
        description: newTask.description,
        status: 'pending',
        type: newTask.type,
        priority: newTask.priority,
        feedback: newTask.feedback,
        requirementId: selectedRequirement,
        useCustomDate: newTask.useCustomDate,
        customDate: newTask.customDate
      });
      
      const taskData = {
        description: newTask.description,
        status: 'pending' as Task['status'],
        type: newTask.type,
        priority: newTask.priority,
        feedback: newTask.feedback,
        requirementId: selectedRequirement
      };
      
      // Si se usa fecha personalizada, convertirla a objeto Date asegurándose de usar la fecha local correcta
      const customDate = newTask.useCustomDate ? (() => {
        // Crear una fecha local correcta a partir de la fecha seleccionada
        const [year, month, day] = newTask.customDate.split('-').map(Number);
        return new Date(year, month - 1, day); // Restamos 1 al mes porque en JavaScript los meses van de 0 a 11
      })() : undefined;
      
      await addTask(taskData, customDate);
      
      console.log('Tarea creada exitosamente');
      
      setNewTask({
        description: '',
        type: 'UI',
        priority: 'media',
        feedback: '',
        useCustomDate: false,
        customDate: new Date().toISOString().split('T')[0]
      });
      
      setShowNewTaskModal(false);
    } catch (error) {
      console.error('Error detallado al crear la tarea:', error);
      if (error instanceof Error) {
        console.error('Mensaje de error:', error.message);
        console.error('Stack trace:', error.stack);
      }
      alert('Error al crear la tarea. Por favor, inténtalo de nuevo. Revisa la consola para más detalles.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      await deleteTask(taskId);
    }
  };

  const openCompletionModal = (taskId: string) => {
    setSelectedTaskForCompletion(taskId);
    setCompletionDetails({
      description: '',
      timeSpent: '',
      sentToQA: false,
      deployedToProduction: false,
      tools: [],
      useCustomDate: false,
      customDate: new Date().toISOString().split('T')[0]
    });
    setShowCompletionModal(true);
  };

  const handleCompleteTask = async () => {
    if (!selectedTaskForCompletion) return;

    // Si se usa fecha personalizada, convertirla a objeto Date asegurándose de usar la fecha local correcta
    const customDate = completionDetails.useCustomDate ? (() => {
      // Crear una fecha local correcta a partir de la fecha seleccionada
      const [year, month, day] = completionDetails.customDate.split('-').map(Number);
      return new Date(year, month - 1, day); // Restamos 1 al mes porque en JavaScript los meses van de 0 a 11
    })() : undefined;

    await completeTask(selectedTaskForCompletion, {
      description: completionDetails.description,
      timeSpent: completionDetails.timeSpent,
      sentToQA: completionDetails.sentToQA,
      deployedToProduction: completionDetails.deployedToProduction,
      tools: completionDetails.tools
    }, customDate);

    setShowCompletionModal(false);
    setSelectedTaskForCompletion(null);
    setCompletionDetails({
      description: '',
      timeSpent: '',
      sentToQA: false,
      deployedToProduction: false,
      tools: [],
      useCustomDate: false,
      customDate: new Date().toISOString().split('T')[0]
    });
  };

  const openProgressModal = (taskId: string) => {
    setSelectedTaskForProgress(taskId);
    setProgressDetails({
      description: '',
      timeSpent: '',
      useCustomDate: false,
      customDate: new Date().toISOString().split('T')[0]
    });
    setShowProgressModal(true);
  };

  const handleAddProgress = async () => {
    if (!selectedTaskForProgress) return;

    // Si se usa fecha personalizada, convertirla a objeto Date asegurándose de usar la fecha local correcta
    const customDate = progressDetails.useCustomDate ? (() => {
      // Crear una fecha local correcta a partir de la fecha seleccionada
      const [year, month, day] = progressDetails.customDate.split('-').map(Number);
      return new Date(year, month - 1, day); // Restamos 1 al mes porque en JavaScript los meses van de 0 a 11
    })() : undefined;

    await addTaskProgress(
      selectedTaskForProgress, 
      {
        description: progressDetails.description,
        timeSpent: progressDetails.timeSpent
      },
      customDate
    );

    setShowProgressModal(false);
    setSelectedTaskForProgress(null);
    setProgressDetails({
      description: '',
      timeSpent: '',
      useCustomDate: false,
      customDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleCompletionDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompletionDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCompletionDetails(prev => ({ ...prev, [name]: checked }));
  };

  const handleToolSelection = (tool: string) => {
    setCompletionDetails(prev => {
      const tools = prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool];
      return { ...prev, tools };
    });
  };

  const handleAddNewTool = () => {
    if (newTool.trim() && !availableTools.includes(newTool)) {
      setAvailableTools(prev => [...prev, newTool]);
      setCompletionDetails(prev => ({ ...prev, tools: [...prev.tools, newTool] }));
      setNewTool('');
    }
  };
  
  const handleCompleteRequirement = async (reqId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Modal para confirmar y pedir información adicional
    if (confirm('¿Estás seguro de marcar este requerimiento como completado?')) {
      const goesToQA = confirm('¿El requerimiento pasa a pruebas de calidad (QA)?');
      const goesToProduction = confirm('¿El requerimiento se despliega a producción?');
      
      // Mostrar un prompt para herramientas usadas
      const toolsUsed = prompt('¿Qué herramientas se utilizaron? (separadas por coma)');
      const tools = toolsUsed ? toolsUsed.split(',').map(t => t.trim()) : [];
      
      await completeRequirement(reqId, {
        sentToQA: goesToQA,
        deployedToProduction: goesToProduction,
        tools
      });
    }
  };

  // Filtrado de tareas
  const filteredTasks = tasks
    .filter(task => {
      if (activeView === 'pending') return task.status === 'pending';
      if (activeView === 'completed') return task.status === 'completed';
      return true;
    });

  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending').length;
  const totalTasks = filteredTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Función para abrir el modal de edición de requerimiento
  const openEditRequirementModal = (req: Requirement, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se seleccione el requerimiento
    setRequirementToEdit(req);
    setShowEditRequirementModal(true);
  };

  // Manejador para actualizar un requerimiento
  const handleUpdateRequirement = async () => {
    if (!requirementToEdit || !requirementToEdit.id) return;
    
    await updateRequirement(requirementToEdit.id, {
      name: requirementToEdit.name,
      tipo: requirementToEdit.tipo,
      tieneEstimacion: requirementToEdit.tieneEstimacion,
      tiempoEstimado: requirementToEdit.tieneEstimacion ? requirementToEdit.tiempoEstimado : undefined
    });
    
    setShowEditRequirementModal(false);
    setRequirementToEdit(null);
  };

  // Manejador para eliminar un requerimiento
  const handleDeleteRequirement = async (reqId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se seleccione el requerimiento
    
    if (confirm('¿Estás seguro de que quieres eliminar este requerimiento? Todas las tareas asociadas también serán eliminadas.')) {
      await deleteRequirement(reqId);
      
      // Si el requerimiento eliminado era el seleccionado, deseleccionarlo
      if (selectedRequirement === reqId) {
        // Seleccionar el primer requerimiento disponible o null si no hay más
        const firstAvailableReq = requirements.find(r => r.id !== reqId)?.id || null;
        if (firstAvailableReq) {
          setSelectedRequirement(firstAvailableReq);
        } else {
          // No hay más requerimientos, mostrar la vista vacía
          setSelectedRequirement('');
        }
      }
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        company: profileData.company,
        area: profileData.area,
        developerLevel: profileData.developerLevel,
        adiestramiento: profileData.adiestramiento,
        horasAdiestramiento: profileData.horasAdiestramiento,
        fullName: profileData.fullName,
        documentId: profileData.documentId,
        age: profileData.age,
        phone: profileData.phone,
        position: profileData.position,
        startDate: profileData.startDate ? new Date(profileData.startDate).toISOString() : undefined
      });
      
      setShowEditProfileModal(false);
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil. Por favor, inténtalo de nuevo.');
    }
  };

  if (loading) {
  return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="bg-red-900 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        <button
            className="mt-4 bg-white text-red-900 px-4 py-2 rounded"
            onClick={() => window.location.reload()}
        >
            Recargar la página
        </button>
        </div>
      </div>
    );
  }

  // Contenido principal - Mantener el resto del componente igual
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Barra lateral */}
      <div className={`fixed inset-y-0 left-0 z-10 w-${sidebarCollapsed ? '20' : '64'} bg-gray-900 text-white transform transition-width duration-200 ease-in-out overflow-hidden`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            {!sidebarCollapsed && (
              <div className="flex items-center">
                <img src="/logo.png" alt="Logo ALI 3000" className="w-14 h-14" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/56')} />
              </div>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
              className="p-1 rounded hover:bg-gray-800 transition-colors"
            >
              {sidebarCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto no-scrollbar">
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all ${
                    activeView === 'dashboard' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className={`flex items-center justify-center ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} w-10 h-10 ${
                    activeView === 'dashboard' 
                      ? 'bg-cyan-600/30 text-white' 
                      : 'bg-gray-800/30 text-gray-300'
                    } rounded-lg`}>
                    {/* Icono de Dashboard: gráfico */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  {!sidebarCollapsed && <span>Dashboard</span>}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('all')}
                  className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all ${
                    activeView === 'all' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className={`flex items-center justify-center ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} w-10 h-10 ${
                    activeView === 'all' 
                      ? 'bg-cyan-600/30 text-white' 
                      : 'bg-gray-800/30 text-gray-300'
                    } rounded-lg`}>
                    {/* Icono de Todos: lista */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  {!sidebarCollapsed && <span>Todos</span>}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('pending')}
                  className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all ${
                    activeView === 'pending' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className={`flex items-center justify-center ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} w-10 h-10 ${
                    activeView === 'pending' 
                      ? 'bg-cyan-600/30 text-white' 
                      : 'bg-gray-800/30 text-gray-300'
                    } rounded-lg`}>
                    {/* Icono de Pendientes: reloj */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {!sidebarCollapsed && <span>Pendientes</span>}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('completed')}
                  className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all ${
                    activeView === 'completed' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className={`flex items-center justify-center ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} w-10 h-10 ${
                    activeView === 'completed' 
                      ? 'bg-cyan-600/30 text-white' 
                      : 'bg-gray-800/30 text-gray-300'
                    } rounded-lg`}>
                    {/* Icono de Completados: check */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {!sidebarCollapsed && <span>Completados</span>}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowNewRequirementModal(true)}
                  className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg`}
                >
                  <div className={`flex items-center justify-center ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} w-10 h-10 bg-cyan-600/30 text-white rounded-lg`}>
                    {/* Icono de Nuevo Requerimiento: plus */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  {!sidebarCollapsed && <span>Nuevo Requerimiento</span>}
                </button>
              </li>
            </ul>
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-800">
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="w-full flex items-center px-4 py-2.5 rounded-xl transition-all hover:bg-gray-800 text-gray-300 mb-2"
            >
              <div className={`flex items-center justify-center ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} w-10 h-10 bg-gray-700 text-gray-300 rounded-lg`}>
                {/* Icono de Perfil: usuario */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col items-start">
                  <span>Perfil</span>
                  {currentUser?.userData?.fullName && (
                    <span className="text-xs text-gray-500 truncate max-w-[160px]">
                      {currentUser.userData.fullName}
                    </span>
                  )}
                </div>
              )}
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2.5 rounded-xl transition-all bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg"
            >
              <div className={`flex items-center justify-center ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} w-10 h-10 bg-red-600/30 text-white rounded-lg`}>
                {/* Icono de Cerrar Sesión: salir */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              {!sidebarCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} p-4 sm:p-8`}>
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">
              {activeView === 'dashboard' ? 'Control de Horas' : 
               activeView === 'all' ? 'Todas las Tareas' : 
               activeView === 'pending' ? 'Tareas Pendientes' : 'Tareas Completadas'}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-gray-700 shadow-md w-full sm:w-auto">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {currentUser?.userData?.fullName?.charAt(0).toUpperCase() || currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-white text-xs sm:text-sm font-medium truncate">
                    {currentUser?.userData?.fullName || currentUser?.displayName}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-xs truncate">
                      {currentUser?.userData?.position ? `${currentUser.userData.position} en ` : ''}
                      {currentUser?.userData?.company || ''}
                    </span>
                  </div>
                </div>
                <span className="text-cyan-400 text-xs font-semibold px-1.5 sm:px-2 py-0.5 bg-gray-700 rounded-full ml-auto flex-shrink-0">
                  {currentUser?.userData?.developerLevel || 'junior'}
                </span>
              </div>
              {currentUser?.userData?.developerLevel === 'trainee' && currentUser?.userData?.adiestramiento && (
                <div className="flex items-center gap-1 bg-gray-800 px-2 sm:px-3 py-1 rounded-xl border border-gray-700 shadow-md">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex gap-1 items-center flex-shrink-0">
                    <span className="text-purple-300 text-xs font-semibold">{currentUser.userData.horasAdiestramiento}h</span>
                    <span className="text-gray-400 text-xs">|</span>
                    <span className="text-cyan-300 text-xs font-semibold">{8 - (currentUser.userData.horasAdiestramiento || 0)}h</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Calendar and Work Time Tracker */}
              <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="order-2 lg:order-1 mb-3 lg:mb-0">
                  <CalendarComponent onSelectDate={setSelectedDate} />
                </div>
                <div className="order-1 lg:order-2 mb-3 lg:mb-0">
                  <WorkTimeTracker
                    selectedDate={selectedDate}
                    tasks={allTasks} // Ahora pasamos todas las tareas sin filtrar
                    requirements={requirements}
                  />
                </div>
              </div>
              
              {/* Task Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-400 text-xs sm:text-sm">Tasa de Completado</span>
                    <div className="text-cyan-400 text-xl sm:text-2xl font-bold">{completionRate}%</div>
                  </div>
                  <div className="mt-1 sm:mt-2 bg-gray-700 h-1.5 sm:h-2 rounded-full">
                    <div 
                      className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <span className="text-gray-400 text-xs sm:text-sm">Completadas</span>
                  <div className="text-green-400 text-xl sm:text-2xl font-bold">{completedTasks}</div>
                </div>
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <span className="text-gray-400 text-xs sm:text-sm">En Progreso</span>
                  <div className="text-yellow-400 text-xl sm:text-2xl font-bold">{inProgressTasks}</div>
                </div>
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                  <span className="text-gray-400 text-xs sm:text-sm">Pendientes</span>
                  <div className="text-red-400 text-xl sm:text-2xl font-bold">{pendingTasks}</div>
                </div>
              </div>

              {/* Requirements List */}
              <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-semibold">Requerimientos Recientes</h2>
                  <button
                    onClick={() => setShowNewRequirementModal(true)}
                    className="text-xs sm:text-sm text-cyan-400 hover:underline"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  {requirements.slice(0, 5).map((req) => (
                    <div
                      key={req.id}
                      className="p-2 sm:p-4 rounded-lg cursor-pointer bg-gray-750 hover:bg-gray-700"
                      onClick={() => {
                        req.id && setSelectedRequirement(req.id);
                        setActiveView('all');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-600 text-white`}>
                              {req.tipo || 'REQ'}
                            </span>
                            <div className="font-medium text-sm sm:text-base">{req.name}</div>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400">
                            Creado: {req.createdAt instanceof Date ? req.createdAt.toLocaleDateString() : 'Fecha desconocida'}
                          </div>
                        </div>
                        <div>
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                            req.status === 'completed' ? 'bg-green-900 text-green-200' : 'bg-blue-900 text-blue-200'
                          }`}>
                            {req.status === 'completed' ? 'Completado' : 'Activo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tareas en Progreso */}
              <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-semibold flex items-center">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-400" />
                    Tareas Activas del Día
                  </h2>
                  <button
                    onClick={() => setActiveView('pending')}
                    className="text-xs sm:text-sm text-cyan-400 hover:underline"
                  >
                    Ver todas
                  </button>
                </div>
                
                <div className="space-y-1 sm:space-y-2">
                  {allTasks.filter(task => task.status === 'in-progress').slice(0, 5).map((task) => {
                    const requirement = requirements.find(req => req.id === task.requirementId);
                    
                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg bg-gray-750 hover:bg-gray-700 border-l-4 border-yellow-500"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gray-600 text-white`}>
                              {requirement?.tipo || 'REQ'}
                            </span>
                            <div className="font-medium text-sm sm:text-base text-yellow-300">{task.description}</div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (task.id) openProgressModal(task.id);
                              }}
                              className="p-1 rounded-full bg-yellow-600 hover:bg-yellow-500 transition"
                              title="Añadir avance"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (task.id) openCompletionModal(task.id);
                              }}
                              className="p-1 rounded-full bg-green-600 hover:bg-green-500 transition"
                              title="Completar tarea"
                            >
                              <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-400 gap-1 sm:gap-3">
                          <div>Requerimiento: {requirement?.name || 'Desconocido'}</div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-gray-400" />
                            {task.progress && task.progress.length > 0 
                              ? `Último avance: ${new Date(task.progress[task.progress.length - 1].date).toLocaleDateString()}`
                              : 'Sin avances registrados'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {allTasks.filter(task => task.status === 'in-progress').length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No tienes tareas activas en este momento
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Requirements Selector - only show in task views */}
          {activeView !== 'dashboard' && (
          <div className="mb-6 bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Requerimientos</h2>
              <button
                  onClick={() => {
                    if (!selectedRequirement) {
                      alert('Por favor, selecciona un requerimiento antes de añadir una tarea');
                      return;
                    }
                    setShowNewTaskModal(true);
                  }}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${
                    selectedRequirement 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md transition-all' 
                      : 'bg-gray-700 cursor-not-allowed text-gray-400'
                  }`}
                >
                  <div className="w-5 h-5 bg-white/30 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-xs">+</span>
                  </div>
                  Añadir Tarea
              </button>
            </div>
            <div className="space-y-2">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedRequirement === req.id ? 'bg-gray-700 border-l-4 border-cyan-400' : 'bg-gray-750 hover:bg-gray-700'
                  }`}
                    onClick={() => req.id && setSelectedRequirement(req.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-600 text-white`}>
                            {req.tipo || 'REQ'}
                          </span>
                      <div className="font-medium">{req.name}</div>
                        </div>
                        <div className="text-sm text-gray-400">
                          Creado: {req.createdAt instanceof Date ? req.createdAt.toLocaleDateString() : 'Fecha desconocida'}
                        </div>
                        {req.tieneEstimacion && (
                          <div className="text-sm text-cyan-400 mt-1 flex items-center">
                            <div className="w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mr-1">
                              <span className="text-white font-bold text-[8px]">T</span>
                            </div>
                            Tiempo estimado: {req.tiempoEstimado}
                          </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === 'completed' ? 'bg-green-900 text-green-200' : 'bg-blue-900 text-blue-200'
                      }`}>
                          {req.status === 'completed' ? 'Completado' : 'Activo'}
                      </span>
                        {req.status === 'active' && req.id && (
                          <>
                            <button
                              onClick={(e) => openEditRequirementModal(req, e)}
                              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-2 py-1 rounded-lg text-xs shadow-sm transition-all"
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <span className="text-white font-bold text-[8px]">E</span>
                              </div>
                            </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteRequirement(req.id!, e);
                          }}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-2 py-1 rounded-lg text-xs shadow-sm transition-all"
                        >
                              Completar
                        </button>
                          </>
                        )}
                        {req.id && (
                          <button
                            onClick={(e) => handleDeleteRequirement(req.id!, e)}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-2 py-1 rounded-lg text-xs shadow-sm transition-all"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <span className="text-white font-bold text-[8px]">X</span>
                            </div>
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Lista de Tareas del Requerimiento Seleccionado */}
          {activeView !== 'dashboard' && (
            <div className="mb-6 bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Tareas</h2>
                <div className="text-sm text-gray-400">
                  {selectedRequirement 
                    ? `Mostrando tareas de: ${requirements.find(r => r.id === selectedRequirement)?.name || 'Requerimiento'}` 
                    : 'Selecciona un requerimiento para ver sus tareas'}
            </div>
          </div>

              {!selectedRequirement ? (
                <div className="p-4 bg-gray-750 rounded-lg text-center text-gray-400">
                  No hay requerimiento seleccionado
              </div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks
                    .filter(task => task.requirementId === selectedRequirement)
                    .map(task => (
                      <div key={task.id} className="p-4 bg-gray-750 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.priority === 'alta' ? 'bg-red-800 text-red-200' :
                                task.priority === 'media' ? 'bg-yellow-800 text-yellow-200' :
                                'bg-green-800 text-green-200'
                              }`}>
                                {task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Media' : 'Baja'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-600">
                          {task.type}
                        </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === 'pending' ? 'bg-gray-600 text-gray-200' :
                                task.status === 'in-progress' ? 'bg-blue-800 text-blue-200' :
                                'bg-green-800 text-green-200'
                              }`}>
                                {task.status === 'pending' ? 'Pendiente' :
                                 task.status === 'in-progress' ? 'En Progreso' :
                                 'Completada'}
                        </span>
                              <div className="font-medium">{task.description}</div>
                            </div>
                            {task.feedback && (
                              <div className="text-sm text-gray-400 mt-1">
                        {task.feedback}
                          </div>
                        )}
                            {task.status === 'completed' && task.completionDetails && (
                              <div className="mt-2 p-2 bg-gray-700 rounded text-sm">
                                <div className="font-medium text-cyan-400">Detalles de completado:</div>
                                <div className="text-gray-300 mt-1">{task.completionDetails.description}</div>
                                <div className="text-gray-400 mt-1 flex flex-wrap justify-between">
                                  <span>Tiempo: {task.completionDetails.timeSpent}</span>
                                  <span>Completado: {task.completionDetails.completedAt instanceof Date 
                                    ? task.completionDetails.completedAt.toLocaleDateString() 
                                    : new Date(task.completionDetails.completedAt).toLocaleDateString()}</span>
                                </div>
                                
                                {/* Información adicional de completado */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {task.completionDetails.sentToQA && (
                                    <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full">Enviado a QA</span>
                                  )}
                                  {task.completionDetails.deployedToProduction && (
                                    <span className="bg-green-900 text-green-200 text-xs px-2 py-1 rounded-full">Desplegado a Producción</span>
                                  )}
                                  {task.completionDetails.tools && task.completionDetails.tools.length > 0 && (
                                    <div className="w-full mt-1">
                                      <span className="text-xs text-gray-400">Herramientas:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {task.completionDetails.tools.map((tool, idx) => (
                                          <span key={idx} className="bg-gray-600 text-gray-200 text-xs px-2 py-0.5 rounded-full">
                                            {tool}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {/* Historial de progreso */}
                            {task.progress && task.progress.length > 0 && (
                              <div className="mt-2 p-2 bg-gray-700 rounded text-sm">
                                <div className="font-medium text-purple-400">Historial de progreso:</div>
                                <div className="max-h-32 overflow-y-auto">
                                  {task.progress.map((entry, index) => (
                                    <div key={index} className="border-l-2 border-purple-500 pl-2 py-1 mt-1">
                                      <div className="text-gray-300">{entry.description}</div>
                                      <div className="text-gray-400 text-xs flex justify-between">
                                        <span>Tiempo: {entry.timeSpent}</span>
                                        <span>{entry.date instanceof Date 
                                          ? entry.date.toLocaleDateString()
                                          : new Date(entry.date).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {task.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => updateTaskStatus(task.id!, 'in-progress')} 
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                >
                                  Iniciar
                                </button>
                          <button
                                  onClick={() => openCompletionModal(task.id!)} 
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                          >
                                  Completar
                          </button>
                              </>
                            )}
                            {task.status === 'in-progress' && (
                              <>
                                <button 
                                  onClick={() => openProgressModal(task.id!)} 
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
                                >
                                  Registrar Avance
                                </button>
                                <button 
                                  onClick={() => openCompletionModal(task.id!)} 
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                                >
                                  Completar
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDeleteTask(task.id!)} 
                              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-2 py-1 rounded-lg text-xs shadow-sm transition-all"
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                <span className="text-white font-bold text-[8px]">X</span>
                        </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {filteredTasks.filter(task => task.requirementId === selectedRequirement).length === 0 && (
                    <div className="p-4 bg-gray-750 rounded-lg text-center text-gray-400">
                      No hay tareas para este requerimiento. ¡Añade una nueva!
            </div>
                  )}
          </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Requirement Modal */}
      {showNewRequirementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex flex-col">
              {/* Cabecera */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Nuevo Requerimiento</h3>
                  <button 
                    onClick={() => setShowNewRequirementModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Formulario */}
              <div className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center text-sm font-medium text-cyan-400 mb-2">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Tipo de Requerimiento
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        {value: 'REQ', label: 'REQUERIMIENTO'},
                        {value: 'INC', label: 'INCIDENCIA'},
                        {value: 'AJU', label: 'AJUSTE'},
                        {value: 'PRC', label: 'PROCESOS'},
                        {value: 'PRO', label: 'PROYECTO'},
                        {value: 'REN', label: 'REUNION'}
                      ].map((tipo) => (
                        <button
                          key={tipo.value}
                          type="button"
                          className={`py-2 px-1 md:px-2 rounded-lg text-xs font-medium border transition-all ${
                            newRequirement.tipo === tipo.value 
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent' 
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                          }`}
                          onClick={() => setNewRequirement({ ...newRequirement, tipo: tipo.value as any })}
                        >
                          {tipo.value}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center text-sm font-medium text-cyan-400 mb-2">
                      <FileText className="h-4 w-4 mr-2" />
                      Descripción
                    </label>
                    <input
                      type="text"
                      placeholder="Descripción del requerimiento"
                      className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      value={newRequirement.name}
                      onChange={(e) => setNewRequirement({ ...newRequirement, name: e.target.value })}
                    />
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="tieneEstimacion"
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                        checked={newRequirement.tieneEstimacion}
                        onChange={(e) => setNewRequirement({ ...newRequirement, tieneEstimacion: e.target.checked })}
                      />
                      <label htmlFor="tieneEstimacion" className="ml-2 text-sm font-medium text-gray-200 flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        Tiene tiempo estimado
                      </label>
                    </div>
                    
                    {newRequirement.tieneEstimacion && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tiempo Estimado</label>
                        <input
                          type="text"
                          placeholder="Ej: 2 horas, 3 días"
                          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={newRequirement.tiempoEstimado}
                          onChange={(e) => setNewRequirement({ ...newRequirement, tiempoEstimado: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="useCustomDate"
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                        checked={newRequirement.useCustomDate}
                        onChange={(e) => setNewRequirement({ ...newRequirement, useCustomDate: e.target.checked })}
                      />
                      <label htmlFor="useCustomDate" className="ml-2 text-sm font-medium text-gray-200 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        Usar fecha personalizada
                      </label>
                    </div>
                    
                    {newRequirement.useCustomDate && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
                        <input
                          type="date"
                          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={newRequirement.customDate}
                          onChange={(e) => setNewRequirement({ ...newRequirement, customDate: e.target.value })}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => setShowNewRequirementModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddNewRequirement}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg shadow-lg transition-colors"
                    disabled={!newRequirement.name.trim() || (newRequirement.tieneEstimacion && !newRequirement.tiempoEstimado.trim())}
                  >
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-1" />
                      Crear Requerimiento
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex flex-col">
              {/* Cabecera */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Nueva Tarea</h3>
                  <button 
                    onClick={() => setShowNewTaskModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Requerimiento: {requirements.find(r => r.id === selectedRequirement)?.name || 'Desconocido'}
                </div>
              </div>
              
              {/* Formulario */}
              <div className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center text-sm font-medium text-cyan-400 mb-2">
                      <ListTodo className="h-4 w-4 mr-2" />
                      Descripción
                    </label>
                    <input
                      type="text"
                      placeholder="Descripción detallada de la tarea"
                      className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-cyan-400 mb-2">
                        <FileText className="h-4 w-4 mr-2" />
                        Tipo
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['UI', 'validación', 'funcionalidad'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all ${
                              newTask.type === type 
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent' 
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                            onClick={() => setNewTask({ ...newTask, type: type as Task['type'] })}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-medium text-cyan-400 mb-2">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Prioridad
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {value: 'baja', color: 'from-green-500 to-emerald-500'},
                          {value: 'media', color: 'from-yellow-500 to-amber-500'},
                          {value: 'alta', color: 'from-red-500 to-rose-500'}
                        ].map((priority) => (
                          <button
                            key={priority.value}
                            type="button"
                            className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all ${
                              newTask.priority === priority.value 
                                ? `bg-gradient-to-r ${priority.color} text-white border-transparent` 
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                            onClick={() => setNewTask({ ...newTask, priority: priority.value as Task['priority'] })}
                          >
                            {priority.value.charAt(0).toUpperCase() + priority.value.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center text-sm font-medium text-cyan-400 mb-2">
                      <FileText className="h-4 w-4 mr-2" />
                      Comentarios
                    </label>
                    <textarea
                      placeholder="Comentarios adicionales sobre la tarea"
                      className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none h-24"
                      value={newTask.feedback}
                      onChange={(e) => setNewTask({ ...newTask, feedback: e.target.value })}
                    />
                  </div>
                </div>
                
                {/* Sección de fecha personalizada */}
                <div className="mt-5">
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="taskUseCustomDate"
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                        checked={newTask.useCustomDate}
                        onChange={(e) => setNewTask({ ...newTask, useCustomDate: e.target.checked })}
                      />
                      <label htmlFor="taskUseCustomDate" className="ml-2 text-sm font-medium text-gray-200 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        Usar fecha personalizada
                      </label>
                    </div>
                    
                    {newTask.useCustomDate && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
                        <input
                          type="date"
                          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={newTask.customDate}
                          onChange={(e) => setNewTask({ ...newTask, customDate: e.target.value })}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => setShowNewTaskModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddNewTask}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg shadow-lg transition-colors"
                    disabled={!newTask.description.trim()}
                  >
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-1" />
                      Crear Tarea
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-3 overflow-auto max-h-screen">
          <div className="bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Cabecera fija */}
            <div className="bg-gradient-to-r from-green-800 to-emerald-900 p-3 sm:p-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-semibold text-white">Completar Tarea</h3>
                <button 
                  onClick={() => {
                    setShowCompletionModal(false);
                    setSelectedTaskForCompletion(null);
                  }}
                  className="text-gray-200 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-1 text-xs sm:text-sm text-green-200 line-clamp-1">
                {selectedTaskForCompletion && 
                  tasks.find(t => t.id === selectedTaskForCompletion)?.description}
              </div>
            </div>
            
            {/* Contenido con scroll */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-grow">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-green-400 mb-1 sm:mb-2">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    ¿Cómo se completó?
                  </label>
                  <textarea
                    name="description"
                    placeholder="Describe cómo completaste la tarea y los detalles relevantes..."
                    className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none h-24"
                    value={completionDetails.description}
                    onChange={handleCompletionDetailsChange}
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium text-green-400 mb-1 sm:mb-2">
                    <Clock4 className="h-4 w-4 mr-2" />
                    Tiempo total dedicado
                  </label>
                  <input
                    type="text"
                    name="timeSpent"
                    placeholder="Ej: 2 horas, 30 minutos"
                    className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                    value={completionDetails.timeSpent}
                    onChange={handleCompletionDetailsChange}
                  />
                </div>
                
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-3">
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-green-400 mb-2">Estado del entregable</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sentToQA"
                          name="sentToQA"
                          className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                          checked={completionDetails.sentToQA}
                          onChange={handleCheckboxChange}
                        />
                        <label htmlFor="sentToQA" className="ml-2 text-sm font-medium text-gray-200">
                          Enviado a QA
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="deployedToProduction"
                          name="deployedToProduction"
                          className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                          checked={completionDetails.deployedToProduction}
                          onChange={handleCheckboxChange}
                        />
                        <label htmlFor="deployedToProduction" className="ml-2 text-sm font-medium text-gray-200 text-xs sm:text-sm">
                          Desplegado
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">Objetos utilizados</h4>
                    <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto p-1">
                      {availableTools.map(tool => (
                        <button
                          key={tool}
                          type="button"
                          onClick={() => handleToolSelection(tool)}
                          className={`py-1 px-1.5 rounded-full text-xs font-medium transition-colors ${
                            completionDetails.tools.includes(tool)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {tool}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Otro objeto..."
                        className="flex-1 bg-gray-700 text-white rounded-lg p-1.5 text-xs sm:text-sm border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        value={newTool}
                        onChange={(e) => setNewTool(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewTool()}
                      />
                      <button
                        onClick={handleAddNewTool}
                        disabled={!newTool.trim()}
                        className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white p-1.5 rounded-lg"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sección de fecha personalizada */}
            <div className="p-3 sm:p-4 border-t border-gray-800">
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="completionUseCustomDate"
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                    checked={completionDetails.useCustomDate}
                    onChange={(e) => setCompletionDetails(prev => ({ 
                      ...prev, 
                      useCustomDate: e.target.checked 
                    }))}
                  />
                  <label htmlFor="completionUseCustomDate" className="ml-2 text-sm font-medium text-gray-200 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    Usar fecha personalizada
                  </label>
                </div>
                
                {completionDetails.useCustomDate && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
                    <input
                      type="date"
                      className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                      value={completionDetails.customDate}
                      onChange={(e) => setCompletionDetails(prev => ({ 
                        ...prev, 
                        customDate: e.target.value 
                      }))}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Botones fijos en la parte inferior */}
            <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-800 flex-shrink-0">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setSelectedTaskForCompletion(null);
                }}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteTask}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg shadow-lg transition-colors flex items-center"
                disabled={!completionDetails.description.trim() || !completionDetails.timeSpent.trim()}
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Completar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-3 overflow-auto max-h-screen">
          <div className="bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Cabecera fija */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 p-3 sm:p-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-semibold text-white">Registrar Progreso</h3>
                <button 
                  onClick={() => {
                    setShowProgressModal(false);
                    setSelectedTaskForProgress(null);
                  }}
                  className="text-gray-200 hover:text-white transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-1 text-xs sm:text-sm text-purple-200 line-clamp-1">
                {selectedTaskForProgress && 
                  tasks.find(t => t.id === selectedTaskForProgress)?.description}
              </div>
            </div>
            
            {/* Contenido con scroll */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-grow">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-purple-400 mb-1 sm:mb-2">
                    <FileText className="h-4 w-4 mr-2" />
                    ¿Qué avances se lograron hoy?
                  </label>
                  <textarea
                    placeholder="Describe los avances realizados en esta tarea..."
                    className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none h-24"
                    value={progressDetails.description}
                    onChange={(e) => setProgressDetails(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium text-purple-400 mb-1 sm:mb-2">
                    <Clock4 className="h-4 w-4 mr-2" />
                    Tiempo dedicado hoy
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 2 horas, 30 minutos"
                    className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    value={progressDetails.timeSpent}
                    onChange={(e) => setProgressDetails(prev => ({ ...prev, timeSpent: e.target.value }))}
                  />
                  
                  <div className="mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Formatos: "2h", "45min", "1.5 horas", etc.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sección de fecha personalizada */}
            <div className="p-3 sm:p-4 border-t border-gray-800">
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="progressUseCustomDate"
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500"
                    checked={progressDetails.useCustomDate}
                    onChange={(e) => setProgressDetails(prev => ({ 
                      ...prev, 
                      useCustomDate: e.target.checked 
                    }))}
                  />
                  <label htmlFor="progressUseCustomDate" className="ml-2 text-sm font-medium text-gray-200 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    Usar fecha personalizada
                  </label>
                </div>
                
                {progressDetails.useCustomDate && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Fecha</label>
                    <input
                      type="date"
                      className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      value={progressDetails.customDate}
                      onChange={(e) => setProgressDetails(prev => ({ 
                        ...prev, 
                        customDate: e.target.value 
                      }))}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Botones fijos en la parte inferior */}
            <div className="flex justify-end gap-2 p-3 sm:p-4 border-t border-gray-800 flex-shrink-0">
              <button
                onClick={() => {
                  setShowProgressModal(false);
                  setSelectedTaskForProgress(null);
                }}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProgress}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-lg shadow-lg transition-colors flex items-center"
                disabled={!progressDetails.description.trim() || !progressDetails.timeSpent.trim()}
              >
                <Clock4 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Requirement Modal */}
      {showEditRequirementModal && requirementToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex flex-col">
              {/* Cabecera */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Editar Requerimiento</h3>
                  <button 
                    onClick={() => {
                      setShowEditRequirementModal(false);
                      setRequirementToEdit(null);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Formulario */}
              <div className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center text-sm font-medium text-cyan-400 mb-2">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Tipo de Requerimiento
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        {value: 'REQ', label: 'REQUERIMIENTO'},
                        {value: 'INC', label: 'INCIDENCIA'},
                        {value: 'AJU', label: 'AJUSTE'},
                        {value: 'PRC', label: 'PROCESOS'},
                        {value: 'PRO', label: 'PROYECTO'},
                        {value: 'REN', label: 'REUNION'}
                      ].map((tipo) => (
                        <button
                          key={tipo.value}
                          type="button"
                          className={`py-2 px-1 md:px-2 rounded-lg text-xs font-medium border transition-all ${
                            requirementToEdit.tipo === tipo.value 
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent' 
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                          }`}
                          onClick={() => setRequirementToEdit({ 
                            ...requirementToEdit, 
                            tipo: tipo.value as 'AJU' | 'INC' | 'PRC' | 'PRO' | 'REN' | 'REQ' 
                          })}
                        >
                          {tipo.value}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center text-sm font-medium text-cyan-400 mb-2">
                      <FileText className="h-4 w-4 mr-2" />
                      Descripción
                    </label>
                    <input
                      type="text"
                      placeholder="Descripción del requerimiento"
                      className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      value={requirementToEdit.name}
                      onChange={(e) => setRequirementToEdit({ ...requirementToEdit, name: e.target.value })}
                    />
                  </div>
  
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="editTieneEstimacion"
                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                        checked={requirementToEdit.tieneEstimacion || false}
                        onChange={(e) => setRequirementToEdit({ 
                          ...requirementToEdit, 
                          tieneEstimacion: e.target.checked,
                          tiempoEstimado: e.target.checked ? requirementToEdit.tiempoEstimado || '' : undefined
                        })}
                      />
                      <label htmlFor="editTieneEstimacion" className="ml-2 text-sm font-medium text-gray-200 flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        Tiene tiempo estimado
                      </label>
                    </div>
                    
                    {requirementToEdit.tieneEstimacion && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tiempo Estimado</label>
                        <input
                          type="text"
                          placeholder="Ej: 2 horas, 3 días"
                          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={requirementToEdit.tiempoEstimado || ''}
                          onChange={(e) => setRequirementToEdit({ ...requirementToEdit, tiempoEstimado: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setShowEditRequirementModal(false);
                      setRequirementToEdit(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateRequirement}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg shadow-lg transition-colors"
                    disabled={!requirementToEdit.name.trim() || (requirementToEdit.tieneEstimacion && !requirementToEdit.tiempoEstimado?.trim())}
                  >
                    <div className="flex items-center">
                      <Save className="h-4 w-4 mr-1" />
                      Actualizar
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row h-full">
              {/* Vista previa del perfil */}
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 md:w-2/5">
                <h3 className="text-lg font-semibold text-white mb-5">Vista previa</h3>
                
                <div className="bg-gray-800 rounded-xl p-5 shadow-lg">
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-md mb-3">
                      <span className="text-white font-bold text-4xl">
                        {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <h4 className="text-xl font-semibold text-white">{profileData.fullName || 'Nombre completo'}</h4>
                    <span className="text-cyan-400 text-sm font-medium px-2 py-1 bg-gray-700 rounded-full mt-2">
                      {profileData.developerLevel === 'trainee' ? 'Trainee' :
                       profileData.developerLevel === 'junior' ? 'Junior' :
                       profileData.developerLevel === 'semi-senior' ? 'Semi-Senior' :
                       profileData.developerLevel === 'senior' ? 'Senior' : 'Tech Lead'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm mt-5">
                    <div className="flex items-center text-gray-300">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                      {profileData.position || 'Cargo'} en {profileData.company || 'Empresa'}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      {profileData.area || 'Área de trabajo'}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                      Desde: {profileData.startDate || 'Fecha de inicio'}
                    </div>
                    {profileData.developerLevel === 'trainee' && profileData.adiestramiento && (
                      <div className="flex items-center text-purple-300">
                        <Clock className="h-4 w-4 mr-2 text-purple-400" />
                        {profileData.horasAdiestramiento}h de adiestramiento diarias
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Formulario de edición */}
              <div className="p-6 md:w-3/5 overflow-y-auto max-h-[70vh] md:max-h-[90vh]">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold">Editar Perfil</h3>
                  <button 
                    onClick={() => setShowEditProfileModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-5">
                  {/* Datos personales */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Datos Personales
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          placeholder="Nombre completo"
                          className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Documento de Identidad</label>
                        <input
                          type="text"
                          placeholder="Cédula o pasaporte"
                          className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={profileData.documentId}
                          onChange={(e) => setProfileData({ ...profileData, documentId: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Edad</label>
                        <input
                          type="number"
                          min="18"
                          placeholder="Edad"
                          className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={profileData.age || ''}
                          onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                        <input
                          type="text"
                          placeholder="Número de teléfono"
                          className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Datos profesionales */}
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Datos Profesionales
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Empresa a colocar</label>
                        <select
                          className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={profileData.company}
                          onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                        >
                          <option value="">Seleccionar empresa</option>
                          <option value="Seguros Universitas, C.A.">Seguros Universitas, C.A.</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Área</label>
                        <input
                          type="text"
                          placeholder="Área o departamento"
                          className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={profileData.area}
                          onChange={(e) => setProfileData({ ...profileData, area: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Cargo</label>
                        <input
                          type="text"
                          placeholder="Cargo o posición"
                          className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={profileData.position}
                          onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Fecha de inicio</label>
                        <input
                          type="date"
                          className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                          value={profileData.startDate}
                          onChange={(e) => setProfileData({ ...profileData, startDate: e.target.value })}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nivel de Desarrollador</label>
                        <div className="grid grid-cols-5 gap-2">
                          {['trainee', 'junior', 'semi-senior', 'senior', 'tech-lead'].map((level) => (
                            <button
                              key={level}
                              type="button"
                              className={`py-2 px-1 sm:px-3 rounded-lg text-xs sm:text-sm font-medium border transition-all ${
                                profileData.developerLevel === level 
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent' 
                                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                              }`}
                              onClick={() => setProfileData({ ...profileData, developerLevel: level })}
                            >
                              {level === 'trainee' ? 'Trainee' :
                               level === 'junior' ? 'Junior' :
                               level === 'semi-senior' ? 'Semi-Sr' :
                               level === 'senior' ? 'Senior' : 'Tech Lead'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Configuración de adiestramiento */}
                  {profileData.developerLevel === 'trainee' && (
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          id="adiestramientoCheck"
                          className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                          checked={profileData.adiestramiento}
                          onChange={(e) => setProfileData({ ...profileData, adiestramiento: e.target.checked })}
                        />
                        <label htmlFor="adiestramientoCheck" className="ml-2 text-sm font-medium text-gray-200">
                          En programa de adiestramiento
                        </label>
                      </div>
                      
                      {profileData.adiestramiento && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-400 mb-1">Horas diarias</label>
                          <div className="flex items-center">
                            <input
                              type="range"
                              min="0"
                              max="8"
                              step="0.5"
                              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              value={profileData.horasAdiestramiento}
                              onChange={(e) => setProfileData({ ...profileData, horasAdiestramiento: parseFloat(e.target.value) || 0 })}
                            />
                            <span className="ml-3 text-cyan-400 font-semibold">{profileData.horasAdiestramiento}h</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Botones de acción */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => setShowEditProfileModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg shadow-lg transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;