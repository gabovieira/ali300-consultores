// Este archivo es un alias para el hook useAuth que redirige al contexto de autenticación
import { useAuth as useAuthContext } from '../context/AuthContext';

// Exportamos el hook con el mismo nombre para mantener la compatibilidad
export const useAuth = useAuthContext;

// También lo exportamos como default para permitir diferentes formas de importación
export default useAuth; 