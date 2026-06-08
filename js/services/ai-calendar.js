// ════════════════════════════════════════════════════════════════
//  MI TURNO · Integración con Calendario
//  Conecta con Google Calendar/Apple Calendar
// ════════════════════════════════════════════════════════════════

// Intenta sincronizar con calendario nativo
document.addEventListener('DOMContentLoaded', function () {
  if (window._mtSession && window._mtSession.uid && navigator.calendar) {
    setTimeout(function () {
      if (confirm('¿Querés sincronizar Mi Turno con tu calendario?')) {
        syncWithCalendar();
      }
    }, 30000); // Preguntar después de 30s
  }
});

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
