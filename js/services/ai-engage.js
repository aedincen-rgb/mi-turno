// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-engage.js
//  Motor de engagement — asegura que cada respuesta tenga:
//    · 1 pregunta de seguimiento (mantiene la conversación viva)
//    · 2 opciones rápidas (botones de acción)
//    · Variedad: sí/no, otra pregunta, continuar, explorar más
//  No abruma — dosifica según nivel de conversación y contexto.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── BANCO DE PREGUNTAS DE ENGAGEMENT ─────────────────────────
// Organizado por intent para máxima relevancia contextual.

var _aiEngageQuestions = {
  // ── Finanzas ──
  total_ganado: [
    { q: '¿Querés ver el detalle por tipo de recargo?', a1: 'Ver detalle', a2: 'No, gracias', i1: 'distribución', i2: null },
    { q: '¿Te gustaría comparar con lo que ganaste el mes pasado?', a1: 'VS mes pasado', a2: 'Mejor día', i1: 'comparativa_mes', i2: 'mejor_dia' },
    { q: '¿Sabías que podés simular cuánto ganarías con horas extra?', a1: 'Simular', a2: 'Proyección', i1: 'simulacion', i2: 'proyeccion' }
  ],
  hoy: [
    { q: '¿Querés ver también lo de ayer?', a1: 'Sí, ¿y ayer?', a2: 'Solo hoy', i1: 'ayer', i2: null },
    { q: '¿Te sirve el dato o necesitás algo más?', a1: 'Ver proyección', a2: 'Está bien, gracias', i1: 'proyeccion', i2: null }
  ],
  ayer: [
    { q: '¿Comparo con lo de hoy?', a1: 'Sí, comparar', a2: 'No hace falta', i1: 'comparativa_semana', i2: null }
  ],
  proyeccion: [
    { q: '¿Querés simular cuánto falta para tu meta?', a1: 'Simular', a2: 'Ver informe', i1: 'simulacion', i2: 'informe_completo'},
    { q: '¿Sabías que los turnos nocturnos pagan 35% más?', a1: 'Contame más', a2: 'No me interesa', i1: 'ley', i2: null }
  ],
  stats: [
    { q: '¿Profundizamos en algún número?', a1: 'Distribución', a2: 'Tendencia', i1: 'distribucion', i2: 'comparativa_semana' }
  ],
  distribucion: [
    { q: '¿Querés saber cómo optimizar tus horarios?', a1: 'Optimizar', a2: 'Ver proyección', i1: 'optimizador', i2: 'proyeccion' }
  ],
  liquidacion: [
    { q: '¿Querés un informe detallado de prestaciones?', a1: 'Sí, informe', a2: 'Con eso basta', i1: 'informe_completo', i2: null }
  ],
  ahorro: [
    { q: '¿Querés planear cuántos turnos te faltan?', a1: 'Planear turnos', a2: 'Ver proyección', i1: 'planificar', i2: 'proyeccion' }
  ],

  // ── Comparativas ──
  comparativa_mes: [
    { q: '¿Comparo también con la semana pasada?', a1: 'VS semana pasada', a2: 'Basta por ahora', i1: 'comparativa_semana', i2: null }
  ],
  comparativa_semana: [
    { q: '¿Y si miramos el mes completo?', a1: 'VS mes pasado', a2: 'No, siguiente', i1: 'comparativa_mes', i2: null }
  ],

  // ── Patrones ──
  mejor_dia: [
    { q: '¿Querés saber cuál fue tu peor día?', a1: 'Ver peor día', a2: 'Ver promedio', i1: 'peor_dia', i2: 'promedio' }
  ],
  peor_dia: [
    { q: '¿Te muestro cómo mejorar esos días bajos?', a1: 'Dame tips', a2: 'No, gracias', i1: 'consejo', i2: null }
  ],
  racha: [
    { q: '¿Querés un análisis de tu ritmo de trabajo?', a1: 'Ver ritmo', a2: 'Ver bienestar', i1: 'velocidad', i2: 'bienestar' }
  ],

  // ── Tiempo ──
  horas_trabajadas: [
    { q: '¿Desgloso por tipo de hora?', a1: 'Desglosar', a2: 'Ver extras', i1: 'distribucion', i2: 'comparativa_mes' }
  ],
  promedio: [
    { q: '¿Comparo con el valor de tu hora base?', a1: 'Comparar', a2: 'No hace falta', i1: 'velocidad', i2: null }
  ],
  velocidad: [
    { q: '¿Querés saber cómo subir tu velocidad?', a1: 'Dame tips', a2: 'Simular', i1: 'horas_trabajadas', i2: 'simulacion' }
  ],

  // ── Simulación ──
  simulacion: [
    { q: '¿Probamos otro escenario?', a1: 'Solo nocturnas', a2: 'Un turno extra', i1: 'simulacion', i2: 'planificar' },
    { q: '¿Querés saber cuánto necesitás para tu meta?', a1: 'Calcular meta', a2: 'Ver proyección', i1: 'ahorro', i2: 'proyeccion' }
  ],

  // ── Bienestar ──
  bienestar: [
    { q: '¿Querés que te recuerde cuándo descansar?', a1: 'Recordarme', a2: 'No por ahora', i1: 'planificar', i2: null }
  ],

  // ── Festivos ──
  festivos: [
    { q: '¿Querés ver cuánto ganarías en un festivo?', a1: 'Calcular', a2: 'Ya lo sé', i1: 'simulacion', i2: null }
  ],

  // ── Conocimiento / Ley ──
  ley: [
    { q: '¿Querés saber cómo aplicar esto a tu caso?', a1: 'Aplicar a mi caso', a2: 'Siguiente', i1: 'total_ganado', i2: null }
  ],
  laboral: [
    { q: '¿Te gustaría conocer más sobre derechos laborales?', a1: 'Más info', a2: 'Basta', i1: 'ley', i2: null }
  ],

  // ── Ayuda ──
  ayuda_app: [
    { q: '¿Hay algo específico con lo que necesités ayuda?', a1: 'Exportar datos', a2: 'Cambiar PIN', i1: 'ayuda_exportar', i2: 'ayuda_pin' }
  ],

  // ── Saludo / Identidad / Capacidades ──
  saludo: [
    { q: '¿Qué querés mirar hoy?', a1: '¿Cuánto gané este mes?', a2: 'Proyección', i1: 'total_ganado', i2: 'proyeccion' },
    { q: '¿Por dónde arrancamos?', a1: 'Ver mis números', a2: 'Simular algo', i1: 'stats', i2: 'simulacion' }
  ],
  identidad: [
    { q: '¿Te muestro todo lo que puedo hacer?', a1: 'Sí, mostrame', a2: 'Mejor preguntar', i1: 'capacidades', i2: 'ayuda_app' }
  ],
  capacidades: [
    { q: '¿Querés probar alguna?', a1: 'Simular ingresos', a2: 'Ver guías', i1: 'simulacion', i2: 'ayuda_app' }
  ],
  despedida: [
    { q: '¿Seguro que te vas? Todavía puedo ayudarte con algo más.', a1: 'Una consulta más', a2: 'Chao', i1: 'default', i2: null }
  ],
  agradecimiento: [
    { q: '¿Necesitás algo más?', a1: 'Sí, una cosa más', a2: 'Así está bien', i1: 'default', i2: null }
  ],

  // ── Fallback ──
  default: [
    { q: '¿Hay algo más en lo que te pueda ayudar?', a1: 'Ver mis números', a2: 'Hacer una simulación', i1: 'stats', i2: 'simulacion' },
    { q: '¿Querés explorar otra cosa?', a1: 'Ver proyección', a2: 'Ver distribución', i1: 'proyeccion', i2: 'distribucion' },
    { q: '¿Te gustaría conocer un dato curioso sobre horas extra?', a1: 'Contame', a2: 'Otro día', i1: 'ley', i2: null }
  ]
};

