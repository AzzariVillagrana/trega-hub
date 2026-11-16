export default function handler(req, res) {
  // Manejo de la verificación del Webhook (Petición GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // El token debe coincidir con el que pones en Meta
    const verify_token = process.env.WEBHOOK_VERIFY_TOKEN;

    if (mode && token) {
      if (mode === 'subscribe' && token === verify_token) {
        console.log('✅ WEBHOOK VERIFICADO POR META');
        return res.status(200).send(challenge);
      } else {
        return res.status(403).json({ error: 'Token de verificación incorrecto' });
      }
    }
    return res.status(400).json({ error: 'Faltan parámetros de verificación' });
  }

  // Manejo de los mensajes entrantes (Petición POST)
  if (req.method === 'POST') {
    console.log('Mensaje recibido:', JSON.stringify(req.body, null, 2));
    // Por ahora solo respondemos 200 OK para que Meta sepa que llegó
    return res.status(200).send('EVENT_RECEIVED');
  }

  // Cualquier otro método no está permitido
  return res.status(405).json({ error: 'Método no permitido' });
}