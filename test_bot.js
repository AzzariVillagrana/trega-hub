import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Inicializar Firebase con credenciales de administrador (Estructura Modular v12+)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // El replace es vital para que Node lea los saltos de línea correctamente
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
};

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// 2. Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function ejecutarPrueba() {
  console.log("Iniciando motores de Trega Hub...\n");
  
  try {
    // Prueba A: Escribir y leer en Firebase
    const telefonoPrueba = '523110000000';
    const clienteRef = db.collection('clientes').doc(telefonoPrueba);
    
    // Usamos new Date() nativo para simplificar la escritura modular
    await clienteRef.set({ 
        nombre: 'Azzari (Modo Prueba)', 
        estado: 'activo',
        fecha_registro: new Date()
    });
    console.log("✅ FIREBASE: Conexión exitosa. Cliente de prueba guardado en Firestore.");

    // Prueba B: Consultar a la IA
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = "Hola, soy Azzari. Eres el núcleo de IA de Trega Hub. Responde en una sola oración confirmando que tus sistemas están en línea y listos para interactuar con Firebase.";
    
    const result = await model.generateContent(prompt);
    console.log("\n✅ GEMINI (IA):", result.response.text());

  } catch (error) {
    console.error("\n❌ ERROR DE CONEXIÓN:", error);
  }
}

ejecutarPrueba();