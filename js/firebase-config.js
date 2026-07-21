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
  apiKey: "AIzaSyDDnW1S6nZmIYkuKl3gZ_J8e3d3lsN8D6w",
  authDomain: "inventario-vive.firebaseapp.com",
  projectId: "inventario-vive",
  storageBucket: "inventario-vive.firebasestorage.app",
  messagingSenderId: "84860026188",
  appId: "1:84860026188:web:f8044563aec73aa65563e9",
  measurementId: "G-000WHK1114"
};

firebase.initializeApp(firebaseConfig);

// Instancias globales usadas por el resto de la aplicación
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Habilita persistencia de sesión en el navegador
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Timestamp de servidor, útil para historial y auditoría
const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
