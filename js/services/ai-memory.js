// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-memory.js
//  Memoria semántica persistente entre sesiones del asistente.
//  Persiste: nivel conversacional, intents recientes, sugerencia
//  pendiente, ganancias y racha — para reanudar donde se dejó.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

var _mtMemNewSession = true;

// ─── CLAVE DE STORAGE ────────────────────────────────────────
function _aiMemKey(uid) {
  return typeof dk === 'function' ? dk(uid, 'aimem') : 'mt_aimem_' + uid;
}

// ─── CARGA ───────────────────────────────────────────────────
function aiMemoryLoad(uid) {
  if (!uid) return null;
  try {
    var raw = typeof leer === 'function' ? leer(_aiMemKey(uid), null) : null;
    if (!raw) {
      // fallback directo a localStorage si leer() no está disponible
      var s = localStorage.getItem(_aiMemKey(uid));
      raw = s ? JSON.parse(s) : null;
    }
    if (raw && raw.v === 1) return raw;
  } catch (_) {}
  return null;
}

// ─── GUARDADO ────────────────────────────────────────────────
function aiMemorySave(uid) {
  if (!uid) return;
  try {
    var snapshot = typeof aiGetMemorySnapshot === 'function' ? aiGetMemorySnapshot() : {};
    var convState =
      typeof aiConvGetState === 'function'
        ? aiConvGetState()
        : { level: 0, seenFeatures: {}, lastIntent: null };

    var prev = aiMemoryLoad(uid);
    var prevCount = prev && typeof prev.sessionCount === 'number' ? prev.sessionCount : 0;

    var structured = aiMemoryBuildStructured(uid, snapshot, convState);

    var recentMessages = typeof aiGetRecentMessages === 'function' ? aiGetRecentMessages(3) : [];

    var mem = {
      v: 1,
      lastTs: Date.now(),
      sessionCount: prevCount + 1,
      convLevel: convState.level,
      seenFeatures: convState.seenFeatures || {},
      recentIntents: snapshot.recentIntents || [],
      recentMessages: recentMessages,
      lastIntent: snapshot.lastIntent || convState.lastIntent || null,
      lastTopic: snapshot.lastTopic || null,
      pendingSuggestion: snapshot.pendingSuggestion || null,
      lastEarnings: snapshot.lastEarnings || 0,
      streakDays: snapshot.streakDays || 0,
      structured: structured
    };

    if (typeof grabar === 'function') {
      grabar(_aiMemKey(uid), mem);
    } else {
      localStorage.setItem(_aiMemKey(uid), JSON.stringify(mem));
    }
  } catch (_) {}
}

// ─── MEMORIA ESTRUCTURADA ────────────────────────────────────
// Separa conversación, finanzas, preferencias e historial para evitar
// duplicar texto crudo y para que el agente consulte solo lo necesario.
function aiMemoryBuildStructured(uid, snapshot, convState) {
  var prefs = {};
  try {
    prefs =
      typeof leer === 'function' && typeof dk === 'function' ? leer(dk(uid, 'prefs'), {}) : {};
  } catch (_) {}
  return {
    conversation: {
      recentMessages: typeof aiGetRecentMessages === 'function' ? aiGetRecentMessages(3) : [],
      recentIntents: snapshot.recentIntents || [],
      lastIntent: snapshot.lastIntent || convState.lastIntent || null,
      lastTopic: snapshot.lastTopic || null,
      pendingSuggestion: snapshot.pendingSuggestion || null,
      convLevel: convState.level || 0
    },
    financial: {
      lastEarnings: snapshot.lastEarnings || 0,
      streakDays: snapshot.streakDays || 0,
      lastUpdatedAt: Date.now()
    },
    userConfig: {
      uid: uid,
      prefs: prefs || {}
    },
    preferences: {
      seenFeatures: convState.seenFeatures || {}
    },
    queryHistory: {
      recentIntents: snapshot.recentIntents || []
    }
  };
}

