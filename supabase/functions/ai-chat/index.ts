// ════════════════════════════════════════════════════════════════
// MI TURNO · Edge Function: ai-chat
// Proxy seguro hacia Gemini 2.0 Flash — la API key nunca sale al cliente
//
// DOS MODOS:
//   1. Respuesta libre (mode: "chat"): responde en prosa con el knowledge doc
//   2. Extractor de intención (mode: "extract"): devuelve JSON estructurado
//      {intent, params, needs_calculation} sin inventar números
// ════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { APP_KNOWLEDGE } from './knowledge.ts';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// ─── SYSTEM PROMPT: MODO CHAT ────────────────────────────────
// Incluye el documento completo de conocimiento de la app.
const SYSTEM_PROMPT_CHAT = `Sos el asistente de Mi Turno, una app colombiana de cálculo de nómina para trabajadores por turnos.

${APP_KNOWLEDGE}

REGLAS DE RESPUESTA:
- Respondé SIEMPRE en español colombiano, tuteo informal
- Respuestas CORTAS y DIRECTAS por defecto (máximo 3 líneas)
- Solo respondé largo si el usuario pide "informe", "reporte", "desglose", "análisis" o "explícame todo"
- NUNCA inventes números de cálculo — si el usuario da datos personales, explicá la fórmula pero NO calcules por él (el motor local lo hará con precisión exacta)
- Si el usuario pregunta sobre sus datos personales (cuánto ganó, proyección, simulación), respondé que el motor local ya lo calculó y ofrecé la fórmula teórica
- Si pregunta algo fuera del dominio laboral, redirigí amablemente: "Eso está por fuera de lo mío, pero en lo laboral te ayudo"
- Usá números en pesos colombianos con formato: $1.234.567`;

// ─── SYSTEM PROMPT: MODO EXTRACTOR ───────────────────────────
// Gemini actúa como clasificador de intención. Devuelve SOLO JSON.
// El cliente usa el JSON para invocar la calculadora local correcta.
const SYSTEM_PROMPT_EXTRACT = `Sos un clasificador de intenciones para Mi Turno, una app de nómina colombiana.

Tu tarea: analizar el mensaje del usuario y devolver ÚNICAMENTE un JSON con este schema exacto:
{
  "intent": string,
  "params": object,
  "needs_calculation": boolean,
  "confidence": number
}

Intents posibles:
- "simular": quiere saber cuánto ganaría con N horas de un tipo (nocturnas, extra, festivas, etc.)
  params: { "horas": number, "tipo": "noctOrd"|"diurnaFest"|"noctFest"|"extraDiurna"|"extraNoct"|"extraFestDiur"|"extraFestNoct"|"diurnaOrd" }
  needs_calculation: true

- "total_ganado": quiere saber cuánto ha ganado en el período actual
  params: { "periodo": "hoy"|"ayer"|"semana"|"mes"|"quincena" }
  needs_calculation: true

- "proyeccion": estimado de ganancias al cierre del mes
  params: {}
  needs_calculation: true

- "liquidacion": neto a recibir, prestaciones proporcionales
  params: {}
  needs_calculation: true

- "valor_hora": su valor hora ordinaria personalizado
  params: {}
  needs_calculation: true

- "ahorro": cuántas horas o turnos necesita para llegar a una meta
  params: { "meta": number, "tipo": string|null }
  needs_calculation: true

- "optimizador": cómo distribuir turnos para ganar un monto extra
  params: { "meta_extra": number }
  needs_calculation: true

- "concepto": pregunta conceptual sobre recargos, ley, prestaciones (sin datos del usuario)
  params: { "tema": "nocturno"|"dominical"|"festivo"|"extra"|"jornada"|"prestaciones"|"auxilio"|"licencia"|"otro" }
  needs_calculation: false

- "ayuda_app": cómo usar una función de la app
  params: { "accion": string }
  needs_calculation: false

- "fuera_dominio": no relacionado con trabajo, nómina o la app
  params: {}
  needs_calculation: false

Reglas:
- Devolvé SOLO el JSON, sin texto antes ni después
- confidence va de 0.0 a 1.0
- Para "simular" con "4 horas nocturnas" → tipo: "noctOrd"
- Para "simular" con "4 horas extra nocturnas" → tipo: "extraNoct"
- Para "simular" sin tipo especificado → tipo: "diurnaOrd"
- Si hay ambigüedad, elegí el intent más probable

Ejemplos:
Usuario: "¿cuánto ganaría con 4 horas nocturnas?"
→ {"intent":"simular","params":{"horas":4,"tipo":"noctOrd"},"needs_calculation":true,"confidence":0.97}

Usuario: "¿qué es el recargo dominical?"
→ {"intent":"concepto","params":{"tema":"dominical"},"needs_calculation":false,"confidence":0.99}

Usuario: "¿cuánto llevo este mes?"
→ {"intent":"total_ganado","params":{"periodo":"mes"},"needs_calculation":true,"confidence":0.95}

Usuario: "¿cómo registro un turno?"
→ {"intent":"ayuda_app","params":{"accion":"registrar_turno"},"needs_calculation":false,"confidence":0.98}

Usuario: "¿cuál es el mejor restaurante cerca?"
→ {"intent":"fuera_dominio","params":{},"needs_calculation":false,"confidence":0.99}`;

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, context, mode } = body;
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) throw new Error('API key not configured');
    if (!message || typeof message !== 'string') throw new Error('message requerido');

    const isExtract = mode === 'extract';

    var userPrompt = message;
    if (context && typeof context === 'string' && !isExtract) {
      userPrompt = '[CONTEXTO DEL USUARIO: ' + context + ']\n\nPregunta: ' + message;
    }

    const generationConfig = isExtract
      ? {
          temperature: 0.1, // baja temperatura para extracción determinista
          maxOutputTokens: 150, // JSON es corto
          topP: 0.8,
          responseMimeType: 'application/json'
        }
      : {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.8
        };

    const systemPrompt = isExtract ? SYSTEM_PROMPT_EXTRACT : SYSTEM_PROMPT_CHAT;

    const response = await fetch(GEMINI_URL + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error('Gemini error ' + response.status + ': ' + errText);
    }

    const data = await response.json();
    const rawText =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
        ? data.candidates[0].content.parts[0].text
        : null;

    if (!rawText) {
      throw new Error('Gemini devolvió respuesta vacía');
    }

    if (isExtract) {
      // Validar que sea JSON parseable antes de devolver
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch (_) {
        // Gemini a veces devuelve JSON con texto alrededor — extraer el bloque
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error('Respuesta del extractor no es JSON válido');
        }
      }
      return new Response(JSON.stringify({ extraction: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ reply: rawText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
