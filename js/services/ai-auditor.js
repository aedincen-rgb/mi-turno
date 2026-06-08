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
  
  // 1. Turnos anormalmente largos (posible olvido de cierre)
  // Buscamos turnos de más de 16 horas en los últimos 7 días
  var limiteHoras = 16;
  var hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (var i = 0; i < turnosAll.length; i++) {
    var t = turnosAll[i];
    var ini = new Date(t.inicio);
    if (ini < hace7Dias) continue; // Solo auditar recientes
    
    var fin = t.fin ? new Date(t.fin) : ahora;
    var horas = (fin - ini) / (1000 * 60 * 60);
    
    if (horas > limiteHoras) {
      var fechaStr = ini.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' });
      anomalies.push({
        type: 'LONG_SHIFT',
        severity: 'high',
        text: '⚠️ **Posible error:** Tienes un turno el ' + fechaStr + ' de ' + horas.toFixed(1) + ' horas. ¿Olvidaste cerrarlo?',
        action: { label: 'Ir al historial para corregir', query: 'ir a historial' }
      });
    }
  }
  
  // 2. Exceso de horas extra semanales (Límite legal: 12h/semana)
  if (c.extraMins > 12 * 60) {
    anomalies.push({
      type: 'LEGAL_LIMIT',
      severity: 'medium',
      text: '⚖️ **Aviso legal:** Llevas ' + (c.extraMins / 60).toFixed(1) + ' horas extra esta semana. El límite legal en Colombia es de 12 horas semanales.',
      action: null
    });
  }
  
  // 3. Falta de descanso dominical (3 domingos seguidos)
  // Esto requeriría un análisis más profundo de los días, pero podemos usar la racha
  if (c.rachaActual >= 14) {
    anomalies.push({
      type: 'HEALTH_WARNING',
      severity: 'high',
      text: '🧘 **Alerta de salud:** Llevas ' + c.rachaActual + ' días trabajando sin parar. Por ley tienes derecho a un descanso compensatorio remunerado.',
      action: { label: '¿Cuándo descanso?', query: '¿Cuándo descanso?' }
    });
  }
  
  // Devolver la anomalía más severa si hay alguna
  if (anomalies.length > 0) {
    // Ordenar por severidad (high primero)
    anomalies.sort(function(a, b) {
      return a.severity === 'high' ? -1 : 1;
    });
    return anomalies[0];
  }
  
  return null;
}

window.aiAuditShifts = aiAuditShifts;
console.log('[MT] ai-auditor.js cargado — Auditor Inteligente ✓');