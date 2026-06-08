// ════════════════════════════════════════════════════════════════
//  MI TURNO · Integración con Calendario
//  Importa turnos desde Google Calendar/Apple Calendar (experimental).
//  NOTA: navigator.calendar no es API estandarizada; solo disponible
//  en navegadores que lo implementan. La integración se activa solo
//  cuando el usuario lo solicita explícitamente desde Ajustes.
// ════════════════════════════════════════════════════════════════

function syncWithCalendar() {
  try {
    // Verificar permisos
    navigator.calendar.requestReadWritePermission(function (permission) {
      if (permission !== 'granted') {
        showToast('Se necesitan permisos de calendario', 'error');
        return;
      }

      // Obtener eventos
      var startDate = new Date();
      var endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      navigator.calendar.findEvents(
        {
          startDate: startDate,
          endDate: endDate,
          title: 'Trabajo|Turno', // Filtra eventos relevantes
          calendar: 'default'
        },
        function (events) {
          if (events && events.length > 0) {
            processCalendarEvents(events);
          }
        },
        function (error) {
          console.error('[Calendario] Error:', error);
        }
      );
    });
  } catch (e) {
    console.error('[Calendario] Error general:', e);
  }
}

function processCalendarEvents(events) {
  var uid = window._mtSession && window._mtSession.uid;
  if (!uid) return;

  var turnosGuardados = leer(dk(uid, 't')) || [];
  var nuevosTurnos = [];

  for (var i = 0; i < events.length; i++) {
    var event = events[i];

    // Convertir a turno
    var nuevoTurno = {
      inicio: event.startDate.getTime(),
      fin: event.endDate.getTime(),
      desc: event.title,
      origen: 'calendario'
    };

    // Verificar si ya existe
    var existe = turnosGuardados.some(function (t) {
      return t.inicio === nuevoTurno.inicio && t.fin === nuevoTurno.fin;
    });

    if (!existe) {
      nuevosTurnos.push(nuevoTurno);
    }
  }

  if (nuevosTurnos.length > 0) {
    // Guardar nuevos turnos
    var todosTurnos = turnosGuardados.concat(nuevosTurnos);
    grabar(dk(uid, 't'), todosTurnos);

    showToast('✅ ' + nuevosTurnos.length + ' turnos importados de calendario', 'success', 5000);
  }
}

// ─── EXPORT ──────────────────────────────────────────────────
// Funciones expuestas para uso desde Ajustes (invocación voluntaria).
// No se auto-ejecutan al cargar — el usuario debe iniciarlo.
window.syncWithCalendar = syncWithCalendar;
window.processCalendarEvents = processCalendarEvents;

console.log('[MT] ai-calendar.js cargado — integración calendario (invocación manual)');
