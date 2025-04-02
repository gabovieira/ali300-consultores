import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { ArrowLeft } from 'lucide-react';

interface AuthScreenProps {
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'login', onBack }) => {
  const [showLogin, setShowLogin] = useState(initialMode === 'login');

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {onBack && (
          <button 
            onClick={onBack}
            className="mb-4 text-gray-400 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </button>
        )}
        
        {showLogin ? (
          <Login onShowRegister={() => setShowLogin(false)} />
        ) : (
          <Register onShowLogin={() => setShowLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthScreen; 