import { GoogleGenAI } from '@google/genai';
import { buildGeminiCatalogContext } from '../shared/catalogLogic.ts';
import type { Venue } from '../shared/types.ts';

export interface IncomingHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

function isTransientUpstreamError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('high demand')
  );
}

function formatFriendlyGeminiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return 'La clave de Gemini API no es válida o no tiene permisos. Verifica GEMINI_API_KEY en Settings > Secrets.';
  }
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
    return 'El servicio de Gemini está experimentando alta demanda temporal. Intenta de nuevo en unos segundos.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Se alcanzó temporalmente el límite de consultas de Gemini API. Intenta nuevamente en un momento.';
  }
  return 'No se pudo obtener respuesta del asistente en este momento. Intenta de nuevo.';
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function askCatalogAssistant(
  message: string,
  history: IncomingHistoryItem[],
  venues: Venue[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Falta configurar GEMINI_API_KEY en el servidor para responder con el asistente inteligente.'
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const catalogContext = buildGeminiCatalogContext(venues);

  const systemInstruction = `Eres "Acorde", el asistente inteligente experto en música del directorio de tiendas de instrumentos musicales, estudios de grabación y escuelas de música.

REGLAS ESTRICTAS:
1. Responde siempre en español claro, cordial, directo y bien organizado.
2. Utiliza EXCLUSIVAMENTE los registros reales del catálogo proporcionados abajo cuando te pregunten por tiendas, escuelas, estudios, disponibilidad de instrumentos, clases, servicios, direcciones, contactos o precios registrados.
3. Si el usuario hace una pregunta pedagógica o general de orientación musical (por ejemplo, "¿Qué instrumento es recomendable para comenzar a estudiar música?"), da una recomendación práctica y fundamentada (como guitarra clásica de nylon, teclado/piano digital o ukelele, explicando por qué) y enlaza tu consejo con los locales, instrumentos y escuelas reales disponibles en el catálogo con sus precios.
4. No inventes locales, direcciones, teléfonos ni precios que no aparezcan en el catálogo. Si algo no está registrado, dilo con honestidad y sugiere alternativas reales del catálogo.
5. Mantén las respuestas concisas y fáciles de leer (usa viñetas simples cuando listes varios locales).

REGISTROS REALES ACTUALES DE LA BASE DE DATOS:
${catalogContext}`;

  const contents = [
    ...history.slice(-8).map((entry) => ({
      role: entry.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: entry.content }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const modelsToTry = ['gemini-4-hydrogen', 'gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: unknown = null;

  for (let attempt = 0; attempt < modelsToTry.length; attempt += 1) {
    const model = modelsToTry[attempt];
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim();
      if (reply) {
        return reply;
      }
      lastError = new Error('Respuesta vacía del modelo.');
    } catch (err) {
      lastError = err;
      if (!isTransientUpstreamError(err) || attempt === modelsToTry.length - 1) {
        break;
      }
      await delay(700 * (attempt + 1));
    }
  }

  throw new Error(formatFriendlyGeminiError(lastError));
}
