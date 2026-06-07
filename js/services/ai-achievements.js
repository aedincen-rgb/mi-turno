// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-achievements.js
//  Sistema de logros, rachas e hitos motivacionales.
//  100% offline · ES5 · sin dependencias externas.
//
//  Evalúa los datos del usuario y devuelve logros desbloqueados.
//  Se integra con la IA para felicitar y motivar.
// ════════════════════════════════════════════════════════════════

// ─── DEFINICIÓN DE LOGROS ─────────────────────────────────────
var AI_ACHIEVEMENTS = [
  // ── Rachas ──
  {
    id: 'racha_3',
    title: 'Racha de 3 días',
    emoji: '🔥',
    desc: 'Trabajaste 3 días seguidos',
    check: function (c) { return c.rachaActual >= 3 && c.rachaActual < 5; }
  },
  {
    id: 'racha_5',
    title: 'Racha de 5 días',
    emoji: '⚡',
    desc: '¡5 días sin parar!',
    check: function (c) { return c.rachaActual >= 5 && c.rachaActual < 7; }
  },
  {
    id: 'racha_7',
    title: 'Racha de 7 días',
    emoji: '🌟',
    desc: 'Una semana entera trabajando',
    check: function (c) { return c.rachaActual >= 7 && c.rachaActual < 10; }
  },
  {
    id: 'racha_10',
    title: 'Racha legendaria',
    emoji: '👑',
    desc: '¡10 días seguidos! ¿Todo bien?',
    check: function (c) { return c.rachaActual >= 10; }
  },

  // ── Hitos de ingresos ──
  {
    id: 'primer_millon',
    title: 'Primer millón',
    emoji: '💵',
    desc: 'Superaste el millón de pesos este mes',
    check: function (c) { return c.totalCOP >= 1000000 && c.totalCOP < 2000000; }
  },
  {
    id: 'dos_millones',
    title: 'Dos millones',
    emoji: '💰',
    desc: '¡Pasaste los 2 millones!',
    check: function (c) { return c.totalCOP >= 2000000 && c.totalCOP < 3000000; }
  },
  {
    id: 'tres_millones',
    title: 'Tres millones',
    emoji: '💎',
    desc: '¡Sos una máquina! 3 millones este mes',
    check: function (c) { return c.totalCOP >= 3000000; }
  },

  // ── Hitos de horas ──
  {
    id: 'horas_100',
    title: '100 horas',
    emoji: '⏱',
    desc: 'Superaste las 100 horas trabajadas este mes',
    check: function (c) { return c.totalMins / 60 >= 100; }
  },
  {
    id: 'horas_200',
    title: '200 horas',
    emoji: '⌛',
    desc: '¡200 horas! Casi el máximo legal',
    check: function (c) { return c.totalMins / 60 >= 200; }
  },

  // ── Hitos de días ──
  {
    id: 'dias_10',
    title: '10 días trabajados',
    emoji: '📅',
    desc: 'Llevás 10 días este mes',
    check: function (c) { return c.diasTrab >= 10 && c.diasTrab < 15; }
  },
  {
    id: 'dias_15',
    title: 'Media mensualidad',
    emoji: '🗓',
    desc: '15 días — vas por la mitad del mes',
    check: function (c) { return c.diasTrab >= 15 && c.diasTrab < 20; }
  },
  {
    id: 'dias_20',
    title: '20 días',
    emoji: '📊',
    desc: 'Casi un mes completo trabajado',
    check: function (c) { return c.diasTrab >= 20; }
  },

  // ── Especiales ──
  {
    id: 'nocturno_50',
    title: 'Vampiro',
    emoji: '🦇',
    desc: 'Más del 50% de tus horas son nocturnas',
    check: function (c) {
      var noctMins = ((c.bd.noctOrd || {}).mins || 0) +
        ((c.bd.extraNoct || {}).mins || 0) +
        ((c.bd.noctFest || {}).mins || 0) +
        ((c.bd.extraFestNoct || {}).mins || 0);
      return c.totalMins > 0 && (noctMins / c.totalMins) > 0.5;
    }
  },
  {
    id: 'festivo_rey',
    title: 'Rey de los festivos',
    emoji: '⛪',
    desc: 'Trabajaste 3 o más festivos este mes',
    check: function (c) {
      return c.festDiasCount >= 3;
    }
  },
  {
    id: 'extra_champion',
    title: 'Campeón de extras',
    emoji: '🏆',
    desc: 'Más de 20 horas extra este mes',
    check: function (c) {
      var extras = ((c.bd.extraDiurna || {}).mins || 0) +
        ((c.bd.extraNoct || {}).mins || 0) +
        ((c.bd.extraFestDiur || {}).mins || 0) +
        ((c.bd.extraFestNoct || {}).mins || 0);
      return extras / 60 >= 20;
    }
  },
  {
    id: 'salario_superado',
    title: '¡Meta superada!',
    emoji: '🎯',
    desc: 'Ya ganaste más que tu salario base este mes',
    check: function (c) {
      return c.salario > 0 && c.totalCOP >= c.salario;
    }
  },

  // ── Records personales ──
  {
    id: 'record_diario',
    title: 'Récord diario',
    emoji: '🚀',
    desc: '¡Hoy fue tu mejor día del mes!',
    check: function (c) {
      return c.hoyEsRecord === true;
    }
  },
  {
    id: 'primer_turno',
    title: 'Primer turno',
    emoji: '🎬',
    desc: '¡Registraste tu primer turno en la app!',
    check: function (c) { return c.totalTurnosVida <= 1; }
  },
  {
    id: 'turnos_100',
    title: '100 turnos',
    emoji: '💯',
    desc: '¡100 turnos registrados en total!',
    check: function (c) { return c.totalTurnosVida >= 100 && c.totalTurnosVida < 200; }
  }
];

