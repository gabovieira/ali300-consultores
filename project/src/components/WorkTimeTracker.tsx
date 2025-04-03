import React, { useEffect, useState } from 'react';
import { Clock, Check, Calendar, Briefcase, BookOpen, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { Task, Requirement } from '../services/databaseService';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface WorkTimeTrackerProps {
  selectedDate: Date;
  tasks: Task[];
  requirements: Requirement[];
}

export const WorkTimeTracker: React.FC<WorkTimeTrackerProps> = ({
  selectedDate,
  tasks,
  requirements
}) => {
  const { currentUser, updateProfile } = useAuth();
  const [trainingHours, setTrainingHours] = useState<{
    description: string;
    hours: number;
    isAutoGenerated: boolean;
    hoursPerTask: number;
  } | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [visibleTasks, setVisibleTasks] = useState<Task[]>([]);

  // Filtrar tareas completadas para la fecha seleccionada
  const completedTasks = tasks.filter(task => {
    if (task.status !== 'completed' || !task.completionDetails?.completedAt) return false;
    
    const completedAt = task.completionDetails.completedAt instanceof Timestamp 
      ? task.completionDetails.completedAt.toDate() 
      : task.completionDetails.completedAt instanceof Date
        ? task.completionDetails.completedAt
        : new Date(task.completionDetails.completedAt);
    
    return completedAt.toDateString() === selectedDate.toDateString();
  });

  // Filtrar tareas con progreso en la fecha seleccionada
  const progressTasks = tasks.filter(task => {
    if (!task.progress || task.progress.length === 0) return false;
    
    return task.progress.some(entry => {
      const entryDate = entry.date instanceof Timestamp 
        ? entry.date.toDate() 
        : entry.date instanceof Date
          ? entry.date
          : new Date(entry.date);
      
      return entryDate.toDateString() === selectedDate.toDateString();
    });
  });

  // Combinar tareas completadas y tareas con progreso, eliminando duplicados
  const allActivityTasks = [...completedTasks];
  
  progressTasks.forEach(progTask => {
    if (!allActivityTasks.some(task => task.id === progTask.id)) {
      allActivityTasks.push(progTask);
    }
  });

  // Agrupar tareas por requerimiento para una mejor visualización
  const tasksByRequirement: { [reqId: string]: Task[] } = {};
  
  allActivityTasks.forEach(task => {
    if (!tasksByRequirement[task.requirementId]) {
      tasksByRequirement[task.requirementId] = [];
    }
    tasksByRequirement[task.requirementId].push(task);
  });
  
  // Convertir a array de grupos para navegar entre ellos
  const taskGroups = Object.keys(tasksByRequirement).map(reqId => ({
    requirementId: reqId,
    tasks: tasksByRequirement[reqId]
  }));
  
  // Calcular horas totales trabajadas (incluidas las de progreso)
  const totalHours = tasks.reduce((total, task) => {
    let taskHours = 0;
    
    // Sumar horas de tareas completadas hoy
    if (task.status === 'completed' && task.completionDetails) {
      const completedAt = task.completionDetails.completedAt instanceof Timestamp 
        ? task.completionDetails.completedAt.toDate() 
        : task.completionDetails.completedAt instanceof Date
          ? task.completionDetails.completedAt
          : new Date(task.completionDetails.completedAt);
      
      if (completedAt.toDateString() === selectedDate.toDateString()) {
        const timeStr = task.completionDetails.timeSpent;
        // Intentar convertir el string de tiempo a horas
        const hours = parseFloat(timeStr) || extractHoursFromTimeString(timeStr);
        taskHours += hours;
      }
    }
    
    // Sumar horas de progreso registradas hoy
    if (task.progress && task.progress.length > 0) {
      task.progress.forEach(entry => {
        const entryDate = entry.date instanceof Timestamp 
          ? entry.date.toDate() 
          : entry.date instanceof Date
            ? entry.date
            : new Date(entry.date);
        
        if (entryDate.toDateString() === selectedDate.toDateString()) {
          const timeStr = entry.timeSpent;
          const hours = parseFloat(timeStr) || extractHoursFromTimeString(timeStr);
          taskHours += hours;
        }
      });
    }
    
    return total + taskHours;
  }, 0);

  // Función auxiliar para extraer horas de strings como "2 horas", "30 minutos"
  const extractHoursFromTimeString = (timeStr: string): number => {
    if (!timeStr) return 0;
    
    // Verificar si ya es un número (por ejemplo "2" o "2.5")
    const directNumber = parseFloat(timeStr);
    if (!isNaN(directNumber) && directNumber >= 0) {
      return directNumber;
    }
    
    // Buscar horas
    const hoursMatch = timeStr.match(/(\d+(\.\d+)?)\s*hora/i);
    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
    
    // Buscar minutos
    const minutesMatch = timeStr.match(/(\d+)\s*minuto/i);
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) / 60 : 0;
    
    return hours + minutes;
  };

  // Calcular el número total de actividades para el cálculo de adiestramiento
  const totalDailyActivities = allActivityTasks.reduce((total, task) => {
    // Si la tarea está completada, cuenta como 1 actividad
    if (task.status === 'completed') {
      return total + 1;
    }
    
    // Si tiene avances hoy, contar cada avance como una actividad separada
    const todaysProgressCount = task.progress?.filter(entry => {
      const entryDate = entry.date instanceof Timestamp 
        ? entry.date.toDate() 
        : entry.date instanceof Date
          ? entry.date
          : new Date(entry.date);
      
      return entryDate.toDateString() === selectedDate.toDateString();
    }).length || 0;
    
    return total + todaysProgressCount;
  }, 0);
  
  // Verificar si el usuario es trainee y tiene horas de adiestramiento
  const isTrainee = currentUser?.userData?.developerLevel === 'trainee';
  const hasTrainingProgram = isTrainee && currentUser?.userData?.adiestramiento;
  const dailyTrainingHours = hasTrainingProgram ? currentUser?.userData?.horasAdiestramiento || 0 : 0;
  const hoursPerActivity = totalDailyActivities > 0 ? dailyTrainingHours / totalDailyActivities : dailyTrainingHours;
  const workHours = 8 - dailyTrainingHours;

  // Calcular horas restantes de trabajo
  const remainingWorkHours = Math.max(workHours - totalHours, 0);
  
  // Calcular horas de adiestramiento automáticamente
  useEffect(() => {
    if (!hasTrainingProgram) {
      setTrainingHours(null);
      return;
    }

    // Si hay actividad en el día (completada o en progreso)
    if (allActivityTasks.length > 0) {
      // Generar descripción basada en las tareas del día
      let description = 'Se recibió adiestramiento para realizar: ';
      
      // Agregar información de todas las tareas con actividad
      allActivityTasks.forEach((task, index) => {
        const requirement = requirements.find(r => r.id === task.requirementId);
        
        description += `${index > 0 ? ', ' : ''}la tarea "${task.description}" del requerimiento ${requirement?.tipo || 'REQ'}: ${requirement?.name || 'Desconocido'}`;
        
        // Agregar detalles dependiendo del estado de la tarea
        if (task.status === 'completed' && task.completionDetails?.description) {
          description += ` (${task.completionDetails.description})`;
        } else if (task.progress && task.progress.length > 0) {
          const todaysProgress = task.progress.filter(entry => {
            const entryDate = entry.date instanceof Timestamp 
              ? entry.date.toDate() 
              : entry.date instanceof Date
                ? entry.date
                : new Date(entry.date);
            
            return entryDate.toDateString() === selectedDate.toDateString();
          });
          
          if (todaysProgress.length > 0) {
            description += ` (${todaysProgress[0].description})`;
          }
        }
      });

      setTrainingHours({
        description,
        hours: dailyTrainingHours,
        isAutoGenerated: true,
        hoursPerTask: dailyTrainingHours / allActivityTasks.length
      });
    } else {
      setTrainingHours(null);
    }
  }, [allActivityTasks, hasTrainingProgram, dailyTrainingHours, requirements, selectedDate]);

  // Actualizar tareas visibles cuando cambian las tareas completadas o la paginación
  useEffect(() => {
    if (allActivityTasks.length === 0) {
      setVisibleTasks([]);
      return;
    }
    
    // En lugar de mostrar todas las tareas a la vez, mostraremos solo la tarea actual
    setVisibleTasks([allActivityTasks[currentTaskIndex]]);
  }, [allActivityTasks, currentTaskIndex]);

  // Navegar a la tarea anterior
  const goToPreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  // Navegar a la siguiente tarea
  const goToNextTask = () => {
    if (currentTaskIndex < allActivityTasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 shadow-md border border-gray-700">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center">
          <div className="bg-cyan-600/20 p-1.5 sm:p-2 rounded-lg mr-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </div>
          <h3 className="text-white font-medium text-sm sm:text-base">Control de Horas</h3>
        </div>
        <div className="text-xs sm:text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">
          {selectedDate.toLocaleDateString()}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Horas de Trabajo */}
        <div className="bg-gray-700/30 p-2 sm:p-3 rounded-lg">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="flex items-center gap-1">
              <Briefcase className="text-cyan-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <h4 className="text-white text-xs sm:text-sm font-medium">Horas de Trabajo</h4>
            </div>
            <div className="text-right">
              <span className="text-cyan-400 font-semibold text-xs sm:text-sm">{Math.min(totalHours, workHours).toFixed(1)}</span>
              <span className="text-gray-400 text-xs sm:text-sm"> / {workHours.toFixed(1)}</span>
            </div>
          </div>
          <div className="h-1.5 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${Math.min((totalHours / workHours) * 100, 100)}%` }}
            ></div>
          </div>
          {remainingWorkHours > 0 && (
            <div className="text-xs sm:text-sm text-cyan-300 mt-1">
              Faltan {remainingWorkHours.toFixed(1)} horas para completar la jornada laboral
            </div>
          )}
          {taskGroups.length > 1 && (
            <div className="text-xs text-gray-400 mt-1">
              Mostrando {visibleTasks.length} de {allActivityTasks.length} tareas activas
            </div>
          )}
        </div>

        {/* Horas de Adiestramiento */}
        {hasTrainingProgram && (
          <div className="bg-gray-700/30 p-2 sm:p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="flex items-center gap-1">
                <BookOpen className="text-purple-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <h4 className="text-white text-xs sm:text-sm font-medium">Horas de Adiestramiento</h4>
              </div>
              <div className="text-right">
                <span className="text-purple-400 font-semibold text-xs sm:text-sm">
                  {trainingHours ? 
                    (dailyTrainingHours < 1 ? 
                      `${Math.round(dailyTrainingHours * 60)}min` : 
                      `${dailyTrainingHours.toFixed(1)}`) 
                    : '0.0'}
                </span>
                <span className="text-gray-400 text-xs sm:text-sm"> / {
                  dailyTrainingHours < 1 ? 
                    `${Math.round(dailyTrainingHours * 60)}min` : 
                    `${dailyTrainingHours.toFixed(1)}`
                }</span>
              </div>
            </div>
            <div className="h-1.5 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${trainingHours ? Math.min((trainingHours.hours / dailyTrainingHours) * 100, 100) : 0}%` }}
              ></div>
            </div>
            <div className="text-xs sm:text-sm text-purple-300 mt-1">
              {trainingHours ? (
                <span className="flex items-center gap-1">
                  <Check className="text-green-400 w-3 h-3" />
                  Adiestramiento de {
                    dailyTrainingHours < 1 ? 
                      `${Math.round(dailyTrainingHours * 60)} minutos` : 
                      `${dailyTrainingHours.toFixed(1)} horas`
                  } registrado automáticamente
                </span>
              ) : (
                allActivityTasks.length === 0 
                  ? 'Registra actividad para acumular horas de adiestramiento'
                  : 'Adiestramiento pendiente de actualizar'
              )}
            </div>
          </div>
        )}

        {/* Tareas Completadas */}
        <div className="bg-gray-700/30 p-2 sm:p-3 rounded-lg">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="flex items-center gap-1">
              <Clock className="text-cyan-400 w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <h4 className="text-white text-xs sm:text-sm font-medium truncate">
                Actividad del Día ({allActivityTasks.length})
              </h4>
            </div>
            
            {allActivityTasks.length > 0 && (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={goToPreviousTask}
                  disabled={currentTaskIndex === 0}
                  className={`p-1 rounded-full ${
                    currentTaskIndex === 0
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <span className="text-gray-400 text-xs sm:text-sm">
                  {currentTaskIndex + 1} / {allActivityTasks.length}
                </span>
                <button
                  onClick={goToNextTask}
                  disabled={currentTaskIndex === allActivityTasks.length - 1}
                  className={`p-1 rounded-full ${
                    currentTaskIndex === allActivityTasks.length - 1
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}
          </div>

          {visibleTasks.length > 0 ? (
            <div className="space-y-2">
              {visibleTasks.map((task) => {
                const requirement = requirements.find(r => r.id === task.requirementId);
                
                // Encontrar entradas de progreso para la fecha seleccionada
                const todaysProgress = task.progress?.filter(entry => {
                  const entryDate = entry.date instanceof Timestamp 
                    ? entry.date.toDate() 
                    : entry.date instanceof Date
                      ? entry.date
                      : new Date(entry.date);
                  
                  return entryDate.toDateString() === selectedDate.toDateString();
                });
                
                return (
                  <div key={task.id} className="bg-gray-700/70 rounded-lg p-2 sm:p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-white text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">
                          {task.description}
                        </h5>
                        <p className="text-gray-400 text-xs truncate">
                          {requirement?.tipo}: {requirement?.name}
                        </p>
                      </div>
                      <div className={`px-2 py-0.5 text-[10px] sm:text-xs rounded-full flex-shrink-0 ${
                        task.status === 'completed' 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-blue-900/50 text-blue-400'
                      }`}>
                        {task.status === 'completed' ? 'Completada' : 'En Progreso'}
                      </div>
                    </div>

                    {/* Mostrar detalles de tareas completadas */}
                    {task.status === 'completed' && task.completionDetails && (
                      <div className="mt-2 text-xs border-l-2 border-green-700 pl-2">
                        <p className="text-gray-300">{task.completionDetails.description}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span className="text-gray-400">
                            Tiempo: {task.completionDetails.timeSpent}
                          </span>
                          {task.completionDetails.tools && task.completionDetails.tools.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 w-full">
                              <span className="text-gray-400">Objetos:</span>
                              {task.completionDetails.tools.map((tool, idx) => (
                                <span key={idx} className="bg-gray-600/50 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full">
                                  {tool}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Mostrar detalles de progreso */}
                    {todaysProgress && todaysProgress.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center mb-1.5">
                          <span className="text-blue-400 text-[10px] font-medium">
                            {todaysProgress.length > 1 
                              ? `${todaysProgress.length} avances registrados hoy` 
                              : '1 avance registrado hoy'}
                          </span>
                        </div>
                        {todaysProgress.map((progress, idx) => (
                          <div key={idx} className="text-xs border-l-2 border-blue-700 pl-2 mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-blue-300 text-[10px] bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                                Avance {idx + 1} de {todaysProgress.length}
                              </span>
                              <span className="text-gray-400 text-[10px]">
                                {typeof progress.createdAt === 'object' && progress.createdAt instanceof Timestamp
                                  ? new Date(progress.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                  : typeof progress.createdAt === 'string'
                                    ? new Date(progress.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                    : ''}
                              </span>
                            </div>
                            <p className="text-gray-300">{progress.description}</p>
                            <span className="text-gray-400 mt-1 block">
                              Tiempo: {progress.timeSpent}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-700/70 rounded-lg p-2 sm:p-3 text-center text-gray-400 text-xs sm:text-sm">
              No hay actividad registrada para esta fecha
            </div>
          )}

          {/* Sección de Adiestramiento */}
          {currentUser?.userData?.adiestramiento && visibleTasks.length > 0 && (
            <div className="mt-4 bg-gradient-to-r from-purple-900/70 to-indigo-900/70 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <GraduationCap className="h-4 w-4 mr-2 text-purple-400" />
                <h4 className="text-purple-300 text-sm font-medium">Adiestramiento Relacionado</h4>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-2.5 text-xs">
                <p className="text-gray-300 mb-2">
                  Se recibió adiestramiento para realizar las siguientes actividades:
                </p>
                
                <div className="space-y-2">
                  {visibleTasks.map(task => {
                    const requirement = requirements.find(r => r.id === task.requirementId);
                    
                    // Ahora vamos a mostrar cada avance individualmente para la tarea visible
                    const todaysProgressEntries = task.progress?.filter(entry => {
                      const entryDate = entry.date instanceof Timestamp 
                        ? entry.date.toDate() 
                        : entry.date instanceof Date
                          ? entry.date
                          : new Date(entry.date);
                      
                      return entryDate.toDateString() === selectedDate.toDateString();
                    }) || [];
                    
                    // Si es tarea completada, usamos su información de completado
                    if (task.status === 'completed' && task.completionDetails) {
                      const timeSpent = task.completionDetails.timeSpent;
                      
                      // Formatear el tiempo de adiestramiento
                      let adiestramientoDisplay = '';
                      if (hoursPerActivity < 1) {
                        const minutes = Math.round(hoursPerActivity * 60);
                        adiestramientoDisplay = `${minutes} minutos`;
                      } else {
                        adiestramientoDisplay = `${hoursPerActivity.toFixed(2)} horas`;
                      }
                      
                      return (
                        <div key={`training-complete-${task.id}`} className="border-l-2 border-purple-500 pl-2">
                          <p className="text-white font-medium">
                            {requirement?.tipo}: {requirement?.name}
                          </p>
                          <p className="text-gray-400">
                            Tarea: {task.description} (Completada)
                          </p>
                          <div className="flex justify-between mt-1">
                            <span className="text-purple-300">
                              Tiempo registrado: {timeSpent}
                            </span>
                            <span className="text-purple-300 font-medium">
                              Adiestramiento: {adiestramientoDisplay}
                            </span>
                          </div>
                        </div>
                      );
                    } 
                    // Si hay avances para esta tarea, mostramos cada uno por separado
                    else if (todaysProgressEntries.length > 0) {
                      return (
                        <React.Fragment key={`training-progress-${task.id}`}>
                          {todaysProgressEntries.map((progress, idx) => {
                            // Usar la variable global hoursPerActivity que considera todas las actividades del día
                            
                            // Formatear el tiempo de adiestramiento para cada avance
                            let adiestramientoDisplay = '';
                            if (hoursPerActivity < 1) {
                              const minutes = Math.round(hoursPerActivity * 60);
                              adiestramientoDisplay = `${minutes} minutos`;
                            } else {
                              adiestramientoDisplay = `${hoursPerActivity.toFixed(2)} horas`;
                            }
                            
                            return (
                              <div key={`training-progress-${task.id}-${idx}`} className="border-l-2 border-purple-500 pl-2">
                                <p className="text-white font-medium">
                                  {requirement?.tipo}: {requirement?.name}
                                </p>
                                <p className="text-gray-400">
                                  Tarea: {task.description} (Avance {idx + 1})
                                </p>
                                <p className="text-gray-300 text-xs mt-1">
                                  Detalle: {progress.description}
                                </p>
                                <div className="flex justify-between mt-1">
                                  <span className="text-purple-300">
                                    Tiempo registrado: {progress.timeSpent}
                                  </span>
                                  <span className="text-purple-300 font-medium">
                                    Adiestramiento: {adiestramientoDisplay}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    }
                    
                    // Si no tiene ni completado ni avances para hoy, no mostramos nada
                    return null;
                  })}
                  
                  {/* Total de adiestramiento */}
                  <div className="mt-3 pt-2 border-t border-gray-700 flex justify-between">
                    <span className="text-white">Total adiestramiento:</span>
                    <span className="text-white font-bold">
                      {dailyTrainingHours < 1 
                        ? `${Math.round(dailyTrainingHours * 60)} minutos` 
                        : `${dailyTrainingHours.toFixed(1)} horas`}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-gray-300">Adiestramiento por actividad:</span>
                    <span className="text-gray-300 font-medium">
                      {hoursPerActivity < 1 
                        ? `${Math.round(hoursPerActivity * 60)} minutos` 
                        : `${hoursPerActivity.toFixed(2)} horas`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 