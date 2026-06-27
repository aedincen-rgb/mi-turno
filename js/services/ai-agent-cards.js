// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-agent-cards.js
//  Tres funciones agénticas VISUALES que la IA ejecuta por el usuario
//  desde el chat. Devuelven objetos {text, card|action, actions} que el
//  render del asistente ya sabe pintar (ver assistant.js):
//
//   1. aiBuildGoalCard   — Agente de Meta: anillo de progreso + plan
//   2. aiBuildSimData    — Simulador interactivo: datos para el widget
//   3. aiBuildWatchdog   — Agente vigía: auditoría de turnos + correcciones
//
//  Toda la matemática reusa la calculadora y los recargos vigentes por
//  fecha (rcFactor, Ley 2466/2025). Degrada local: sin esos helpers usa
//  factores 2026 por defecto. NO toca el clasificador NLP — ai.js cablea
//  estos builders en handlers EXISTENTES (/meta) o ramas dedicadas.
// ════════════════════════════════════════════════════════════════

function _agcFC(n) {
  var v = Math.round(n || 0);
  return typeof fCOP === 'function' ? fCOP(v) : '$' + v;
}

// Factor de recargo vigente por fecha; cae a los valores 2026 si el motor
// legal no está cargado (smoke / arranque parcial).
function _agcFactor(rk, fecha) {
  if (typeof rcFactor === 'function') {
    var f = rcFactor(rk, fecha || new Date());
    if (f && isFinite(f) && f > 0) return f;
  }
  var def = { noctOrd: 1.35, diurnaFest: 1.8, extraDiurna: 1.25 };
  return def[rk] || 1;
}

function _agcClamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

// ─────────────────────────────────────────────────────────────────
//  1 · AGENTE DE META — tarjeta con anillo de progreso + plan
// ─────────────────────────────────────────────────────────────────
//  Recibe el monto objetivo y el contexto (c = buildContext). Devuelve
//  la tarjeta visual ('goal'), los chips de seguimiento y las líneas de
//  plan ya redactadas (el handler de ai.js arma el texto del bubble).
function aiBuildGoalCard(meta, c) {
  c = c || {};
  var actual = c.totalCOP || 0;
  var proy = c.proy || 0;
  var falta = Math.max(0, meta - actual);
  var pct = meta > 0 ? actual / meta : 0;
  var promTurno = c.promPorTurno || 0;
  var turnosFalt = promTurno > 0 ? Math.ceil(falta / promTurno) : null;

  // Plan concreto: "te faltan ~N turnos como los tuyos" o "ya llegaste".
  var planLines = [];
  if (falta <= 0) {
    planLines.push('🎉 ¡Ya superaste la meta! Llevás ' + _agcFC(actual) + '.');
  } else {
    planLines.push('Te faltan ' + _agcFC(falta) + ' para llegar.');
    if (turnosFalt) {
      planLines.push(
        'A tu promedio (' +
          _agcFC(promTurno) +
          '/turno) son ≈ **' +
          turnosFalt +
          ' turno' +
          (turnosFalt !== 1 ? 's' : '') +
          '** más.'
      );
    }
    if (proy > 0) {
      planLines.push(
        proy >= meta
          ? 'Tu proyección al cierre (' + _agcFC(proy) + ') ya la alcanza. Vas bien. 💪'
          : 'A este ritmo cerrarías en ' +
              _agcFC(proy) +
              ' — un toque por debajo. Probá el simulador. 🔮'
      );
    }
  }

  var card = {
    kind: 'goal',
    pct: _agcClamp(pct, 0, 1),
    pctLabel: Math.round(_agcClamp(pct, 0, 1.5) * 100) + '%',
    metaLabel: _agcFC(meta),
    actualLabel: _agcFC(actual),
    faltaLabel: _agcFC(falta),
    proyLabel: _agcFC(proy),
    proyReached: proy >= meta && proy > 0,
    reached: actual >= meta
  };

  var actions = [
    { label: '🔮 Simular el plan', query: '/simulador' },
    { label: '📈 Mi proyección', query: 'proyección al cierre' }
  ];
  if (falta > 0) {
    actions.push({ label: '¿Me pagan bien?', query: 'me están pagando bien' });
  }

  return { card: card, actions: actions, planLines: planLines };
}

