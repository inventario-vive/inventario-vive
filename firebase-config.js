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

  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDDnW1S6nZmIYkuKl3gZ_J8e3d3lsN8D6w",
    authDomain: "inventario-vive.firebaseapp.com",
    projectId: "inventario-vive",
    storageBucket: "inventario-vive.firebasestorage.app",
    messagingSenderId: "84860026188",
    appId: "1:84860026188:web:f8044563aec73aa65563e9",
    measurementId: "G-000WHK1114"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

// Habilita persistencia de sesión en el navegador
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Timestamp de servidor, útil para historial y auditoría
const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
