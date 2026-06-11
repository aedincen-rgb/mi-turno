// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-episodes.js
//  Memoria episódica: registra QUÉ pasó y CUÁNDO en episodios
//  concretos (consultas significativas, metas propuestas, hitos),
//  y los recupera en lenguaje natural ("¿de qué hablamos?").
//  Complementa a ai-memory.js (memoria semántica: tema/intents).
//  100% offline · ES5 · localStorage por usuario · cap 60 episodios.
// ════════════════════════════════════════════════════════════════

var AI_EP_MAX = 60;
var AI_EP_DEDUP_MS = 6 * 3600000; // mismo episodio dentro de 6h → no repetir

function _aiEpKey(uid) {
  return typeof dk === 'function' ? dk(uid, 'aiep') : 'mt_aiep_' + uid;
}

function aiEpisodesLoad(uid) {
  if (!uid) return [];
  try {
    var raw = typeof leer === 'function' ? leer(_aiEpKey(uid), null) : null;
    if (raw && raw.v === 1 && raw.items && raw.items.length) return raw.items;
  } catch (_) {}
  return [];
}

function _aiEpSave(uid, items) {
  try {
    if (typeof grabar === 'function') grabar(_aiEpKey(uid), { v: 1, items: items });
  } catch (_) {}
}

// ─── REGISTRO ────────────────────────────────────────────────
// tipo: 'consulta' | 'meta' | 'hito'
// resumen: frase corta en pasado, sin punto final ("Te propusiste...")
function aiEpisodeRecord(uid, tipo, resumen, datos) {
  if (!uid || !tipo || !resumen) return false;
  var items = aiEpisodesLoad(uid);
  var ahora = Date.now();

  // Dedup: mismo tipo+resumen reciente no genera episodio nuevo
  for (var i = items.length - 1; i >= 0; i--) {
    if (
      items[i].tipo === tipo &&
      items[i].resumen === resumen &&
      ahora - items[i].ts < AI_EP_DEDUP_MS
    ) {
      return false;
    }
  }

  items.push({ ts: ahora, tipo: tipo, resumen: resumen, datos: datos || {} });
  if (items.length > AI_EP_MAX) items = items.slice(items.length - AI_EP_MAX);
  _aiEpSave(uid, items);
  return true;
}

// ─── REGISTRO AUTOMÁTICO DESDE EL PIPELINE ───────────────────
// Convierte interacciones significativas en episodios. Solo intents
// con valor de recuerdo; saluditos y charla no generan episodios.
var _AI_EP_INTENT_LABELS = {
  total_ganado: 'tus ganancias del mes',
  proyeccion: 'tu proyección al cierre',
  liquidacion: 'tu liquidación',
  simulacion: 'una simulación de turnos',
  ahorro: 'tus metas de ahorro',
  bienestar: 'tu descanso',
  stats: 'el resumen de tu mes',
  eficiencia: 'tu valor por hora',
  distribucion: 'el desglose de tus recargos',
  comparativa_mes: 'la comparativa con el mes pasado',
  comparativa_semana: 'la comparativa semanal',
  horas_trabajadas: 'tus horas trabajadas',
  racha: 'tu racha de trabajo',
  ley: 'tus derechos laborales',
  laboral: 'tus derechos laborales',
  optimizador: 'el optimizador de horarios',
  oferta: 'una oferta de trabajo',
  email: 'el envío de tu reporte',
  auditoria: 'la auditoría de tus turnos',
  consulta_datos: 'una consulta a tus datos'
};

