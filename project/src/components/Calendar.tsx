import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  onSelectDate: (date: Date) => void;
}

// Feriados nacionales de Venezuela para 2023-2025
const FERIADOS_VENEZUELA = [
  // 2023
  '2023-01-01', // Año Nuevo
  '2023-01-09', // Batalla de La Victoria
  '2023-02-20', // Carnaval
  '2023-02-21', // Carnaval
  '2023-04-06', // Jueves Santo
  '2023-04-07', // Viernes Santo
  '2023-04-19', // Declaración de la Independencia
  '2023-05-01', // Día del Trabajador
  '2023-06-24', // Batalla de Carabobo
  '2023-07-05', // Día de la Independencia
  '2023-07-24', // Natalicio de Simón Bolívar
  '2023-10-12', // Día de la Resistencia Indígena
  '2023-12-24', // Nochebuena
  '2023-12-25', // Navidad
  '2023-12-31', // Fin de Año
  
  // 2024
  '2024-01-01', // Año Nuevo
  '2024-01-15', // Batalla de La Victoria
  '2024-02-12', // Carnaval
  '2024-02-13', // Carnaval
  '2024-03-28', // Jueves Santo
  '2024-03-29', // Viernes Santo
  '2024-04-19', // Declaración de la Independencia
  '2024-05-01', // Día del Trabajador
  '2024-06-24', // Batalla de Carabobo
  '2024-07-05', // Día de la Independencia
  '2024-07-24', // Natalicio de Simón Bolívar
  '2024-10-12', // Día de la Resistencia Indígena
  '2024-12-24', // Nochebuena
  '2024-12-25', // Navidad
  '2024-12-31', // Fin de Año

  // 2025
  '2025-01-01', // Año Nuevo
  '2025-01-06', // Día de Reyes
  '2025-03-03', // Carnaval
  '2025-03-04', // Carnaval
  '2025-04-17', // Jueves Santo
  '2025-04-18', // Viernes Santo
  '2025-04-19', // Declaración de la Independencia
  '2025-05-01', // Día del Trabajador
  '2025-06-24', // Batalla de Carabobo
  '2025-07-05', // Día de la Independencia
  '2025-07-24', // Natalicio de Simón Bolívar
  '2025-10-12', // Día de la Resistencia Indígena
  '2025-12-24', // Nochebuena
  '2025-12-25', // Navidad
  '2025-12-31', // Fin de Año
];

// Feriados bancarios adicionales
const FERIADOS_BANCARIOS = [
  // 2023
  '2023-03-19', // San José
  '2023-11-01', // Día de Todos los Santos
  '2023-11-04', // Nuestra Señora de Chiquinquirá (Zulia)
  '2023-12-08', // Inmaculada Concepción
  
  // 2024
  '2024-03-19', // San José
  '2024-11-01', // Día de Todos los Santos
  '2024-11-04', // Nuestra Señora de Chiquinquirá (Zulia)
  '2024-12-08', // Inmaculada Concepción

  // 2025
  '2025-03-19', // San José (19 de marzo)
  '2025-06-29', // San Pedro y San Pablo (29 de junio)
  '2025-08-15', // Asunción del Señor (15 de agosto)
  '2025-09-11', // Virgen del Valle (11 de septiembre)
  '2025-10-04', // San Francisco de Asís (4 de octubre)
  '2025-11-01', // Día de Todos los Santos
  '2025-11-04', // Nuestra Señora de Chiquinquirá (Zulia)
  '2025-12-08', // Inmaculada Concepción
];

