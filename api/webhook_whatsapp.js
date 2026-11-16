import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Inicializar Firebase Admin (Evita inicializarlo múltiples veces en Serverless)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

// 2. Inicializar la IA (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Configuración obligatoria para que Meta verifique el Webhook
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === 'trega_token_seguro_123') {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Token inválido' });
  }

  // Recepción de mensajes (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      // Extraer datos del mensaje de Meta/WhatsApp
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const messageData = changes?.value?.messages?.[0];
      
      if (!messageData) return res.status(200).send('No es un mensaje');

      const telefono = messageData.from;
      const textoRecibido = messageData.text?.body;

      // 3. Lógica de Base de Datos: ¿Quién nos escribe?
      const clienteRef = db.collection('clientes').doc(telefono);
      const clienteDoc = await clienteRef.get();
      
      let contextoCliente = "";
      if (!clienteDoc.exists) {
        contextoCliente = "Es un cliente nuevo, no está registrado.";
      } else {
        contextoCliente = `Es un cliente registrado. Estado: ${clienteDoc.data().estado}`;
      }

      // 4. Lógica de IA: Enrutar o Responder
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Rol: Eres el asistente Trega.
        Contexto del usuario: ${contextoCliente}
        Mensaje del usuario: "${textoRecibido}"
        Instrucción: Si es cliente nuevo, salúdalo y dile que Azzari te pidió contactarlo para iniciar su configuración.
      `;
      
      const aiResponse = await model.generateContent(prompt);
      const respuestaTexto = aiResponse.response.text();

      // 5. Enviar la respuesta de vuelta por WhatsApp (Aquí iría la llamada fetch a la API de Meta)
      console.log(`Respuesta generada para ${telefono}:`, respuestaTexto);

      // Responder HTTP 200 rápido a Meta para que no reintente el envío
      return res.status(200).json({ success: true, ai_response: respuestaTexto });

    } catch (error) {
      console.error("Error procesando webhook:", error);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
}