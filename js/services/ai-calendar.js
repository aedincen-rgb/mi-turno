// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-calendar.js
//  Exporta los turnos como archivo .ics (iCalendar) para importar
//  en Google Calendar, Apple Calendar u otras agendas.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── GENERADOR ICS ────────────────────────────────────────────────

function _icsDate(ts) {
  var d = new Date(ts);
  var pad = function (n) {
    return n < 10 ? '0' + n : '' + n;
  };
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function _icsUID(turno) {
  return 'miturno-' + (turno.inicio || Date.now()) + '@miturno.app';
}

/**
 * Convierte un arreglo de turnos en contenido .ics.
 * @param {Array} turnos - lista de turnos {inicio, fin, desc?}
 * @returns {string} contenido del archivo .ics
 */
function aiGenerateICS(turnos) {
  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mi Turno//Mi Turno App//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mis Turnos - Mi Turno',
    'X-WR-CALDESC:Turnos laborales exportados desde Mi Turno'
  ];

  var stamp = _icsDate(Date.now());

  for (var i = 0; i < turnos.length; i++) {
    var t = turnos[i];
    if (!t.inicio || !t.fin) continue;

    var durMs = t.fin - t.inicio;
    var durHoras = Math.round((durMs / (1000 * 60 * 60)) * 10) / 10;
    var summary = t.desc ? 'Turno - ' + t.desc : 'Turno laboral';
    var description = 'Turno de ' + durHoras + 'h registrado en Mi Turno';

    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + _icsUID(t));
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART:' + _icsDate(t.inicio));
    lines.push('DTEND:' + _icsDate(t.fin));
    lines.push('SUMMARY:' + summary);
    lines.push('DESCRIPTION:' + description);
    lines.push('CATEGORIES:TRABAJO');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Descarga los turnos como archivo .ics para importar en cualquier agenda.
 * @param {string} uid - user id
 * @param {Array} [filtroTurnos] - turnos a exportar (si null, lee de localStorage)
 * @returns {boolean} true si se descargó algo
 */
function aiExportCalendar(uid, filtroTurnos) {
  try {
    var turnos = filtroTurnos;
    if (!turnos && uid) {
      turnos = leer(dk(uid, 't'), []);
    }
    if (!turnos || turnos.length === 0) {
      if (typeof showToast === 'function') {
        showToast('No tenés turnos para exportar', 'warning', 3000);
      }
      return false;
    }

    // Filtrar solo los que tienen inicio y fin
    var exportables = [];
    for (var i = 0; i < turnos.length; i++) {
      if (turnos[i].inicio && turnos[i].fin) {
        exportables.push(turnos[i]);
      }
    }

    if (exportables.length === 0) {
      if (typeof showToast === 'function') {
        showToast('No hay turnos completos para exportar', 'warning', 3000);
      }
      return false;
    }

    var icsContent = aiGenerateICS(exportables);
    var blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var now = new Date();
    a.download = 'mis-turnos-' + now.getFullYear() + '-' + (now.getMonth() + 1) + '.ics';
    a.style.cssText = 'position:absolute;opacity:0;pointer-events:none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 1000);

    if (typeof showToast === 'function') {
      showToast('📅 ' + exportables.length + ' turnos exportados', 'success', 4000);
    }
    return exportables.length;
  } catch (e) {
    console.error('[Calendario] Error al exportar:', e);
    if (typeof showToast === 'function') {
      showToast('No se pudo exportar. Intentá de nuevo.', 'error', 3000);
    }
    return false;
  }
}

// ─── EXPORT ─────────────────────────────────────────────────────
window.aiGenerateICS = aiGenerateICS;
window.aiExportCalendar = aiExportCalendar;

console.log('[MT] ai-calendar.js cargado — exportar .ics ✓');
