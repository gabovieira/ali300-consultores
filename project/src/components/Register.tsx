import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, UserCircle, Briefcase, Code } from 'lucide-react';

interface RegisterProps {
  onShowLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onShowLogin }) => {
  const { signUp, loading, error } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [developerLevel, setDeveloperLevel] = useState('senior');
  const [company, setCompany] = useState('Seguros Universitas, C.A.');
  const [area, setArea] = useState('Sistemas');
  const [adiestramiento, setAdiestramiento] = useState(false);
  const [horasAdiestramiento, setHorasAdiestramiento] = useState('0');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validaciones básicas
    if (!displayName.trim()) {
      setLocalError('Ingresa tu nombre');
      return;
    }

    if (!email.trim()) {
      setLocalError('Ingresa un correo electrónico');
      return;
    }

    if (!password.trim()) {
      setLocalError('Ingresa una contraseña');
      return;
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    try {
      // Crear objeto con datos adicionales del usuario
      const userData = {
        developerLevel,
        company,
        area,
        adiestramiento,
        horasAdiestramiento: adiestramiento ? parseFloat(horasAdiestramiento) : 0
      };
      
      await signUp(email, password, displayName, userData);
    } catch (err) {
      // El error se maneja en el contexto de autenticación
      // pero podemos mostrar información adicional
      console.error('Error en el componente de registro:', err);
      if (err instanceof Error && err.message.includes('configuration-not-found')) {
        setLocalError('Error de configuración en Firebase. Por favor, verifica que la autenticación esté habilitada en la consola de Firebase.');
      }
    }
  };

  return (
    <div className="bg-gray-800 p-4 sm:p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-cyan-600 rounded-full mx-auto mb-3 sm:mb-4">
          <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Crear Cuenta</h2>
        <p className="text-sm sm:text-base text-gray-400">Regístrate para comenzar a gestionar tus requerimientos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Nombre</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Tu nombre"
              className="w-full bg-gray-700 pl-9 sm:pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white text-sm sm:text-base"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </div>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full bg-gray-700 pl-9 sm:pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Nivel de Desarrollador</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Code className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </div>
            <select
              className="w-full bg-gray-700 pl-9 sm:pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white text-sm sm:text-base"
              value={developerLevel}
              onChange={(e) => {
                setDeveloperLevel(e.target.value);
                if (e.target.value !== 'trainee') {
                  setAdiestramiento(false);
                }
              }}
            >
              <option value="trainee">Trainee</option>
              <option value="junior">Junior</option>
              <option value="semi-senior">Semi-Senior</option>
              <option value="senior">Senior</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Empresa Asignada</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Nombre de la empresa"
              className="w-full bg-gray-700 pl-9 sm:pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white text-sm sm:text-base"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Área</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Área o departamento"
              className="w-full bg-gray-700 pl-9 sm:pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white text-sm sm:text-base"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
        </div>

        {developerLevel === 'trainee' && (
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="adiestramiento"
                className="mr-2 h-3 w-3 sm:h-4 sm:w-4 rounded bg-gray-700 border-gray-600"
                checked={adiestramiento}
                onChange={(e) => setAdiestramiento(e.target.checked)}
              />
              <label htmlFor="adiestramiento" className="text-xs sm:text-sm font-medium text-gray-400">
                Horas de adiestramiento
              </label>
            </div>
            
            {adiestramiento && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Horas diarias de adiestramiento</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  step="0.5"
                  placeholder="Ej: 3.5"
                  className="w-full bg-gray-700 pl-3 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white text-sm sm:text-base"
                  value={horasAdiestramiento}
                  onChange={(e) => setHorasAdiestramiento(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Contraseña</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </div>
            <input
              type="password"
              placeholder="********"
              className="w-full bg-gray-700 pl-9 sm:pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Confirmar Contraseña</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </div>
            <input
              type="password"
              placeholder="********"
              className="w-full bg-gray-700 pl-9 sm:pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white text-sm sm:text-base"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        {(error || localError) && (
          <div className="bg-red-900 text-white p-2 sm:p-3 rounded-lg text-xs sm:text-sm">
            {localError || error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors duration-200 text-sm sm:text-base"
        >
          {loading ? (
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Crear Cuenta
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="text-xs sm:text-sm text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <button
              type="button"
              onClick={onShowLogin}
              className="text-cyan-400 hover:underline"
            >
              Inicia Sesión
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register; 