function aiEpisodeFromInteraction(uid, intent, topic, question, c) {
  if (!uid || !intent) return;

  var label = _AI_EP_INTENT_LABELS[intent];
  if (label) {
    // Las consultas al motor de datos guardan la pregunta literal:
    // "Preguntaste: «cuánto gané los domingos»" es un recuerdo real.
    var resumen;
    if (intent === 'consulta_datos' && question) {
      var qLimpia = question.replace(/[¿?¡!]/g, '').trim();
      if (qLimpia.length > 60) qLimpia = qLimpia.substring(0, 57) + '...';
      resumen = 'Preguntaste: «' + qLimpia + '»';
    } else {
      resumen = 'Preguntaste por ' + label;
    }
    var datos = { intent: intent, q: (question || '').substring(0, 80) };
    // Dedup extra por intent: una consulta del mismo tipo en 6h basta.
    // consulta_datos se exceptúa: cada pregunta literal distinta es un
    // recuerdo propio (el dedup por resumen de aiEpisodeRecord la cubre).
    var repetido = false;
    if (intent !== 'consulta_datos') {
      var items = aiEpisodesLoad(uid);
      for (var i = items.length - 1; i >= 0; i--) {
        if (
          items[i].tipo === 'consulta' &&
          items[i].datos &&
          items[i].datos.intent === intent &&
          Date.now() - items[i].ts < AI_EP_DEDUP_MS
        ) {
          repetido = true;
          break;
        }
      }
    }
    if (!repetido) aiEpisodeRecord(uid, 'consulta', resumen, datos);
  }

  // Hito: superar el salario base (una vez por mes)
  try {
    if (c && c.pctSalario >= 100) {
      var mesKey = new Date().getFullYear() + '-' + (new Date().getMonth() + 1);
      var existentes = aiEpisodesLoad(uid);
      var yaCelebrado = false;
      for (var j = existentes.length - 1; j >= 0; j--) {
        if (
          existentes[j].tipo === 'hito' &&
          existentes[j].datos &&
          existentes[j].datos.mes === mesKey
        ) {
          yaCelebrado = true;
          break;
        }
      }
      if (!yaCelebrado) {
        aiEpisodeRecord(uid, 'hito', 'Superaste tu salario base este mes 🎉', { mes: mesKey });
      }
    }
  } catch (_) {}
}

// ─── RECUPERACIÓN ────────────────────────────────────────────

function aiEpisodesRecent(uid, n) {
  var items = aiEpisodesLoad(uid);
  var lim = n || 5;
  return items.slice(Math.max(0, items.length - lim)).reverse();
}

function aiEpisodeLast(uid) {
  var items = aiEpisodesLoad(uid);
  return items.length ? items[items.length - 1] : null;
}

function _aiEpFechaRel(ts) {
  var hoy = new Date();
  var fecha = new Date(ts);
  var hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  var fecha0 = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  var dias = Math.round((hoy0 - fecha0) / 86400000);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 7) return 'Hace ' + dias + ' días';
  var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return fecha.getDate() + ' ' + meses[fecha.getMonth()];
}

// ─── RESPUESTA CONVERSACIONAL ────────────────────────────────
// Detecta preguntas sobre la memoria compartida y responde con los
// episodios. Devuelve null si la pregunta no es de este dominio.
function aiEpisodeAnswer(q, uid) {
  if (!q || !uid) return null;
  var t = q.toLowerCase();
  try {
    t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (_) {}

  var esComando = t === '/recuerdos';
  var esPregunta =
    t.indexOf('de que hablamos') >= 0 ||
    t.indexOf('que hablamos') >= 0 ||
    t.indexOf('que hemos hablado') >= 0 ||
    t.indexOf('que te pregunte') >= 0 ||
    t.indexOf('que te he preguntado') >= 0 ||
    t.indexOf('te acordas') >= 0 ||
    t.indexOf('te acuerdas') >= 0 ||
    t.indexOf('que recuerdas') >= 0 ||
    t.indexOf('que recordas') >= 0;

  if (!esComando && !esPregunta) return null;
  // Las preguntas de datos ("¿recuerdas cuánto gané?") van a sus handlers
  if (!esComando && /\bcuant[oa]s?\b/.test(t)) return null;

  var eps = aiEpisodesRecent(uid, 5);
  if (!eps.length) {
    return (
      '🧠 Todavía no tengo episodios guardados de nuestras charlas. ' +
      'A medida que consultes tus datos o te propongas metas, los voy a ir recordando.'
    );
  }

  var lineas = [];
  for (var i = 0; i < eps.length; i++) {
    lineas.push('• ' + _aiEpFechaRel(eps[i].ts) + ': ' + eps[i].resumen);
  }

  return (
    '🧠 **Lo que recuerdo de nuestras charlas:**\n\n' +
    lineas.join('\n') +
    '\n\n¿Querés retomar alguno de esos temas?'
  );
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiEpisodesLoad = aiEpisodesLoad;
window.aiEpisodeRecord = aiEpisodeRecord;
window.aiEpisodeFromInteraction = aiEpisodeFromInteraction;
window.aiEpisodesRecent = aiEpisodesRecent;
window.aiEpisodeLast = aiEpisodeLast;
window.aiEpisodeAnswer = aiEpisodeAnswer;

console.log('[MT] ai-episodes.js cargado — memoria episódica ✓');
