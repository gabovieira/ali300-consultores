# Task Manager con Firebase

Una aplicación para gestionar tareas y requisitos de proyectos con persistencia de datos en Firebase.

## Características

- Gestión de requisitos (requirements) de proyectos
- Creación y seguimiento de tareas
- Asignación de tipo, prioridad y estado a cada tarea
- Estadísticas y métricas de progreso
- Almacenamiento de datos en Firebase Firestore

## Configuración

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn

### Instalación

1. Clona el repositorio o descarga los archivos
2. Instala las dependencias:

```bash
npm install
```

### Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Activa Firestore Database en tu proyecto
3. En la configuración del proyecto, obtén las credenciales de tu aplicación web
4. Edita el archivo `src/firebase.ts` y reemplaza los valores de `firebaseConfig` con tus propias credenciales:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "12345678901",
  appId: "1:12345678901:web:abc123def456"
};
```

### Configuración de reglas de seguridad de Firestore

En la consola de Firebase, establece las siguientes reglas de seguridad para Firestore (para desarrollo):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> Nota: Estas reglas permiten acceso completo a tu base de datos. Para producción, deberías implementar reglas de seguridad más estrictas.

## Ejecución

Para iniciar la aplicación en modo desarrollo:

```bash
npm run dev
```

## Estructura de la base de datos

La aplicación utiliza dos colecciones principales en Firestore:

### Colección `requirements`

Cada documento representa un requisito con los siguientes campos:
- `name`: Nombre del requisito
- `status`: Estado ('active' o 'completed')
- `createdAt`: Fecha de creación

### Colección `tasks`

Cada documento representa una tarea con los siguientes campos:
- `description`: Descripción de la tarea
- `status`: Estado ('pending', 'in-progress' o 'completed')
- `type`: Tipo de tarea ('UI', 'validation' o 'functionality')
- `priority`: Prioridad ('high', 'medium' o 'low')
- `feedback`: Retroalimentación o notas adicionales
- `requirementId`: ID del requisito al que pertenece
- `completionDetails`: Detalles de completado (solo para tareas completadas)
  - `description`: Descripción de cómo se completó
  - `timeSpent`: Tiempo dedicado
  - `completedAt`: Fecha de completado

## Personalización

Puedes personalizar la aplicación modificando los siguientes archivos:

- `src/App.tsx`: Componente principal de la aplicación
- `src/context/DataContext.tsx`: Contexto para el manejo de datos
- `src/services/databaseService.ts`: Servicios para interactuar con Firebase 