/* ============================================================
   VIVE TELECOM — Configuración de Firebase
   ------------------------------------------------------------
   1. Crear un proyecto en https://console.firebase.google.com
   2. Habilitar Firestore Database (modo producción) y
      Authentication > método "Correo electrónico/contraseña".
   3. Reemplazar los valores de abajo por los de tu proyecto
      (Configuración del proyecto > General > Tus apps > Web).
   4. Crear manualmente los primeros usuarios en
      Authentication > Users, o habilitar un flujo de alta
      controlado por un administrador.
   ============================================================ */

const firebaseConfig = {
  apiKey: "REEMPLAZAR_API_KEY",
  authDomain: "REEMPLAZAR.firebaseapp.com",
  projectId: "REEMPLAZAR_PROJECT_ID",
  storageBucket: "REEMPLAZAR.appspot.com",
  messagingSenderId: "REEMPLAZAR_SENDER_ID",
  appId: "REEMPLAZAR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

// Instancias globales usadas por el resto de la aplicación
const auth = firebase.auth();
const db = firebase.firestore();

// Habilita persistencia de sesión en el navegador
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Timestamp de servidor, útil para historial y auditoría
const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