// ─────────────────────────────────────────────────────────────────
//  2 · SIMULADOR INTERACTIVO — datos para el widget con steppers
// ─────────────────────────────────────────────────────────────────
//  Devuelve los valores unitarios marginales (cuánto suma 1 noche, 1
//  festivo, 1 hora extra) ya resueltos por fecha. El widget (assistant.js)
//  recalcula el total en vivo sin volver a tocar la IA. Si no hay salario
//  configurado devuelve ok:false para que el handler pida configurarlo.
function aiBuildSimData(c) {
  c = c || {};
  var vh = c.vh || 0;
  if (vh <= 0 || !c.salarioConfigurado) {
    return {
      ok: false,
      text: 'Para jugar con los números primero necesito tu salario base. Decime "configurar salario" y lo dejamos listo en un toque. ⚙️'
    };
  }
  var now = c.ahora || new Date();
  // Unidades: una noche/festivo de jornada típica de 8h; la hora extra suelta.
  var data = {
    base: c.totalCOP || 0,
    salario: c.salario || 0,
    vh: vh,
    unitNoche: Math.round(8 * vh * _agcFactor('noctOrd', now)),
    unitFest: Math.round(8 * vh * _agcFactor('diurnaFest', now)),
    unitHora: Math.round(vh * _agcFactor('extraDiurna', now))
  };
  return {
    ok: true,
    data: data,
    text: '🎚️ **Simulador en vivo.** Tocá los **+ / −** y mirá cómo cambia tu total al cierre. Cada noche, festivo u hora extra se calcula con los recargos vigentes.'
  };
}

