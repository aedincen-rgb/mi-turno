// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai.js
//  Motor de IA local 100% offline · 50+ capacidades
//  Sin red, sin LLM, sin dependencias externas
// ════════════════════════════════════════════════════════════════

// ─── NLP HELPERS ───────────────────────────────────────────────

function _aiNorm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿¡?!;:()[\]"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _aiHas(t) {
  for (var i = 1; i < arguments.length; i++) {
    if (t.indexOf(arguments[i]) >= 0) return true;
  }
  return false;
}

function _aiAll(t, arr) {
  for (var i = 0; i < arr.length; i++) if (t.indexOf(arr[i]) < 0) return false;
  return true;
}

// Extrae primer número en texto. Soporta dígitos y palabras (uno..diez)
function _aiNum(t) {
  // Limpiar formato de moneda común en Colombia (puntos de miles)
  var clean = t.replace(/\./g, '').replace(/,/g, '.');
  var m = clean.match(/(\d+(?:\.\d+)?)/);
  if (m) return parseFloat(m[1]);

  // Mapeo de palabras a números
  var w = {
    cero: 0,
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
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    dieciseis: 16,
    veinte: 20,
    treinta: 30
  };
  for (var k in w) {
    if (t.indexOf(k) >= 0) return w[k];
  }
  return null;
}

// ─── VARIACIÓN DE FRASES CONVERSACIONALES ────────────────────
var _aiPhraseVariants = {
  total: [
    'Te cuento cómo vas:',
    'Esto es lo que llevas:',
    'Aquí van tus números:',
    'Así vas este mes:',
    'Vamos a ver...',
    'Mira esto:'
  ],
  comparativa: [
    'Mira la comparativa:',
    'Te pongo los números lado a lado:',
    'Así se ve la diferencia:',
    'Comparando ambos periodos:'
  ],
  consejo: [
    'Un tip rápido:',
    'Te recomiendo:',
    'Mi sugerencia:',
    'Para mejorar:',
    'Algo que podrías hacer:'
  ]
};

function _aiPickPhrase(category) {
  var opts = _aiPhraseVariants[category] || [''];
  return opts[Math.floor(Math.random() * opts.length)];
}

// ─── PREGUNTAS DE SEGUIMIENTO CONVERSACIONALES ─────────────────
var _aiFollowUps = {
  salario: [
    '¿Quieres saber cuánto te falta para la meta? 🤔',
    '¿Te gustaría ver cómo subir ese número con nocturnas o extras?'
  ],
  extra: [
    '¿Quieres el detalle de cuánto suman esas extras por tipo?',
    '¿Te gustaría saber cómo se comparan con el mes pasado?'
  ],
  nocturn: [
    '¿Sabías que con 20h nocturnas extra podrías sumar bastante más?',
    '¿Quieres ver cuánto ganarías si haces solo turnos nocturnos?'
  ],
  festiv: [
    '¿Quieres saber cuáles son los próximos festivos que se vienen?',
    '¿Te gustaría planear tus turnos para esos días?'
  ],
  proyecc: [
    '¿Quieres que calcule escenarios optimista y pesimista?',
    '¿Te gustaría saber cuánto necesitas trabajar para llegar a una meta específica?'
  ],
  resumen: [
    '¿Quieres comparar con el mes pasado?',
    '¿Necesitas algún detalle más específico?',
    '¿Te gustaría que envíe esto por correo?'
  ],
  hola: [
    '¿Qué quieres saber hoy?',
    '¿Te ayudo con tu mes, tus ingresos o algo más?',
    'Dime, ¿cómo van los turnos?'
  ],
  descanso: [
    '¿Te gustaría que te recuerde cuándo fue tu último día libre?',
    '¿Quieres calcular cuánto has descansado este mes?'
  ],
  default: [
    '¿Necesitas algo más?',
    '¿Quieres profundizar en algún dato?',
    'Dime si quieres que calcule algo más.',
    '¿Te sirve esa info o necesitas otra cosa?'
  ]
};

function _aiPickFollowUp(intent) {
  var opts = _aiFollowUps[intent] || _aiFollowUps['default'];
  return opts[Math.floor(Math.random() * opts.length)];
}

// ─── CONSTRUCCIÓN DE CONTEXTO ──────────────────────────────────

