// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-greeting.js
//  Helpers de saludo, nombre personal del usuario, y frases del hero.
//  Compartidos entre el asistente (tabs/assistant.js) y el historial
//  (tabs/history.js). Extraídos de tabs/assistant.js en v48.
// ════════════════════════════════════════════════════════════════

// ── Helper compartido: saludo según hora ──
// Fuente única de verdad usada por el asistente y por el historial,
// para que ambos digan lo mismo a la misma hora (sin desfases tipo
// "Buenos días" en uno y "Buenas noches" en el otro a las 3 AM).
function _saludoHora(d) {
  var h = (d && typeof d.getHours === 'function' ? d : new Date()).getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ── Helper interno: nombre/apodo personal del usuario ──
// Lee el alias guardado en localStorage (mt_<uid>_pname); cae al
// primer nombre del email; finalmente vacío.
function _aiNombrePersonal(props) {
  try {
    var s = props && props.session;
    var uid = s && s.uid ? s.uid : null;
    if (uid && typeof leer === 'function') {
      var n = leer(typeof dk === 'function' ? dk(uid, 'pname') : 'mt_pname_' + uid, '');
      if (n && String(n).trim()) return String(n).trim();
    }
    if (s && s.email && !s.guest) {
      var primero = String(s.email).split('@')[0].split('.')[0];
      if (primero && primero.length <= 16) {
        return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
      }
    }
  } catch (_) {}
  return '';
}

// ── Micro-reconocimiento psicológico laboral con personalización ──
// Frases contextuales basadas en evidencia: reconocimiento específico
// (qué hiciste), refuerza el esfuerzo, mezcla condicional + incondicional.
// Cuando hay un nombre personal disponible, lo intercala de forma natural
// — no en todas las frases, para no parecer cliché.
function _aiHeroPhrases(props) {
  var c = props.calc || {};
  var bd = c.bd || {};
  var totalMins = c.totalMins || 0;
  var totalCOP = c.totalCOP || 0;
  var salario = props.salario || 0;
  var pct = salario > 0 ? Math.round((totalCOP / salario) * 100) : 0;
  var ahora = props.ahora || new Date();
  var activo = props.activo || null;
  var turnos = props.turnos || [];
  var hora = ahora.getHours();

  var isNoche = hora >= 21 || hora < 6;
  var isMadrugada = hora >= 0 && hora < 5;
  var isFestivo = typeof esFest === 'function' && esFest(ahora);
  var diaSemana = ahora.getDay();
  var isFinDeSemana = diaSemana === 0 || diaSemana === 6;
  var isDomingo = diaSemana === 0;
  var isLunes = diaSemana === 1;
  var isViernes = diaSemana === 5;

  // Nombre personal (puede ser vacío)
  var nm = _aiNombrePersonal(props);
  // Helper: prefija el nombre con coma si existe ("Pipe, ..."), si no devuelve la frase tal cual
  function n(frase) {
    return nm ? nm + ', ' + frase : frase.charAt(0).toUpperCase() + frase.slice(1);
  }
  // Helper: saludo natural — "Hola pipe" o "Hola"
  function hola() {
    return nm ? 'Hola ' + nm : 'Hola';
  }

  // Duración del turno activo en minutos
  var durActualMins = activo ? Math.round((ahora - new Date(activo.inicio)) / 60000) : 0;

  // Horas semanales acumuladas
  var minsSemana = 0;
  if (typeof semLun === 'function') {
    var iniSem = semLun(ahora);
    turnos.forEach(function (t) {
      var ini = new Date(t.inicio);
      if (ini >= iniSem) {
        var fin = t.fin ? new Date(t.fin) : ahora;
        minsSemana += (fin - ini) / 60000;
      }
    });
    if (activo && new Date(activo.inicio) >= iniSem) minsSemana += durActualMins;
  }
  var horasSemana = minsSemana / 60;

  function _mins(k) {
    return (bd[k] && bd[k].mins) || 0;
  }
  var extraMins =
    _mins('extraDiurna') + _mins('extraNoct') + _mins('extraFestDiur') + _mins('extraFestNoct');
  var festMins =
    _mins('diurnaFest') + _mins('noctFest') + _mins('extraFestDiur') + _mins('extraFestNoct');
  var noctMins = _mins('noctOrd') + _mins('extraNoct') + _mins('noctFest') + _mins('extraFestNoct');

  // Días trabajados del mes (turnos cerrados, días únicos)
  var diasSet = {};
  turnos.forEach(function (t) {
    if (t.fin) {
      var d = new Date(t.inicio);
      diasSet[d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate()] = true;
    }
  });
  var diasTrab = Object.keys(diasSet).length;

  // ── Racha consecutiva de días trabajados (anti-burnout) ──
  // Cuenta hacia atrás desde ayer (o hoy si ya hubo turno) cuántos
  // días seguidos hay un turno cerrado, hasta que aparezca un día vacío.
  function _diaKey(d) {
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  }
  var rachaSeguidos = 0;
  var cursor = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  while (true) {
    if (diasSet[_diaKey(cursor)]) {
      rachaSeguidos++;
      cursor.setDate(cursor.getDate() - 1);
      if (rachaSeguidos > 30) break; // tope de seguridad
    } else {
      break;
    }
  }

  // ── Mejor día del mes (récord personal de COP en un día) ──
  // Solo lo calculamos si hay calcPorDia disponible globalmente.
  var mejorDiaCOP = 0;
  var mejorDiaEsHoy = false;
  try {
    if (typeof calcPorDia === 'function') {
      var vh = props.vh || (salario ? salario / 240 : 0);
      var dxd = calcPorDia(turnos, vh) || [];
      var hoyKey =
        ahora.getFullYear() +
        '-' +
        String(ahora.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(ahora.getDate()).padStart(2, '0');
      dxd.forEach(function (d) {
        if (d.cop > mejorDiaCOP) {
          mejorDiaCOP = d.cop;
          mejorDiaEsHoy = d.fecha === hoyKey;
        }
      });
    }
  } catch (_) {}

  // ── Sin datos aún → frases de arranque
  if (totalMins <= 0 && !activo) {
    if (nm) {
      return [
        hola() + '. Cuando estés listo, toca Iniciar y empezamos juntos. ✦',
        n('aquí empieza todo. Tu primer turno está a un toque.'),
        nm + ', cada turno que registres se calcula automático — sin Excel, sin cuentas.',
        'Listos cuando vos digás, ' + nm.toLowerCase() + '. El primer paso es el más importante.'
      ];
    }
    return [
      'Aquí empieza todo. Toca Iniciar y el resto corre por mi cuenta.',
      'Listo para calcular tus recargos en tiempo real, turno a turno.',
      'Tu primer registro está a un toque. Cuando quieras, arrancamos.'
    ];
  }

  var f = [];

  // ══════ 1. SALUDO POR HORA + DÍA (incondicional, cálido) ══════
  if (isMadrugada) {
    if (activo)
      f.push(
        n(
          'a esta hora hay pocos como vos. Llevás ' +
            fDur(durActualMins) +
            ' — gracias por estar acá.'
        )
      );
    else
      f.push(
        nm
          ? hola() + '. Madrugada acompañándote. Lo que registres ahora vale más.'
          : 'Madrugada. A esta hora cada minuto cuenta el doble.'
      );
  } else if (hora >= 5 && hora < 9) {
    f.push(
      nm
        ? hola() + ', buenos días ☀️. El día apenas arranca y vos ya estás acá.'
        : 'Buenos días. El día apenas arranca y vos ya estás acá.'
    );
  } else if (hora >= 9 && hora < 12) {
    f.push(
      nm
        ? n('buen día. La mañana avanza y tu esfuerzo también.')
        : 'Buen día. La mañana avanza y tu esfuerzo también.'
    );
  } else if (hora >= 12 && hora < 14) {
    f.push(
      nm
        ? hola() + '. Mediodía — recordá comer algo, eso también cuenta.'
        : 'Mediodía. Recordá comer algo, eso también cuenta.'
    );
  } else if (hora >= 14 && hora < 18) {
    if (activo)
      f.push(n('buenas tardes. Llevás ' + fDur(durActualMins) + ' en este turno — buen ritmo.'));
    else
      f.push(
        nm
          ? hola() + ', buenas tardes. Tu día de hoy ya quedó registrado.'
          : 'Buenas tardes. Tu día de hoy ya quedó registrado.'
      );
  } else if (hora >= 18 && hora < 21) {
    f.push(
      nm
        ? n('el atardecer y vos seguís dándole. Eso se llama disciplina.')
        : 'El atardecer y vos seguís dándole. Eso se llama disciplina.'
    );
  } else {
    // 21–23
    f.push(
      nm
        ? hola() + '. Trabajar a esta hora pesa — el +35% nocturno ya está corriendo.'
        : 'Buenas noches. Trabajar a esta hora pesa — el +35% nocturno ya está corriendo.'
    );
  }

  // ══════ 2. DURACIÓN DEL TURNO ACTIVO (refuerzo específico) ══════
  if (activo && durActualMins > 0) {
    if (durActualMins < 30) {
      f.push(n('recién arrancás. Cada minuto desde ahora queda registrado.'));
    } else if (durActualMins < 60) {
      f.push('Turno en marcha. Vamos juntos en esto' + (nm ? ', ' + nm.toLowerCase() : '') + '.');
    } else if (durActualMins < 180) {
      var hA = Math.floor(durActualMins / 60);
      f.push(
        (hA === 1 ? '1 hora' : hA + ' horas') +
          ' seguidas' +
          (nm ? ', ' + nm.toLowerCase() : '') +
          ' — el foco está ahí.'
      );
    } else if (durActualMins < 300) {
      f.push(
        nm
          ? nm + ', llevás ' + fDur(durActualMins) + ' sin parar. Eso es constancia pura.'
          : 'Llevás ' + fDur(durActualMins) + ' sin parar. Eso es constancia pura.'
      );
    } else if (durActualMins < 480) {
      f.push(
        n('llevás ' + fDur(durActualMins) + '. Si necesitás un respiro, tomalo — te lo merecés.')
      );
    } else if (durActualMins < 600) {
      f.push(n('8 horas en este turno. Jornada completa. Lo que sigue ya se paga como extra. 💪'));
    } else if (durActualMins < 720) {
      f.push(
        nm
          ? nm +
              ', ' +
              fDur(durActualMins) +
              ' seguidas… esto es de otro nivel. Cuidate también, ¿sí?'
          : fDur(durActualMins) + ' seguidas. Esto es de otro nivel. Cuidate también, ¿sí?'
      );
    } else {
      f.push(
        n(
          'más de 12 horas en este turno. Por favor, descansá pronto. Tu cuerpo te lo va a agradecer.'
        )
      );
    }
  }

  // ══════ 3. HORAS SEMANALES ══════
  var hsemActual = typeof getHSEM === 'function' ? getHSEM(ahora) : 44;
  if (horasSemana >= hsemActual) {
    f.push(
      Math.round(horasSemana) +
        'h esta semana' +
        (nm ? ', ' + nm.toLowerCase() : '') +
        ' — completaste las ' +
        hsemActual +
        'h legales. Todo lo que sumes es extra. 🎯'
    );
  } else if (horasSemana >= hsemActual - 8) {
    f.push(
      nm
        ? nm +
            ', llevás ' +
            Math.round(horasSemana) +
            'h esta semana. Falta poquito para las ' +
            hsemActual +
            'h.'
        : 'Llevás ' +
            Math.round(horasSemana) +
            'h esta semana. Falta poquito para las ' +
            hsemActual +
            'h.'
    );
  } else if (horasSemana >= 20) {
    f.push(
      Math.round(horasSemana) +
        'h acumuladas esta semana' +
        (nm ? ', ' + nm.toLowerCase() : '') +
        ' — vas más de la mitad.'
    );
  } else if (horasSemana >= 10) {
    f.push(
      (nm ? nm + ', ' : '') + Math.round(horasSemana) + 'h registradas esta semana. Buen arranque.'
    );
  }

  // ══════ 4. DÍAS ESPECIALES Y CONTEXTO ══════
  if (isFestivo && isNoche) {
    f.push(
      (nm ? nm + ', festivo nocturno' : 'Festivo nocturno') +
        '. Tu recargo llega al +110% — ese compromiso tiene peso. 🔥'
    );
  } else if (isFestivo) {
    f.push(
      (nm ? 'Trabajando en festivo, ' + nm.toLowerCase() : 'Trabajando en festivo') +
        '. Ese esfuerzo tiene +75% a tu favor.'
    );
  }
  if (isDomingo && !isFestivo && activo) {
    f.push(
      (nm ? nm + ', ' : '') +
        'domingo trabajando. Cuando otros descansan, vos sumás. Eso no es poco.'
    );
  } else if (isFinDeSemana && !isFestivo && !isDomingo) {
    f.push(
      (nm ? 'Sábado, ' + nm.toLowerCase() + ', ' : 'Sábado: ') +
        'lo que hagas hoy se va a notar en la próxima nómina.'
    );
  }
  if (isLunes && totalMins > 0 && hora < 12) {
    f.push(
      (nm ? nm + ', ' : '') + 'arrancando lunes con turno. La semana empieza con vos al volante.'
    );
  } else if (isViernes && activo) {
    f.push(
      (nm ? nm + ', ' : '') +
        'viernes y dándole. El fin de semana se va a sentir mejor sabiendo que cumpliste.'
    );
  }

  // ══════ 5. TURNO NOCTURNO ══════
  if (isNoche && activo) {
    f.push(
      (nm ? nm + ', ' : '') +
        'turno nocturno en curso — el +35% ya corre a tu favor en cada minuto.'
    );
  } else if (isNoche && !activo && totalMins > 0) {
    f.push(
      (nm ? nm + ', ' : '') + 'trabajando hasta tarde. Tu dedicación a esta hora habla sola. 🌙'
    );
  }

  // ══════ 6. HITOS DE META MENSUAL ══════
  if (totalMins > 0) {
    if (pct >= 100) {
      f.push(
        (nm ? '¡' + nm + ', meta superada' : '¡Meta mensual superada') +
          '! Llevás ' +
          fCOP(totalCOP) +
          ' — descansá cuando puedas. 🎉'
      );
    } else if (pct >= 90) {
      f.push((nm ? nm + ', ' : '') + 'al ' + pct + '% de tu meta. Estás a un suspiro de llegar.');
    } else if (pct >= 75) {
      f.push((nm ? nm + ', ' : '') + 'vas en el ' + pct + '%. Con este ritmo, llegás sobrado.');
    } else if (pct >= 50) {
      f.push(
        (nm ? nm + ', ' : '') +
          'llevás el ' +
          pct +
          '%. Mitad del camino — exactamente donde tenés que estar.'
      );
    } else if (pct >= 25) {
      f.push((nm ? nm + ', ' : '') + fCOP(totalCOP) + ' acumulados. Cada turno suma al total.');
    } else {
      f.push(
        (nm ? nm + ', ' : '') +
          'el mes recién arranca. ' +
          fCOP(totalCOP) +
          ' por ahora — paso a paso.'
      );
    }
  }

  // ══════ 7. RECARGOS Y ESPECIALES DEL MES ══════
  if (extraMins > 0 && extraMins >= 60) {
    f.push(
      (nm ? nm + ', ' : '') +
        'tenés ' +
        fDur(extraMins) +
        ' en horas extra este mes — entre +25% y +150% sobre tu valor hora. 💰'
    );
  }
  if (festMins > 0 && !isFestivo) {
    f.push(
      'Has trabajado ' +
        fDur(festMins) +
        ' en festivos este mes' +
        (nm ? ', ' + nm.toLowerCase() : '') +
        '. Ese esfuerzo extra se nota en el bolsillo.'
    );
  }
  if (noctMins > 60 * 10) {
    f.push((nm ? nm + ', ' : '') + 'más de 10h nocturnas este mes — turnero de verdad. 🌙');
  }

  // ══════ 8. RECONOCIMIENTOS POR PATRONES ══════
  if (diasTrab >= 20) {
    f.push((nm ? nm + ', ' : '') + diasTrab + ' días trabajados este mes. Constancia que se ve.');
  } else if (diasTrab >= 10) {
    f.push((nm ? nm + ', ' : '') + 'llevás ' + diasTrab + ' días trabajados. Vas firme.');
  }

  // ══════ 9-A. ANTI-BURNOUT (racha de días seguidos) ══════
  if (rachaSeguidos >= 12) {
    f.push(
      (nm ? nm + ', ' : '') +
        rachaSeguidos +
        ' días seguidos. Sos una máquina — pero las máquinas también descansan. Buscá un día libre pronto. 🙏'
    );
  } else if (rachaSeguidos >= 7) {
    f.push(
      (nm ? nm + ', ' : '') +
        rachaSeguidos +
        ' días seguidos trabajando. Una pausa esta semana te haría bien.'
    );
  } else if (rachaSeguidos >= 5) {
    f.push(
      'Llevás ' +
        rachaSeguidos +
        ' días seguidos' +
        (nm ? ', ' + nm.toLowerCase() : '') +
        ' — muy buena constancia.'
    );
  }

  // ══════ 9-B. ANTI-CULPA (semanas/días bajos) ══════
  if (totalMins > 0 && horasSemana > 0 && horasSemana < 20 && diaSemana >= 5) {
    f.push(
      (nm ? nm + ', ' : '') +
        'una semana más liviana no define tu mes. Lo que viene sigue siendo tuyo.'
    );
  }
  if (diasTrab > 0 && diasTrab < 5 && ahora.getDate() > 20) {
    f.push((nm ? nm + ', ' : '') + 'tu ritmo es tuyo. Cada turno cuenta — no hace falta comparar.');
  }

  // ══════ 9-C. SOLEDAD A HORAS RARAS (compañía emocional) ══════
  if (isMadrugada && activo && durActualMins >= 60) {
    f.push(
      (nm ? nm + ', ' : '') +
        'a esta hora hay pocos despiertos. Yo estoy acá, no estás solo en este turno. 🌙'
    );
  }
  if (hora >= 23 && activo) {
    f.push(
      (nm ? nm + ', ' : '') + 'la noche se hace más corta cuando alguien la registra con vos.'
    );
  }

  // ══════ 9-D. RÉCORD PERSONAL DEL MES ══════
  if (mejorDiaEsHoy && totalMins > 60) {
    f.push(
      (nm ? '¡' + nm + ', ' : '¡') +
        'hoy es tu mejor día del mes! ' +
        fCOP(mejorDiaCOP) +
        ' — récord personal. 🏆'
    );
  } else if (mejorDiaCOP > 0 && totalMins > 60 && hora >= 14) {
    var hoyCOP = 0;
    try {
      if (typeof calcPorDia === 'function') {
        var vhh = props.vh || (salario ? salario / 240 : 0);
        var dxdh = calcPorDia(turnos, vhh) || [];
        var hkey =
          ahora.getFullYear() +
          '-' +
          String(ahora.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(ahora.getDate()).padStart(2, '0');
        for (var i = 0; i < dxdh.length; i++) {
          if (dxdh[i].fecha === hkey) {
            hoyCOP = dxdh[i].cop;
            break;
          }
        }
      }
    } catch (_) {}
    if (hoyCOP > 0 && hoyCOP > mejorDiaCOP * 0.85 && !mejorDiaEsHoy) {
      f.push(
        (nm ? nm + ', ' : '') + 'vas muy cerca de tu mejor día del mes. Si seguís así, lo rompés.'
      );
    }
  }

  // ══════ 9-E. NUDGES SUAVES DE SALUD (sin ser moralista) ══════
  if (activo && durActualMins >= 300 && durActualMins < 360) {
    f.push((nm ? nm + ', ' : '') + 'llevás 5h. ¿Tomaste agua hace rato? Es un buen momento.');
  } else if (activo && durActualMins >= 420 && durActualMins < 480) {
    f.push(
      (nm ? nm + ', ' : '') + 'si podés estirar un poco antes de seguir, tu espalda lo va a notar.'
    );
  }

  // ══════ 9. MENSAJES CÁLIDOS DE CIERRE / TRANSICIÓN ══════
  if (!activo && totalMins > 0 && hora >= 18) {
    f.push(
      (nm ? nm + ', ' : '') + 'turno cerrado por hoy. Lo que hiciste ya quedó. Descansá bien. ✨'
    );
  }
  if (!activo && totalMins > 0 && isMadrugada) {
    f.push((nm ? nm + ', ' : '') + 'descansá. Mañana también vamos a estar acá para vos.');
  }

  // ══════ 10. FALLBACKS CÁLIDOS ══════
  if (f.length < 3) {
    f.push(
      (nm ? nm + ', ' : '') +
        'llevás ' +
        fDur(totalMins) +
        ' registradas este mes. Cada minuto cuenta.'
    );
  }
  if (f.length < 3) {
    f.push(
      (nm ? nm + ', tocame ' : 'Tocame ') + 'si querés revisar algo de tu nómina. Estoy acá. ✦'
    );
  }

  return f;
}

// ─── EXPORT ──────────────────────────────────────────────────
window._saludoHora = _saludoHora;
window._aiNombrePersonal = _aiNombrePersonal;
window._aiHeroPhrases = _aiHeroPhrases;
