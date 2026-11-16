import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAq_VcDSYcTUkRi5I3Gdw7JzVa54mrhGec",
  authDomain: "trega-hub.firebaseapp.com",
  projectId: "trega-hub",
  storageBucket: "trega-hub.firebasestorage.app",
  messagingSenderId: "24196991643",
  appId: "1:24196991643:web:f3deb80004c1b7a257d43e"
};

// Inicializar los servicios principales
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Exportarlos para usarlos en cualquier componente sin repetir código
export { db, auth, storage };