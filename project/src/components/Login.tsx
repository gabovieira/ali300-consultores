import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Mail, Lock } from 'lucide-react';

interface LoginProps {
  onShowRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onShowRegister }) => {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validaciones básicas
    if (!email.trim()) {
      setLocalError('Ingresa un correo electrónico');
      return;
    }

    if (!password.trim()) {
      setLocalError('Ingresa una contraseña');
      return;
    }

    try {
      await signIn(email, password);
    } catch (err) {
      // El error se maneja en el contexto de autenticación
      // pero podemos mostrar información adicional
      console.error('Error en el componente de login:', err);
      if (err instanceof Error && err.message.includes('configuration-not-found')) {
        setLocalError('Error de configuración en Firebase. Por favor, verifica que la autenticación esté habilitada en la consola de Firebase.');
      }
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-cyan-600 rounded-full mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Iniciar Sesión</h2>
        <p className="text-gray-400">Ingresa para gestionar tus requerimientos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full bg-gray-700 pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="password"
              placeholder="********"
              className="w-full bg-gray-700 pl-10 pr-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {(error || localError) && (
          <div className="bg-red-900 text-white p-3 rounded-lg text-sm">
            {localError || error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              Iniciar Sesión
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="text-gray-400">
            ¿No tienes una cuenta?{' '}
            <button
              type="button"
              onClick={onShowRegister}
              className="text-cyan-400 hover:underline"
            >
              Regístrate
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login; 