// ─────────────────────────────────────────────────────────────────
//  3 · AGENTE VIGÍA — audita los turnos y propone correcciones
// ─────────────────────────────────────────────────────────────────
//  Escanea el historial buscando errores humanos y límites legales que el
//  usuario puede corregir. Cada hallazgo trae un chip de acción reusando
//  rutas existentes (ir a historial, descanso). Sin hallazgos: tarjeta en
//  verde "todo en orden". Reusa señales del contexto (racha, extra semanal).
function aiBuildWatchdog(c, turnosAll) {
  c = c || {};
  turnosAll = turnosAll || [];
  var findings = [];
  var ahora = new Date();
  var hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Cerrados recientes, ordenados por inicio (para detectar solapamientos).
  var cerrados = [];
  var i, t, fin;
  for (i = 0; i < turnosAll.length; i++) {
    t = turnosAll[i];
    if (!t || !t.fin) continue;
    fin = new Date(t.fin);
    if (fin < hace30) continue;
    cerrados.push({ ini: new Date(t.inicio), fin: fin });
  }
  cerrados.sort(function (a, b) {
    return a.ini - b.ini;
  });

  // (a) Turno anormalmente largo (>16h): probable olvido de cierre.
  var peor = null;
  for (i = 0; i < cerrados.length; i++) {
    var hrs = (cerrados[i].fin - cerrados[i].ini) / 3600000;
    if (hrs > 16 && (!peor || hrs > peor.hrs)) peor = { d: cerrados[i].ini, hrs: hrs };
  }
  if (peor) {
    findings.push({
      icon: '⏱',
      sev: 'high',
      title: 'Turno de ' + peor.hrs.toFixed(1) + 'h',
      detail:
        'El ' +
        peor.d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' }) +
        '. ¿Quedó sin cerrar? Infla tus cuentas.',
      fix: { label: '✏️ Corregir en historial', query: 'ir a historial' }
    });
  }

  // (b) Turnos solapados: el inicio de uno cae dentro del anterior.
  var solape = null;
  for (i = 1; i < cerrados.length; i++) {
    if (cerrados[i].ini < cerrados[i - 1].fin) {
      solape = cerrados[i].ini;
      break;
    }
  }
  if (solape) {
    findings.push({
      icon: '⚠️',
      sev: 'high',
      title: 'Turnos encimados',
      detail:
        'Dos turnos del ' +
        solape.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' }) +
        ' se pisan en el horario. Revisá las horas.',
      fix: { label: '✏️ Revisar en historial', query: 'ir a historial' }
    });
  }

  // (c) Turno demasiado corto (<25 min): posible error de tipeo.
  var corto = null;
  for (i = 0; i < cerrados.length; i++) {
    var mins = (cerrados[i].fin - cerrados[i].ini) / 60000;
    if (mins > 0 && mins < 25) {
      corto = cerrados[i].ini;
      break;
    }
  }
  if (corto) {
    findings.push({
      icon: '🔍',
      sev: 'low',
      title: 'Turno muy corto',
      detail:
        'Uno del ' +
        corto.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' }) +
        ' dura menos de 25 min. ¿Te equivocaste al cargarlo?',
      fix: { label: '✏️ Verificar', query: 'ir a historial' }
    });
  }

  // (d) Exceso de horas extra semanales (límite legal: 12h).
  var extraSem = typeof c.extraMinsSemana === 'number' ? c.extraMinsSemana : 0;
  if (extraSem > 12 * 60) {
    findings.push({
      icon: '⚖️',
      sev: 'med',
      title: (extraSem / 60).toFixed(1) + 'h extra esta semana',
      detail: 'El tope legal en Colombia es 12h/semana. Ya lo pasaste.',
      fix: { label: '¿Cómo se pagan las extra?', query: 'cómo se pagan las horas extra' }
    });
  }

  // (e) Racha sin descanso (≥14 días): salud + derecho a compensatorio.
  if (c.rachaActual >= 14) {
    findings.push({
      icon: '🧘',
      sev: 'med',
      title: c.rachaActual + ' días sin parar',
      detail: 'Tenés derecho a un descanso compensatorio remunerado. Cuidate.',
      fix: { label: '¿Cuándo descanso?', query: '¿cuándo descanso?' }
    });
  }

  // Ordenar por severidad y limitar (sin spam).
  var rank = { high: 0, med: 1, low: 2 };
  findings.sort(function (a, b) {
    return rank[a.sev] - rank[b.sev];
  });
  findings = findings.slice(0, 4);

  var nTurnos = cerrados.length;
  if (!findings.length) {
    return {
      text:
        nTurnos > 0
          ? 'Revisé tus ' +
            nTurnos +
            ' turnos del último mes y está **todo en orden** ✓. Nada raro: ni turnos sin cerrar, ni encimados, ni excesos. Bien ahí. 👌'
          : 'Todavía no tenés turnos cerrados para revisar. Cuando cargues algunos, te los audito. 🙂',
      card: { kind: 'watchdog', findings: [], ok: true, nTurnos: nTurnos },
      actions:
        nTurnos > 0
          ? [
              { label: '¿Cómo voy este mes?', query: 'cómo voy este mes' },
              { label: '¿Me pagan bien?', query: 'me están pagando bien' }
            ]
          : []
    };
  }

  // Chips de corrección: dedup por query, máx 3.
  var seen = {};
  var actions = [];
  for (i = 0; i < findings.length && actions.length < 3; i++) {
    var fx = findings[i].fix;
    if (fx && !seen[fx.query]) {
      seen[fx.query] = true;
      actions.push({ label: fx.label, query: fx.query });
    }
  }

  var nProblemas = findings.length;
  return {
    text:
      'Revisé tus turnos y encontré **' +
      nProblemas +
      '** cosa' +
      (nProblemas !== 1 ? 's' : '') +
      ' para mirar 👇 Tocá una para corregirla.',
    card: { kind: 'watchdog', findings: findings, ok: false, nTurnos: nTurnos },
    actions: actions
  };
}