const Calendar: React.FC<CalendarProps> = ({ onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Nombres de los meses y días de la semana
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Función para obtener el número de días en un mes
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Función para obtener el día de la semana del primer día del mes
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Función para verificar si una fecha es hoy
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Función para verificar si es día feriado nacional en Venezuela
  const isFeriadoNacional = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return FERIADOS_VENEZUELA.includes(dateString);
  };
  
  // Función para verificar si es día feriado bancario en Venezuela
  const isFeriadoBancario = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return FERIADOS_BANCARIOS.includes(dateString);
  };
  
  // Función para verificar si es cualquier tipo de día feriado en Venezuela
  const isFeriado = (date: Date) => {
    return isFeriadoNacional(date) || isFeriadoBancario(date);
  };
  
  // Función para verificar si es día laborable (lunes a viernes y no feriado)
  const isWorkingDay = (date: Date) => {
    const day = date.getDay();
    // Es día laborable si es de lunes a viernes (1-5) y no es feriado
    return day >= 1 && day <= 5 && !isFeriado(date);
  };
  
  // Navegar al mes anterior
  const previousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };
  
  // Navegar al mes siguiente
  const nextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };
  
  // Seleccionar una fecha
  const handleSelectDate = (day: number) => {
    const newSelectedDate = new Date(currentDate);
    newSelectedDate.setDate(day);
    setSelectedDate(newSelectedDate);
    onSelectDate(newSelectedDate);
  };
  
  // Generar el grid del calendario
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const grid = [];
    
    // Días del mes anterior para rellenar la primera semana
    const prevMonthDays = [];
    if (firstDayOfMonth > 0) {
      const daysInPrevMonth = getDaysInMonth(year, month - 1);
      for (let i = 0; i < firstDayOfMonth; i++) {
        prevMonthDays.unshift(daysInPrevMonth - i);
      }
    }
    
    // Agregar días del mes anterior
    for (const day of prevMonthDays) {
      const date = new Date(year, month - 1, day);
      grid.push({
        day,
        currentMonth: false,
        date
      });
    }
    
    // Agregar días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      grid.push({
        day,
        currentMonth: true,
        date
      });
    }
    
    // Días del mes siguiente para rellenar la última semana
    const remainingCells = 7 - (grid.length % 7 || 7);
    if (remainingCells < 7) {
      for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        grid.push({
          day,
          currentMonth: false,
          date
        });
      }
    }
    
    return grid;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarIcon className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-white font-medium">Calendario Laboral</h3>
        </div>
        <div className="flex items-center">
          <button 
            className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
            onClick={previousMonth}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="mx-2 text-white font-medium">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button 
            className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
            onClick={nextMonth}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {generateCalendarGrid().map((cell, index) => {
          const isSelectedDate = 
            cell.date.getDate() === selectedDate.getDate() &&
            cell.date.getMonth() === selectedDate.getMonth() &&
            cell.date.getFullYear() === selectedDate.getFullYear();
          
          // Comprobar si es un día feriado (nacional o bancario)
          const isFeriadoNacionalDay = isFeriadoNacional(cell.date);
          const isFeriadoBancarioDay = isFeriadoBancario(cell.date);
          const isFeriadoDay = isFeriadoNacionalDay || isFeriadoBancarioDay;
          
          // Comprobar si es fin de semana (sábado o domingo)
          const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
          
          return (
            <button
              key={index}
              className={`
                h-9 w-full flex items-center justify-center rounded-lg text-sm
                ${!cell.currentMonth ? 'text-gray-600' : 
                  isFeriadoNacionalDay ? 'text-red-400' :
                  isFeriadoBancarioDay ? 'text-orange-400' :
                  isWeekend ? 'text-gray-500' :
                  isWorkingDay(cell.date) ? 'text-white' : 'text-gray-500'}
                ${isToday(cell.date) ? 'bg-cyan-700 text-white' : ''}
                ${isSelectedDate ? 'bg-cyan-600 text-white' : ''}
                ${isFeriadoNacionalDay && cell.currentMonth && !isSelectedDate ? 'border-red-700 border' : ''}
                ${isFeriadoBancarioDay && cell.currentMonth && !isSelectedDate ? 'border-orange-700 border' : ''}
                ${isWeekend && cell.currentMonth && !isSelectedDate && !isFeriadoDay ? 'border-gray-600 border' : ''}
                ${cell.currentMonth && !isToday(cell.date) && !isSelectedDate ? 'hover:bg-gray-700' : ''}
              `}
              onClick={() => cell.currentMonth && handleSelectDate(cell.day)}
              disabled={!cell.currentMonth}
              title={
                isFeriadoNacionalDay ? 'Feriado nacional' : 
                isFeriadoBancarioDay ? 'Feriado bancario' : 
                isWeekend ? 'Fin de semana' : ''
              }
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-cyan-600 rounded-full mr-1"></div>
            <span>Hoy</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border border-red-700 rounded-full mr-1"></div>
            <span>Feriado nacional</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border border-orange-700 rounded-full mr-1"></div>
            <span>Feriado bancario</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border border-gray-600 rounded-full mr-1"></div>
            <span>Fin de semana</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 