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

// ── Micro-frases motivacionales personalizadas (v360) ──
// Filosofía: 70% motivacional · 30% dato como prueba del esfuerzo.
// Frases cortas (≤ 70 chars), sin emojis innecesarios, muy variadas.
// Metodología: PERMA (Seligman) + Aprecio Específico + Micro-afirmaciones.
// El dato financiero aparece solo como evidencia, nunca como titular.
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

  var nm = _aiNombrePersonal(props);
  function n(frase) {
    return nm ? nm + ', ' + frase : frase.charAt(0).toUpperCase() + frase.slice(1);
  }
  function hola() {
    return nm ? 'Hola ' + nm : 'Hola';
  }

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

  // Racha consecutiva de días trabajados
  function _diaKey(d) {
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  }
  var rachaSeguidos = 0;
  var cursor = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  while (true) {
    if (diasSet[_diaKey(cursor)]) {
      rachaSeguidos++;
      cursor.setDate(cursor.getDate() - 1);
      if (rachaSeguidos > 30) break;
    } else {
      break;
    }
  }

  // Récord personal del mes
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

  // ── Sin datos aún → frases de arranque ──
  if (totalMins <= 0 && !activo) {
    if (nm) {
      return [
        hola() + '. Cuando estés listo, arrancamos juntos.',
        n('aquí empieza todo. Tu primer turno está a un toque.'),
        n('cada turno que registrés lo calculo automático.'),
        'El primer paso es el que más vale, ' + nm.toLowerCase() + '.'
      ];
    }
    return [
      'Aquí empieza todo. Tocá Iniciar y yo me encargo.',
      'Tu primer turno está a un toque. Cuando quieras, vamos.',
      'Listo para calcular tus recargos en tiempo real.'
    ];
  }

  var f = [];

  // ══ 1. PRESENCIA POR HORA (siempre) ══
  if (isMadrugada) {
    if (activo) {
      f.push(n('a esta hora hay pocos como vos.'));
      f.push(n('madrugada de turno. Estoy acá contigo.'));
    } else {
      f.push(nm ? hola() + '. Madrugada — buen momento para revisar.' : 'Madrugada. Estoy acá.');
      f.push(n('hasta a esta hora el trabajo cuenta. Bien.'));
    }
  } else if (hora >= 5 && hora < 9) {
    f.push(n('el día arranca y vos ya estás. Eso vale.'));
    f.push(n('mañana temprano y en pie. Se nota el compromiso.'));
  } else if (hora >= 9 && hora < 12) {
    f.push(n('buen ritmo esta mañana. Seguimos.'));
    f.push(n('la mañana avanza bien — y vos con ella.'));
  } else if (hora >= 12 && hora < 14) {
    f.push(nm ? hola() + '. Mediodía — seguís firme.' : 'Mediodía y seguís firme. Eso habla bien.');
    f.push(n('mitad del día y sin parar. Eso es ritmo.'));
  } else if (hora >= 14 && hora < 18) {
    if (activo) {
      f.push(n('buenas tardes. El turno avanza bien.'));
    } else {
      f.push(n('buenas tardes. Lo de hoy ya quedó registrado.'));
    }
    f.push(n('tarde activa. Lo que hiciste hoy ya es tuyo.'));
  } else if (hora >= 18 && hora < 21) {
    f.push(n('el atardecer y seguís dándole. Eso es disciplina.'));
    f.push(n('hora pico de turnos — y vos ya tenés el tuyo.'));
  } else {
    if (activo) {
      f.push(n('noche de turno — el recargo ya corre a tu favor.'));
      f.push(n('turno nocturno en curso. Estoy acá.'));
    } else {
      f.push(n('trabajar a esta hora pesa. Tu dedicación se nota.'));
      f.push(n('la noche también forma parte de tu esfuerzo.'));
    }
  }

  // ══ 2. TURNO ACTIVO ══
  if (activo && durActualMins > 0) {
    if (durActualMins < 30) {
      f.push(n('recién arrancás. Cada minuto queda registrado.'));
    } else if (durActualMins < 60) {
      f.push('Turno en marcha' + (nm ? ', ' + nm.toLowerCase() : '') + '. Vamos juntos.');
    } else if (durActualMins < 120) {
      f.push(n('una hora de turno. El foco está ahí.'));
    } else if (durActualMins < 180) {
      var hA = Math.floor(durActualMins / 60);
      f.push(hA + 'h de turno' + (nm ? ', ' + nm.toLowerCase() : '') + '. Buen ritmo.');
    } else if (durActualMins < 300) {
      f.push(n(fDur(durActualMins) + ' seguidas. Constancia pura.'));
    } else if (durActualMins < 480) {
      f.push(n(fDur(durActualMins) + ' en turno. Si podés respirar un momento, tomalo.'));
    } else if (durActualMins < 720) {
      f.push(n('jornada completa y más. Eso no lo hace cualquiera.'));
      f.push(n('más de 8h — el extra ya corre. Descansá pronto.'));
    } else {
      f.push(n('más de 12h. Por favor, descansá cuando puedas.'));
    }
  }

  // ══ 3. SEMANA ══
  var hsemActual = typeof getHSEM === 'function' ? getHSEM(ahora) : 44;
  if (horasSemana >= hsemActual) {
    f.push(n('semana completa. Todo lo que sumes ahora es extra.'));
    f.push(n('superaste las horas semanales. Excelente semana.'));
  } else if (horasSemana >= hsemActual - 8) {
    f.push(n(Math.round(horasSemana) + 'h esta semana. Falta poquito.'));
  } else if (horasSemana >= 24) {
    f.push(
      Math.round(horasSemana) +
        'h esta semana' +
        (nm ? ', ' + nm.toLowerCase() : '') +
        '. Vas muy bien.'
    );
  } else if (horasSemana >= 10) {
    f.push(n('buen arranque de semana. Seguimos.'));
  }

  // ══ 4. DÍAS ESPECIALES ══
  if (isFestivo && isNoche) {
    f.push(n('festivo nocturno. Doble mérito — eso tiene peso real.'));
  } else if (isFestivo) {
    f.push(n('trabajando en festivo. Ese compromiso se nota.'));
    f.push(n('festivo que no te detiene. Eso habla de vos.'));
  }
  if (isDomingo && activo) {
    f.push(n('domingo trabajando. Cuando otros descansan, vos sumás.'));
  }
  if (isFinDeSemana && !isDomingo) {
    f.push(n('sábado que suma. Lo que hagas hoy se nota en la nómina.'));
  }
  if (isLunes && totalMins > 0 && hora < 12) {
    f.push(n('arrancando lunes con turno. La semana empieza con vos.'));
    f.push(n('lunes de trabajo — la semana arranca bien.'));
  } else if (isViernes && activo) {
    f.push(n('viernes y seguís dándole. La semana cierra bien.'));
    f.push(n('último empujón del viernes — ya casi.'));
  }

  // ══ 5. META MENSUAL (dato como respaldo motivacional) ══
  if (totalMins > 0) {
    if (pct >= 100) {
      f.push(n('meta del mes superada. Podés cerrar tranquilo.'));
      f.push(n('llegaste a tu meta. Todo lo que sigue es ganancia extra.'));
    } else if (pct >= 90) {
      f.push(n('al ' + pct + '% de tu meta. Estás a un suspiro.'));
      f.push(n('casi, ' + (nm ? nm.toLowerCase() : 'ya') + '. Falta poquísimo.'));
    } else if (pct >= 75) {
      f.push(n('vas en el ' + pct + '%. Con este ritmo llegás cómodo.'));
    } else if (pct >= 50) {
      f.push(n('mitad del camino. Exactamente donde tenés que estar.'));
    } else if (pct >= 25) {
      f.push(n('el mes avanza bien. Paso a paso es como se llega.'));
    } else {
      f.push(n('el mes arranca. Sin apuro — cada turno suma al total.'));
    }
  }

  // ══ 6. RACHA Y PATRONES ══
  if (rachaSeguidos >= 12) {
    f.push(n(rachaSeguidos + ' días seguidos. Increíble — pero descansá pronto.'));
  } else if (rachaSeguidos >= 7) {
    f.push(n(rachaSeguidos + ' días sin parar. Una pausa te haría bien.'));
  } else if (rachaSeguidos >= 5) {
    f.push(n(rachaSeguidos + ' días seguidos. Buena constancia.'));
    f.push(
      rachaSeguidos + ' días consecutivos' + (nm ? ', ' + nm.toLowerCase() : '') + '. Se nota.'
    );
  } else if (rachaSeguidos >= 3) {
    f.push(n(rachaSeguidos + ' días seguidos. Buen ritmo.'));
  }

  if (diasTrab >= 20) {
    f.push(n(diasTrab + ' días trabajados este mes. La constancia se ve.'));
  } else if (diasTrab >= 15) {
    f.push(n(diasTrab + ' días este mes. Vas a paso firme.'));
  } else if (diasTrab >= 10) {
    f.push(n(diasTrab + ' días trabajados. Vas bien encaminado.'));
  }

  // ══ 7. HORAS EXTRA Y NOCTURNOS ══
  if (extraMins >= 120) {
    f.push(n('tenés horas extra este mes. El esfuerzo se convierte en más.'));
  }
  if (noctMins >= 600) {
    f.push(n('más de 10h nocturnas este mes. Turnero de verdad.'));
  } else if (noctMins >= 180 && isNoche) {
    f.push(n('ya acumulás varias noches este mes. El recargo es tuyo.'));
  }

  // ══ 8. RÉCORD PERSONAL ══
  if (mejorDiaEsHoy && totalMins > 60) {
    f.push('Hoy es tu mejor día del mes' + (nm ? ', ' + nm : '') + '. Récord personal.');
  }

  // ══ 9. BIENESTAR Y COMPAÑÍA ══
  if (isMadrugada && activo && durActualMins >= 60) {
    f.push(n('no estás solo en este turno. Estoy acá.'));
    f.push(n('madrugada de turno — acá acompañándote.'));
  }
  if (hora >= 23 && activo) {
    f.push(n('la noche se hace más corta cuando la registrás.'));
  }
  if (activo && durActualMins >= 300 && durActualMins < 360) {
    f.push(n('¿tomaste agua? Con 5h de turno, es buen momento.'));
  } else if (activo && durActualMins >= 420 && durActualMins < 480) {
    f.push(n('estirá un poco si podés — la espalda lo va a notar.'));
  }

  // ══ 10. CIERRE Y TRANSICIÓN ══
  if (!activo && totalMins > 0 && hora >= 18 && hora < 23) {
    f.push(n('turno cerrado por hoy. Lo que hiciste ya quedó.'));
    f.push(n('cerraste bien el día. Descansá.'));
  }
  if (!activo && totalMins > 0 && isMadrugada) {
    f.push(n('descansá. Mañana también estamos acá para vos.'));
  }

  // ══ ANTI-CULPA ══
  if (totalMins > 0 && horasSemana > 0 && horasSemana < 20 && diaSemana >= 5) {
    f.push(n('una semana más liviana no define tu mes.'));
    f.push(n('el ritmo varía — lo que cuenta es seguir.'));
  }
  if (diasTrab > 0 && diasTrab < 5 && ahora.getDate() > 20) {
    f.push(n('tu ritmo es tuyo. No hace falta comparar.'));
    f.push(n('cada turno que registrés suma — sin presión.'));
  }

  // ══ FRASES GENÉRICAS DE CALIDAD (variedad extra) ══
  f.push(n('lo que no se registra no cuenta. Vos lo hacés bien.'));
  f.push('Tocame' + (nm ? ', ' + nm.toLowerCase() : '') + ' si querés revisar algo. Estoy acá.');
  if (totalMins > 0) {
    f.push(n(fDur(totalMins) + ' registradas este mes. Todo sumado.'));
  }
  f.push(n('cada turno que cerrás es un paso más. Bien.'));
  f.push(
    'El trabajo que no se mide no se valora' +
      (nm ? ', ' + nm.toLowerCase() : '') +
      '. Vos lo medís.'
  );

  return f;
}

// ─── EXPORT ──────────────────────────────────────────────────
window._saludoHora = _saludoHora;
window._aiNombrePersonal = _aiNombrePersonal;
window._aiHeroPhrases = _aiHeroPhrases;