function buildContext(state) {
  var ahora = new Date();
  var iniMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  var diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  var diaActual = ahora.getDate();
  var vh = state.vh || 0;
  var salario = state.salario || SMIN;

  // Turnos del mes (state.turnos viene filtrado por mes)
  var turnosMes = (state.turnos || []).filter(function (t) {
    return new Date(t.inicio) >= iniMes && t.fin;
  });

  // Turnos absolutos (todos): usado para mes/semana pasados
  var turnosAll = state.turnosAll || state.turnos || [];

  // ── Mes actual ──
  var dias = calcPorDia(turnosMes, vh);
  var totalMins = state.calc.totalMins,
    totalCOP = state.calc.totalCOP;
  var diasTrab = dias.length;
  var prom = diasTrab > 0 ? totalCOP / diasTrab : 0;
  var promHoras = diasTrab > 0 ? totalMins / diasTrab / 60 : 0;
  var mejor =
    dias.length > 0
      ? dias.reduce(function (a, b) {
          return b.cop > a.cop ? b : a;
        }, dias[0])
      : null;
  var peor =
    dias.length > 0
      ? dias.reduce(function (a, b) {
          return b.cop < a.cop ? b : a;
        }, dias[0])
      : null;
  var festTrab = dias.filter(function (d) {
    return d.fest;
  });
  var bd = state.calc.bd;
  // Helper para acceso seguro a los recargos (evita TypeError)
  var _get = function (k, p) {
    return (bd[k] || {})[p] || 0;
  };

  var nocturnasMins =
    _get('noctOrd', 'mins') +
    _get('extraNoct', 'mins') +
    _get('noctFest', 'mins') +
    _get('extraFestNoct', 'mins');
  var nocturnasCOP =
    _get('noctOrd', 'cop') +
    _get('extraNoct', 'cop') +
    _get('noctFest', 'cop') +
    _get('extraFestNoct', 'cop');
  var festMins =
    _get('diurnaFest', 'mins') +
    _get('noctFest', 'mins') +
    _get('extraFestDiur', 'mins') +
    _get('extraFestNoct', 'mins');
  var festCOP =
    _get('diurnaFest', 'cop') +
    _get('noctFest', 'cop') +
    _get('extraFestDiur', 'cop') +
    _get('extraFestNoct', 'cop');
  var extraMins =
    _get('extraDiurna', 'mins') +
    _get('extraNoct', 'mins') +
    _get('extraFestDiur', 'mins') +
    _get('extraFestNoct', 'mins');
  var extraCOP =
    _get('extraDiurna', 'cop') +
    _get('extraNoct', 'cop') +
    _get('extraFestDiur', 'cop') +
    _get('extraFestNoct', 'cop');

  var diurnaOrdMins = _get('diurnaOrd', 'mins'),
    diurnaOrdCOP = _get('diurnaOrd', 'cop');

  var proy = diasTrab > 0 ? (totalCOP / diaActual) * diasMes : 0;
  var pctSalario = salario > 0 ? (totalCOP / salario) * 100 : 0;
  var falta = Math.max(0, salario - totalCOP);
  var horasParaMeta = vh > 0 ? falta / vh : 0;

  // ── Mes pasado ──
  var iniMesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  var finMesPasado = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
  finMesPasado.setHours(23, 59, 59, 999);
  var turnosMesPasado = turnosAll.filter(function (t) {
    var d = new Date(t.inicio);
    return d >= iniMesPasado && d <= finMesPasado && t.fin;
  });
  var calcMesPasado =
    turnosMesPasado.length > 0
      ? doCalc(turnosMesPasado, null, finMesPasado, vh)
      : { totalMins: 0, totalCOP: 0, bd: {} };
  var diasTrabMesPasado = calcPorDia(turnosMesPasado, vh).length;

  // ── Semana actual (Lun-Dom) ──
  var iniSemana = semLun(ahora);
  var turnosSemana = turnosMes.filter(function (t) {
    return new Date(t.inicio) >= iniSemana;
  });
  var diasSemana = calcPorDia(turnosSemana, vh);
  var totalCOPSemana = diasSemana.reduce(function (a, d) {
    return a + d.cop;
  }, 0);
  var totalMinsSemana = diasSemana.reduce(function (a, d) {
    return a + d.mins;
  }, 0);

  // ── Semana pasada ──
  var iniSemPas = new Date(iniSemana);
  iniSemPas.setDate(iniSemana.getDate() - 7);
  var finSemPas = new Date(iniSemana);
  finSemPas.setMilliseconds(-1);
  var turnosSemPas = turnosAll.filter(function (t) {
    var d = new Date(t.inicio);
    return d >= iniSemPas && d <= finSemPas && t.fin;
  });
  var diasSemPas = calcPorDia(turnosSemPas, vh);
  var totalCOPSemPas = diasSemPas.reduce(function (a, d) {
    return a + d.cop;
  }, 0);
  var totalMinsSemPas = diasSemPas.reduce(function (a, d) {
    return a + d.mins;
  }, 0);

  // ── Hoy / Ayer ──
  var hoyIni = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  var ayerIni = new Date(hoyIni);
  ayerIni.setDate(hoyIni.getDate() - 1);
  var turnosHoy = turnosMes.filter(function (t) {
    return new Date(t.inicio) >= hoyIni;
  });
  var turnosAyer = turnosAll.filter(function (t) {
    var d = new Date(t.inicio);
    return d >= ayerIni && d < hoyIni && t.fin;
  });
  var diasHoy = calcPorDia(turnosHoy, vh);
  var diasAyer = calcPorDia(turnosAyer, vh);
  var copHoy = diasHoy.reduce(function (a, d) {
    return a + d.cop;
  }, 0);
  var minsHoy = diasHoy.reduce(function (a, d) {
    return a + d.mins;
  }, 0);
  var copAyer = diasAyer.reduce(function (a, d) {
    return a + d.cop;
  }, 0);
  var minsAyer = diasAyer.reduce(function (a, d) {
    return a + d.mins;
  }, 0);

  // ── Turno más largo / corto ──
  var tLargo = null,
    tCorto = null;
  turnosMes.forEach(function (t) {
    var dur = (new Date(t.fin) - new Date(t.inicio)) / 60000;
    if (dur <= 0) return;
    if (!tLargo || dur > tLargo.dur) tLargo = { t: t, dur: dur };
    if (!tCorto || dur < tCorto.dur) tCorto = { t: t, dur: dur };
  });

  // ── Patrón día de semana y horas valle ──
  var dowMins = [0, 0, 0, 0, 0, 0, 0],
    dowCOP = [0, 0, 0, 0, 0, 0, 0],
    dowCount = [0, 0, 0, 0, 0, 0, 0];
  dias.forEach(function (d) {
    var dt = new Date(d.fecha + 'T12:00:00');
    var dow = (dt.getDay() + 6) % 7;
    var dMins = d.mins || 0;
    dowMins[dow] += dMins;
    dowCOP[dow] += d.cop;
    dowCount[dow]++;
  });
  var bestDow = 0,
    worstDow = -1;
  for (var i = 1; i < 7; i++) {
    if (dowCOP[i] > dowCOP[bestDow]) bestDow = i;
    if (dowCOP[i] > 0 && (worstDow < 0 || dowCOP[i] < dowCOP[worstDow])) worstDow = i;
  }
  if (worstDow < 0) worstDow = 0;
  var bestDowInfo = {
    dia: bestDow,
    cop: dowCOP[bestDow],
    count: dowCount[bestDow]
  };

  // ── Próximos festivos del año ──
  var festSet = getColombianHolidays(ahora.getFullYear());
  var proxFests = [];
  var probe = new Date(ahora);
  probe.setHours(0, 0, 0, 0);
  probe.setDate(probe.getDate() + 1);
  for (var n = 0; n < 366 && proxFests.length < 5; n++) {
    var key =
      probe.getFullYear() +
      '-' +
      String(probe.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(probe.getDate()).padStart(2, '0');
    if (festSet.has(key) && probe.getDay() !== 0) proxFests.push(new Date(probe));
    probe.setDate(probe.getDate() + 1);
    if (probe.getFullYear() !== ahora.getFullYear()) break;
  }

  // ── Velocidad efectiva (COP por hora trabajada real) ──
  var copPorHoraReal = totalMins > 0 ? totalCOP / (totalMins / 60) : vh;

  // ── Racha actual (días consecutivos trabajando, contando hacia atrás) ──
  var rachaActual = 0;
  var probeR = new Date(ahora);

  for (var k = 0; k < diasMes; k++) {
    var keyR =
      probeR.getFullYear() +
      '-' +
      String(probeR.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(probeR.getDate()).padStart(2, '0');
    var trabajado = dias.some(function (d) {
      return d.fecha === keyR;
    });
    // La racha se rompe al primer día sin trabajo registrado
    if (!trabajado) break;
    rachaActual++;
    probeR.setDate(probeR.getDate() - 1);
  }

  // ── Estimación de Liquidación Proporcional (CST Colombia) ──
  var diasMesEfectivos = Math.max(1, diaActual);
  var estPrima = (salario * diasMesEfectivos) / 360;
  var estCesantias = (salario * diasMesEfectivos) / 360;
  var estIntereses = (estCesantias * diasMesEfectivos * 0.12) / 360;
  var estVacaciones = (salario * diasMesEfectivos) / 720;
  // Auxilio de transporte: usa la constante global definida en js/config/globals.js
  var estTransporte = totalCOP > SMIN * 2 ? 0 : (AUX_TRANSPORTE_2026 * diasMesEfectivos) / 30;
  var totalLiq = estPrima + estCesantias + estIntereses + estVacaciones + estTransporte;

  // Descuentos de ley (Salud 4% + Pensión 4% = 8%)
  var deducciones = totalCOP * 0.08;
  var sueldoNeto = totalCOP - deducciones + estTransporte;

  // ── Análisis de Bienestar ──
  // Alerta si el promedio semanal supera las 46h o si hay racha de 6+ días
  var hrsSemanales = diaActual > 0 ? totalMins / 60 / (diaActual / 7) : 0;
  var alertaFatiga = hrsSemanales > 48 || rachaActual >= 6;

  // ── Días hábiles restantes (no domingos ni festivos del calendario laboral, contando todos) ──
  var diasRestantes = diasMes - diaActual;

  // ── Campos para sistema de logros ──
  var festDiasCount = festTrab.length;
  var hoyEsRecord = false;
  if (mejor && dias.length > 0) {
    var hoyKey =
      ahora.getFullYear() +
      '-' +
      String(ahora.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(ahora.getDate()).padStart(2, '0');
    hoyEsRecord = mejor.fecha === hoyKey;
  }
  var totalTurnosVida =
    (state.turnosAll || state.turnos || []).length +
    (state.calc && state.calc.totalMins > 0 ? 1 : 0);

  // ── Contexto situacional ──────────────────────────────────────
  var horaDelDia = ahora.getHours();
  var periodoDelDia =
    horaDelDia >= 6 && horaDelDia < 12
      ? 'mañana'
      : horaDelDia >= 12 && horaDelDia < 18
        ? 'tarde'
        : horaDelDia >= 18 && horaDelDia < 22
          ? 'noche'
          : 'madrugada';
  var _diaSemNum = ahora.getDay();
  var _DOW_ES2 = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var diaSemana = _DOW_ES2[_diaSemNum];
  var esFinDeSemana = _diaSemNum === 0 || _diaSemNum === 6;
  var _hoyFestKey =
    ahora.getFullYear() +
    '-' +
    String(ahora.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(ahora.getDate()).padStart(2, '0');
  var esFestivo = festSet && typeof festSet.has === 'function' ? festSet.has(_hoyFestKey) : false;

  // Turno activo en curso
  var activoObj = state.activo || null;
  var tieneActivo = !!(activoObj && activoObj.inicio);
  var minutosEnTurnoActual = 0;
  if (tieneActivo) {
    minutosEnTurnoActual = Math.round((ahora - new Date(activoObj.inicio)) / 60000);
  }
  var alertaTurnoLargo = tieneActivo && minutosEnTurnoActual > 600; // >10h
  var alertaNocturnaActivo = tieneActivo && (horaDelDia >= 22 || horaDelDia < 6);

  // Indicadores de setup y historial
  var salarioConfigurado = salario > SMIN;
  var tieneHistorial = turnosAll.length > 0;

  // Bienestar compuesto
  var necesitaDescanso = rachaActual >= 6 || alertaTurnoLargo;
  var _wb = 'normal';
  if (alertaTurnoLargo || rachaActual >= 9 || hrsSemanales > 55) _wb = 'critico';
  else if (rachaActual >= 6 || hrsSemanales > 46) _wb = 'cansado';
  else if (rachaActual <= 3 && diasTrab >= 5 && hrsSemanales < 40) _wb = 'optimo';
  var estadoBienestar = _wb;

  return {
    // Tiempo
    // 📚 Diccionario para Programar (Base de Conocimiento Admin)
    _dictionary: {
      // Anatomía y Estructura
      html: 'HTML: Es el esqueleto. index.html es la puerta de entrada principal.',
      css: 'CSS: Es la ropa y estilos. Tu app usa 38 archivos CSS para ser modular.',
      js: 'JavaScript: El cerebro. 39 archivos JS manejan la lógica y Supabase.',
      'sw.js':
        'Service Worker: Asistente fantasma. Maneja el modo offline y el caché persistente. ¡Cuidado con el caché viejo!',
      'manifest.json': 'Configura la instalación como PWA (icono, nombre, colores de tema).',
      'package.json': 'Lista de "ingredientes" y librerías del proyecto.',
      'estructura.md': 'Tu mapa interno que explica la fragmentación en 77 archivos.',
      base: 'Carpeta css/base/: Reglas fundamentales (colores, reset, tipografía).',
      layout:
        'Carpeta css/layout/: Cómo se acomodan las cosas (header, scroll, botones de acción).',
      components: 'Carpeta css/components/: Bloques reutilizables (tarjetas, botones, inputs).',
      utils: 'Carpeta js/utils/: Funciones pequeñas (formato de moneda, haptic, red).',
      'sync-queue.js':
        'Cola de sincronización: Guarda cambios offline y los sube a Supabase cuando hay conexión.',
      services: 'Carpeta js/services/: Conexiones externas (Supabase, Calculadora, IA).',
      tabs: 'Carpeta js/tabs/: Las 5 pantallas principales de la interfaz.',
      app: 'Carpeta js/app/: Componentes de alto nivel (Root, Auth, AppMain).',

      // Conceptos Web
      pwa: 'Progressive Web App: Web que se siente como app (instalable + offline).',
      cache: 'Memoria temporal. El nivel de Service Worker es el más terco.',
      cdn: 'Red de servidores que sirven librerías como React o Chart.js rápidamente.',
      404: 'Error: No existe. El archivo no se encuentra en la ruta especificada.',
      500: 'Error de servidor: Algo falló en la nube o en la lógica de Vercel.',
      modular: 'Muchos archivos pequeños vs uno gigante. Facilita el mantenimiento.',
      frontend: 'Lo que el usuario ve y toca (HTML/CSS/JS).',
      backend: 'Lo que no se ve (Supabase: Base de datos y Auth).',
      react: 'Librería de UI. Describe los componentes y React los actualiza automáticamente.',

      // Git y Vercel
      git: 'Control de versiones. Commit (foto), Branch (rama), Push (subir), Pull (bajar).',
      commit: 'Un "punto de guardado" en la historia de tu código.',
      branch: 'Rama: Línea paralela de desarrollo (ej: ajustes, main).',
      revert: 'Deshacer un cambio creando un commit nuevo que anula el anterior.',
      reset: 'Mover la historia hacia atrás. Peligroso si ya hiciste Push.',
      vercel: 'Donde vive tu app. Despliega automáticamente desde GitHub.',
      deployment: 'Una versión publicada de tu app. Son inmutables.',
      rollback: 'Volver a una versión anterior que funcionaba bien.',

      // DevTools
      devtools:
        'F12: Herramienta detective. Console (errores), Network (peticiones), Application (SW/Storage).',
      console: 'Donde JavaScript grita sus errores. Mira aquí primero.',
      network: 'Muestra qué archivos cargan. Rojo = Fallo (404 o red).',
      application: 'Usa esta pestaña para borrar el Service Worker (Unregister) si nada actualiza.'
    },
    // Mapa Estructural para Consultas de Desarrollo
    _devMap: {
      emoji: 'Lógica visual: js/tabs/home.js (botones) o js/utils/icons.js (SVG de navegación).',
      luna: 'Modo oscuro: js/tabs/home.js (icono) y estilos en css/modals/dark-overrides.css.',
      color:
        'Modifica css/base/variables.css para temas globales o el CSS específico en css/components/.',
      boton: 'Estilos: css/layout/action-button.css. Lógica de inicio: js/tabs/home.js.',
      calculo: 'Toda la lógica matemática reside en js/services/calculator.js.',
      supabase: 'Configuración en js/config.js y helpers en js/services/supabase.js.',
      login:
        'Pantalla de acceso en js/app/auth-screen.js y estilos en css/components/auth-screen.css.',
      error: 'Logger en js/utils/error-logger.js y visor en js/modals/error-viewer.js.',
      pdf: 'Generación de documentos en js/services/export-files.js.',
      ia: 'Este motor reside en js/services/ai.js.',
      infra:
        'Verifica js/config.js. En Vercel, revisa las Env Variables. En Supabase, revisa las políticas RLS.',
      vercel:
        'Si la app no carga: 1. Revisa las "Environment Variables" en el dashboard de Vercel. 2. Verifica si el Service Worker (sw.js) está cacheando una versión vieja.',
      red: 'Usa navigator.onLine para detectar cortes. Errores de "Failed to fetch" suelen ser CORS o falta de internet.'
    },
    // Guía de resolución de problemas técnicos
    _troubleshooting: {
      supabase_auth:
        'Si falla el login: Revisa si el email está confirmado en Supabase Auth o si las políticas de la tabla "perfiles" permiten la lectura.',
      supabase_db:
        'Si no guarda datos: Revisa la consola de errores (🐞). Si ves "PGRST116", es que el registro no existe. Si es "403", es un problema de RLS.',
      vercel_deploy:
        'Si ves un error 500 en Vercel: Revisa los logs de las Edge Functions en el dashboard. Suele ser una variable de entorno faltante.',
      network_offline:
        'La app detecta estado offline. Los cambios se guardarán en localStorage (js/utils/storage.js) y se sincronizarán al volver la red.',
      cors: 'Si ves errores de CORS: Asegúrate de que el dominio de Vercel esté en la lista blanca de "Allowed Origins" en el dashboard de Supabase (API Settings).'
    },
    ahora: ahora,
    diasMes: diasMes,
    diaActual: diaActual,
    diasRestantes: diasRestantes,
    // Configuración
    salario: salario,
    vh: vh,
    // Mes actual
    turnosMes: turnosMes,
    dias: dias,
    totalMins: totalMins,
    totalCOP: totalCOP,
    diasTrab: diasTrab,
    prom: prom,
    promHoras: promHoras,
    mejor: mejor,
    peor: peor,
    bd: bd,
    diurnaOrdMins: diurnaOrdMins,
    diurnaOrdCOP: diurnaOrdCOP,
    nocturnasMins: nocturnasMins,
    nocturnasCOP: nocturnasCOP,
    festMins: festMins,
    festCOP: festCOP,
    festTrab: festTrab,
    extraMins: extraMins,
    extraCOP: extraCOP,
    proy: proy,
    pctSalario: pctSalario,
    falta: falta,
    horasParaMeta: horasParaMeta,
    // Mes pasado
    totalCOPMesPasado: calcMesPasado.totalCOP || 0,
    totalMinsMesPasado: calcMesPasado.totalMins || 0,
    diasMesPasado: diasTrabMesPasado,
    // Semana actual
    totalCOPSemana: totalCOPSemana,
    totalMinsSemana: totalMinsSemana,
    diasSemanaCount: diasSemana.length,
    // Semana pasada
    totalCOPSemPas: totalCOPSemPas,
    totalMinsSemPas: totalMinsSemPas,
    diasSemPasCount: diasSemPas.length,
    // Hoy / ayer
    copHoy: copHoy,
    minsHoy: minsHoy,
    turnosHoy: turnosHoy.length,
    copAyer: copAyer,
    minsAyer: minsAyer,
    turnosAyer: turnosAyer.length,
    // Turnos extremo
    tLargo: tLargo,
    tCorto: tCorto,
    // Patrones
    dowMins: dowMins,
    dowCOP: dowCOP,
    dowCount: dowCount,
    bestDow: bestDow,
    bestDowInfo: bestDowInfo,
    worstDow: worstDow,
    // Festivos / extras
    proxFests: proxFests,
    copPorHoraReal: copPorHoraReal,
    // Rachas
    rachaActual: rachaActual,
    // Finanzas y Salud
    totalLiq: totalLiq,
    estPrima: estPrima,
    estCesantias: estCesantias,
    estVacaciones: estVacaciones,
    estTransporte: estTransporte,
    deducciones: deducciones,
    sueldoNeto: sueldoNeto,
    burnout: alertaFatiga,
    hrsSemanales: hrsSemanales,
    // Logros
    festDiasCount: festDiasCount,
    hoyEsRecord: hoyEsRecord,
    totalTurnosVida: totalTurnosVida,
    // ── Situacional ──
    horaDelDia: horaDelDia,
    periodoDelDia: periodoDelDia,
    diaSemana: diaSemana,
    esFinDeSemana: esFinDeSemana,
    esFestivo: esFestivo,
    // Turno activo
    tieneActivo: tieneActivo,
    minutosEnTurnoActual: minutosEnTurnoActual,
    alertaTurnoLargo: alertaTurnoLargo,
    alertaNocturnaActivo: alertaNocturnaActivo,
    // Setup
    salarioConfigurado: salarioConfigurado,
    tieneHistorial: tieneHistorial,
    // Bienestar compuesto
    necesitaDescanso: necesitaDescanso,
    estadoBienestar: estadoBienestar
  };
}

// ─── HELPERS DE FORMATO ────────────────────────────────────────

var _DOW = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

function _fechaLarga(fechaISO) {
  var d = new Date(fechaISO + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function _bdLines(bd) {
  return Object.keys(bd)
    .filter(function (k) {
      return bd[k].mins > 0;
    })
    .map(function (k) {
      return '• ' + RC[k].label + ': ' + fCOP(bd[k].cop) + ' (' + fDur(bd[k].mins) + ')';
    })
    .join('\n');
}

function _trend(curr, prev) {
  if (prev <= 0) return curr > 0 ? '+∞%' : 'sin cambio';
  var pct = ((curr - prev) / prev) * 100;
  var sig = pct >= 0 ? '+' : '';
  return sig + pct.toFixed(1) + '%';
}

// ─── DESPACHADOR NLP (v76) ─────────────────────────────────────
// Mapea intents clasificados por ai-nlp.js a respuestas.
// Solo se invoca cuando la confianza del clasificador es ≥0.5.
// Si un intent no está mapeado, devuelve null → cae al sistema clásico.
function _aiDispatchNLP(intent, c, state, q, t) {
  // ── Conversacionales ──
  if (intent === 'saludo') {
    var s = typeof _saludoHora === 'function' ? _saludoHora(c.ahora) : 'Hola';
    var nm = state.session && state.session.email ? state.session.email.split('@')[0] : '';
    var nombre = nm ? ', ' + nm.charAt(0).toUpperCase() + nm.slice(1) : '';
    // Personalizar el saludo según el contexto situacional
    var saludoExtra = '';
    if (c.alertaTurnoLargo) {
      saludoExtra =
        ' Llevás ' + Math.round(c.minutosEnTurnoActual / 60) + ' horas en turno — ¿todo bien?';
    } else if (c.alertaNocturnaActivo) {
      saludoExtra = ' Trabajando de noche, ¿cómo vas?';
    } else if (c.tieneActivo) {
      saludoExtra = ' Turno activo en curso.';
    } else if (c.periodoDelDia === 'madrugada') {
      saludoExtra = ' Trasnochando, ¿todo bien?';
    } else if (!c.salarioConfigurado) {
      saludoExtra =
        ' Antes de empezar, te recomiendo configurar tu salario base en Ajustes para que las proyecciones sean exactas.';
    } else if (c.necesitaDescanso) {
      saludoExtra = ' Llevas ' + c.rachaActual + ' días seguidos — acordate de descansar.';
    }
    return (
      '¡' +
      s +
      nombre +
      '!' +
      saludoExtra +
      ' Puedo decirte cómo vas este mes, proyectar tus ingresos, calcular tu liquidación o avisarte si necesitás un descanso. ¿Qué querés mirar hoy?'
    );
  }
  if (intent === 'despedida') {
    var despedidas =
      typeof _gl === 'function'
        ? _gl('goodbye')
        : [
            '¡Nos vemos! Cuidate y descansá cuando puedas. ✦',
            'Chao, parce. Acá estoy cuando me necesités. 💪',
            '¡Hasta luego! Que te rinda el día. 🌟'
          ];
    return despedidas[Math.floor(Math.random() * despedidas.length)];
  }
  if (intent === 'agradecimiento') {
    var gracias =
      typeof _gl === 'function'
        ? _gl('thanks')
        : [
            '¡Con gusto! Para eso estoy. 🙌',
            'De nada, parce. Lo que necesités. ✨',
            'A la orden. ¿Algo más en que te ayude?'
          ];
    return gracias[Math.floor(Math.random() * gracias.length)];
  }
  if (intent === 'identidad') {
    return 'Soy tu asistente de nómina 100% local. Vivo en tu dispositivo, no envío tus datos a ningún lado. Conozco la Ley 2101/2021, los recargos colombianos, los festivos y tu historial de turnos. 🇨🇴';
  }
  if (intent === 'capacidades') {
    // Si pregunta específicamente por guías, mostrar todas
    if (
      typeof aiHelpListAll === 'function' &&
      _aiHas(t, 'guia', 'guía', 'lista', 'todo', 'todas', 'sabes hacer', 'podes hacer')
    ) {
      return aiHelpListAll();
    }
    return 'Estas son mis capacidades:\n\n💰 **Finanzas:** sueldo neto, liquidación, proyección\n⚖️ **Legal:** Ley 2101, recargos, auxilio de transporte\n📊 **Estadísticas:** KPIs, comparativas, rachas\n🔮 **Simulaciones:** ¿cuánto si trabajo X horas más?\n📅 **Festivos:** próximos, cuántos este mes\n🧘 **Bienestar:** análisis de fatiga, recomendaciones\n📧 **Reportes:** envío de PDF/Excel por correo\n📖 **Guías:** preguntame "¿cómo exporto?" o "¿cómo cambio mi foto?" para ayuda paso a paso';
  }

  // ── Conversacionales emocionales ──
  if (intent === 'celebracion') {
    var logros = [];
    if (c.pctSalario >= 100) logros.push('superaste tu salario base');
    if (c.diasTrab >= 20) logros.push('trabajaste ' + c.diasTrab + ' turnos este mes');
    if (c.rachaActual >= 5) logros.push('llevas ' + c.rachaActual + ' días seguidos sin parar');
    var logroStr = logros.length ? ' Te puedo decir que ' + logros.join(', ') + '. ' : '';
    var enc =
      typeof _gl === 'function'
        ? _gl('enthusiasm')
        : ['¡Así se hace!', '¡Con toda!', '¡Sin miedo al éxito!'];
    return (
      '🎉 ¡' +
      enc[Math.floor(Math.random() * enc.length)] +
      ' ' +
      logroStr +
      'Los éxitos se celebran y también se analizan — así se repiten.\n\n¿Querés ver el detalle de lo que lograste este mes?'
    );
  }
  if (intent === 'motivacion') {
    var enc2 =
      typeof _gl === 'function' ? _gl('enthusiasm') : ['¡Vamos con todo!', '¡Sin miedo al éxito!'];
    var apoyos = [
      'Cada turno que hacés, cada hora que ponés, es un ladrillo más. No se ven de cerca, pero desde lejos se ve el edificio.',
      'Los días difíciles son los que más te fortalecen. Si fuera fácil, todos lo harían.',
      'No medís el progreso día a día. Medís el progreso mes a mes. Y ahí es donde se nota lo que valés.',
      'Tenés ' + c.diasTrab + ' turnos encima este mes. Eso no lo hace cualquiera.',
      'El cansancio de hoy es el resultado de mañana. Seguí.'
    ];
    var apoyo = apoyos[Math.floor(Math.random() * apoyos.length)];
    return (
      '💪 ' +
      enc2[Math.floor(Math.random() * enc2.length)] +
      '\n\n' +
      apoyo +
      '\n\n¿Querés ver cómo vas este mes para recordarte por qué vale la pena?'
    );
  }
  if (intent === 'queja_fatiga') {
    var empat =
      typeof _gl === 'function' ? _gl('consolation') : ['Tranqui, todo bien.', 'Así es la vuelta.'];
    var resp = empat[Math.floor(Math.random() * empat.length)];
    var rachaMsg =
      c.rachaActual >= 6
        ? ' Llevás ' +
          c.rachaActual +
          ' días seguidos — la ley te da derecho a un descanso cada 6 días trabajados. No es un lujo, es tu derecho.'
        : ' A veces el cuerpo manda señales. Escuchalo.';
    return '🤝 ' + resp + rachaMsg + '\n\n¿Querés que revisemos si tenés algún descanso pendiente?';
  }
  if (intent === 'estado_animo') {
    var respuestas = [
      'Yo bien, gracias por preguntar. 😄 Procesando números y listo para ayudarte. ¿Vos cómo andás?',
      'Todo en orden por acá. Sin fatiga, sin burnout — ventajas de ser digital. 🤖 ¿En qué te puedo ayudar hoy?',
      'Funcionando al 100%, como siempre. La pregunta es ¿cómo estás vos? Si querés, te cuento cómo vas este mes.'
    ];
    return respuestas[Math.floor(Math.random() * respuestas.length)];
  }

  // ── Conversacionales exploratorias ──
  if (intent === 'curiosidad_app') {
    var curiosidades = [
      'La hora extra nocturna en festivo es la tarifa más cara del mercado laboral colombiano: 75% de recargo sobre el valor hora. Si trabajás 8 horas en esas condiciones, es como cobrar 14 horas diurnas.',
      'Esta app no envía nada a ningún servidor externo durante los cálculos. Todo el motor de nómina corre en tu dispositivo, sin internet. Podés usarla en el metro sin señal.',
      'El auxilio de transporte no es proporcional si trabajás menos de 15 días. Si ingresaste a mitad de mes, solo aplica desde la fecha de ingreso.',
      'Podés exportar todo tu historial como PDF o Excel desde la pestaña Historial. Útil si alguna vez tenés que demostrar tus ingresos o negociar un crédito.',
      'El simulador de escenarios puede calcular cuánto ganarías si solo hicieras turnos nocturnos, o si agregaras 2 horas extra por día. Preguntame "simular" y lo arrancamos.',
      'Tenés un backup de todos tus datos disponible en Ajustes. Exportá el archivo antes de cambiar de celular para no perder nada.',
      'En Colombia hay exactamente 18 festivos fijos por año. Si trabajaras todos, serían 31.5 días extra de ingresos. El rey de los festivos puede ganar más que alguien con 30% más de salario base.'
    ];
    var cur = curiosidades[Math.floor(Math.random() * curiosidades.length)];
    return '💡 ' + cur + '\n\n¿Querés que profundice en algo de esto?';
  }
  if (intent === 'reflexion') {
    var calificacion = '';
    if (c.pctSalario >= 100) calificacion = '⭐ Excelente mes — superaste tu salario base.';
    else if (c.pctSalario >= 80)
      calificacion = '👍 Buen mes — vas al ' + c.pctSalario.toFixed(0) + '% de tu meta.';
    else if (c.pctSalario >= 50)
      calificacion =
        '📊 Mes en progreso — llegas al ' + c.pctSalario.toFixed(0) + '% de tu salario base.';
    else if (c.diasTrab === 0) calificacion = '📋 No tengo datos de este mes todavía.';
    else
      calificacion =
        '💡 Mes arrancando — ' +
        c.diasTrab +
        ' turno' +
        (c.diasTrab !== 1 ? 's' : '') +
        ' registrado' +
        (c.diasTrab !== 1 ? 's' : '') +
        ' hasta ahora.';
    return (
      calificacion +
      '\n\nEn números: **' +
      fCOP(c.totalCOP) +
      '** brutos en ' +
      c.diasTrab +
      ' turnos, promedio **' +
      fCOP(c.prom) +
      '** por turno.\n\n¿Querés compararlo con el mes pasado o ver qué podría mejorar?'
    );
  }
  if (intent === 'planificacion_semana') {
    var faltaDinero =
      c.falta > 0
        ? 'Te faltan **' + fCOP(c.falta) + '** para llegar a tu salario base.'
        : 'Ya alcanzaste tu salario base este mes.';
    return (
      '📅 Para planear bien la semana necesito saber qué buscás:\n\n• Si querés **maximizar ingresos** → los turnos nocturnos y en festivo pagan hasta 75% más.\n• Si querés **descansar más** → un día libre cada 6 trabajados es tu derecho legal.\n• Si querés **alcanzar tu meta** → ' +
      faltaDinero +
      '\n\n¿Cuántos turnos estás pensando hacer esta semana?'
    );
  }

  // ── Dinero ──
  if (intent === 'total_ganado') {
    return (
      'Este mes llevás **' +
      fCOP(c.totalCOP) +
      '** brutos, en ' +
      c.diasTrab +
      ' turnos.\n\n' +
      _bdLines(c.bd) +
      '\n\n' +
      '📊 Vas al ' +
      c.pctSalario.toFixed(1) +
      '% de tu salario base.\n' +
      '🔮 Proyección al cierre: **' +
      fCOP(c.proy) +
      '**\n\n' +
      (typeof aiFollowUp === 'function' ? aiFollowUp('total_ganado') : '')
    );
  }
  if (intent === 'hoy') {
    if (c.turnosHoy === 0) return 'Hoy no registraste turnos todavía. ¿Arrancamos? 🚀';
    return (
      'Hoy llevás **' +
      fCOP(c.copHoy) +
      '** en ' +
      fDur(c.minsHoy) +
      ' repartidos en ' +
      c.turnosHoy +
      ' turno' +
      (c.turnosHoy !== 1 ? 's' : '') +
      '.\n\n' +
      (typeof aiFollowUp === 'function' ? aiFollowUp('hoy') : '')
    );
  }
  if (intent === 'ayer') {
    if (c.turnosAyer === 0) return 'Ayer no tuviste turnos registrados.';
    return (
      'Ayer hiciste **' +
      fCOP(c.copAyer) +
      '** en ' +
      fDur(c.minsAyer) +
      ' con ' +
      c.turnosAyer +
      ' turno' +
      (c.turnosAyer !== 1 ? 's' : '') +
      '.'
    );
  }
  if (intent === 'proyeccion') {
    return (
      '🔮 Al cierre del mes proyectás **' +
      fCOP(c.proy) +
      '**.\n\n' +
      '• Días trabajados: ' +
      c.diasTrab +
      ' de ' +
      c.diasMes +
      '\n' +
      '• Promedio por turno: ' +
      fCOP(c.prom) +
      '\n' +
      '• Días restantes: ' +
      c.diasRestantes +
      '\n\n' +
      '💰 Eso es el ' +
      c.pctSalario.toFixed(1) +
      '% de tu salario base.\n\n' +
      (typeof aiFollowUp === 'function' ? aiFollowUp('proyeccion') : '')
    );
  }
  if (intent === 'horas_trabajadas') {
    return (
      '⏱ Llevás **' +
      fDur(c.totalMins) +
      '** este mes (' +
      (c.totalMins / 60).toFixed(1) +
      ' horas).\n\n' +
      '• Promedio por turno: ' +
      c.promHoras.toFixed(1) +
      'h\n' +
      '• Horas nocturnas: ' +
      fDur(c.nocturnasMins) +
      '\n' +
      '• Horas festivas: ' +
      fDur(c.festMins) +
      '\n' +
      '• Horas extra: ' +
      fDur(c.extraMins)
    );
  }
  if (intent === 'promedio') {
    return (
      '📊 Tu promedio es de **' +
      fCOP(c.prom) +
      '** por turno (' +
      c.promHoras.toFixed(1) +
      'h).\n\n' +
      '• Mejor día: ' +
      (c.mejor ? fCOP(c.mejor.cop) + ' el ' + _fechaLarga(c.mejor.fecha) : '—') +
      '\n' +
      '• COP por hora real: ' +
      fCOP(c.copPorHoraReal)
    );
  }

  // ── Comparativas ──
  if (intent === 'comparativa_mes') {
    if (c.totalCOPMesPasado === 0) return 'No tengo datos del mes pasado para comparar.';
    return (
      '📊 **Este mes vs mes pasado:**\n\n' +
      '• Este mes: ' +
      fCOP(c.totalCOP) +
      ' en ' +
      fDur(c.totalMins) +
      '\n' +
      '• Mes pasado: ' +
      fCOP(c.totalCOPMesPasado) +
      ' en ' +
      fDur(c.totalMinsMesPasado) +
      '\n' +
      '• Tendencia: ' +
      _trend(c.totalCOP, c.totalCOPMesPasado)
    );
  }
  if (intent === 'comparativa_semana') {
    return (
      '📊 **Esta semana vs pasada:**\n\n' +
      '• Esta semana: ' +
      fCOP(c.totalCOPSemana) +
      ' en ' +
      fDur(c.totalMinsSemana) +
      '\n' +
      '• Semana pasada: ' +
      fCOP(c.totalCOPSemPas) +
      ' en ' +
      fDur(c.totalMinsSemPas) +
      '\n' +
      '• Tendencia: ' +
      _trend(c.totalCOPSemana, c.totalCOPSemPas)
    );
  }

  // ── Patrones ──
  if (intent === 'mejor_dia') {
    if (!c.mejor) return 'Aún no tengo datos para identificar tu mejor día.';
    return (
      '🏆 Tu mejor día fue el **' +
      _fechaLarga(c.mejor.fecha) +
      '** con **' +
      fCOP(c.mejor.cop) +
      '**. ¡Qué jornada!'
    );
  }
  if (intent === 'peor_dia') {
    if (!c.peor) return 'Aún no tengo datos para identificar tu peor día.';
    return (
      'Tu día más bajo fue el **' +
      _fechaLarga(c.peor.fecha) +
      '** con ' +
      fCOP(c.peor.cop) +
      '. Todos tenemos días así.'
    );
  }
  if (intent === 'turno_largo') {
    if (!c.tLargo) return 'No tengo turnos cerrados todavía.';
    return (
      'Tu turno más largo duró **' +
      fDur(c.tLargo.dur) +
      '** el ' +
      _fechaLarga(c.tLargo.t.inicio) +
      '.'
    );
  }
  if (intent === 'turno_corto') {
    if (!c.tCorto) return 'No tengo turnos cerrados todavía.';
    return (
      'Tu turno más corto duró **' +
      fDur(c.tCorto.dur) +
      '** el ' +
      _fechaLarga(c.tCorto.t.inicio) +
      '.'
    );
  }
  if (intent === 'racha') {
    if (c.rachaActual <= 1)
      return (
        'No tenés racha activa. Tu última jornada fue ' +
        (c.rachaActual === 1 ? 'hoy.' : 'hace más de un día.')
      );
    var rachaMsg = '🔥 Llevás **' + c.rachaActual + ' días consecutivos** trabajando. ';
    rachaMsg +=
      c.rachaActual >= 7 ? '⚠️ ¿Consideraste tomarte un día de descanso?' : '¡Buen ritmo!';
    return rachaMsg;
  }
  if (intent === 'distribucion') {
    var lines = Object.keys(c.bd)
      .filter(function (k) {
        return c.bd[k].mins > 0;
      })
      .map(function (k) {
        return '• ' + RC[k].label + ': ' + fCOP(c.bd[k].cop) + ' (' + fDur(c.bd[k].mins) + ')';
      })
      .join('\n');

    // Generar datos para el gráfico visual
    var chartData = [];
    var colors = {
      ord: '#5b86e5',
      noc: '#3a5cb5',
      ext_d: '#ff9f43',
      ext_n: '#ff7675',
      fest_d: '#1dd1a1',
      fest_n: '#10ac84',
      ext_fd: '#feca57',
      ext_fn: '#ff6b6b'
    };

    var totalMins = c.totalMins || 1;
    for (var k in c.bd) {
      if (c.bd[k].mins > 0) {
        chartData.push({
          label: RC[k].label,
          val: fDur(c.bd[k].mins),
          pct: (c.bd[k].mins / totalMins) * 100,
          color: colors[k] || 'var(--accent)'
        });
      }
    }

    // Ordenar de mayor a menor
    chartData.sort(function (a, b) {
      return b.pct - a.pct;
    });

    return {
      text: '📊 **Distribución de tus horas:**\n\n' + lines,
      chart: {
        title: 'Distribución de Tiempo',
        data: chartData
      }
    };
  }
  if (intent === 'velocidad') {
    return (
      '⚡ Tu velocidad es de **' +
      fCOP(c.copPorHoraReal) +
      ' por hora** trabajada.\n\n' +
      '• Valor hora base: ' +
      fCOP(c.vh) +
      '\n' +
      '• Efectiva (con recargos): ' +
      fCOP(c.copPorHoraReal)
    );
  }

  // ── Simulación ──
  if (intent === 'simulacion') {
    var hrs = _aiNum(t);
    if (hrs === null) hrs = 4;
    return (
      '🔮 Si trabajás **' +
      hrs +
      'h adicionales**:\n\n' +
      '• Diurna ordinaria: +' +
      fCOP(hrs * c.vh * 1.0) +
      '\n' +
      '• Nocturna: +' +
      fCOP(hrs * c.vh * 1.35) +
      '\n' +
      '• Extra diurna: +' +
      fCOP(hrs * c.vh * 1.25) +
      '\n' +
      '• Festiva diurna: +' +
      fCOP(hrs * c.vh * 1.75) +
      '\n' +
      '• Festiva nocturna: +' +
      fCOP(hrs * c.vh * 2.1)
    );
  }

  // ── Festivos ──
  if (intent === 'festivos') {
    if (!c.proxFests || !c.proxFests.length) return 'No hay más festivos este año.';
    var flist = c.proxFests
      .map(function (d) {
        return (
          '• ' + d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
        );
      })
      .join('\n');
    return (
      '📅 **Próximos festivos:**\n\n' +
      flist +
      '\n\n⚠️ Recordá: los festivos pagan con recargo del 75%.'
    );
  }

  // ── Bienestar ──
  if (intent === 'bienestar') {
    var _fu = typeof aiFollowUp === 'function' ? '\n\n' + aiFollowUp('bienestar') : '';
    // Turno largo activo → alerta inmediata
    if (c.alertaTurnoLargo) {
      return (
        '⚠️ **Turno muy largo:** Llevas **' +
        Math.round(c.minutosEnTurnoActual / 60) +
        ' horas** en este turno.' +
        (c.alertaNocturnaActivo ? ' Y encima de noche.' : '') +
        '\n\n🛑 El límite legal diario son 10 horas. Considerá cerrar el turno y descansar.\n\n' +
        '💡 Un descanso ahora es mejor que un accidente o una baja de productividad mañana.' +
        _fu
      );
    }
    if (c.estadoBienestar === 'critico' || c.burnout) {
      return (
        '⚠️ **Alerta de fatiga:** Tu ritmo (' +
        c.hrsSemanales.toFixed(1) +
        'h/sem) y racha de ' +
        c.rachaActual +
        ' días seguidos indican que necesitás un descanso urgente.\n\n' +
        '💡 **Recomendación:** Tomate al menos un día libre esta semana. La ley te ampara: un día de descanso cada 6 trabajados es tu derecho.' +
        _fu
      );
    }
    if (c.estadoBienestar === 'cansado') {
      return (
        '🟡 **Atención:** Llevas ' +
        c.rachaActual +
        ' días seguidos (' +
        c.hrsSemanales.toFixed(1) +
        'h/sem esta semana).\n\n' +
        '💡 Estás dentro del límite pero acercándote al borde. Planificá un día de descanso pronto.' +
        _fu
      );
    }
    if (c.estadoBienestar === 'optimo') {
      return (
        '✅ **Excelente equilibrio:** Tu carga de ' +
        c.hrsSemanales.toFixed(1) +
        'h/sem y ' +
        c.rachaActual +
        ' días de racha son sostenibles.\n\n' +
        '💡 Seguí así. El descanso bien distribuido es lo que mantiene el rendimiento a largo plazo.' +
        _fu
      );
    }
    return (
      '✅ **Estado:** Tu carga está dentro de lo saludable (' +
      c.hrsSemanales.toFixed(1) +
      'h/sem).\n\n' +
      '💡 Mantené al menos un día de desconexión total a la semana.' +
      _fu
    );
  }

  // ── Liquidación ──
  if (intent === 'liquidacion') {
    return (
      '💰 **Tu liquidación estimada (día ' +
      c.diaActual +
      '):**\n\n' +
      '**Neto a recibir: ' +
      fCOP(c.sueldoNeto) +
      '**\n' +
      '• Bruto: ' +
      fCOP(c.totalCOP) +
      '\n' +
      '• Salud + Pensión (8%): -' +
      fCOP(c.deducciones) +
      '\n' +
      '• Auxilio transporte: +' +
      fCOP(c.estTransporte) +
      '\n\n' +
      '📋 **Prestaciones acumuladas:**\n' +
      '• Prima: ' +
      fCOP(c.estPrima) +
      '\n' +
      '• Cesantías: ' +
      fCOP(c.estCesantias) +
      '\n' +
      '• Vacaciones: ' +
      fCOP(c.estVacaciones)
    );
  }

  // ── Ley / Conocimiento laboral ──
  if (intent === 'ley' || intent === 'laboral') {
    // Preguntas conceptuales/definitorias ("qué es", "qué significa", "cómo funciona el recargo")
    // van siempre a la base de conocimiento, incluso si tenemos el salario del usuario.
    // El cálculo personalizado solo aplica cuando el usuario quiere saber su valor específico.
    var _esDefinitoria = _aiHas(
      t,
      'que es',
      'que son',
      'que significa',
      'como funciona',
      'como se calcula',
      'en que consiste',
      'explica',
      'explique',
      'cuanto es el recargo',
      'cual es el recargo',
      'cuanto recargo'
    );
    if (_esDefinitoria && typeof aiKnowledgeSearch === 'function') {
      var kRespDef = aiKnowledgeSearch(q);
      if (kRespDef) return kRespDef;
    }

    // Si el usuario pregunta por el valor de una hora específica y tenemos su salario
    if (c.vh > 0) {
      if (_aiHas(t, 'domingo', 'dominical', 'festivo')) {
        if (_aiHas(t, 'extra', 'extras')) {
          if (_aiHas(t, 'noche', 'nocturno', 'nocturna')) {
            return (
              '🌙⛪ **Hora extra festiva nocturna:**\n\nTu hora base es ' +
              fCOP(c.vh) +
              '.\nCon el recargo del 150% (2.50x), te pagan **' +
              fCOP(c.vh * 2.5) +
              '** por cada hora.'
            );
          }
          return (
            '☀️⛪ **Hora extra festiva diurna:**\n\nTu hora base es ' +
            fCOP(c.vh) +
            '.\nCon el recargo del 100% (2.00x), te pagan **' +
            fCOP(c.vh * 2.0) +
            '** por cada hora.'
          );
        }
        if (_aiHas(t, 'noche', 'nocturno', 'nocturna')) {
          return (
            '🌙⛪ **Hora festiva nocturna:**\n\nTu hora base es ' +
            fCOP(c.vh) +
            '.\nCon el recargo del 110% (2.10x), te pagan **' +
            fCOP(c.vh * 2.1) +
            '** por cada hora.'
          );
        }
        return (
          '☀️⛪ **Hora dominical/festiva diurna:**\n\nTu hora base es ' +
          fCOP(c.vh) +
          '.\nCon el recargo del 75% (1.75x), te pagan **' +
          fCOP(c.vh * 1.75) +
          '** por cada hora.'
        );
      }

      if (_aiHas(t, 'noche', 'nocturno', 'nocturna')) {
        if (_aiHas(t, 'extra', 'extras')) {
          return (
            '🌙 **Hora extra nocturna:**\n\nTu hora base es ' +
            fCOP(c.vh) +
            '.\nCon el recargo del 75% (1.75x), te pagan **' +
            fCOP(c.vh * 1.75) +
            '** por cada hora.'
          );
        }
        return (
          '🌙 **Hora nocturna ordinaria:**\n\nTu hora base es ' +
          fCOP(c.vh) +
          '.\nCon el recargo del 35% (1.35x), te pagan **' +
          fCOP(c.vh * 1.35) +
          '** por cada hora.'
        );
      }

      if (_aiHas(t, 'extra', 'extras')) {
        return (
          '☀️ **Hora extra diurna:**\n\nTu hora base es ' +
          fCOP(c.vh) +
          '.\nCon el recargo del 25% (1.25x), te pagan **' +
          fCOP(c.vh * 1.25) +
          '** por cada hora.'
        );
      }

      if (_aiHas(t, 'hora', 'vale', 'pagan') && !_aiHas(t, 'ley', 'normativa')) {
        return (
          'Tu **valor hora ordinario** (sin recargos) es de **' +
          fCOP(c.vh) +
          '**, calculado en base a tu salario de ' +
          fCOP(c.salario) +
          '.'
        );
      }
    }

    // PRIORIDAD: buscar en la base de conocimiento para respuestas específicas
    if (typeof aiKnowledgeSearch === 'function') {
      var kResp = aiKnowledgeSearch(q);
      if (kResp) return kResp;
    }
    var hsemActual = typeof getHSEM === 'function' ? getHSEM(c.ahora) : 44;
    return (
      '⚖️ **Normativa laboral colombiana:**\n\n' +
      '• Jornada máxima actual: **' +
      hsemActual +
      'h/semana** (Ley 2101/2021)\n' +
      '• Recargo nocturno (9pm-6am): **+35%**\n' +
      '• Recargo dominical/festivo: **+75%**\n' +
      '• Hora extra diurna: **+25%**\n' +
      '• Hora extra nocturna: **+75%**\n' +
      '• Extra festiva diurna: **+100%**\n' +
      '• Extra festiva nocturna: **+150%**\n\n' +
      '• Máximo 2h extra/día y 12h/semana\n' +
      '• Descanso obligatorio tras 6 días de trabajo'
    );
  }

  // ── Ahorro ──
  if (intent === 'ahorro') {
    var meta = _aiNum(t);
    if (!meta || meta < 1000) meta = c.salario;
    var faltaMeta = Math.max(0, meta - c.totalCOP);
    if (faltaMeta === 0)
      return '🎉 ¡Ya alcanzaste la meta de ' + fCOP(meta) + '! Vas en ' + fCOP(c.totalCOP) + '.';
    var turnosNec = c.prom > 0 ? Math.ceil(faltaMeta / c.prom) : '—';
    return (
      '🎯 Para llegar a **' +
      fCOP(meta) +
      '** te faltan **' +
      fCOP(faltaMeta) +
      '**.\n\n' +
      '• A tu ritmo: ~' +
      turnosNec +
      ' turnos más\n' +
      '• En horas base: ' +
      (faltaMeta / (c.vh || 1)).toFixed(1) +
      'h'
    );
  }

  // ── Optimizador de Horarios ──
  if (intent === 'optimizador') {
    var metaExtra = _aiNum(t);
    if (!metaExtra || metaExtra < 1000) {
      return 'Para recomendarte turnos, necesito saber cuánto dinero extra quieres ganar. Por ejemplo: "Quiero ganar 150 lucas extra".';
    }
    if (typeof aiAdvisorOptimizador === 'function') {
      return aiAdvisorOptimizador(c, metaExtra);
    }
  }

  // ── Planificador de Vacaciones (State Machine) ──
  if (intent === 'planear_vacaciones') {
    var conv = typeof aiGetConversation === 'function' ? aiGetConversation() : null;
    if (conv && conv.stateMachine) {
      conv.stateMachine.active = true;
      conv.stateMachine.flow = 'vacaciones';
      conv.stateMachine.step = 1;
      return '🌴 ¡Qué bueno! Planear vacaciones es importante. ¿Cuántos días hábiles te quieres tomar?';
    }
    return '🌴 Para planear tus vacaciones, ve a la pestaña de Ajustes.';
  }

  // ── Stats ──
  if (intent === 'stats') {
    return (
      '⚡ **Resumen rápido:**\n' +
      '• ' +
      c.diasTrab +
      ' turnos · ' +
      fDur(c.totalMins) +
      '\n' +
      '• ' +
      fCOP(c.totalCOP) +
      ' (' +
      c.pctSalario.toFixed(1) +
      '% de tu meta)\n' +
      '• Mejor día: ' +
      (c.mejor ? _fechaLarga(c.mejor.fecha) + ' ' + fCOP(c.mejor.cop) : '—') +
      '\n' +
      '• Proyección: ' +
      fCOP(c.proy)
    );
  }

  // ── Acciones del Agente ──
  if (
    intent === 'configurar_salario' ||
    intent === 'iniciar_turno' ||
    intent === 'cerrar_turno' ||
    intent === 'navegar_ajustes' ||
    intent === 'navegar_historial'
  ) {
    // Devolvemos un string temporal, aiEnhancedRespond lo reemplazará con el texto final y la acción
    return 'Procesando acción...';
  }

  // ── Email ──
  if (intent === 'email') {
    // Usar el mismo builder que el sistema clásico para acción real
    if (typeof _aiBuildEmail === 'function') {
      var emailAction = _aiBuildEmail(q, t, c, state);
      if (emailAction && emailAction.preview) {
        return {
          text:
            emailAction.preview +
            '\n\n💡 **¿Sabías que...?** También podés **compartir por WhatsApp** desde la pestaña Análisis (es más rápido, solo un mensaje de texto), o **exportar PDF** desde Historial si necesitás un archivo.',
          action: emailAction.data ? { type: 'email_compose', data: emailAction.data } : undefined
        };
      }
    }
    return '📧 Claro, puedo ayudarte a enviar tu reporte por correo.\n\n💡 **Alternativas:**\n• **WhatsApp:** más rápido, sin archivo — decí "compartir por WhatsApp"\n• **PDF/Excel:** archivo descargable — decí "exportar PDF" o "exportar Excel"\n• **Email:** documento adjunto — decime "enviá mi reporte a [correo]"';
  }
  if (intent === 'correo_formal') {
    return (
      '📝 **Redacté este borrador para tu jefe:**\n\n' +
      '"Estimado/a,\n\nAdjunto el reporte de mis turnos del mes con el detalle de horas trabajadas, recargos aplicados y proyección al cierre. El total acumulado hasta hoy es de ' +
      fCOP(c.totalCOP) +
      '.\n\nQuedo atento/a a cualquier comentario.\nSaludos cordiales."\n\n¿Lo ajusto o así está bien?'
    );
  }

  // ── Ayuda ──
  if (intent === 'ayuda_app') {
    return (
      '📖 **¿Cómo usar Mi Turno?**\n\n' +
      '1. **Inicio:** tocá "Iniciar turno" al llegar y "Finalizar" al irte\n' +
      '2. **Análisis:** mirá tus KPIs, gráfico y proyección\n' +
      '3. **Asistente:** preguntame lo que quieras (¡estamos acá!)\n' +
      '4. **Historial:** revisá todos tus turnos pasados\n' +
      '5. **Ajustes:** configurá tu salario, PIN, modo quincena\n\n' +
      '💡 La app funciona sin internet. Tus datos se sincronizan cuando vuelve la conexión.\n\n' +
      '📚 ¿Necesitás ayuda con algo específico? Decime "cómo exportar", "cómo respaldar", "cómo cambiar mi foto"...'
    );
  }

  // ── Ayuda de navegación (ai-help.js) ──
  if (intent === 'ayuda_navegacion') {
    // Diagnóstico rápido de conexión: "estoy conectado", "hay conexion"
    if (
      _aiHas(
        t,
        'conectado',
        'conexion',
        'supabase',
        'nube',
        'online',
        'offline',
        'sincronizando',
        'sync',
        'hay internet',
        'funciona internet'
      )
    ) {
      var _onlineStatus = typeof navigator !== 'undefined' && navigator.onLine;
      var _cloudOK = typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE;
      var _rtStatus = typeof getRealtimeStatus === 'function' ? getRealtimeStatus() : null;
      var _syncPending = 0;
      try {
        var _sq = leer('mt_sync_queue', {});
        var _uid = state.session && state.session.uid;
        if (_uid && _sq[_uid]) _syncPending = _sq[_uid].length;
      } catch (_) {}
      var _resp = '📡 **Estado de conexión**\n\n';
      _resp += _onlineStatus ? '✅ **Internet:** Conectado\n' : '❌ **Internet:** Sin conexión\n';
      _resp += _cloudOK
        ? '☁️ **Supabase:** Conectado' + (_rtStatus ? ' (' + _rtStatus + ')' : '') + '\n'
        : '⚠️ **Supabase:** No conectado\n';
      if (_syncPending > 0)
        _resp +=
          '🔄 **Pendiente:** ' +
          _syncPending +
          ' cambio' +
          (_syncPending !== 1 ? 's' : '') +
          ' por sincronizar\n';
      _resp +=
        '\n💡 La app funciona 100% sin internet. Tus datos se guardan localmente y se sincronizan cuando vuelve la conexión.';
      return _resp;
    }

    if (typeof aiHelpAnswer === 'function') {
      var helpResp = aiHelpAnswer(q);
      if (helpResp) return helpResp;
    }
    return '🤔 Contame qué querés hacer y te guío paso a paso. Por ejemplo:\n\n• "¿Cómo exporto mis turnos?"\n• "¿Cómo cambio mi foto?"\n• "¿Cómo configuro el PIN?"\n• "¿Cómo respaldo mis datos?"';
  }

  // ── WhatsApp Share ──
  if (intent === 'whatsapp_share') {
    return '📱 **Compartir por WhatsApp**\n\nPodés compartir tus números desde la pestaña **Análisis** (📊). Bajá hasta el final y tocá el botón verde **💬 WhatsApp**. Se abre directo con un mensaje pre-formateado.\n\nTambién podés usar **📤 Compartir** para enviarlo por Telegram, correo u otras apps.\n\n💡 **¿Sabías que...?** Esto es un mensaje de texto, no un archivo. Si necesitás un PDF o Excel descargable, decime **"exportar PDF"** o andá a **Historial > Exportar**.';
  }

  // Intent no mapeado → advertir en consola y delegar al sistema clásico
  if (intent) {
    try {
      console.warn(
        '[NLP] Intent sin handler en _aiDispatchNLP:',
        intent,
        '— delegando a sistema clásico'
      );
    } catch (_) {}
  }
  return null;
}

// ─── MOTOR PRINCIPAL ───────────────────────────────────────────

function aiAnswer(question, state) {
  var q = question.toLowerCase().trim();
  var t = _aiNorm(question);
  if (!q) return 'Pregúntame algo sobre tu mes.';

  // Construcción del contexto garantizada
  var c = buildContext(state);
  var isAdmin = state.session && state.session.isAdmin;

  // ── MÁQUINA DE ESTADOS (Flujos Multi-paso) ──
  var conv = typeof aiGetConversation === 'function' ? aiGetConversation() : null;
  if (conv && conv.stateMachine && conv.stateMachine.active) {
    var sm = conv.stateMachine;

    if (sm.flow === 'vacaciones') {
      if (sm.step === 1) {
        var dias = _aiNum(t);
        if (dias) {
          sm.data.dias = dias;
          sm.step = 2;
          return (
            'Perfecto, ' +
            dias +
            ' días hábiles. ¿A partir de qué fecha te los quieres tomar? (ej. "del 10 de agosto")'
          );
        }
        return 'No entendí cuántos días. Por favor dime un número, ej. "15 días".';
      }
      if (sm.step === 2) {
        // Simulación simple de fecha
        sm.data.fecha = question;
        sm.active = false; // Terminar flujo

        var valorVacaciones = (c.salario / 30) * sm.data.dias;
        return (
          '🌴 **Resumen de Vacaciones:**\n\n' +
          '• Días hábiles: ' +
          sm.data.dias +
          '\n' +
          '• Fecha de inicio: ' +
          sm.data.fecha +
          '\n' +
          '• Valor estimado a recibir: **' +
          fCOP(valorVacaciones) +
          '**\n\n' +
          '¡Que las disfrutes mucho! ¿Te ayudo con algo más?'
        );
      }
    }
  }

  // ── MODO DESARROLLADOR Y DIAGNÓSTICO ──
  if (
    isAdmin &&
    _aiHas(
      t,
      'donde',
      'archivo',
      'modulo',
      'cambio',
      'eliminar',
      'mover',
      'codigo',
      'error',
      'falla',
      'supabase',
      'vercel',
      'red',
      'conexion',
      'luna',
      'oscuro',
      'tema',
      'que es',
      'para que',
      'significa',
      'diccionario',
      'reglas'
    )
  ) {
    var map = c._devMap;
    var fix = c._troubleshooting;
    var dict = c._dictionary;

    // 1. Prioridad: Reglas de Oro
    if (_aiHas(t, 'reglas', 'oro', 'lecciones')) {
      return (
        '🌟 **Reglas de Oro del Proyecto:**\n\n' +
        [
          '1. Antes de borrar, haz backup manual de la carpeta.',
          '2. Si no ves cambios, sospecha del Service Worker (SW).',
          '3. F12 -> Console -> Network es tu primer paso.',
          '4. Vercel es una máquina del tiempo (Rollback).',
          '5. Los errores tienen mensajes: léelos, no los ignores.',
          '6. Modularizar temprano facilita la vida.'
        ].join('\n') +
        '\n\n💡 *Sigue estas pautas para un desarrollo profesional.*'
      );
    }

    // 2. Prioridad: Diccionario de conceptos
    for (var term in dict) {
      if (_aiHas(t, term)) {
        return (
          '📖 **Diccionario de Bolsillo:**\n\n' +
          dict[term] +
          '\n\n💡 *Esta definición es específica para tu proyecto Mi Turno.*'
        );
      }
    }

    var respuesta = '🛠 **Sugerencia de Arquitectura:**\n\n';

    // Priorizar diagnósticos de infraestructura
    if (_aiHas(t, 'supabase')) {
      return '🛡 **Diagnóstico Supabase:**\n' + map.supabase + '\n\n💡 ' + fix.supabase_db;
    }
    if (_aiHas(t, 'vercel', 'despliegue', 'hosting')) {
      return '🚀 **Diagnóstico Vercel:**\n' + map.vercel + '\n\n💡 ' + fix.vercel_deploy;
    }
    if (_aiHas(t, 'red', 'conexion', 'internet', 'offline')) {
      var status = navigator.onLine ? '✅ Actualmente en línea' : '❌ Actualmente sin conexión';
      return (
        '🌐 **Estado de Red:** ' +
        status +
        '\n\n' +
        fix.network_offline +
        '\n\nSi el servidor no responde: ' +
        fix.cors
      );
    }

    if (_aiHas(t, 'emoji', 'icono')) respuesta += '• ' + map.emoji + '\n';
    if (_aiHas(t, 'color', 'estilo', 'apariencia')) respuesta += '• ' + map.color + '\n';
    if (_aiHas(t, 'boton', 'click')) respuesta += '• ' + map.boton + '\n';
    if (_aiHas(t, 'calculo', 'nomina', 'plata', 'cuenta')) respuesta += '• ' + map.calculo + '\n';
    if (_aiHas(t, 'error', 'falla', 'bug')) respuesta += '• ' + map.error + '\n';

    respuesta +=
      '\nBasado en `ESTRUCTURA.md`, este cambio requiere editar el módulo mencionado y recargar la app.';
    return respuesta;
  }

  // ── NLP MEJORADO (v76): clasificación inteligente de intenciones ──
  // Usa el motor ai-nlp.js para entender lenguaje natural con:
  // · Tolerancia a typos y variaciones conversacionales
  // · Sinónimos colombianos (plata=lucas=dinero, camello=trabajo)
  // · Contexto multi-turno ("¿y ayer?" después de "¿cuánto gané?")
  // · Detección de tono emocional para respuestas empáticas
  // Solo se activa con confianza ≥0.5; si no, cae al sistema clásico.
  var _nlp =
    typeof aiClassifyIntent === 'function'
      ? aiClassifyIntent(question, aiGetConversation(), c)
      : null;

  // Extraer entidades (dinero, números, tiempo)
  var _entities = typeof aiExtractEntities === 'function' ? aiExtractEntities(question) : null;

  if (_nlp && _nlp.confidence >= 0.5) {
    aiUpdateConversation(_nlp.intent, _nlp.topic);
    var _mood =
      typeof aiAnalyzeMood === 'function' ? aiAnalyzeMood(question, c) : { mood: 'neutral' };
    var _pref = typeof aiEmpatheticPrefix === 'function' ? aiEmpatheticPrefix(_mood.mood) : '';
    var _suff = typeof aiEmpatheticSuffix === 'function' ? aiEmpatheticSuffix(_mood.mood) : '';
    var _resp = _aiDispatchNLP(_nlp.intent, c, state, q, t);
    if (_resp) {
      // _resp puede ser string o {text, action}
      var _isAction = _resp && typeof _resp === 'object' && _resp.action;
      var _text = _isAction ? _resp.text : _resp;
      var _final = _pref + _text + _suff;
      if (typeof aiEnhancedRespond === 'function') {
        var _enriched = aiEnhancedRespond(
          _final,
          _nlp.intent,
          _nlp.topic,
          q,
          c,
          _entities,
          state.turnosAll
        );
        if (_enriched && _enriched.text) {
          if (_isAction) _enriched.action = _resp.action;
          return _enriched;
        }
      }
      if (_isAction) return _resp;
      return _final;
    }
  }

  // ── FOLLOW-UP: ¿el usuario responde a una sugerencia de la IA? ──
  if (typeof aiCheckFollowUp === 'function') {
    var _fuIntent = aiCheckFollowUp(q);
    if (_fuIntent) {
      var _fuResp = _aiDispatchNLP(_fuIntent, c, state, q, t);
      if (_fuResp) {
        if (typeof aiEnhancedRespond === 'function') {
          var _fuEnriched = aiEnhancedRespond(
            _fuResp,
            _fuIntent,
            _aiIntentTopic(_fuIntent),
            q,
            c,
            null,
            state.turnosAll
          );
          if (_fuEnriched && _fuEnriched.text) return _fuEnriched;
        }
        return _fuResp;
      }
    }
  }

  // ── SLASH COMMANDS ──
  if (q === '/ayuda' || q === '/help' || q === '/?') {
    return (
      '⌨️ **Comandos rápidos**\n\n' +
      '• **/stats** — Resumen exprés: plata, horas y proyección en 1 línea\n' +
      '• **/logros** — Tus insignias desbloqueadas (rachas, récords, hitos)\n' +
      '• **/meta 2500000** — ¿Cuánto te falta para llegar a X pesos?\n' +
      '• **/simular 4h** — ¿Cuánto ganarías con X horas extra? (añadí "nocturnas" para simular de noche)\n' +
      '• **/tendencia** — Comparativa de tus últimos 3 meses\n' +
      '• **/semana** — Resumen de cuánto llevás esta semana\n' +
      '• **/dia** — Lo que ganaste hoy\n' +
      '• **/liquidar** — Prestaciones, descuentos y sueldo neto estimado\n' +
      '• **/ley** — Info de la Ley 2101, jornada máxima y salario mínimo\n' +
      '• **/salud** — Análisis de fatiga y ritmo de trabajo\n\n' +
      '💡 También podés escribir en lenguaje natural: "¿cuánto gané ayer?", "proyección al cierre", "¿cómo cambio mi foto?"'
    );
  }
  if (q === '/capacidades' || q === '/skills') {
    return '**Capacidades Potenciadas:**\n\n💰 **Finanzas**\n• Sueldo Neto (menos salud/pensión)\n• Liquidación Proporcional\n\n⚖️ **Legal**\n• Ley 2101 (Reducción de jornada)\n• Auxilio de Transporte y Recargos\n\n🧠 **Salud**\n• Análisis de burnout y descanso';
  }

  // ── INTENT: LIQUIDACIÓN ──
  if (
    q === '/liquidar' ||
    _aiHas(t, 'liquidacion', 'cuanto me deben', 'mis prestaciones', 'prima', 'cesantia')
  ) {
    return (
      '💰 **Proyección Financiera (Día ' +
      c.diaActual +
      '):**\n\n' +
      '**A recibir (Neto): ' +
      fCOP(c.sueldoNeto) +
      '**\n' +
      '• Bruto: ' +
      fCOP(c.totalCOP) +
      '\n' +
      '• Desc. Ley (8%): -' +
      fCOP(c.deducciones) +
      '\n' +
      '• Aux. Transp: +' +
      fCOP(c.estTransporte) +
      '\n\n' +
      '**Prestaciones Acumuladas:**\n' +
      '• Prima: ' +
      fCOP(c.estPrima) +
      '\n' +
      '• Cesantías: ' +
      fCOP(c.estCesantias) +
      '\n' +
      '• Vacaciones: ' +
      fCOP(c.estVacaciones) +
      '\n\n' +
      '*Nota: Cálculos informativos basados en el CST.*'
    );
  }

  // ── INTENT: NORMATIVA LABORAL ──
  if (
    q === '/ley' ||
    _aiHas(t, 'normativa', 'mis derechos', 'codigo sustantivo', 'cst', 'ley 2101', 'legal')
  ) {
    return (
      '⚖️ **Normativa Laboral Colombia 2026:**\n\n' +
      '• **Jornada Máxima:** 46 horas semanales (Ley 2101 de 2021).\n' +
      '• **Recargo Nocturno:** +35% (9:00 PM a 6:00 AM).\n' +
      '• **Auxilio Transporte:** Tienes derecho si ganas menos de 2 SMMLV ($' +
      fCOP(SMIN * 2) +
      ').\n' +
      '• **Día de Descanso:** Es obligatorio tras 6 días de trabajo.\n' +
      '• **Extras:** Máximo 2 horas diarias y 12 semanales.\n\n' +
      '¿Tienes dudas sobre algún recargo específico?'
    );
  }

  // ── INTENT: AUXILIO DE TRANSPORTE ──
  if (_aiHas(t, 'auxilio', 'transporte', 'subsidio transporte')) {
    var tieneDerecho = c.totalCOP <= SMIN * 2;
    return (
      '🚌 **Auxilio de Transporte 2026:**\n\n' +
      '• Valor mensual: **' +
      fCOP(AUX_TRANSPORTE_2026) +
      '**.\n' +
      '• Requisito: Ganar hasta 2 SMMLV.\n' +
      (tieneDerecho
        ? '✅ Según tus ingresos actuales, **tienes derecho** a percibirlo.'
        : '⚠️ Tus ingresos superan los 2 SMMLV, por lo cual **no aplica** este auxilio.')
    );
  }

  // ── INTENT: AHORRO / METAS ──
  if (_aiHas(t, 'ahorro', 'meta', 'quiero ganar', 'para llegar a')) {
    var meta = _aiNum(t);
    if (!meta || meta < 1000) meta = c.salario;
    var faltaMeta = Math.max(0, meta - c.totalCOP);
    if (faltaMeta === 0)
      return (
        '¡Felicidades! Ya superaste la meta de ' + fCOP(meta) + '. Llevas ' + fCOP(c.totalCOP) + '.'
      );
    var turnosNec = c.prom > 0 ? Math.ceil(faltaMeta / c.prom) : '—';
    return (
      '🎯 **Análisis de Meta:**\n\n' +
      '• Para alcanzar ' +
      fCOP(meta) +
      ' te faltan **' +
      fCOP(faltaMeta) +
      '**.\n' +
      '• A tu ritmo actual, necesitas **' +
      turnosNec +
      ' turnos** adicionales.\n' +
      '• Eso equivale a ' +
      (faltaMeta / c.vh).toFixed(1) +
      ' horas base.'
    );
  }

  // ── /STATS ──
  if (q === '/stats') {
    return (
      '⚡ **Stats exprés**\n• ' +
      c.diasTrab +
      ' turnos · ' +
      fDur(c.totalMins) +
      '\n• ' +
      fCOP(c.totalCOP) +
      ' (' +
      c.pctSalario.toFixed(1) +
      '% meta)\n• Mejor día: ' +
      (c.mejor ? _fechaLarga(c.mejor.fecha) : '—') +
      '\n• Proyección: ' +
      fCOP(c.proy)
    );
  }

  // ── /LOGROS ──
  if (q === '/logros') {
    if (typeof aiListAllAchievements === 'function') {
      return aiListAllAchievements(c);
    }
    return '🏅 Sistema de logros no disponible.';
  }

  // ── /INFORME ──
  if (q === '/informe') {
    if (typeof aiAdvisorInforme === 'function') {
      return aiAdvisorInforme(c);
    }
    return '📊 Informe no disponible.';
  }

  // ── /HISTORIAL ──
  if (q === '/historial') {
    if (typeof aiAdvisorHistorico === 'function') {
      var histText = aiAdvisorHistorico(state.turnosAll || state.turnos || [], c.vh, c.salario);
      if (histText) return histText;
    }
    return '📈 Necesito al menos 5 turnos en meses distintos para generar un análisis histórico. ¡Seguí registrando!';
  }

  // ── /AHORRO ──
  if (q.indexOf('/ahorro') === 0) {
    var ahorroNum = _aiNum(t);
    if (!ahorroNum && q.split(' ').length > 1)
      ahorroNum = parseFloat(q.split(' ')[1].replace(/[^0-9]/g, ''));
    if (!ahorroNum || ahorroNum <= 0) {
      return '💡 Usá **/ahorro 5000000** para calcular un plan de ahorro. También podés decir "quiero ahorrar 5 millones en 12 meses".';
    }
    if (typeof aiAdvisorAhorro === 'function') {
      return aiAdvisorAhorro(c, ahorroNum, 12);
    }
    return 'Calculadora de ahorro no disponible.';
  }

  // ── /METAS ──
  if (q === '/metas') {
    var goalsText = '';
    if (typeof aiCheckGoals === 'function') {
      goalsText = aiCheckGoals(c);
    }
    if (goalsText) return '🎯 **Tus metas guardadas**\n' + goalsText;
    return '🎯 No tenés metas guardadas todavía.\n\nUsá **/meta 2000000** para calcular y guardar tu primera meta. La app va a seguir tu progreso automáticamente.';
  }

  // ── /META ──
  if (
    q.indexOf('/meta') === 0 ||
    _aiHas(t, 'meta', 'cuanto necesito para', 'cuanto debo trabajar para')
  ) {
    var metaVal = _aiNum(t);
    if (!metaVal && q.indexOf('/meta') === 0) {
      var metaParts = q.split(' ');
      if (metaParts.length > 1) metaVal = parseFloat(metaParts[1].replace(/[^0-9]/g, ''));
    }
    if (!metaVal || metaVal <= 0) {
      return '💡 Usá **/meta 2500000** para calcular cuánto te falta. También podés escribir "¿cuánto necesito para llegar a 2 millones?"';
    }
    var _copHora = c && c.copPorHoraReal ? c.copPorHoraReal : c.vh || 0;
    var _promDia = c && c.prom ? c.prom : 0;
    var falta = Math.max(0, metaVal - ((c && c.totalCOP) || 0));
    var horasFaltan = _copHora > 0 ? falta / _copHora : 0;
    var diasFaltan = _promDia > 0 ? Math.ceil(falta / _promDia) : 0;
    var resp = '🎯 **Meta: ' + fCOP(metaVal) + '**\n\n';
    resp +=
      '• Llevás: ' +
      fCOP((c && c.totalCOP) || 0) +
      ' (' +
      ((c && c.pctSalario) || 0).toFixed(1) +
      '% de tu salario base)\n';
    resp += '• Te faltan: ' + fCOP(falta) + '\n';
    resp += '• Necesitás ≈ ' + horasFaltan.toFixed(1) + ' horas más (≈ ' + fCOP(_copHora) + '/h)\n';
    if (_promDia > 0)
      resp +=
        '• A tu ritmo actual (' +
        fCOP(_promDia) +
        '/día), te tomaría unos **' +
        diasFaltan +
        ' días**\n';
    if ((c && c.diasRestantes) > 0) {
      var diarioNecesario = falta / c.diasRestantes;
      resp +=
        '• Quedan ' +
        c.diasRestantes +
        ' días del mes → necesitás ' +
        fCOP(diarioNecesario) +
        '/día para llegar\n';
    }
    resp += '\n💡 Escribí **/simular** para probar escenarios distintos.';
    // Guardar meta para seguimiento
    if (metaVal > 0 && typeof aiSetGoal === 'function') {
      try {
        aiSetGoal(metaVal);
      } catch (_) {}
      resp += '\n📌 Meta guardada. Escribí **/metas** para ver tu progreso.';
    }
    return resp;
  }

  // ── /SIMULAR ──
  if (q.indexOf('/simular') === 0 || (_aiHas(t, 'simular') && _aiNum(t) !== null)) {
    var numHoras = _aiNum(t);
    if (!numHoras && q.indexOf('/simular') === 0) {
      var simParts = q.split(' ');
      for (var si = 0; si < simParts.length; si++) {
        var n = parseFloat(simParts[si].replace(/[^0-9.]/g, ''));
        if (!isNaN(n) && n > 0) {
          numHoras = n;
          break;
        }
      }
    }
    if (!numHoras || numHoras <= 0) {
      return '💡 Usá **/simular 4h** o **/simular 4h nocturnas** para calcular un escenario.\n\nEjemplos:\n• "/simular 4h" → 4 horas diurnas extra\n• "/simular 4h nocturnas" → 4 horas extra de noche';
    }
    var esNocturno = _aiHas(t, 'nocturn', 'noche', 'noct');
    var _vh = c.vh || 0;
    var factor = esNocturno ? 1.75 : 1.25;
    var extraEstimado = numHoras * _vh * factor;
    var nuevoTotal = ((c && c.totalCOP) || 0) + extraEstimado;
    var _sal = (c && c.salario) || 1;
    var respSim =
      '🔮 **Simulación: +' + numHoras + 'h' + (esNocturno ? ' nocturnas' : ' diurnas') + '**\n\n';
    respSim += '• Valor hora base: ' + fCOP(_vh) + '\n';
    respSim += '• Factor recargo: ' + (factor * 100).toFixed(0) + '%\n';
    respSim += '• Extra estimado: ≈ ' + fCOP(extraEstimado) + '\n';
    respSim +=
      '• Nuevo total: ≈ ' +
      fCOP(nuevoTotal) +
      ' (' +
      ((nuevoTotal / _sal) * 100).toFixed(1) +
      '% del salario)\n';
    respSim +=
      '\n💡 Probá también **/meta ' +
      Math.round(nuevoTotal / 100000) * 100000 +
      '** para ver si llegás.';
    return respSim;
  }

  // ── /TENDENCIA ──
  if (q === '/tendencia' || _aiHas(t, 'tendencia', 'evolucion', 'como voy vs antes', 'historico')) {
    try {
      var tvh = c.vh || 0;
      var _ahora = c && c.ahora ? c.ahora : new Date();
      var ahoraMes = _ahora.getMonth();
      var ahoraAno = _ahora.getFullYear();
      var mesesNombres = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic'
      ];
      var mesesData = [];
      var allTurnos = state.turnosAll || state.turnos || [];
      for (var mi = 0; mi < 3; mi++) {
        var mIdx = ahoraMes - mi;
        var aIdx = ahoraAno;
        if (mIdx < 0) {
          mIdx += 12;
          aIdx--;
        }
        var iniM = new Date(aIdx, mIdx, 1);
        var finM = new Date(aIdx, mIdx + 1, 0);
        var turnosM = [];
        for (var tj = 0; tj < allTurnos.length; tj++) {
          var t = allTurnos[tj];
          if (!t || !t.inicio || !t.fin) continue;
          var d = new Date(t.inicio);
          if (d >= iniM && d <= finM) turnosM.push(t);
          if (turnosM.length > 500) break;
        }
        if (turnosM.length === 0 && mi > 0) continue;
        var calcM, diasM;
        if (mi === 0) {
          calcM = { totalMins: c.totalMins || 0, totalCOP: c.totalCOP || 0 };
          diasM = c.diasTrab || 0;
        } else {
          calcM = doCalc(turnosM, null, finM, tvh);
          var diasArr = calcPorDia(turnosM, tvh);
          diasM = diasArr && diasArr.length ? diasArr.length : 0;
        }
        mesesData.push({
          label: mesesNombres[mIdx],
          cop: Math.round(calcM.totalCOP || 0),
          mins: Math.round(calcM.totalMins || 0),
          dias: diasM
        });
      }
      if (mesesData.length < 2) {
        return '📊 Necesito al menos 2 meses de datos para mostrar una tendencia. ¡Seguí trabajando! 💪';
      }
      var respTen = '📈 **Tendencia**\n\n';
      for (var ti = 0; ti < mesesData.length; ti++) {
        var flecha =
          ti === 0
            ? '📍 '
            : mesesData[ti].cop > (mesesData[ti - 1] || mesesData[ti]).cop
              ? '📈 '
              : '📉 ';
        respTen +=
          flecha +
          mesesData[ti].label +
          ': ' +
          fCOP(mesesData[ti].cop) +
          ' · ' +
          fDur(mesesData[ti].mins) +
          ' · ' +
          mesesData[ti].dias +
          ' días\n';
      }
      if (mesesData.length >= 2) {
        var dif = mesesData[0].cop - mesesData[1].cop;
        var pctCambio = mesesData[1].cop > 0 ? (dif / mesesData[1].cop) * 100 : 0;
        respTen +=
          '\n' +
          (dif >= 0 ? '📈 ' : '📉 ') +
          'vs mes pasado: ' +
          (dif >= 0 ? '+' : '') +
          fCOP(Math.abs(dif)) +
          ' (' +
          (pctCambio >= 0 ? '+' : '') +
          pctCambio.toFixed(1) +
          '%)';
      }
      return respTen;
    } catch (err) {
      console.error('[MT] /tendencia error:', err);
      return '⚠️ No se pudo calcular la tendencia en este momento. Intentá de nuevo más tarde.';
    }
  }

  // ── /SEMANA ──
  if (q === '/semana') {
    return (
      '📅 **Esta semana:** ' +
      fCOP(c.totalCOPSemana) +
      ' en ' +
      fDur(c.totalMinsSemana) +
      ' · ' +
      c.diasSemanaCount +
      ' días.\n\n' +
      '💡 **/tendencia** para ver la evolución de los últimos meses.'
    );
  }

  // ── /DIA ──
  if (q === '/dia') {
    if (c.turnosHoy === 0) return 'Hoy no registraste turnos todavía. ¿Arrancamos? 🚀';
    return (
      '📅 **Hoy:** ' +
      fCOP(c.copHoy) +
      ' en ' +
      fDur(c.minsHoy) +
      ' · ' +
      c.turnosHoy +
      ' turno' +
      (c.turnosHoy !== 1 ? 's' : '') +
      '.'
    );
  }

  // ── INTENT: SALUD / FATIGA ──
  if (q === '/salud' || _aiHas(t, 'cansado', 'fatiga', 'descanso', 'bienestar', 'salud')) {
    var saludMsg = c.burnout
      ? '⚠️ **Alerta de Fatiga:** Tu ritmo actual (' +
        c.hrsSemanales.toFixed(1) +
        'h/sem) o tu racha de ' +
        c.rachaActual +
        ' días sugieren que necesitas un descanso urgente para evitar el agotamiento.'
      : '✅ **Estado de Bienestar:** Tu carga laboral está dentro de los límites saludables. Mantienes un promedio de ' +
        c.hrsSemanales.toFixed(1) +
        'h semanales.';

    return (
      saludMsg +
      '\n\n**Recomendación:**\n' +
      (c.nocturnasMins > c.totalMins * 0.4
        ? '• Tienes mucha carga nocturna. Prioriza el sueño en total oscuridad.'
        : '• Intenta mantener al menos un día de desconexión total a la semana.')
    );
  }

  // ── INTERACCIÓN HUMANA ──
  if (_aiHas(t, 'hola', 'buenas', 'hey', 'que tal', 'saludos', 'que hubo', 'holi', 'ola')) {
    var saludo = (typeof _saludoHora === 'function' ? _saludoHora(c.ahora) : 'Hola') + '!';
    return (
      '¡' +
      saludo +
      ' Soy tu copiloto de turno 🤖✨ Puedo contarte cómo vas este mes, proyectar tus ingresos, calcular tu liquidación o avisarte si necesitas un descanso. También sé redactar correos para tu jefe. 🚀\n\n' +
      _aiPickFollowUp('hola')
    );
  }
  if (_aiHas(t, 'gracias', 'thanks', 'thx', 'genial', 'perfecto', 'excelente')) {
    return '¡Con gusto! 🙌 Si necesitas otro dato, aquí estoy.';
  }
  if (_aiHas(t, 'adios', 'chao', 'hasta luego', 'nos vemos', 'bye')) {
    return '¡Hasta luego! Trabaja con pilas y descansa cuando puedas. ✦';
  }
  if (
    _aiHas(
      t,
      'quien eres',
      'que eres',
      'de donde',
      'funcionas con internet',
      'offline',
      'online',
      'sin internet'
    )
  ) {
    return 'Soy un motor analítico 100% local. **No envío tus datos a ningún servidor**, todo se procesa en tu dispositivo. Conozco la Ley 2101/2021, los recargos colombianos, los festivos del año y tu historial completo.';
  }
  if (_aiHas(t, 'broma', 'chiste', 'divierteme')) {
    var chistes = [
      '¿Cómo se llama un turno nocturno que nunca termina? Hipotecario. 😅',
      '¿Por qué los recargos son tan honestos? Porque siempre te dan más de lo que pides.',
      'Mi jefe dice que no soy nada raro... aunque a las 3am, hasta los relojes lo dudan. ⏰'
    ];
    return chistes[Math.floor(Math.random() * chistes.length)];
  }

  // ── DATOS BASE: SIN TURNOS ──
  if (
    c.diasTrab === 0 &&
    !_aiHas(
      t,
      'recarg',
      'ley',
      'jornada',
      'festiv',
      'noctur',
      'extra',
      'salario',
      'meta',
      'ayuda',
      'funcion',
      'capacid',
      '/'
    )
  ) {
    return (
      'Aún no tienes turnos registrados este mes. ¡Pero no pasa nada! 💪 En la pestaña **Inicio** puedes empezar tu primer turno y yo me encargo del resto.\n\nMientras tanto ¿te explico sobre **recargos legales**, **jornada nocturna**, **horas extras** o **próximos festivos**?\n\n' +
      _aiPickFollowUp('default')
    );
  }

  // ════════════════════════════════════════════════════════════
  //  PERIODOS ESPECÍFICOS
  // ════════════════════════════════════════════════════════════

  // Hoy
  if (_aiHas(t, 'hoy') && !_aiHas(t, 'mes', 'semana', 'ayer', 'llev')) {
    if (c.minsHoy === 0) return 'Hoy aún no has registrado turnos.';
    return (
      'Hoy llevas ' +
      fDur(c.minsHoy) +
      ' trabajados · ' +
      fCOP(c.copHoy) +
      '.' +
      (c.turnosHoy > 1 ? ' En ' + c.turnosHoy + ' turnos.' : '')
    );
  }
  // Ayer
  if (_aiHas(t, 'ayer', 'antier')) {
    if (c.minsAyer === 0) return 'No hay registros de ayer.';
    return 'Ayer trabajaste ' + fDur(c.minsAyer) + ' y ganaste ' + fCOP(c.copAyer) + '.';
  }
  // Esta semana
  if (
    _aiHas(t, 'esta semana', 'semana actual') ||
    (_aiHas(t, 'semana') && !_aiHas(t, 'pasad', 'anterior', 'que viene', 'sigui'))
  ) {
    if (c.diasSemanaCount === 0) return 'Esta semana aún no has trabajado.';
    return (
      'Esta semana llevas ' +
      c.diasSemanaCount +
      ' día' +
      (c.diasSemanaCount !== 1 ? 's' : '') +
      ' · ' +
      fDur(c.totalMinsSemana) +
      ' · ' +
      fCOP(c.totalCOPSemana) +
      '.'
    );
  }
  // Semana pasada
  if (_aiHas(t, 'semana pasad', 'semana anterior', 'semana previa')) {
    if (c.diasSemPasCount === 0) return 'No hay registros de la semana pasada.';
    return (
      'La semana pasada: ' +
      c.diasSemPasCount +
      ' día' +
      (c.diasSemPasCount !== 1 ? 's' : '') +
      ' · ' +
      fDur(c.totalMinsSemPas) +
      ' · ' +
      fCOP(c.totalCOPSemPas) +
      '.'
    );
  }
  // Mes pasado
  if (_aiHas(t, 'mes pasad', 'mes anterior', 'mes previo')) {
    if (c.diasMesPasado === 0) return 'No hay registros del mes pasado.';
    return (
      'El mes pasado: ' +
      c.diasMesPasado +
      ' día' +
      (c.diasMesPasado !== 1 ? 's' : '') +
      ' · ' +
      fDur(c.totalMinsMesPasado) +
      ' · ' +
      fCOP(c.totalCOPMesPasado) +
      '.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  COMPARATIVAS
  // ════════════════════════════════════════════════════════════

  // Mes actual vs mes pasado
  if (
    _aiHas(t, 'compar', 'vs', 'versus', 'contra') &&
    (_aiHas(t, 'mes pasad', 'anterior', 'mes previo') || _aiHas(t, 'mes'))
  ) {
    if (c.totalCOPMesPasado === 0) return 'No tengo datos del mes pasado para comparar.';
    var difCOP = c.totalCOP - c.totalCOPMesPasado;
    var tr = _trend(c.totalCOP, c.totalCOPMesPasado);
    var emoji = difCOP >= 0 ? '📈' : '📉';
    return (
      emoji +
      ' **Mes actual vs anterior:**\n• Ingresos: ' +
      fCOP(c.totalCOP) +
      ' vs ' +
      fCOP(c.totalCOPMesPasado) +
      ' (' +
      tr +
      ')\n• Horas: ' +
      fDur(c.totalMins) +
      ' vs ' +
      fDur(c.totalMinsMesPasado) +
      '\n• Días: ' +
      c.diasTrab +
      ' vs ' +
      c.diasMesPasado +
      '\n\n' +
      (difCOP >= 0
        ? 'Vas ' + fCOP(Math.abs(difCOP)) + ' por delante.'
        : 'Vas ' + fCOP(Math.abs(difCOP)) + ' por debajo, aún hay ' + c.diasRestantes + ' días.')
    );
  }

  // Esta semana vs semana pasada
  if (_aiHas(t, 'compar', 'vs') && _aiHas(t, 'semana')) {
    if (c.totalCOPSemPas === 0 && c.totalCOPSemana === 0)
      return 'No tengo registros recientes para comparar semanas.';
    var trS = _trend(c.totalCOPSemana, c.totalCOPSemPas);
    return (
      '📊 **Esta semana vs pasada:**\n• ' +
      fCOP(c.totalCOPSemana) +
      ' vs ' +
      fCOP(c.totalCOPSemPas) +
      ' (' +
      trS +
      ')\n• ' +
      fDur(c.totalMinsSemana) +
      ' vs ' +
      fDur(c.totalMinsSemPas)
    );
  }

  // Mejor que mes pasado?
  if (
    _aiHas(t, 'mejor que', 'peor que', 'superado', 'superar') &&
    _aiHas(t, 'mes pasad', 'anterior')
  ) {
    if (c.totalCOPMesPasado === 0) return 'No hay con qué comparar el mes pasado.';
    if (c.totalCOP > c.totalCOPMesPasado)
      return (
        '✅ Sí, ya vas ' + fCOP(c.totalCOP - c.totalCOPMesPasado) + ' por encima del mes pasado.'
      );
    var lf = c.totalCOPMesPasado - c.totalCOP;
    return (
      '⏳ Te faltan ' +
      fCOP(lf) +
      ' (' +
      (lf / c.vh).toFixed(1) +
      'h aprox.) para igualar el mes pasado. Aún tienes ' +
      c.diasRestantes +
      ' días.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  PREDICCIONES Y SIMULACIONES
  // ════════════════════════════════════════════════════════════

  // Simulación: "si trabajo X horas más"
  if (
    _aiHas(t, 'si trabaj', 'si hago', 'si meto', 'cuanto si', 'cuanto ganaria', 'cuanto gano si') ||
    (_aiNum(t) !== null && _aiHas(t, 'mas', 'adicional', 'sumo', 'agreg'))
  ) {
    var hrs = _aiNum(t);
    if (hrs === null) hrs = 4;
    var addCOP = hrs * c.vh * 1.0; // diurna ord por defecto
    var addNoct = hrs * c.vh * 1.35;
    var addExtra = hrs * c.vh * 1.25;
    var addFest = hrs * c.vh * 1.75;
    return (
      'Si trabajas **' +
      hrs +
      'h adicionales** te suman:\n• Diurna ordinaria: ' +
      fCOP(addCOP) +
      '\n• Nocturna ordinaria: ' +
      fCOP(addNoct) +
      '\n• Extra diurna: ' +
      fCOP(addExtra) +
      '\n• Festiva diurna: ' +
      fCOP(addFest) +
      '\n• Festiva nocturna: ' +
      fCOP(hrs * c.vh * 2.1) +
      '\n\nTotal mes proyectado con extras diurnas: ' +
      fCOP(c.totalCOP + addExtra)
    );
  }

  // Cuándo llego a la meta
  if (
    _aiHas(t, 'cuando', 'cuando llego', 'cuanto falt', 'cuantas horas para', 'cuanto para llegar')
  ) {
    if (c.totalCOP >= c.salario)
      return '✅ Ya superaste tu salario base este mes en ' + fCOP(c.totalCOP - c.salario) + '.';
    if (c.prom <= 0) return 'Aún no tengo suficiente data para estimar cuándo llegas a la meta.';
    var diasFaltan = Math.ceil(c.falta / c.prom);
    return (
      'A tu ritmo actual (' +
      fCOP(c.prom) +
      '/turno) necesitas **aproximadamente ' +
      diasFaltan +
      ' turnos más** para llegar a ' +
      fCOP(c.salario) +
      '.\n\nEso equivale a unas ' +
      c.horasParaMeta.toFixed(1) +
      'h al valor hora base (' +
      fCOP(c.vh) +
      '/h).'
    );
  }

  // Mejor caso / peor caso
  if (
    _aiHas(t, 'mejor caso', 'peor caso', 'escenario', 'si todo sale bien', 'optimista', 'pesimista')
  ) {
    var optimista = c.totalCOP + c.diasRestantes * ((c.mejor || {}).cop || 0);
    var pesimista = c.totalCOP + c.diasRestantes * ((c.peor || {}).cop || 0);
    return (
      '🔮 **Escenarios al cierre del mes** (' +
      c.diasRestantes +
      ' días por delante):\n• Optimista (trabajas como tu mejor día): ' +
      fCOP(optimista) +
      '\n• Conservador (ritmo actual): ' +
      fCOP(c.proy) +
      '\n• Mínimo (solo turnos como el peor): ' +
      fCOP(pesimista)
    );
  }

  // Días hábiles / días que faltan
  if (
    _aiHas(
      t,
      'dias restant',
      'dias falta',
      'dias del mes',
      'cuantos dias quedan',
      'dias por delante'
    )
  ) {
    return (
      'Quedan **' +
      c.diasRestantes +
      ' días** del mes (' +
      c.diaActual +
      '/' +
      c.diasMes +
      '). Trabajaste ' +
      c.diasTrab +
      '.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  CORE INTENTS (mejorados)
  // ════════════════════════════════════════════════════════════

  // Total ganado
  if (
    _aiHas(
      t,
      'cuanto gan',
      'cuanto cobr',
      'cuanto llev',
      'cuanto ingr',
      'total ingres',
      'ingreso mes',
      'total mes'
    ) ||
    (_aiHas(t, 'total') && _aiHas(t, 'gan', 'cop', 'plata', 'dinero')) ||
    _aiAll(t, ['cuanto', 'mes'])
  ) {
    return (
      _aiPickPhrase('total') +
      '\n\nEste mes llevas **' +
      fCOP(c.totalCOP) +
      '** brutos, distribuidos así:\n\n' +
      _bdLines(c.bd) +
      '\n\nEso representa el ' +
      c.pctSalario.toFixed(1) +
      '% de tu salario base.\n\n' +
      _aiPickFollowUp('salario')
    );
  }

  // Horas trabajadas
  if (
    _aiHas(
      t,
      'cuantas horas',
      'horas mes',
      'horas llev',
      'tiempo trabajad',
      'tiempo regist',
      'cuanto trabaj'
    ) &&
    !_aiHas(t, 'extra', 'nocturn', 'festiv')
  ) {
    return (
      'Llevas **' +
      fDur(c.totalMins) +
      '** en ' +
      c.diasTrab +
      ' turno' +
      (c.diasTrab !== 1 ? 's' : '') +
      '. Promedio de ' +
      c.promHoras.toFixed(1) +
      'h por turno. La velocidad efectiva real es ' +
      fCOP(c.copPorHoraReal) +
      '/h (vs valor hora base ' +
      fCOP(c.vh) +
      ').'
    );
  }

  // Horas extras
  if (_aiHas(t, 'extra', 'sobretiempo', 'adicional', 'sobrejornad')) {
    if (c.extraMins === 0)
      return (
        'No tienes horas extras este mes. Las extras se generan al superar las **46h semanales**. Llevas ' +
        fDur(c.totalMinsSemana) +
        ' esta semana.'
      );
    var pctExtra = ((c.extraMins / c.totalMins) * 100).toFixed(0);
    return (
      'Tienes **' +
      fDur(c.extraMins) +
      '** en extras que suman **' +
      fCOP(c.extraCOP) +
      '** (' +
      pctExtra +
      '% de tu tiempo total).\n\nLas extras se reparten así:\n• Extra diurna (+25%): ' +
      fDur(c.bd.extraDiurna.mins) +
      ' · ' +
      fCOP(c.bd.extraDiurna.cop) +
      '\n• Extra nocturna (+75%): ' +
      fDur(c.bd.extraNoct.mins) +
      ' · ' +
      fCOP(c.bd.extraNoct.cop) +
      '\n• Extra fest. diurna (+100%): ' +
      fDur(c.bd.extraFestDiur.mins) +
      ' · ' +
      fCOP(c.bd.extraFestDiur.cop) +
      '\n• Extra fest. nocturna (+150%): ' +
      fDur(c.bd.extraFestNoct.mins) +
      ' · ' +
      fCOP(c.bd.extraFestNoct.cop)
    );
  }

  // Preguntas conceptuales sobre recargos dominicales/nocturnos en el sistema clásico.
  // Deben evaluarse antes del bloque "Festivos" que responde con el historial del mes,
  // para evitar que "qué es una hora dominical" caiga en la rama de estadísticas.
  if (
    _aiHas(t, 'dominical', 'domingo', 'nocturn', 'recargo') &&
    _aiHas(
      t,
      'que es',
      'que son',
      'que significa',
      'como funciona',
      'cuanto es',
      'cuanto vale',
      'cuanto pagan',
      'cuanto se paga',
      'cuanto recargo',
      'cual es el recargo',
      'que recargo'
    )
  ) {
    if (typeof aiKnowledgeSearch === 'function') {
      var kRespClas = aiKnowledgeSearch(q);
      if (kRespClas) return kRespClas;
    }
  }

  // Festivos
  if (_aiHas(t, 'festiv', 'domingo', 'fest') && !_aiHas(t, 'proxim', 'siguient', 'que viene')) {
    if (c.festMins === 0)
      return (
        'Aún no has trabajado en domingos ni festivos este mes.\n\n' +
        (c.proxFests.length > 0
          ? 'Próximo festivo: **' +
            c.proxFests[0].toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            }) +
            '**.'
          : '')
      );
    return (
      'Has trabajado **' +
      fDur(c.festMins) +
      '** en ' +
      c.festTrab.length +
      ' día' +
      (c.festTrab.length !== 1 ? 's' : '') +
      ' festivos · **' +
      fCOP(c.festCOP) +
      '**.\n\nEsos pagan +75% (diurna) o +110% (nocturna). Si fueran extras, +100% / +150%.'
    );
  }

  // Nocturnas
  if (_aiHas(t, 'nocturn', 'noche', 'noct', 'madrugad', '21', '3am', 'de noche')) {
    if (c.nocturnasMins === 0)
      return 'No has trabajado horas nocturnas este mes. El recargo nocturno aplica de **9pm a 6am**.';
    var pctN = ((c.nocturnasMins / c.totalMins) * 100).toFixed(0);
    return (
      'Tienes **' +
      fDur(c.nocturnasMins) +
      '** nocturnas (' +
      pctN +
      '% de tu tiempo) · **' +
      fCOP(c.nocturnasCOP) +
      '**.\n\nEstas horas tienen recargo del **+35% mínimo** (ordinaria) hasta **+150%** (extra festiva nocturna).'
    );
  }

  // Mejor día
  if (_aiHas(t, 'mejor dia', 'mejor día', 'dia max', 'mas gane', 'top dia') && c.mejor) {
    return (
      '🏆 Tu mejor día fue el **' +
      _fechaLarga(c.mejor.fecha) +
      '** con **' +
      fCOP(c.mejor.cop) +
      '** en ' +
      fDur(c.mejor.mins) +
      '.' +
      (c.mejor.fest ? ' (Fue festivo, por eso pagó tan bien)' : '')
    );
  }

  // Peor día
  if (
    _aiHas(
      t,
      'peor dia',
      'peor día',
      'dia min',
      'menos gane',
      'dia mas bajo',
      'dia mas corto productiv'
    ) &&
    c.peor
  ) {
    return (
      'Tu día más bajo fue el **' +
      _fechaLarga(c.peor.fecha) +
      '** con ' +
      fCOP(c.peor.cop) +
      ' en ' +
      fDur(c.peor.mins) +
      '. Cada día cuenta. 💪'
    );
  }

  // Promedio
  if (_aiHas(t, 'promedio', 'media', 'promedi', 'prom diario', 'prom turno')) {
    return (
      'Promedio por turno: **' +
      fCOP(c.prom) +
      '** · **' +
      c.promHoras.toFixed(1) +
      'h**.\nVelocidad efectiva (COP/hora real): **' +
      fCOP(c.copPorHoraReal) +
      '/h**.'
    );
  }

  // Proyección
  if (
    _aiHas(
      t,
      'proyecc',
      'ritmo',
      'al cierr',
      'fin de mes',
      'fin mes',
      'cuanto llegar',
      'cuanto cierr',
      'estim',
      'prono'
    )
  ) {
    return (
      'A tu ritmo actual (' +
      fCOP(c.prom) +
      '/turno · ' +
      c.diasTrab +
      ' turnos en ' +
      c.diaActual +
      ' días) podrías cerrar el mes en **' +
      fCOP(c.proy) +
      '**.\n\n' +
      (c.proy >= c.salario
        ? '✅ Eso superaría tu salario base en ' + fCOP(c.proy - c.salario)
        : '⏳ Te faltarían ' + fCOP(c.salario - c.proy) + ' para llegar al salario base.')
    );
  }

  // Salario / Meta
  if (_aiHas(t, 'salario', 'meta', 'base', 'sueldo', 'objetivo')) {
    return (
      'Salario base: **' +
      fCOP(c.salario) +
      '** · valor hora **' +
      fCOP(c.vh) +
      '**.\nLlevas ' +
      fCOP(c.totalCOP) +
      ' (' +
      c.pctSalario.toFixed(1) +
      '%) · te faltan **' +
      fCOP(c.falta) +
      '** (' +
      c.horasParaMeta.toFixed(1) +
      'h al valor base).'
    );
  }

  // Días trabajados
  if (_aiHas(t, 'cuantos dias', 'cuantos turn', 'dias trab', 'turnos llev')) {
    return (
      'Has trabajado **' +
      c.diasTrab +
      ' día' +
      (c.diasTrab !== 1 ? 's' : '') +
      '** (' +
      c.turnosMes.length +
      ' turnos) este mes. Quedan **' +
      c.diasRestantes +
      ' días** por delante.\n\nRacha actual: **' +
      c.rachaActual +
      ' día' +
      (c.rachaActual !== 1 ? 's' : '') +
      ' consecutivo' +
      (c.rachaActual !== 1 ? 's' : '') +
      '**.'
    );
  }

  // Recargos legales
  if (
    _aiHas(
      t,
      'recarg',
      'porcentaje',
      'por que paga',
      'como calcul',
      'ley',
      'ley 2101',
      'jornada legal'
    ) &&
    !_aiHas(t, 'extra', 'noctur', 'jornada nocturn')
  ) {
    return (
      '⚖️ **Ley 2101/2021 (Colombia)** · factores sobre valor hora base (' +
      fCOP(c.vh) +
      '):\n\n• Diurna ord. (6am-9pm) = ×1.00\n• Nocturna ord. (9pm-6am) = ×1.35 (+35%)\n• Festiva diurna = ×1.75 (+75%)\n• Festiva nocturna = ×2.10 (+110%)\n• Extra diurna = ×1.25 (+25%)\n• Extra nocturna = ×1.75 (+75%)\n• Extra fest. diurna = ×2.00 (+100%)\n• Extra fest. nocturna = ×2.50 (+150%)\n\n**Las extras** arrancan al superar 46h semanales (jornada máxima legal).'
    );
  }

  // Jornada nocturna legal
  if (_aiHas(t, 'jornada nocturn', 'que es nocturn', 'horario nocturn', 'desde que hora nocturn')) {
    return 'La **jornada nocturna** en Colombia va de **9:00pm a 6:00am**. Cualquier minuto trabajado en esa franja recibe recargo del **+35%** sobre el valor hora base (Ley 2101/2021).';
  }

  // Qué cuenta como hora extra
  if (_aiHas(t, 'que es extra', 'cuando es extra', 'desde cuando extra', 'que cuenta como extra')) {
    return 'Las **horas extras** son las que superan la **jornada máxima legal de 46h semanales** (Ley 2101/2021, vigente desde 2023). Mi motor las suma por semana (lunes a domingo) y todo lo que pase de 46h se cuenta como extra. El recargo varía: +25% diurna, +75% nocturna, +100% festiva diurna, +150% festiva nocturna.';
  }

  // Máximo legal de horas
  if (
    _aiHas(
      t,
      'maximo legal',
      'jornada maxima',
      'horas maxim',
      'cuantas horas semana',
      'cuanto puedo trabaj'
    )
  ) {
    return (
      'Jornada máxima legal: **46h semanales** (Ley 2101/2021). Esta semana llevas ' +
      fDur(c.totalMinsSemana) +
      ' de ' +
      fDur(46 * 60) +
      '.\n\nTodo lo que pase de 46h se paga como **hora extra** con sus respectivos recargos.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  PATRONES / ESTADÍSTICAS
  // ════════════════════════════════════════════════════════════

  // Día de la semana más rentable
  if (
    _aiHas(
      t,
      'dia de la semana',
      'que dia gano mas',
      'que dia mejor',
      'dia mas product',
      'dia mas rent'
    )
  ) {
    if (c.dowCount[c.bestDow] === 0) return 'Aún no tengo datos suficientes por día de semana.';
    var best = _DOW[c.bestDow],
      worst = _DOW[c.worstDow];
    return (
      '📅 **Patrón semanal:**\n• Mejor día: **' +
      best +
      '** (' +
      fCOP(c.dowCOP[c.bestDow]) +
      ' acumulado · ' +
      c.dowCount[c.bestDow] +
      ' veces)\n• Día más bajo: ' +
      worst +
      ' (' +
      fCOP(c.dowCOP[c.worstDow]) +
      ')\n\nDistribución:\n' +
      _DOW
        .map(function (d, i) {
          return (
            '• ' +
            d +
            ': ' +
            (c.dowCount[i] > 0 ? fCOP(c.dowCOP[i]) + ' · ' + c.dowCount[i] + '×' : 'sin registros')
          );
        })
        .join('\n')
    );
  }

  // Turno más largo
  if (_aiHas(t, 'turno mas largo', 'jornada larga', 'turno mas extens', 'dia mas largo')) {
    if (!c.tLargo) return 'Aún no tienes turnos cerrados este mes.';
    var dt = new Date(c.tLargo.t.inicio);
    return (
      'Tu turno más largo del mes fue el **' +
      dt.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) +
      '** con **' +
      fDur(c.tLargo.dur) +
      '**. ' +
      (c.tLargo.dur > 720 ? '⚠️ Más de 12h: cuídate y respeta los descansos.' : '')
    );
  }

  // Turno más corto
  if (_aiHas(t, 'turno mas corto', 'turno mas breve', 'jornada corta')) {
    if (!c.tCorto) return 'Aún no tienes turnos cerrados.';
    var dtc = new Date(c.tCorto.t.inicio);
    return (
      'Tu turno más corto fue el **' +
      dtc.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) +
      '** con ' +
      fDur(c.tCorto.dur) +
      '.'
    );
  }

  // Velocidad / COP por hora
  if (_aiHas(t, 'velocid', 'cop por hora', 'copporhora', 'cop/h', 'valor real', 'plata por hora')) {
    return (
      'Velocidad efectiva: **' +
      fCOP(c.copPorHoraReal) +
      '/h** (vs valor hora base ' +
      fCOP(c.vh) +
      ').\n\nDiferencia: ' +
      (c.copPorHoraReal > c.vh
        ? '+' +
          fCOP(c.copPorHoraReal - c.vh) +
          ' por encima del base — los recargos están sumando bien.'
        : 'aún por debajo del base, normal si llevas pocas horas con recargo.')
    );
  }

  // Racha
  if (_aiHas(t, 'racha', 'dias seguidos', 'dias consecut', 'sin descansar')) {
    if (c.rachaActual <= 1)
      return (
        'No tienes racha activa. Tu última jornada fue ' +
        (c.rachaActual === 1 ? 'hoy.' : 'hace más de un día.')
      );
    return (
      '🔥 Llevas **' +
      c.rachaActual +
      ' días consecutivos** trabajando. ' +
      (c.rachaActual >= 6 ? '⚠️ Considera un día de descanso pronto.' : '¡Muy buen ritmo!')
    );
  }

  // Distribución porcentual / "donde se va mi tiempo"
  if (
    _aiHas(
      t,
      'distribuci',
      'porcentaje recarg',
      'donde va',
      'desglose',
      'porcent tiempo',
      'por categ'
    )
  ) {
    var lines = Object.keys(c.bd)
      .filter(function (k) {
        return c.bd[k].mins > 0;
      })
      .map(function (k) {
        var pctM = ((c.bd[k].mins / c.totalMins) * 100).toFixed(1);
        var pctC = ((c.bd[k].cop / c.totalCOP) * 100).toFixed(1);
        return '• ' + RC[k].label + ': ' + pctM + '% tiempo · ' + pctC + '% ingreso';
      })
      .join('\n');
    return (
      '📊 **Distribución porcentual:**\n\n' +
      lines +
      '\n\nNocturnas + festivas + extras representan el ' +
      (
        ((c.nocturnasMins +
          c.festMins +
          c.extraMins -
          c.bd.noctFest.mins -
          c.bd.extraNoct.mins -
          c.bd.extraFestNoct.mins) /
          c.totalMins) *
        100
      ).toFixed(0) +
      '% del tiempo pero pagan mucho más por su recargo.'
    );
  }

  // Diurna vs nocturna comparativa
  if (_aiAll(t, ['diurn', 'noctur']) || _aiHas(t, 'gano mas de dia', 'gano mas de noche')) {
    var copDia =
      c.diurnaOrdCOP + c.bd.diurnaFest.cop + c.bd.extraDiurna.cop + c.bd.extraFestDiur.cop;
    var copNoche = c.nocturnasCOP;
    return (
      '☀ Diurnas: ' +
      fCOP(copDia) +
      '\n☾ Nocturnas: ' +
      fCOP(copNoche) +
      '\n\n' +
      (copNoche > copDia
        ? 'Estás ganando más en la **noche** este mes. El recargo +35% pega fuerte.'
        : 'Las diurnas dominan tus ingresos. Pero un par de turnos nocturnos suben rápido por el +35%.')
    );
  }

  // ════════════════════════════════════════════════════════════
  //  PRÓXIMOS FESTIVOS
  // ════════════════════════════════════════════════════════════

  if (_aiHas(t, 'proxim', 'siguient', 'que viene', 'prox') && _aiHas(t, 'festiv', 'fest')) {
    if (c.proxFests.length === 0) return 'No quedan festivos en lo que resta del año.';
    var lf = c.proxFests
      .slice(0, 3)
      .map(function (d) {
        var dias = Math.ceil((d - c.ahora) / (1000 * 60 * 60 * 24));
        return (
          '• **' +
          d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) +
          '** (en ' +
          dias +
          ' día' +
          (dias !== 1 ? 's' : '') +
          ')'
        );
      })
      .join('\n');
    return (
      '📅 **Próximos festivos:**\n\n' +
      lf +
      '\n\nEn festivos el recargo arranca en +75% (diurna). Si además son nocturnos o extras, puede llegar a +150%.'
    );
  }

  // ════════════════════════════════════════════════════════════
  //  OPTIMIZACIÓN / RECOMENDACIONES
  // ════════════════════════════════════════════════════════════

  // Qué jornada me conviene
  if (
    _aiHas(
      t,
      'que jornada conviene',
      'jornada mas rent',
      'jornada paga mas',
      'cual paga mas',
      'mas rentable'
    )
  ) {
    return (
      '💰 **Ranking de rentabilidad** (sobre tu valor hora ' +
      fCOP(c.vh) +
      '):\n\n1️⃣ Extra fest. nocturna: ' +
      fCOP(c.vh * 2.5) +
      '/h (+150%)\n2️⃣ Festiva nocturna: ' +
      fCOP(c.vh * 2.1) +
      '/h (+110%)\n3️⃣ Extra fest. diurna: ' +
      fCOP(c.vh * 2.0) +
      '/h (+100%)\n4️⃣ Festiva diurna: ' +
      fCOP(c.vh * 1.75) +
      '/h (+75%)\n5️⃣ Extra nocturna: ' +
      fCOP(c.vh * 1.75) +
      '/h (+75%)\n6️⃣ Nocturna ordinaria: ' +
      fCOP(c.vh * 1.35) +
      '/h (+35%)\n7️⃣ Extra diurna: ' +
      fCOP(c.vh * 1.25) +
      '/h (+25%)\n8️⃣ Diurna ordinaria: ' +
      fCOP(c.vh) +
      '/h\n\n👉 Un turno **nocturno en festivo** paga **2.1×** un turno diurno normal.'
    );
  }

  // ¿Debería tomar extras?
  if (_aiHas(t, 'debo tomar extra', 'conviene extra', 'vale la pena extra', 'hago extras')) {
    if (c.totalMinsSemana < 46 * 60) {
      var faltaPara46 = 46 * 60 - c.totalMinsSemana;
      return (
        'Esta semana llevas ' +
        fDur(c.totalMinsSemana) +
        '. Te faltan **' +
        fDur(faltaPara46) +
        '** para llegar al límite de 46h. Hasta ese punto trabajas como ordinaria. Después, **toda hora vale +25% mínimo**.'
      );
    }
    return 'Esta semana ya superaste las 46h, así que cada hora extra se está pagando con recargo (+25% mín). Cuídate del cansancio igual.';
  }

  // Descanso
  if (
    _aiHas(
      t,
      'descanso',
      'descansar',
      'cuanto descanso',
      'necesito descans',
      'fatig',
      'cansad',
      'agotad'
    )
  ) {
    if (c.rachaActual >= 6)
      return (
        '⚠️ Llevas **' +
        c.rachaActual +
        ' días consecutivos** trabajando. El cuerpo lo nota. Considera **un día completo de descanso** esta semana.'
      );
    if (c.tLargo && c.tLargo.dur >= 720)
      return (
        'Tu jornada más larga del mes fue de ' +
        fDur(c.tLargo.dur) +
        '. Si vas a hacer un turno largo, asegura un buen descanso después.'
      );
    return 'Vas bien. Te recomiendo siempre un descanso mínimo de 8h entre turnos y al menos 1 día libre semanal.';
  }

  // ════════════════════════════════════════════════════════════
  //  AYUDA APP
  // ════════════════════════════════════════════════════════════

  if (
    _aiHas(
      t,
      'como registr',
      'como iniciar turno',
      'como uso',
      'como funciona',
      'como inicio',
      'iniciar turno'
    )
  ) {
    return '✦ **Cómo usar Mi Turno:**\n1. Tab **Inicio** → toca el botón **Iniciar** para arrancar un turno.\n2. El cronómetro corre en tiempo real con cálculo de recargos.\n3. Toca **Parar** al terminar — se guarda en tu historial.\n4. Tab **Análisis** ve tu desempeño · Tab **Historial** exporta a PDF/Excel.';
  }
  if (_aiHas(t, 'como export', 'exportar pdf', 'exportar excel', 'generar reporte')) {
    return 'Tab **Historial** (icono reloj) → en la parte superior tienes **Exportar PDF** y **Exportar Excel**. Generan reportes mensuales con desglose por recargo, firmados con tu cuenta.';
  }
  if (_aiHas(t, 'como cambio salario', 'cambiar salario', 'editar salario', 'configur salario')) {
    return 'Tab **Ajustes** (engranaje) → toca el campo de **Salario base** y escribe el nuevo valor. Se aplica al instante a todos los cálculos.';
  }

  // ════════════════════════════════════════════════════════════
  //  RESUMEN EJECUTIVO
  // ════════════════════════════════════════════════════════════

  if (_aiHas(t, 'resumen', 'analisis', 'como voy', 'panorama', 'estado', 'dame todo', 'reporte')) {
    var tip = '';
    if (c.pctSalario >= 100) tip = '\n\n💪 Ya superaste tu salario base este mes.';
    else if (c.pctSalario >= 80) tip = '\n\n📈 Vas muy bien, cerca de la meta mensual.';
    else if (c.pctSalario >= 50) tip = '\n\n⚖️ Vas a buen ritmo, mitad de mes ideal.';
    else if (c.diaActual > 15) tip = '\n\n⚡ Vas un poco atrás, aprovecha festivos y nocturnas.';
    else tip = '\n\n📅 Aún estás en la primera mitad del mes.';
    var rachaLine =
      c.rachaActual > 0
        ? '\n• Racha: ' +
          c.rachaActual +
          ' día' +
          (c.rachaActual !== 1 ? 's' : '') +
          ' seguido' +
          (c.rachaActual !== 1 ? 's' : '')
        : '';
    var compLine = '';
    if (c.totalCOPMesPasado > 0) {
      compLine = '\n• vs mes pasado: ' + _trend(c.totalCOP, c.totalCOPMesPasado);
    }
    return (
      _aiPickPhrase('total') +
      '\n\n📋 **Resumen ejecutivo:**\n\n• ' +
      c.diasTrab +
      ' turnos · ' +
      fDur(c.totalMins) +
      '\n• Ingreso bruto: ' +
      fCOP(c.totalCOP) +
      '\n• Promedio por turno: ' +
      fCOP(c.prom) +
      '\n• Proyección al cierre: ' +
      fCOP(c.proy) +
      '\n• Avance vs salario base: ' +
      c.pctSalario.toFixed(1) +
      '%' +
      rachaLine +
      compLine +
      tip +
      '\n\n' +
      _aiPickFollowUp('resumen')
    );
  }

  // ════════════════════════════════════════════════════════════
  //  COMPOSICIÓN DE CORREO (acción real, no solo texto)
  // ════════════════════════════════════════════════════════════

  if (_aiIsEmailIntent(t)) {
    var emailAction = _aiBuildEmail(question, t, c, state);
    return {
      text: emailAction.preview,
      action: { type: 'email_compose', data: emailAction.data }
    };
  }

  // ════════════════════════════════════════════════════════════
  //  FALLBACK
  // ════════════════════════════════════════════════════════════

  return (
    '🤔 No estoy seguro de qué buscas. Algunas cosas que puedo responder:\n\n• "¿Cuánto gané hoy?" · "¿Y ayer?"\n• "Compara con mes pasado"\n• "¿Cuándo llego a la meta?"\n• "¿Cuánto si trabajo 4h más?"\n• "Mejor día de la semana"\n• "Próximos festivos"\n• "Mi racha"\n• **"Envía mi reporte por correo a juan@empresa.com"**\n• **"Redacta un correo formal para mi jefe"**\n\n💡 O simplemente pregúntame algo con tus palabras, ¡soy más conversacional ahora!\n\n' +
    _aiPickFollowUp('default')
  );
}

// ════════════════════════════════════════════════════════════════
//  COMPOSICIÓN DE EMAIL · detección y plantillas
// ════════════════════════════════════════════════════════════════

function _aiIsEmailIntent(t) {
  // Verbo de envío
  var hasVerbo = _aiHas(
    t,
    'enviar',
    'envia',
    'envía',
    'manda',
    'mandar',
    'mandame',
    'envíame',
    'enviame',
    'redacta',
    'redactar',
    'compon',
    'componer',
    'escribe un',
    'escribir un'
  );
  // Sustantivo
  var hasSust = _aiHas(
    t,
    'correo',
    'email',
    'mail',
    'mensaje',
    'reporte por correo',
    'reporte al mail'
  );
  return hasVerbo && hasSust;
}

function _aiBuildEmail(raw, t, c, state) {
  // ── Destinatario ──
  var emailMatch = raw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  var to = emailMatch ? emailMatch[0].toLowerCase() : '';
  if (!to && state.session && state.session.email) to = state.session.email;
  if (!to && _aiHas(t, 'mi correo', 'mi email', 'a mi', 'para mi', 'mi propio')) {
    to = (state.session && state.session.email) || '';
  }

  // ── Formato ──
  var format = _aiHas(t, 'excel', 'xlsx', 'xls', 'hoja', 'spreadsheet', 'planilla')
    ? 'xlsx'
    : 'pdf';

  // ── Adjuntar reporte ──
  var attach = !_aiHas(
    t,
    'sin adjunto',
    'sin archivo',
    'sin pdf',
    'sin reporte',
    'solo texto',
    'sin anex'
  );

  // ── Tipo de email (define plantilla) ──
  var tipo = 'resumen';
  if (
    _aiHas(
      t,
      'jefe',
      'supervisor',
      'rrhh',
      'empleador',
      'patron',
      'recursos humanos',
      'gerente',
      'jefa',
      'contador'
    )
  )
    tipo = 'formal';
  if (_aiHas(t, 'extra', 'sobretiempo')) tipo = 'extras';
  if (_aiHas(t, 'festiv', 'domingo')) tipo = 'festivos';
  if (_aiHas(t, 'nocturn', 'noche')) tipo = 'nocturnas';
  if (_aiHas(t, 'reporte', 'informe', 'completo', 'detallad')) tipo = 'reporte';
  if (_aiHas(t, 'justific', 'explic')) tipo = 'justificacion';

  var mesNombre = c.ahora.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  var mesCap = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);

  var subject = '',
    body = '';

  if (tipo === 'formal') {
    subject = 'Reporte de turnos · ' + mesCap;
    body =
      'Buenos días,\n\n' +
      'Adjunto mi reporte oficial de turnos correspondiente a ' +
      mesNombre +
      '.\n\n' +
      'Resumen ejecutivo:\n' +
      '• Días trabajados: ' +
      c.diasTrab +
      ' (' +
      c.turnosMes.length +
      ' turnos)\n' +
      '• Total de horas: ' +
      fDur(c.totalMins) +
      '\n' +
      '• Horas extras: ' +
      fDur(c.extraMins) +
      (c.extraMins > 0 ? ' · ' + fCOP(c.extraCOP) : '') +
      '\n' +
      '• Horas festivas: ' +
      fDur(c.festMins) +
      (c.festMins > 0 ? ' · ' + fCOP(c.festCOP) : '') +
      '\n' +
      '• Horas nocturnas: ' +
      fDur(c.nocturnasMins) +
      (c.nocturnasMins > 0 ? ' · ' + fCOP(c.nocturnasCOP) : '') +
      '\n\n' +
      'El detalle completo día por día, con los recargos calculados según la Ley 2101 de 2021 y el CST (Arts. 168-171), ' +
      'se encuentra en el archivo adjunto.\n\n' +
      'Quedo atento a cualquier consulta o ajuste.\n\n' +
      'Cordialmente.';
  } else if (tipo === 'extras') {
    var lineasExt =
      Object.keys(c.bd)
        .filter(function (k) {
          return c.bd[k].mins > 0 && k.indexOf('extra') === 0;
        })
        .map(function (k) {
          return '• ' + RC[k].label + ': ' + fDur(c.bd[k].mins) + ' · ' + fCOP(c.bd[k].cop);
        })
        .join('\n') || '• Sin horas extras en este período.';
    subject = 'Detalle de horas extras · ' + mesCap;
    body =
      'Buenas tardes,\n\n' +
      'Comparto el detalle de mis horas extras del mes de ' +
      mesNombre +
      ':\n\n' +
      lineasExt +
      '\n\n' +
      'Total extras: ' +
      fDur(c.extraMins) +
      ' · ' +
      fCOP(c.extraCOP) +
      '\n\n' +
      'Recuerdo que las horas extras se generan al superar las 46 horas semanales (jornada máxima legal, Ley 2101/2021). ' +
      'Los recargos aplicados son: +25% diurna, +75% nocturna, +100% festiva diurna y +150% festiva nocturna sobre el valor hora base.\n\n' +
      'Adjunto el reporte completo con la trazabilidad por turno.\n\n' +
      'Quedo atento.\n\nSaludos.';
  } else if (tipo === 'festivos') {
    var lineasFest =
      c.festTrab
        .map(function (d) {
          return '• ' + _fechaLarga(d.fecha) + ' · ' + fDur(d.mins) + ' · ' + fCOP(d.cop);
        })
        .join('\n') || '• Sin días festivos trabajados en este período.';
    subject = 'Turnos en festivos · ' + mesCap;
    body =
      'Hola,\n\n' +
      'Detalle de turnos trabajados en días festivos / dominicales durante ' +
      mesNombre +
      ':\n\n' +
      lineasFest +
      '\n\n' +
      'Total festivos: ' +
      c.festTrab.length +
      ' día' +
      (c.festTrab.length !== 1 ? 's' : '') +
      ' · ' +
      fDur(c.festMins) +
      ' · ' +
      fCOP(c.festCOP) +
      '\n\n' +
      'Recargos aplicados: +75% (diurna festiva), +110% (nocturna festiva), ' +
      'según la Ley 2101 de 2021.\n\n' +
      'Adjunto el reporte completo.\n\n' +
      'Saludos.';
  } else if (tipo === 'nocturnas') {
    subject = 'Detalle de jornada nocturna · ' + mesCap;
    body =
      'Hola,\n\n' +
      'Comparto el detalle de mis horas nocturnas (9pm-6am) trabajadas en ' +
      mesNombre +
      ':\n\n' +
      '• Nocturna ordinaria: ' +
      fDur(c.bd.noctOrd.mins) +
      ' · ' +
      fCOP(c.bd.noctOrd.cop) +
      '\n' +
      '• Nocturna festiva: ' +
      fDur(c.bd.noctFest.mins) +
      ' · ' +
      fCOP(c.bd.noctFest.cop) +
      '\n' +
      '• Extra nocturna: ' +
      fDur(c.bd.extraNoct.mins) +
      ' · ' +
      fCOP(c.bd.extraNoct.cop) +
      '\n' +
      '• Extra fest. nocturna: ' +
      fDur(c.bd.extraFestNoct.mins) +
      ' · ' +
      fCOP(c.bd.extraFestNoct.cop) +
      '\n\n' +
      'Total: ' +
      fDur(c.nocturnasMins) +
      ' · ' +
      fCOP(c.nocturnasCOP) +
      '\n\n' +
      'El recargo nocturno mínimo es del +35% sobre el valor hora base (Ley 2101/2021).\n\n' +
      'Adjunto el reporte detallado.\n\n' +
      'Saludos.';
  } else if (tipo === 'justificacion') {
    subject = 'Justificación de turnos · ' + mesCap;
    body =
      'Buen día,\n\n' +
      'Adjunto la justificación de mis turnos trabajados durante ' +
      mesNombre +
      ':\n\n' +
      '• ' +
      c.diasTrab +
      ' días con turno · ' +
      fDur(c.totalMins) +
      '\n' +
      '• Distribución por jornada:\n' +
      _bdLines(c.bd).replace(/\n/g, '\n  ') +
      '\n\n' +
      'Cada turno está registrado con hora de inicio, hora de fin y duración exacta. Los recargos se aplican según la legislación laboral colombiana (Ley 2101/2021, CST Arts. 168-171).\n\n' +
      'El documento adjunto contiene la trazabilidad completa.\n\n' +
      'Atento a cualquier comentario.\n\nCordialmente.';
  } else if (tipo === 'reporte') {
    subject = 'Mi reporte de turnos · ' + mesCap;
    body =
      'Hola,\n\n' +
      'Adjunto mi reporte de turnos de ' +
      mesNombre +
      '.\n\n' +
      'Resumen rápido:\n' +
      '• ' +
      c.diasTrab +
      ' turnos · ' +
      fDur(c.totalMins) +
      '\n' +
      '• Ingreso bruto: ' +
      fCOP(c.totalCOP) +
      ' (' +
      c.pctSalario.toFixed(1) +
      '% del salario base)\n' +
      '• Promedio: ' +
      fCOP(c.prom) +
      ' por turno\n' +
      (c.proy > 0 ? '• Proyección al cierre: ' + fCOP(c.proy) + '\n' : '') +
      '\nEl detalle completo está en el archivo adjunto.\n\nSaludos.';
  } else {
    // resumen (default)
    var mejorLine = c.mejor
      ? '🏆 Mejor día: ' + _fechaLarga(c.mejor.fecha) + ' · ' + fCOP(c.mejor.cop) + '\n'
      : '';
    subject = 'Resumen del mes · ' + mesCap;
    body =
      'Hola,\n\n' +
      'Este es mi resumen de turnos del mes:\n\n' +
      '📊 ' +
      c.diasTrab +
      ' turnos · ' +
      fDur(c.totalMins) +
      '\n' +
      '💰 Ingresos: ' +
      fCOP(c.totalCOP) +
      ' (' +
      c.pctSalario.toFixed(1) +
      '% del salario base)\n' +
      (c.extraMins > 0 ? '⚡ Extras: ' + fDur(c.extraMins) + ' · ' + fCOP(c.extraCOP) + '\n' : '') +
      (c.nocturnasMins > 0 ? '☾ Nocturnas: ' + fDur(c.nocturnasMins) + '\n' : '') +
      (c.festMins > 0 ? '✦ Festivas: ' + fDur(c.festMins) + '\n' : '') +
      (c.proy > 0 ? '📈 Proyección: ' + fCOP(c.proy) + '\n' : '') +
      '\n' +
      mejorLine +
      '\nReporte completo en el adjunto.\n\nSaludos.';
  }

  // Sin destinatario detectado → IA pide que el usuario complete
  var preview;
  if (!to) {
    preview =
      'Preparé un correo. Solo me falta a quién enviarlo — completa el destinatario en la tarjeta:';
  } else {
    preview =
      'He redactado este correo para **' +
      to +
      '**. Revísalo, edítalo si quieres y pulsa **Enviar**:';
  }

  return {
    preview: preview,
    data: {
      to: to,
      subject: subject,
      body: body,
      format: format,
      attach: attach
    }
  };
}
