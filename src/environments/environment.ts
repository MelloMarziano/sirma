export const environment = {
  production: false,
  // URL del backend (opcional). Dejar vacio si no se usa API custom.
  backendUrl: '',
  firebase: {
    apiKey: 'REPLACE_FIREBASE_API_KEY',
    authDomain: 'REPLACE_FIREBASE_AUTH_DOMAIN',
    projectId: 'REPLACE_FIREBASE_PROJECT_ID',
    storageBucket: 'REPLACE_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'REPLACE_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'REPLACE_FIREBASE_APP_ID',
  },
  cloudinary: {
    cloudName: 'REPLACE_CLOUDINARY_CLOUD_NAME',
    uploadPreset: 'REPLACE_CLOUDINARY_UPLOAD_PRESET',
    // Endpoint seguro (backend/cloud function) para eliminar imagen por publicId.
    deleteEndpoint: '',
  },
};
