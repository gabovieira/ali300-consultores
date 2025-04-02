import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Interfaces
export interface UserData {
  developerLevel?: string;
  company?: string;
  area?: string;
  adiestramiento?: boolean;
  horasAdiestramiento?: number;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  userData?: UserData;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  userData?: UserData;
}

export interface SignInData {
  email: string;
  password: string;
}

// Traducir mensajes de error de Firebase Auth
const getAuthErrorMessage = (error: FirebaseError): string => {
  console.error('Código de error Firebase:', error.code);
  
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo electrónico ya está registrado. Por favor utiliza otro correo.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/operation-not-allowed': 'Esta operación no está permitida. Contacta con soporte.',
    'auth/weak-password': 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/user-not-found': 'No hay usuario registrado con este correo electrónico.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, inténtalo más tarde.',
    'auth/network-request-failed': 'Error de conexión. Verifica tu conectividad a internet.',
    'auth/internal-error': 'Error interno. Por favor, inténtalo de nuevo más tarde.',
    'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
    'auth/configuration-not-found': 'Error de configuración en Firebase. Asegúrate de que la autenticación esté habilitada en la consola de Firebase.'
  };

  return errorMessages[error.code] || `Error de autenticación: ${error.message}`;
};

// Convertir el objeto User de Firebase a nuestro objeto AuthUser
const formatUser = async (user: User): Promise<AuthUser> => {
  const authUser: AuthUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName
  };
  
  // Intentar obtener datos adicionales del usuario desde Firestore
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.developerLevel || userData.company || userData.area) {
        authUser.userData = {
          developerLevel: userData.developerLevel,
          company: userData.company,
          area: userData.area,
          adiestramiento: userData.adiestramiento || false,
          horasAdiestramiento: userData.horasAdiestramiento || 0
        };
      }
    }
  } catch (err) {
    console.error('Error al obtener datos adicionales del usuario:', err);
  }
  
  return authUser;
};

// Servicio de autenticación
export const authService = {
  // Registrar un nuevo usuario
  signUp: async (data: SignUpData): Promise<AuthUser> => {
    try {
      console.log('Registrando nuevo usuario:', data.email);
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Actualizar el perfil del usuario con el nombre
      if (data.displayName) {
        try {
          await updateProfile(result.user, {
            displayName: data.displayName
          });
        } catch (err) {
          console.error('Error al actualizar el perfil del usuario:', err);
          // Continuar a pesar del error en el perfil
        }
      }
      
      // Crear un documento para el usuario en Firestore
      try {
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: data.displayName,
          createdAt: new Date(),
          // Agregar datos adicionales
          ...(data.userData && {
            developerLevel: data.userData.developerLevel,
            company: data.userData.company,
            area: data.userData.area,
            adiestramiento: data.userData.adiestramiento,
            horasAdiestramiento: data.userData.horasAdiestramiento
          })
        };
        
        await setDoc(doc(db, 'users', result.user.uid), userData);
      } catch (err) {
        console.error('Error al crear el documento del usuario en Firestore:', err);
        // Continuar a pesar del error en Firestore
      }
      
      console.log('Usuario registrado correctamente:', result.user);
      return formatUser(result.user);
    } catch (error) {
      console.error('Error durante el registro:', error);
      if (error instanceof FirebaseError) {
        throw new Error(getAuthErrorMessage(error));
      }
      throw error;
    }
  },

  // Iniciar sesión
  signIn: async (data: SignInData): Promise<AuthUser> => {
    try {
      console.log('Iniciando sesión:', data.email);
      const result = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('Sesión iniciada correctamente:', result.user);
      return formatUser(result.user);
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      if (error instanceof FirebaseError) {
        throw new Error(getAuthErrorMessage(error));
      }
      throw error;
    }
  },

  // Cerrar sesión
  signOut: async (): Promise<void> => {
    try {
      await signOut(auth);
      console.log('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      if (error instanceof FirebaseError) {
        throw new Error(getAuthErrorMessage(error));
      }
      throw error;
    }
  },

  // Obtener el usuario actual
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },
  
  // Actualizar perfil de usuario
  updateUserProfile: async (uid: string, userData: Partial<UserData>): Promise<AuthUser> => {
    try {
      console.log('Actualizando perfil de usuario:', uid, userData);
      
      // Actualizar datos en Firestore
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, userData);
      
      // Obtener el usuario actualizado
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      
      console.log('Perfil de usuario actualizado correctamente');
      return formatUser(user);
    } catch (error) {
      console.error('Error al actualizar perfil de usuario:', error);
      if (error instanceof FirebaseError) {
        throw new Error(getAuthErrorMessage(error));
      }
      throw error;
    }
  },

  // Exponer la función formatUser
  formatUser
};

export default authService; 