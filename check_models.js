import 'dotenv/config';

async function verificarModelos() {
  console.log("Consultando modelos disponibles en Google AI Studio...\n");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
        console.log("✅ MODELOS COMPATIBLES CON TU CUENTA:");
        data.models.forEach(m => {
            // Filtramos solo los que sirven para generar texto/chat
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name.replace('models/', '')}`);
            }
        });
    } else {
        console.log("❌ Error en la respuesta:", data);
    }
  } catch (error) {
    console.error("Error de red:", error);
  }
}

verificarModelos();