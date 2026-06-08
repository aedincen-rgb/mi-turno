// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-knowledge.js
//  Base de conocimiento laboral — responde preguntas generales
//  sobre recargos, leyes y valores sin necesitar datos del usuario.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── BASE DE CONOCIMIENTO ─────────────────────────────────────

var AI_KNOWLEDGE = {
  'domingo': '⛪ **Trabajar un domingo o festivo paga con recargo del 75%** sobre tu valor hora ordinario.\n\n' +
    '• Hora diurna dominical: **1.75x** (75% extra)\n' +
    '• Hora nocturna dominical: **2.10x** (110% extra)\n' +
    '• Extra diurna dominical: **2.00x** (100% extra)\n' +
    '• Extra nocturna dominical: **2.50x** (150% extra)\n\n' +
    '📐 **Cómo calcularlo:** valor_hora × factor. Si tu hora vale $10,000, una hora dominical diurna son $17,500.\n\n' +
    '💡 También tenés derecho a un descanso compensatorio si trabajás domingo.\n\n' +
    '📌 **Sábado:** NO es festivo. Se paga como día ordinario, salvo que sea festivo por ley (ej. Sábado Santo).',
  'nocturno': '🌙 **El recargo nocturno es del 35%** sobre el valor hora ordinario.\n\n' +
    'Aplica entre las **9:00 PM y las 6:00 AM**.\n\n' +
    '• Hora nocturna ordinaria: **1.35x** (35% extra)\n' +
    '• Hora extra nocturna: **1.75x** (75% extra)\n\n' +
    '📐 Si tu hora vale $10,000, una hora nocturna vale $13,500.\n\n' +
    '💡 El recargo nocturno se acumula con el dominical/festivo si aplica.',
  'extra': '➕ **Horas extra en Colombia:**\n\n' +
    '• Extra diurna: **+25%** (1.25x)\n' +
    '• Extra nocturna: **+75%** (1.75x)\n' +
    '• Extra dominical/festiva diurna: **+100%** (2.00x)\n' +
    '• Extra dominical/festiva nocturna: **+150%** (2.50x)\n\n' +
    '⚖️ **Límites legales:** máximo 2 horas extra por día y 12 por semana (CST Art. 159).\n\n' +
    '💡 Las horas extra se calculan cuando superás la jornada ordinaria (8h/día o el límite semanal).',
  'festivo': '⛪ **Recargos en días festivos y domingos:**\n\n' +
    '• Diurno festivo: **+75%** (1.75x)\n' +
    '• Nocturno festivo: **+110%** (2.10x)\n' +
    '• Extra festivo diurno: **+100%** (2.00x)\n' +
    '• Extra festivo nocturno: **+150%** (2.50x)\n\n' +
    '💡 La app detecta automáticamente si un día es festivo. Todos los festivos colombianos están precargados.',
  'salario': '💰 **Salario mínimo 2026:** $1,750,905 (Decreto 1470/2025).\n\n' +
    '**Auxilio de transporte 2026:** $249,095 mensuales.\n\n' +
    '• Aplica si ganás hasta 2 SMMLV ($3,501,810).\n' +
    '• Activá esta opción en Ajustes > Preferencias de pago.\n\n' +
    '**Cómo calcular tu valor hora:** salario_base / 240 horas.',
  'ley': '⚖️ **Ley 2101 de 2021** — Reducción gradual de la jornada laboral:\n\n' +
    '• 2023: 47h/semana\n' +
    '• 2024: 46h/semana\n' +
    '• 2025: 45h/semana\n' +
    '• 2026: 44h/semana\n' +
    '• 2027 en adelante: 42h/semana\n\n' +
    'La app ajusta automáticamente el cálculo según la fecha del turno.\n\n' +
    '📐 **CST Art. 159:** jornada máxima diaria 8h.\n' +
    '📐 **CST Art. 168-171:** recargos nocturnos, extras, dominicales.'
};

// ─── MOTOR DE BÚSQUEDA ────────────────────────────────────────

/**
 * Busca en la base de conocimiento y devuelve la respuesta.
 * @param {string} text - pregunta del usuario
 * @returns {string|null}
 */
function aiKnowledgeSearch(text) {
  if (!text) return null;
  var t = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Buscar palabras clave en orden de especificidad
  var keywords = [
    { words: ['domingo', 'dominical', 'sabado', 'sábado', 'festivo vale', 'cuanto pagan domingo', 'recargo dominical', 'trabajar domingo', 'pagan domingo', 'pagan sabado', 'cuanto pagan sabado'], key: 'domingo' },
    { words: ['nocturno', 'noche', 'recargo noche', 'horario nocturno', 'pagan noche', 'cuanto pagan nocturno', 'vale hora noche'], key: 'nocturno' },
    { words: ['extra', 'extras', 'hora extra', 'sobretiempo', 'recargo extra', 'pagan extra', 'cuanto extra'], key: 'extra' },
    { words: ['festivo', 'feriado', 'fest', 'festividad', 'recargo festivo', 'cuanto festivo'], key: 'festivo' },
    { words: ['salario', 'sueldo', 'minimo', 'mínimo', 'base', 'cuanto es salario', 'cuanto pagan'], key: 'salario' },
    { words: ['ley', '2101', 'jornada', 'cst', 'codigo', 'código', 'legal', 'normativa', 'legislacion', 'derechos'], key: 'ley' }
  ];

  for (var i = 0; i < keywords.length; i++) {
    var kw = keywords[i];
    for (var j = 0; j < kw.words.length; j++) {
      if (t.indexOf(kw.words[j]) >= 0) {
        return AI_KNOWLEDGE[kw.key] || null;
      }
    }
  }

  // Búsqueda combinada
  if (t.indexOf('hora') >= 0 || t.indexOf('vale') >= 0 || t.indexOf('pagan') >= 0 || t.indexOf('cuanto') >= 0) {
    if (t.indexOf('domingo') >= 0) return AI_KNOWLEDGE['domingo'];
    if (t.indexOf('noche') >= 0 || t.indexOf('nocturn') >= 0) return AI_KNOWLEDGE['nocturno'];
    if (t.indexOf('extra') >= 0) return AI_KNOWLEDGE['extra'];
  }

  return null;
}

// ─── EXPORT ──────────────────────────────────────────────────
window.AI_KNOWLEDGE = AI_KNOWLEDGE;
window.aiKnowledgeSearch = aiKnowledgeSearch;

console.log('[MT] ai-knowledge.js cargado — base de conocimiento laboral ✓');
