import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp, Timestamp, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDke6ECcxX7-MENu9QFAmTGPO2DvCm4tP0",
  authDomain: "proyecto-de-rquerimientos.firebaseapp.com",
  projectId: "proyecto-de-rquerimientos",
  storageBucket: "proyecto-de-rquerimientos.appspot.com", // Corregido a appspot.com
  messagingSenderId: "451424594818",
  appId: "1:451424594818:web:70c33a8bf31a28784f3d9b",
  measurementId: "G-BM0WHH2LYD"
};

// Registrar información de inicialización para depuración
console.log('Inicializando Firebase con config:', {
  apiKey: firebaseConfig.apiKey ? 'presente' : 'ausente',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  // No mostrar IDs completos por seguridad
});

// Inicializa Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase inicializado correctamente');
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
  throw error;
}

// Inicializa servicios de Firebase
let db: Firestore;
try {
  db = getFirestore(app);
  console.log('Firestore inicializado correctamente');
} catch (error) {
  console.error('Error al inicializar Firestore:', error);
  throw error;
}

// Inicializa Authentication
const auth = getAuth(app);
console.log('Authentication inicializado correctamente');

// Inicializa Storage
const storage = getStorage(app);

// Inicializa Analytics (solo en producción y si está disponible)
let analytics = null;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
    console.log('Analytics inicializado correctamente');
  }
} catch (error) {
  console.warn('No se pudo inicializar Analytics:', error);
}

// Exporta funciones útiles de Firestore
export {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp
};

export { db, auth, storage, analytics };
export default app; 