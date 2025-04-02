import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { XCircle } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { Clock } from 'lucide-react';
import { Users } from 'lucide-react';
import { Settings } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Save } from 'lucide-react';
import { FileText } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { ListTodo } from 'lucide-react';
import { CheckSquare } from 'lucide-react';
import { Clock4 } from 'lucide-react';
import { Edit } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Briefcase } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useData } from './context/DataContext';
import { useAuth } from './context/AuthContext';
import { Task, Requirement } from './services/databaseService';
import AuthScreen from './components/AuthScreen';
import WelcomePage from './components/WelcomePage';
import Calendar from './components/Calendar';
import { WorkTimeTracker } from './components/WorkTimeTracker';
import Icon from './components/Icon';

function App() {
  const { currentUser, signOut, updateProfile } = useAuth();
  const { 
    requirements, 
    tasks, 
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
    deleteRequirement
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
    tiempoEstimado: ''
  });
  const [newTask, setNewTask] = useState({
    description: '',
    type: 'UI' as Task['type'],
    priority: 'media' as Task['priority'],
    feedback: ''
  });
  const [profileData, setProfileData] = useState<{
    company: string;
    area: string;
    developerLevel: string;
    adiestramiento: boolean;
    horasAdiestramiento: number;
  }>({
    company: currentUser?.userData?.company || '',
    area: currentUser?.userData?.area || '',
    developerLevel: currentUser?.userData?.developerLevel || 'junior',
    adiestramiento: currentUser?.userData?.adiestramiento || false,
    horasAdiestramiento: currentUser?.userData?.horasAdiestramiento || 0
  });

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
      currentUser: currentUser
    });
    
    try {
      const reqId = await addRequirement({
        name: newRequirement.name,
        tipo: newRequirement.tipo,
        tieneEstimacion: newRequirement.tieneEstimacion,
        tiempoEstimado: newRequirement.tieneEstimacion ? newRequirement.tiempoEstimado : undefined
      });
      
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
        tiempoEstimado: ''
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
      requirementId: selectedRequirement
      });
      
      await addTask({
        description: newTask.description,
        status: 'pending',
        type: newTask.type,
        priority: newTask.priority,
        feedback: newTask.feedback,
        requirementId: selectedRequirement
      });
      
      console.log('Tarea creada exitosamente');
      
    setNewTask({
      description: '',
      type: 'UI',
        priority: 'media',
      feedback: ''
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
    setShowCompletionModal(true);
  };

  const handleCompleteTask = async () => {
    if (!selectedTaskForCompletion) return;

    await completeTask(selectedTaskForCompletion, completionDetails);

    setShowCompletionModal(false);
    setSelectedTaskForCompletion(null);
    setCompletionDetails({ description: '', timeSpent: '' });
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
        horasAdiestramiento: profileData.horasAdiestramiento
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
              {!sidebarCollapsed && <span>Perfil</span>}
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
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} p-8`}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {activeView === 'dashboard' ? 'Control de Horas' : 
               activeView === 'all' ? 'Todas las Tareas' : 
               activeView === 'pending' ? 'Tareas Pendientes' : 'Tareas Completadas'}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-700 shadow-md">
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-xs">
                    {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-white text-sm font-medium">
                  {currentUser?.displayName} - {currentUser?.userData?.company || ''}
                </span>
                <span className="text-cyan-400 text-xs font-semibold px-2 py-0.5 bg-gray-700 rounded-full">
                  {currentUser?.userData?.developerLevel || 'junior'}
                </span>
                {currentUser?.userData?.developerLevel === 'trainee' && currentUser?.userData?.adiestramiento && (
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="text-purple-300 text-xs font-semibold">{currentUser.userData.horasAdiestramiento}h</span>
                      <span className="text-gray-400 text-xs">|</span>
                      <span className="text-cyan-300 text-xs font-semibold">{8 - (currentUser.userData.horasAdiestramiento || 0)}h</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Calendar and Work Time Tracker */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Calendar onSelectDate={setSelectedDate} />
                </div>
                <WorkTimeTracker
                  selectedDate={selectedDate}
                  tasks={tasks}
                  requirements={requirements}
                />
              </div>
              
              {/* Task Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Tasa de Completado</span>
                    <div className="text-cyan-400 text-2xl font-bold">{completionRate}%</div>
                  </div>
                  <div className="mt-2 bg-gray-700 h-2 rounded-full">
                    <div 
                      className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <span className="text-gray-400">Completadas</span>
                  <div className="text-green-400 text-2xl font-bold">{completedTasks}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <span className="text-gray-400">En Progreso</span>
                  <div className="text-yellow-400 text-2xl font-bold">{inProgressTasks}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <span className="text-gray-400">Pendientes</span>
                  <div className="text-red-400 text-2xl font-bold">{pendingTasks}</div>
                </div>
              </div>

              {/* Requirements List */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Requerimientos Recientes</h2>
                  <button
                    onClick={() => setShowNewRequirementModal(true)}
                    className="text-sm text-cyan-400 hover:underline"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="space-y-2">
                  {requirements.slice(0, 5).map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-lg cursor-pointer bg-gray-750 hover:bg-gray-700"
                      onClick={() => {
                        req.id && setSelectedRequirement(req.id);
                        setActiveView('all');
                      }}
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
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                                completeRequirement(req.id!);
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
                                <div className="text-gray-400 mt-1">
                                  Tiempo: {task.completionDetails.timeSpent} • 
                                  Completado: {task.completionDetails.completedAt instanceof Date 
                                    ? task.completionDetails.completedAt.toLocaleDateString() 
                                    : 'Fecha desconocida'}
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
                              <button 
                                onClick={() => openCompletionModal(task.id!)} 
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                              >
                                Completar
                              </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Nuevo Requerimiento</h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Requerimiento</label>
                <select
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={newRequirement.tipo}
                  onChange={(e) => setNewRequirement({ ...newRequirement, tipo: e.target.value as 'AJU' | 'INC' | 'PRC' | 'PRO' | 'REN' | 'REQ' })}
                >
                  <option value="AJU">AJUSTE</option>
                  <option value="INC">INCIDENCIA</option>
                  <option value="PRC">PROCESOS</option>
                  <option value="PRO">PROYECTO</option>
                  <option value="REN">REUNION</option>
                  <option value="REQ">REQUERIMIENTO</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
            <input
              type="text"
                  placeholder="Descripción del requerimiento"
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
              value={newRequirement.name}
                  onChange={(e) => setNewRequirement({ ...newRequirement, name: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="tieneEstimacion"
                    className="mr-2 h-4 w-4 rounded bg-gray-700 border-gray-600"
                    checked={newRequirement.tieneEstimacion}
                    onChange={(e) => setNewRequirement({ ...newRequirement, tieneEstimacion: e.target.checked })}
                  />
                  <label htmlFor="tieneEstimacion" className="text-sm font-medium text-gray-400">
                    Tiene tiempo estimado
                  </label>
                </div>
                
                {newRequirement.tieneEstimacion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tiempo Estimado</label>
                    <input
                      type="text"
                      placeholder="Ej: 2 horas, 3 días"
                      className="w-full bg-gray-700 text-white rounded-lg p-2"
                      value={newRequirement.tiempoEstimado}
                      onChange={(e) => setNewRequirement({ ...newRequirement, tiempoEstimado: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewRequirementModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNewRequirement}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
                disabled={!newRequirement.name.trim() || (newRequirement.tieneEstimacion && !newRequirement.tiempoEstimado.trim())}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Nueva Tarea</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="Descripción de la tarea"
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                <select
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value as Task['type'] })}
                >
                  <option value="UI">UI</option>
                  <option value="validación">Validación</option>
                  <option value="funcionalidad">Funcionalidad</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Prioridad</label>
                <select
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Comentarios</label>
                <textarea
                  placeholder="Comentarios sobre la tarea"
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={newTask.feedback}
                  onChange={(e) => setNewTask({ ...newTask, feedback: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNewTask}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
                disabled={!newTask.description.trim()}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Detalles de Completado</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  ¿Cómo se completó?
                </label>
                <textarea
                  placeholder="Describe cómo completaste la tarea..."
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={completionDetails.description}
                  onChange={(e) => setCompletionDetails(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Tiempo dedicado
                </label>
                <input
                  type="text"
                  placeholder="Ej: 2 horas, 30 minutos"
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={completionDetails.timeSpent}
                  onChange={(e) => setCompletionDetails(prev => ({ ...prev, timeSpent: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setSelectedTaskForCompletion(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteTask}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                disabled={!completionDetails.description.trim() || !completionDetails.timeSpent.trim()}
              >
                Completar Tarea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Requirement Modal */}
      {showEditRequirementModal && requirementToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Editar Requerimiento</h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Requerimiento</label>
                <select
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={requirementToEdit.tipo || 'REQ'}
                  onChange={(e) => setRequirementToEdit({ 
                    ...requirementToEdit, 
                    tipo: e.target.value as 'AJU' | 'INC' | 'PRC' | 'PRO' | 'REN' | 'REQ' 
                  })}
                >
                  <option value="AJU">AJUSTE</option>
                  <option value="INC">INCIDENCIA</option>
                  <option value="PRC">PROCESOS</option>
                  <option value="PRO">PROYECTO</option>
                  <option value="REN">REUNION</option>
                  <option value="REQ">REQUERIMIENTO</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="Descripción del requerimiento"
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={requirementToEdit.name}
                  onChange={(e) => setRequirementToEdit({ ...requirementToEdit, name: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="editTieneEstimacion"
                    className="mr-2 h-4 w-4 rounded bg-gray-700 border-gray-600"
                    checked={requirementToEdit.tieneEstimacion || false}
                    onChange={(e) => setRequirementToEdit({ 
                      ...requirementToEdit, 
                      tieneEstimacion: e.target.checked,
                      tiempoEstimado: e.target.checked ? requirementToEdit.tiempoEstimado || '' : undefined
                    })}
                  />
                  <label htmlFor="editTieneEstimacion" className="text-sm font-medium text-gray-400">
                    Tiene tiempo estimado
                  </label>
                </div>
                
                {requirementToEdit.tieneEstimacion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tiempo Estimado</label>
                    <input
                      type="text"
                      placeholder="Ej: 2 horas, 3 días"
                      className="w-full bg-gray-700 text-white rounded-lg p-2"
                      value={requirementToEdit.tiempoEstimado || ''}
                      onChange={(e) => setRequirementToEdit({ ...requirementToEdit, tiempoEstimado: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditRequirementModal(false);
                  setRequirementToEdit(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateRequirement}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
                disabled={!requirementToEdit.name.trim() || (requirementToEdit.tieneEstimacion && !requirementToEdit.tiempoEstimado?.trim())}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Editar Perfil</h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Empresa a colocar</label>
                <select
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
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
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={profileData.area}
                  onChange={(e) => setProfileData({ ...profileData, area: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nivel de Desarrollador</label>
                <select
                  className="w-full bg-gray-700 text-white rounded-lg p-2"
                  value={profileData.developerLevel}
                  onChange={(e) => setProfileData({ ...profileData, developerLevel: e.target.value })}
                >
                  <option value="trainee">Trainee</option>
                  <option value="junior">Junior</option>
                  <option value="semi-senior">Semi-Senior</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              
              {profileData.developerLevel === 'trainee' && (
                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="adiestramientoCheck"
                      className="mr-2 h-4 w-4 rounded bg-gray-700 border-gray-600"
                      checked={profileData.adiestramiento}
                      onChange={(e) => setProfileData({ ...profileData, adiestramiento: e.target.checked })}
                    />
                    <label htmlFor="adiestramientoCheck" className="text-sm font-medium text-gray-400">
                      En programa de adiestramiento
                    </label>
                  </div>
                  
                  {profileData.adiestramiento && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Horas diarias de adiestramiento</label>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        step="0.5"
                        className="w-full bg-gray-700 text-white rounded-lg p-2"
                        value={profileData.horasAdiestramiento}
                        onChange={(e) => setProfileData({ ...profileData, horasAdiestramiento: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateProfile}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;