// ─────────────────────────────────────────────────────────────────
//  Parser de monto en lenguaje natural (sobre texto NORMALIZADO sin
//  acentos): "3 millones", "3.000.000", "500 mil", "millon y medio",
//  "$2.500.000". Devuelve pesos o null.
// ─────────────────────────────────────────────────────────────────
function aiParseMonto(t) {
  if (!t) return null;
  var s = ' ' + String(t).replace(/\$/g, ' ') + ' ';
  var W = {
    un: 1,
    uno: 1,
    una: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10
  };
  function val(tok) {
    if (tok == null) return null;
    if (W[tok] != null) return W[tok];
    var n = parseFloat(String(tok).replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  var m;
  // millones / palos
  m = s.match(
    /(\d[\d.,]*|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*(?:millon(?:es)?|palos?)/
  );
  if (m) {
    var b = val(m[1]);
    if (b) {
      var v = b * 1000000;
      if (/medio/.test(s)) v += 500000;
      return Math.round(v);
    }
  }
  // N mil
  m = s.match(/(\d[\d.,]*|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*mil\b/);
  if (m) {
    var b2 = val(m[1]);
    if (b2) return Math.round(b2 * 1000);
  }
  // número crudo grande (>= 6 dígitos con separadores opcionales)
  m = s.match(/(\d[\d.,]{4,}\d)/);
  if (m) {
    var raw = m[1].replace(/[.,]/g, '');
    var n3 = parseInt(raw, 10);
    if (!isNaN(n3) && n3 >= 50000) return n3;
  }
  return null;
}

function _agHas(t, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (t.indexOf(arr[i]) >= 0) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────
//  Router de las 3 features agénticas. Corre PRE-NLP en ai.js para
//  ganarle al clasificador (que mandaría "revisá mis turnos" a navegar).
//  Devuelve la respuesta lista o null si ninguna aplica.
// ─────────────────────────────────────────────────────────────────
var _AG_SIM_TRIGGERS = [
  'simulador interactivo',
  'simulador en vivo',
  'simulador visual',
  'abrir simulador',
  'abrir el simulador',
  'jugar con los numeros',
  'jugar con numeros',
  'simular con botones',
  'simulador de turnos'
];
var _AG_VIGIA_TRIGGERS = [
  'revisa mis turnos',
  'revisar mis turnos',
  'revisame los turnos',
  'revisa el historial',
  'revisa mi historial',
  'chequea mis turnos',
  'chequear mis turnos',
  'audita mis turnos',
  'auditar mis turnos',
  'agente vigia',
  'hay errores en mis turnos',
  'errores en mis turnos',
  'todo bien con mis turnos',
  'estan bien mis turnos',
  'revisame el historial'
];
var _AG_META_TRIGGERS = [
  'quiero llegar a',
  'llegar a los',
  'mi meta',
  'meta de',
  'objetivo de',
  'objetivo es',
  'necesito juntar',
  'necesito reunir',
  'quiero juntar',
  'quiero reunir',
  'quiero completar',
  'me gustaria llegar a'
];

function aiAgentRoute(q, t, c, state) {
  q = q || '';
  t = t || '';
  // 1 · Simulador interactivo
  if (q.indexOf('/simulador') === 0 || _agHas(t, _AG_SIM_TRIGGERS)) {
    var sd = aiBuildSimData(c);
    if (sd && sd.ok) return { text: sd.text, action: { type: 'sim', data: sd.data } };
    if (sd) return { text: sd.text };
  }
  // 2 · Agente vigía
  if (q.indexOf('/vigia') === 0 || _agHas(t, _AG_VIGIA_TRIGGERS)) {
    var wd = aiBuildWatchdog(c, (state && (state.turnosAll || state.turnos)) || []);
    if (wd) return { text: wd.text, card: wd.card, actions: wd.actions };
  }
  // 3 · Agente de Meta (lenguaje natural con monto). El slash /meta y la
  // palabra "meta" los sigue manejando el handler dedicado en ai.js.
  if (_agHas(t, _AG_META_TRIGGERS)) {
    var monto = aiParseMonto(t);
    if (monto && monto >= 50000) {
      try {
        if (typeof aiSetGoal === 'function') aiSetGoal(monto);
      } catch (_e) {}
      try {
        if (typeof aiEpisodeRecord === 'function' && state && state.session && state.session.uid) {
          aiEpisodeRecord(state.session.uid, 'meta', 'Te propusiste llegar a ' + _agcFC(monto), {
            meta: monto
          });
        }
      } catch (_e2) {}
      var g = aiBuildGoalCard(monto, c);
      var txt =
        '🎯 **Meta: ' +
        _agcFC(monto) +
        '**\n\n' +
        g.planLines.join('\n') +
        '\n\n📌 Meta guardada — escribí **/metas** para seguir tu progreso.';
      return { text: txt, card: g.card, actions: g.actions };
    }
  }
  return null;
}

window.aiBuildGoalCard = aiBuildGoalCard;
window.aiBuildSimData = aiBuildSimData;
window.aiBuildWatchdog = aiBuildWatchdog;
window.aiParseMonto = aiParseMonto;
window.aiAgentRoute = aiAgentRoute;
console.log('[MT] ai-agent-cards.js cargado — Meta · Simulador · Vigía ✓');