// ─── RESTAURACIÓN ─────────────────────────────────────────────
function aiMemoryRestore(uid) {
  if (!uid) return;
  try {
    var mem = aiMemoryLoad(uid);
    if (!mem) return;

    if (typeof aiSeedMessages === 'function') {
      aiSeedMessages(mem.recentMessages);
    }

    if (typeof aiConvRestore === 'function') {
      aiConvRestore(mem.convLevel, mem.seenFeatures);
    }

    if (typeof aiRestoreHistory === 'function') {
      aiRestoreHistory(mem.recentIntents, mem.lastIntent, mem.lastTopic, mem.pendingSuggestion);
    }
  } catch (_) {}
}

// ─── MAPA DE INTENTS A FRASES ─────────────────────────────────
function _aiMemIntentLabel(intent) {
  var labels = {
    total_ganado: 'tus ganancias del mes',
    liquidacion: 'tu liquidación',
    simulacion: 'una simulación de turnos',
    proyeccion: 'la proyección al cierre',
    ahorro: 'tus metas de ahorro',
    bienestar: 'tu descanso y bienestar',
    stats: 'tus estadísticas',
    historial: 'tu historial de turnos',
    legal: 'tus derechos laborales',
    optimizador: 'el optimizador de horarios',
    oferta: 'una oferta de trabajo'
  };
  return labels[intent] || null;
}

// ─── BIENVENIDA DE VUELTA ─────────────────────────────────────
function aiMemoryOnFirstMessage(uid, userContext) {
  if (!_mtMemNewSession) return '';
  _mtMemNewSession = false;

  if (!uid) return '';

  var mem = aiMemoryLoad(uid);
  if (!mem || !mem.lastTs) return '';

  var ahora = Date.now();
  var diffMs = ahora - mem.lastTs;
  var diffMins = diffMs / 60000;

  // No interrumpir una sesión reanudada antes de 30 minutos
  if (diffMins < 30) return '';

  var diffDias = diffMs / 86400000;

  // Saludo según hora
  var saludo = typeof _saludoHora === 'function' ? _saludoHora(new Date()) : 'Hola';

  // Nombre personal
  var nombre = '';
  if (typeof _aiNombrePersonal === 'function' && userContext) {
    var sesProxy = {
      session: {
        uid: uid,
        email: userContext.email || '',
        guest: false
      }
    };
    nombre = _aiNombrePersonal(sesProxy) || '';
  }

  var partes = [];

  // Saludo base
  var saludoBase = saludo;
  if (nombre) saludoBase += ', ' + nombre;
  partes.push(saludoBase + '.');

  // Tiempo transcurrido
  if (diffDias >= 1) {
    var diasEnteros = Math.floor(diffDias);
    if (diasEnteros === 1) {
      partes.push('Pasó 1 día desde tu última sesión.');
    } else {
      partes.push('Pasaron ' + diasEnteros + ' días desde tu última sesión.');
    }
  } else {
    partes.push('Bienvenido de vuelta.');
  }

  // Sugerencia pendiente o último intent conocido
  if (mem.pendingSuggestion) {
    partes.push('La última vez te sugerí: *' + mem.pendingSuggestion + '* ¿Lo revisaste?');
  } else if (mem.lastIntent && mem.lastIntent !== 'unknown' && mem.lastIntent !== 'saludo') {
    var label = _aiMemIntentLabel(mem.lastIntent);
    if (label) {
      partes.push('La última vez estabas viendo ' + label + '. ¿Seguimos?');
    }
  }

  // Racha motivadora
  if (mem.streakDays >= 5) {
    partes.push(
      '¡Llevas ' +
        mem.streakDays +
        ' días seguidos registrando turnos! ' +
        'Esa constancia es lo que marca la diferencia.'
    );
  }

  return partes.join(' ');
}

// ─── RESET DE SESIÓN (cuando el usuario limpia el chat) ───────
function aiMemoryResetSession() {
  _mtMemNewSession = true;
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiMemoryLoad = aiMemoryLoad;
window.aiMemorySave = aiMemorySave;
window.aiMemoryBuildStructured = aiMemoryBuildStructured;
window.aiMemoryRestore = aiMemoryRestore;
window.aiMemoryOnFirstMessage = aiMemoryOnFirstMessage;
window.aiMemoryResetSession = aiMemoryResetSession;

console.log('[MT] ai-memory.js cargado — memoria persistente entre sesiones ✓');