// ─── BANCO DE CURIOSIDADES (DATOS BREVES) ────────────────────
// Uno por respuesta, nunca repetir en la misma sesión.
var _aiCuriosidades = [
  '🌙 Dato curioso: si trabajás de noche (9pm-6am), cada hora vale 35% más. Un turno nocturno de 8h te paga como 10.8h diurnas.',
  '⛪ ¿Sabías que los domingos y festivos pagan 75% extra? Un turno de 8h en domingo equivale a 14h un día normal.',
  '📅 En Colombia hay 18 festivos al año — si trabajás todos, ganás como si hubieras trabajado 31.5 días extra.',
  '💰 El auxilio de transporte para 2026 es de ' + (typeof AUX_TRANSPORTE_2026 !== 'undefined' ? fCOP(AUX_TRANSPORTE_2026) : '$200.000') + ' mensuales si ganás hasta 2 SMMLV.',
  '⚖️ Desde la Ley 2101 de 2021, la jornada máxima bajó de 48 a 42 horas semanales (en fase progresiva hasta 2026).',
  '🧮 Las cesantías equivalen a un mes de salario por año trabajado. ¡Es como un ahorro obligatorio!',
  '🏖️ Por cada año trabajado, tenés derecho a 15 días hábiles de vacaciones pagas.',
  '📊 Si hacés horas extra de noche en un festivo, ¡cobrás el 150% extra! Es la tarifa más alta.',
  '🕐 El mejor momento para trabajar es de noche en festivo — cada hora te la pagan al 210%.',
  '💡 La prima de servicios son 15 días de salario por semestre. Se paga en junio y diciembre.',
  '🔢 Un turno normal de 8h diurnas te da 8h cotizadas. Pero 8h nocturnas + extra te dan hasta 14h cotizadas.',
  '📱 ¿Sabías que podés usar la app sin internet? Todos los cálculos son locales y se sincronizan después.',
  '🎯 Si mantenés un promedio de 8h diarias, en 22 días hábiles completás un mes de trabajo.'
];

