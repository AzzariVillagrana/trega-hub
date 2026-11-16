import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // 1. VALIDACIÓN DEL WEBHOOK (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verify_token = process.env.WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verify_token) {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Token incorrecto' });
  }

  // 2. RECEPCIÓN Y PROCESAMIENTO DE MENSAJES (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Verificar que el evento venga de WhatsApp
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        // Si hay un mensaje entrante y es de tipo texto
        if (messages && messages[0] && messages[0].type === 'text') {
          const numeroRemitente = messages[0].from;
          const textoRecibido = messages[0].text.body;

          console.log(`Recibido de ${numeroRemitente}: ${textoRecibido}`);

          // A. Mandar el texto a Gemini
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = `Un usuario de WhatsApp dice: "${textoRecibido}". Responde de manera breve, amigable y natural, ideal para un chat de celular.`;
          
          const result = await model.generateContent(prompt);
          const respuestaIA = result.response.text();

          console.log(`Respuesta de IA: ${respuestaIA}`);

          // B. Enviar la respuesta de vuelta por WhatsApp
          await enviarMensajeWhatsApp(numeroRemitente, respuestaIA);
        }
      }
      
      // Meta exige un 200 OK rápido para no reenviar el mensaje
      return res.status(200).send('EVENT_RECEIVED');
      
    } catch (error) {
      console.error("Error procesando el webhook:", error);
      return res.status(500).send('ERROR INTERNO');
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// --- FUNCIÓN AUXILIAR PARA ENVIAR EL MENSAJE ---
async function enviarMensajeWhatsApp(numeroDestino, texto) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: numeroDestino, // Número de quien nos escribió
    type: "text",
    text: { body: texto }
  };

  const respuesta = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!respuesta.ok) {
    const errorData = await respuesta.json();
    console.error("Error enviando mensaje a Meta:", errorData);
  } else {
    console.log("Mensaje entregado con éxito.");
  }
}