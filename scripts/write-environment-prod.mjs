import fs from 'node:fs';
import path from 'node:path';

const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_UPLOAD_PRESET',
];

const missing = requiredEnvVars.filter((key) => !process.env[key] || !process.env[key].trim());

if (missing.length > 0) {
  console.error('Faltan variables requeridas para generar environment.prod.ts:');
  missing.forEach((name) => console.error(`- ${name}`));
  process.exit(1);
}

const escapeValue = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const backendUrl = escapeValue(process.env.BACKEND_URL ?? '');
const cloudinaryDeleteEndpoint = escapeValue(process.env.CLOUDINARY_DELETE_ENDPOINT ?? '');

const content = `export const environment = {
  production: true,
  backendUrl: '${backendUrl}',
  firebase: {
    apiKey: '${escapeValue(process.env.FIREBASE_API_KEY)}',
    authDomain: '${escapeValue(process.env.FIREBASE_AUTH_DOMAIN)}',
    projectId: '${escapeValue(process.env.FIREBASE_PROJECT_ID)}',
    storageBucket: '${escapeValue(process.env.FIREBASE_STORAGE_BUCKET)}',
    messagingSenderId: '${escapeValue(process.env.FIREBASE_MESSAGING_SENDER_ID)}',
    appId: '${escapeValue(process.env.FIREBASE_APP_ID)}',
  },
  cloudinary: {
    cloudName: '${escapeValue(process.env.CLOUDINARY_CLOUD_NAME)}',
    uploadPreset: '${escapeValue(process.env.CLOUDINARY_UPLOAD_PRESET)}',
    deleteEndpoint: '${cloudinaryDeleteEndpoint}',
  },
};
`;

const outputFile = path.resolve('src/environments/environment.prod.ts');
fs.writeFileSync(outputFile, content, 'utf8');
console.log(`Archivo generado: ${outputFile}`);