var _aiCuriosidadUsadas = {};

// ─── BANCO DE MINI-DESAFÍOS (TRIVIA LABORAL) ──────────────────
// Preguntas tipo quiz que entretienen y educan.
var _aiTrivia = [
  { q: '¿Cuánto paga una hora extra diurna?', opts: ['+25%', '+35%', '+50%', '+75%'], correcta: 0, explicacion: 'La hora extra diurna tiene un recargo del 25% sobre el valor hora ordinario.' },
  { q: '¿Cuántos días de vacaciones te corresponden por año?', opts: ['10 días', '15 días', '20 días', '30 días'], correcta: 1, explicacion: 'Por ley, tenés derecho a 15 días hábiles de vacaciones por cada año trabajado.' },
  { q: '¿Cuánto paga un domingo trabajado?', opts: ['+25%', '+50%', '+75%', '+100%'], correcta: 2, explicacion: 'Los domingos y festivos pagan con recargo del 75% sobre el valor hora ordinario.' },
  { q: '¿Cuál es el máximo de horas extra por semana?', opts: ['8h', '10h', '12h', '16h'], correcta: 2, explicacion: 'El límite legal es de 12 horas extra por semana y máximo 2 por día.' },
  { q: '¿Cada cuánto se paga la prima de servicios?', opts: ['Mensual', 'Trimestral', 'Semestral', 'Anual'], correcta: 2, explicacion: 'La prima se paga en dos cuotas: junio (50%) y diciembre (50%).' }
];

var _aiTriviaUsadas = {};

// ─── API PRINCIPAL ────────────────────────────────────────────

/**
 * Genera 2 opciones de seguimiento garantizadas para cualquier intent.
 * Siempre devuelve un array con 2 actions, nunca vacío.
 *
 * @param {string} intent - intent clasificado por NLP
 * @param {object} userContext - contexto del usuario (buildContext)
 * @param {number} convLevel - nivel de conversación (0-3)
 * @returns {Array<{label: string, query: string}>}
 */
function aiEngageActions(intent, userContext, convLevel) {
  var c = userContext || {};
  var actions = [];

  // 1. Intentar acciones específicas del banco
  var pool = _aiEngageQuestions[intent] || _aiEngageQuestions['default'];
  if (!pool || !pool.length) pool = _aiEngageQuestions['default'];

  // Seleccionar una entrada del pool (evitar repetir la misma en sesión)
  var key = 'engage_' + intent;
  var usado = _aiEngageUsados || {};
  var candidatas = [];
  for (var i = 0; i < pool.length; i++) {
    if (!usado[key + '_' + i]) candidatas.push(i);
  }
  if (candidatas.length === 0) {
    // Reiniciar pool si ya se usaron todas
    for (var j = 0; j < pool.length; j++) usado[key + '_' + j] = false;
    candidatas = [];
    for (var k = 0; k < pool.length; k++) candidatas.push(k);
  }
  var idx = candidatas[Math.floor(Math.random() * candidatas.length)];
  usado[key + '_' + idx] = true;
  var entry = pool[idx];

  // Construir 2 botones de acción
  if (entry.a1) actions.push({ label: entry.a1, query: entry.a1, intent: entry.i1 });
  if (entry.a2) actions.push({ label: entry.a2, query: entry.a2, intent: entry.i2 });

  // 2. Si no hay suficientes, agregar del pool default
  if (actions.length < 2) {
    var defPool = _aiEngageQuestions['default'];
    var defEntry = defPool[Math.floor(Math.random() * defPool.length)];
    if (actions.length === 0 && defEntry.a1) actions.push({ label: defEntry.a1, query: defEntry.a1 });
    if (actions.length < 2 && defEntry.a2) actions.push({ label: defEntry.a2, query: defEntry.a2 });
  }

  return actions.slice(0, 2);
}

