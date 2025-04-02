import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';
import { authService, AuthUser, UserData } from '../services/authService';

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string, userData?: UserData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (userData: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        try {
          const formattedUser = await authService.formatUser(user);
          setCurrentUser(formattedUser);
        } catch (err) {
          console.error('Error al formatear el usuario:', err);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, userData?: UserData) => {
    setError(null);
    try {
      setLoading(true);
      const user = await authService.signUp({
        email,
        password,
        displayName,
        userData
      });
      setCurrentUser(user);
      setLoading(false);
    } catch (err) {
      setError(`Error al registrar el usuario: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setLoading(false);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      setLoading(true);
      const user = await authService.signIn({
        email,
        password
      });
      setCurrentUser(user);
      setLoading(false);
    } catch (err) {
      setError(`Error al iniciar sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      setLoading(true);
      await authService.signOut();
      setCurrentUser(null);
      setLoading(false);
    } catch (err) {
      setError(`Error al cerrar sesión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setLoading(false);
      throw err;
    }
  };

  const updateProfile = async (userData: Partial<UserData>) => {
    setError(null);
    if (!currentUser) {
      setError('No hay usuario autenticado');
      throw new Error('No hay usuario autenticado');
    }
    
    try {
      setLoading(true);
      const updatedUser = await authService.updateUserProfile(currentUser.uid, userData);
      setCurrentUser(updatedUser);
      setLoading(false);
    } catch (err) {
      setError(`Error al actualizar el perfil: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setLoading(false);
      throw err;
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 