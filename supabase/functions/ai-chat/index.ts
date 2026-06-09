// ════════════════════════════════════════════════════════════════
// MI TURNO · Edge Function: ai-chat
// Proxy seguro hacia Gemini 2.0 Flash — la API key nunca sale al cliente
// ════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const SYSTEM_PROMPT = `Sos el asistente de Mi Turno, una app colombiana de cálculo de nómina para trabajadores por turnos.

CONTEXTO DE LA APP:
- Calcula salarios con recargos: nocturno (35%), dominical (75%), festivo (75%), hora extra diurna (25%), hora extra nocturna (75%)
- Salario mínimo Colombia 2026: $1.423.500
- Auxilio de transporte 2026: $200.021
- Ley colombiana: Código Sustantivo del Trabajo (CST)

REGLAS DE RESPUESTA:
- Respondé SIEMPRE en español colombiano, tuteo informal
- Respuestas CORTAS y DIRECTAS por defecto (máximo 3 líneas)
- Solo respondé largo si el usuario pide "informe", "reporte", "desglose", "análisis" o "explícame todo"
- Si el usuario da datos de su turno (horas, tipo, salario), hacé el cálculo
- Si pregunta algo fuera del dominio laboral, redirigí amablemente: "Eso está por fuera de lo mío, pero en lo laboral te ayudo"
- Nunca inventes leyes o porcentajes que no existan
- Usá números en pesos colombianos con formato: $1.234.567`;

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) throw new Error('API key not configured');
    if (!message || typeof message !== 'string') throw new Error('message requerido');

    var userPrompt = message;
    if (context && typeof context === 'string') {
      userPrompt = '[CONTEXTO DEL USUARIO: ' + context + ']\n\nPregunta: ' + message;
    }

    const response = await fetch(GEMINI_URL + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.8
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error('Gemini error ' + response.status + ': ' + errText);
    }

    const data = await response.json();
    const reply =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
        ? data.candidates[0].content.parts[0].text
        : 'No pude procesar eso, intentá de nuevo.';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