// ─── MOTOR DE LOGROS ──────────────────────────────────────────

/**
 * Evalúa todos los logros contra el contexto del usuario.
 * @param {object} c - contexto de buildContext
 * @returns {Array} lista de logros desbloqueados
 */
function aiCheckAchievements(c) {
  if (!c || !c.totalMins) return [];
  var unlocked = [];
  for (var i = 0; i < AI_ACHIEVEMENTS.length; i++) {
    var a = AI_ACHIEVEMENTS[i];
    try {
      if (a.check(c)) {
        unlocked.push({ id: a.id, title: a.title, emoji: a.emoji, desc: a.desc });
      }
    } catch (_) {}
  }
  return unlocked;
}

/**
 * Formatea logros para mostrar en el chat.
 * @param {Array} achievements - de aiCheckAchievements
 * @returns {string|null}
 */
function aiFormatAchievements(achievements) {
  if (!achievements || !achievements.length) return null;
  // Mostrar máximo 3 para no saturar
  var top = achievements.slice(0, 3);
  var resp = '\n\n🏅 **Logros desbloqueados:**\n';
  for (var i = 0; i < top.length; i++) {
    resp += top[i].emoji + ' ' + top[i].title + ' — ' + top[i].desc + '\n';
  }
  if (achievements.length > 3) {
    resp += '...y ' + (achievements.length - 3) + ' más. Escribí **/logros** para verlos todos.\n';
  }
  return resp;
}

/**
 * Lista todos los logros (desbloqueados y pendientes).
 * @param {object} c - contexto
 * @returns {string}
 */
function aiListAllAchievements(c) {
  var unlocked = aiCheckAchievements(c);
  var unlockedIds = {};
  for (var i = 0; i < unlocked.length; i++) {
    unlockedIds[unlocked[i].id] = true;
  }

  var resp = '🏅 **Todos los logros**\n\n';
  resp += '✅ **Desbloqueados (' + unlocked.length + '):**\n';
  if (unlocked.length === 0) {
    resp += '  Ninguno aún. ¡Seguí trabajando!\n';
  } else {
    for (var u = 0; u < unlocked.length; u++) {
      resp += '  ' + unlocked[u].emoji + ' ' + unlocked[u].title + '\n';
    }
  }

  resp += '\n🔒 **Pendientes:**\n';
  var pending = 0;
  for (var j = 0; j < AI_ACHIEVEMENTS.length; j++) {
    if (!unlockedIds[AI_ACHIEVEMENTS[j].id]) {
      resp += '  ' + AI_ACHIEVEMENTS[j].emoji + ' ' + AI_ACHIEVEMENTS[j].title + ' — ' + AI_ACHIEVEMENTS[j].desc + '\n';
      pending++;
    }
  }
  if (pending === 0) resp += '  ¡Los desbloqueaste todos! 🎉\n';

  return resp;
}

// ─── EXPORT ──────────────────────────────────────────────────
window.AI_ACHIEVEMENTS = AI_ACHIEVEMENTS;
window.aiCheckAchievements = aiCheckAchievements;
window.aiFormatAchievements = aiFormatAchievements;
window.aiListAllAchievements = aiListAllAchievements;

console.log('[MT] ai-achievements.js cargado — ' + AI_ACHIEVEMENTS.length + ' logros');
