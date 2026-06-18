// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-auditor.js
//  Auditor Inteligente de Turnos (Anomaly Detection)
//  Analiza los datos del usuario en busca de errores humanos o
//  problemas legales (turnos muy largos, falta de descanso, etc.)
// ════════════════════════════════════════════════════════════════

function aiAuditShifts(userContext, turnosAll) {
  if (!userContext || !turnosAll || turnosAll.length === 0) return null;

  var c = userContext;
  var anomalies = [];
  var ahora = new Date();

  // 1. Turnos anormalmente largos (posible olvido de cierre).
  // Se filtra por fecha de CIERRE reciente, no de inicio: un turno de 200h
  // cerrado tarde envenena todas las estadísticas (totalMins/extraMins/total)
  // y hay que avisarlo aunque haya empezado hace semanas. El filtro anterior
  // por inicio >= hace7Dias lo perdía. Solo se reporta el más largo (sin spam).
  var limiteHoras = 16;
  var hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
  var peorLargo = null;

  for (var i = 0; i < turnosAll.length; i++) {
    var t = turnosAll[i];
    if (!t.fin) continue; // el turno activo se maneja aparte
    var ini = new Date(t.inicio);
    var fin = new Date(t.fin);
    if (fin < hace30Dias) continue;

    var horas = (fin - ini) / (1000 * 60 * 60);
    if (horas > limiteHoras && (!peorLargo || horas > peorLargo.horas)) {
      peorLargo = { ini: ini, horas: horas };
    }
  }

  if (peorLargo) {
    var fechaStr = peorLargo.ini.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' });
    anomalies.push({
      type: 'LONG_SHIFT',
      severity: 'high',
      text:
        '⚠️ **Posible error:** Tenés un turno del ' +
        fechaStr +
        ' de ' +
        peorLargo.horas.toFixed(1) +
        ' horas. ¿Te quedó sin cerrar? Eso infla tus estadísticas — revisalo en el historial.',
      action: { label: 'Ir al historial para corregir', query: 'ir a historial' }
    });
  }

  // 2. Exceso de horas extra semanales (Límite legal: 12h/semana).
  // Usa el extra de LA SEMANA (no del mes) — antes mezclaba periodos y mostraba
  // cifras imposibles cuando un turno largo contaminaba el acumulado mensual.
  var extraSem = typeof c.extraMinsSemana === 'number' ? c.extraMinsSemana : 0;
  if (extraSem > 12 * 60) {
    anomalies.push({
      type: 'LEGAL_LIMIT',
      severity: 'medium',
      text:
        '⚖️ **Aviso legal:** Llevás ' +
        (extraSem / 60).toFixed(1) +
        ' horas extra esta semana. El límite legal en Colombia es de 12 horas semanales.',
      action: null
    });
  }

  // 3. Falta de descanso dominical (3 domingos seguidos)
  // Esto requeriría un análisis más profundo de los días, pero podemos usar la racha
  if (c.rachaActual >= 14) {
    anomalies.push({
      type: 'HEALTH_WARNING',
      severity: 'high',
      text:
        '🧘 **Alerta de salud:** Llevas ' +
        c.rachaActual +
        ' días trabajando sin parar. Por ley tienes derecho a un descanso compensatorio remunerado.',
      action: { label: '¿Cuándo descanso?', query: '¿Cuándo descanso?' }
    });
  }

  // Devolver la anomalía más severa si hay alguna
  if (anomalies.length > 0) {
    // Ordenar por severidad (high primero)
    anomalies.sort(function (a, b) {
      return a.severity === 'high' ? -1 : 1;
    });
    return anomalies[0];
  }

  return null;
}

window.aiAuditShifts = aiAuditShifts;
console.log('[MT] ai-auditor.js cargado — Auditor Inteligente ✓');