var _aiEngageUsados = {};

/**
 * Inserta una curiosidad si la respuesta es corta y no hay ya una.
 * Nunca repite la misma en la misma sesión.
 *
 * @param {string} text - respuesta actual
 * @returns {string}
 */
function aiEngageCuriosidad(text) {
  if (!text) return text;
  // Solo si la respuesta es relativamente corta (< 300 chars)
  if (text.length > 350) return text;
  // No repetir curiosidades
  var disponibles = [];
  for (var i = 0; i < _aiCuriosidades.length; i++) {
    if (!_aiCuriosidadUsadas[i]) disponibles.push(i);
  }
  if (disponibles.length === 0) {
    for (var j = 0; j < _aiCuriosidades.length; j++) _aiCuriosidadUsadas[j] = false;
    disponibles = [];
    for (var k = 0; k < _aiCuriosidades.length; k++) disponibles.push(k);
  }
  var idx = disponibles[Math.floor(Math.random() * disponibles.length)];
  _aiCuriosidadUsadas[idx] = true;
  return text + '\n\n📚 ' + _aiCuriosidades[idx];
}

/**
 * Genera un mini-desafío (trivia) si la respuesta es corta y el
 * usuario ya conversó al menos 3 turnos.
 *
 * @param {string} text - respuesta actual
 * @returns {string|null} - devuelve el texto con trivia, o null
 */
function aiEngageTrivia(text) {
  if (!text || text.length > 350) return null;
  if (_aiMemory && _aiMemory.history && _aiMemory.history.length < 4) return null;

  var disponibles = [];
  for (var i = 0; i < _aiTrivia.length; i++) {
    if (!_aiTriviaUsadas[i]) disponibles.push(i);
  }
  if (disponibles.length === 0) {
    for (var j = 0; j < _aiTrivia.length; j++) _aiTriviaUsadas[j] = false;
    disponibles = [];
    for (var k = 0; k < _aiTrivia.length; k++) disponibles.push(k);
  }
  var idx = disponibles[Math.floor(Math.random() * disponibles.length)];
  _aiTriviaUsadas[idx] = true;
  var t = _aiTrivia[idx];

  var optionsHtml = t.opts.map(function (o, oi) {
    return (oi + 1) + '. ' + o;
  }).join('  ');
  return text + '\n\n🎮 **Trivia laboral:** ' + t.q + '\n' + optionsHtml;
}

/**
 * Verifica si el usuario acertó una trivia y devuelve la respuesta.
 * Se llama desde el clasificador NLP o desde el envío de mensajes.
 *
 * @param {string} text - texto del usuario
 * @returns {string|null}
 */
function aiEngageCheckTrivia(text) {
  var t = (text || '').trim();
  // Solo verificar si parece respuesta numérica (1-4)
  var num = parseInt(t, 10);
  if (isNaN(num) || num < 1 || num > 4) return null;

  // Buscar la trivia activa
  var activa = null;
  for (var i = _aiTrivia.length - 1; i >= 0; i--) {
    if (_aiTriviaUsadas[i]) {
      activa = _aiTrivia[i];
      break;
    }
  }
  if (!activa) return null;

  if (num - 1 === activa.correcta) {
    return '✅ ¡Correcto! ' + activa.explicacion + ' 🎉\n\n¿Seguimos?';
  } else {
    return '❌ ¡Casi! La respuesta correcta es la ' + (activa.correcta + 1) + '. ' + activa.explicacion + '\n\n¿Otra pregunta?';
  }
}

// ─── LIMPIEZA ─────────────────────────────────────────────────

function aiEngageReset() {
  _aiEngageUsados = {};
  _aiCuriosidadUsadas = {};
  _aiTriviaUsadas = {};
}

// ─── EXPORT ────────────────────────────────────────────────────
window.aiEngageActions = aiEngageActions;
window.aiEngageCuriosidad = aiEngageCuriosidad;
window.aiEngageTrivia = aiEngageTrivia;
window.aiEngageCheckTrivia = aiEngageCheckTrivia;
window.aiEngageReset = aiEngageReset;

console.log('[MT] ai-engage.js cargado — motor de engagement');
