// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-engage.js
//  Motor de engagement — asegura que cada respuesta tenga:
//    · 1 pregunta de seguimiento (mantiene la conversación viva)
//    · 2 opciones rápidas (botones de acción)
//    · Variedad: sí/no, otra pregunta, continuar, explorar más
//  No abruma — dosifica según nivel de conversación y contexto.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ─── BANCO DE PREGUNTAS DE ENGAGEMENT ─────────────────────────
// Organizado por intent para máxima relevancia contextual.

var _aiEngageQuestions = {
  // ── Finanzas ──
  total_ganado: [
    {
      q: '¿Querés ver el detalle por tipo de recargo?',
      a1: 'Ver detalle',
      a2: 'No, gracias',
      i1: 'distribución',
      i2: null
    },
    {
      q: '¿Te gustaría comparar con lo que ganaste el mes pasado?',
      a1: 'VS mes pasado',
      a2: 'Mejor día',
      i1: 'comparativa_mes',
      i2: 'mejor_dia'
    },
    {
      q: '¿Sabías que podés simular cuánto ganarías con horas extra?',
      a1: 'Simular',
      a2: 'Proyección',
      i1: 'simulacion',
      i2: 'proyeccion'
    }
  ],
  hoy: [
    {
      q: '¿Querés ver también lo de ayer?',
      a1: 'Sí, ¿y ayer?',
      a2: 'Solo hoy',
      i1: 'ayer',
      i2: null
    },
    {
      q: '¿Te sirve el dato o necesitás algo más?',
      a1: 'Ver proyección',
      a2: 'Está bien, gracias',
      i1: 'proyeccion',
      i2: null
    }
  ],
  ayer: [
    {
      q: '¿Comparo con lo de hoy?',
      a1: 'Sí, comparar',
      a2: 'No hace falta',
      i1: 'comparativa_semana',
      i2: null
    }
  ],
  proyeccion: [
    {
      q: '¿Querés simular cuánto falta para tu meta?',
      a1: 'Simular',
      a2: 'Ver informe',
      i1: 'simulacion',
      i2: 'informe_completo'
    },
    {
      q: '¿Sabías que los turnos nocturnos pagan 35% más?',
      a1: 'Contame más',
      a2: 'No me interesa',
      i1: 'ley',
      i2: null
    }
  ],
  stats: [
    {
      q: '¿Profundizamos en algún número?',
      a1: 'Distribución',
      a2: 'Tendencia',
      i1: 'distribucion',
      i2: 'comparativa_semana'
    }
  ],
  distribucion: [
    {
      q: '¿Querés saber cómo optimizar tus horarios?',
      a1: 'Optimizar',
      a2: 'Ver proyección',
      i1: 'optimizador',
      i2: 'proyeccion'
    }
  ],
  liquidacion: [
    {
      q: '¿Querés un informe detallado de prestaciones?',
      a1: 'Sí, informe',
      a2: 'Con eso basta',
      i1: 'informe_completo',
      i2: null
    }
  ],
  ahorro: [
    {
      q: '¿Querés planear cuántos turnos te faltan?',
      a1: 'Planear turnos',
      a2: 'Ver proyección',
      i1: 'planificar',
      i2: 'proyeccion'
    }
  ],

  // ── Comparativas ──
  comparativa_mes: [
    {
      q: '¿Comparo también con la semana pasada?',
      a1: 'VS semana pasada',
      a2: 'Basta por ahora',
      i1: 'comparativa_semana',
      i2: null
    }
  ],
  comparativa_semana: [
    {
      q: '¿Y si miramos el mes completo?',
      a1: 'VS mes pasado',
      a2: 'No, siguiente',
      i1: 'comparativa_mes',
      i2: null
    }
  ],

  // ── Patrones ──
  mejor_dia: [
    {
      q: '¿Querés saber cuál fue tu peor día?',
      a1: 'Ver peor día',
      a2: 'Ver promedio',
      i1: 'peor_dia',
      i2: 'promedio'
    }
  ],
  peor_dia: [
    {
      q: '¿Te muestro cómo mejorar esos días bajos?',
      a1: 'Dame tips',
      a2: 'No, gracias',
      i1: 'consejo',
      i2: null
    }
  ],
  racha: [
    {
      q: '¿Querés un análisis de tu ritmo de trabajo?',
      a1: 'Ver ritmo',
      a2: 'Ver bienestar',
      i1: 'velocidad',
      i2: 'bienestar'
    }
  ],

  // ── Tiempo ──
  horas_trabajadas: [
    {
      q: '¿Desgloso por tipo de hora?',
      a1: 'Desglosar',
      a2: 'Ver extras',
      i1: 'distribucion',
      i2: 'comparativa_mes'
    }
  ],
  promedio: [
    {
      q: '¿Comparo con el valor de tu hora base?',
      a1: 'Comparar',
      a2: 'No hace falta',
      i1: 'velocidad',
      i2: null
    }
  ],
  velocidad: [
    {
      q: '¿Querés saber cómo subir tu velocidad?',
      a1: 'Dame tips',
      a2: 'Simular',
      i1: 'horas_trabajadas',
      i2: 'simulacion'
    }
  ],

  // ── Simulación ──
  simulacion: [
    {
      q: '¿Probamos otro escenario?',
      a1: 'Solo nocturnas',
      a2: 'Un turno extra',
      i1: 'simulacion',
      i2: 'planificar'
    },
    {
      q: '¿Querés saber cuánto necesitás para tu meta?',
      a1: 'Calcular meta',
      a2: 'Ver proyección',
      i1: 'ahorro',
      i2: 'proyeccion'
    }
  ],

  // ── Bienestar ──
  bienestar: [
    {
      q: '¿Querés que te recuerde cuándo descansar?',
      a1: 'Recordarme',
      a2: 'No por ahora',
      i1: 'planificar',
      i2: null
    }
  ],

  // ── Festivos ──
  festivos: [
    {
      q: '¿Querés ver cuánto ganarías en un festivo?',
      a1: 'Calcular',
      a2: 'Ya lo sé',
      i1: 'simulacion',
      i2: null
    }
  ],

  // ── Conocimiento / Ley ──
  ley: [
    {
      q: '¿Querés saber cómo aplicar esto a tu caso?',
      a1: 'Aplicar a mi caso',
      a2: 'Siguiente',
      i1: 'total_ganado',
      i2: null
    }
  ],
  laboral: [
    {
      q: '¿Te gustaría conocer más sobre derechos laborales?',
      a1: 'Más info',
      a2: 'Basta',
      i1: 'ley',
      i2: null
    }
  ],

  // ── Ayuda ──
  ayuda_app: [
    {
      q: '¿Hay algo específico con lo que necesités ayuda?',
      a1: 'Exportar datos',
      a2: 'Cambiar PIN',
      i1: 'ayuda_exportar',
      i2: 'ayuda_pin'
    }
  ],

  // ── Saludo / Identidad / Capacidades ──
  saludo: [
    {
      q: '¿Qué querés mirar hoy?',
      a1: '¿Cuánto gané este mes?',
      a2: 'Proyección',
      i1: 'total_ganado',
      i2: 'proyeccion'
    },
    {
      q: '¿Por dónde arrancamos?',
      a1: 'Ver mis números',
      a2: 'Simular algo',
      i1: 'stats',
      i2: 'simulacion'
    }
  ],
  identidad: [
    {
      q: '¿Te muestro todo lo que puedo hacer?',
      a1: 'Sí, mostrame',
      a2: 'Mejor preguntar',
      i1: 'capacidades',
      i2: 'ayuda_app'
    }
  ],
  capacidades: [
    {
      q: '¿Querés probar alguna?',
      a1: 'Simular ingresos',
      a2: 'Ver guías',
      i1: 'simulacion',
      i2: 'ayuda_app'
    }
  ],
  despedida: [
    {
      q: '¿Seguro que te vas? Todavía puedo ayudarte con algo más.',
      a1: 'Una consulta más',
      a2: 'Chao',
      i1: 'default',
      i2: null
    }
  ],
  agradecimiento: [
    {
      q: '¿Necesitás algo más?',
      a1: 'Sí, una cosa más',
      a2: 'Así está bien',
      i1: 'default',
      i2: null
    }
  ],

  // ── Fallback ──
  default: [
    {
      q: '¿Hay algo más en lo que te pueda ayudar?',
      a1: 'Ver mis números',
      a2: 'Hacer una simulación',
      i1: 'stats',
      i2: 'simulacion'
    },
    {
      q: '¿Querés explorar otra cosa?',
      a1: 'Ver proyección',
      a2: 'Ver distribución',
      i1: 'proyeccion',
      i2: 'distribucion'
    },
    {
      q: '¿Te gustaría conocer un dato curioso sobre horas extra?',
      a1: 'Contame',
      a2: 'Otro día',
      i1: 'ley',
      i2: null
    }
  ]
};

// ── Bancos por ESTRATEGIA DE ENGAGEMENT (no por intent) ──────
// Usados cuando aiThink() determina que la pregunta financiera no es la indicada.
_aiEngageQuestions._personal = [
  {
    q: '¿Cómo te está yendo esta semana?',
    a1: 'Bien, gracias',
    a2: 'Con mucho trabajo',
    i1: 'bienestar',
    i2: 'racha'
  },
  {
    q: '¿Tenés alguna meta de ingresos este mes?',
    a1: 'Sí, tengo una',
    a2: 'No todavía',
    i1: 'ahorro',
    i2: 'proyeccion'
  },
  {
    q: '¿Necesitás un respiro? La ley te ampara con un día libre cada 6 trabajados.',
    a1: 'Ver mi racha',
    a2: 'Estoy bien',
    i1: 'racha',
    i2: null
  },
  {
    q: '¿Algo en lo que te pueda dar una mano hoy?',
    a1: 'Ver mis números',
    a2: 'Solo quería hablar',
    i1: 'stats',
    i2: 'bienestar'
  },
  {
    q: '¿Cómo vas de ánimo esta semana?',
    a1: 'Con toda',
    a2: 'Más o menos',
    i1: 'bienestar',
    i2: 'racha'
  }
];

_aiEngageQuestions._discovery = [
  {
    q: '¿Exploraste el apartado de Análisis? Tiene gráficos y proyección.',
    a1: 'Ver Análisis',
    a2: 'Seguir aquí',
    i1: 'navegar_analisis',
    i2: null
  },
  {
    q: '¿Sabías que podés compartir tu resumen mensual por WhatsApp?',
    a1: 'Cómo se hace',
    a2: 'Lo sé',
    i1: 'ayuda_app',
    i2: null
  },
  {
    q: '¿Ya configuraste tu salario base? Sin eso, la proyección no es exacta.',
    a1: 'Configurar ya',
    a2: 'Ya está',
    i1: 'configurar_salario',
    i2: null
  },
  {
    q: '¿Usaste el simulador de escenarios? Podés ver qué pasa si hacés más nocturnas.',
    a1: 'Simular ahora',
    a2: 'Qué más tenés',
    i1: 'simulacion',
    i2: 'capacidades'
  },
  {
    q: '¿Viste el historial de turnos? Guardás todos los detalles por mes.',
    a1: 'Ver historial',
    a2: 'Ya lo vi',
    i1: 'navegar_historial',
    i2: null
  }
];

_aiEngageQuestions._reflexion = [
  {
    q: '¿Este mes fue mejor que el anterior?',
    a1: 'Comparar meses',
    a2: 'Ver el resumen',
    i1: 'comparativa_mes',
    i2: 'stats'
  },
  {
    q: '¿Hay algo que cambiarías en tus horarios?',
    a1: 'Optimizar turnos',
    a2: 'Estoy bien así',
    i1: 'optimizador',
    i2: null
  },
  {
    q: '¿Qué harías con un ingreso extra este mes?',
    a1: 'Simular ingreso extra',
    a2: 'Ver proyección',
    i1: 'simulacion',
    i2: 'proyeccion'
  },
  {
    q: '¿Estás cerca de tu meta mensual?',
    a1: 'Ver cuánto falta',
    a2: 'Ya la cumplí',
    i1: 'proyeccion',
    i2: 'ahorro'
  }
];

// ─── BANCO DE CURIOSIDADES (DATOS BREVES) ────────────────────
// Uno por respuesta, nunca repetir en la misma sesión.
var _aiCuriosidades = [
  '🌙 Dato curioso: si trabajás de noche (9pm-6am), cada hora vale 35% más. Un turno nocturno de 8h te paga como 10.8h diurnas.',
  '⛪ ¿Sabías que los domingos y festivos pagan 75% extra? Un turno de 8h en domingo equivale a 14h un día normal.',
  '📅 En Colombia hay 18 festivos al año — si trabajás todos, ganás como si hubieras trabajado 31.5 días extra.',
  '💰 El auxilio de transporte para 2026 es de ' +
    (typeof AUX_TRANSPORTE_2026 !== 'undefined' ? fCOP(AUX_TRANSPORTE_2026) : '$200.000') +
    ' mensuales si ganás hasta 2 SMMLV.',
  '⚖️ Desde la Ley 2101 de 2021, la jornada máxima bajó de 48 a 42 horas semanales (en fase progresiva hasta 2026).',
  '🧮 Las cesantías equivalen a un mes de salario por año trabajado. ¡Es como un ahorro obligatorio!',
  '🏖️ Por cada año trabajado, tenés derecho a 15 días hábiles de vacaciones pagas.',
  '📊 Si hacés horas extra de noche en un festivo, ¡cobrás el 150% extra! Es la tarifa más alta.',
  '🕐 El mejor momento para trabajar es de noche en festivo — cada hora te la pagan al 210%.',
  '💡 La prima de servicios son 15 días de salario por semestre. Se paga en junio y diciembre.',
  '🔢 Un turno normal de 8h diurnas te da 8h cotizadas. Pero 8h nocturnas + extra te dan hasta 14h cotizadas.',
  '📱 ¿Sabías que podés usar la app sin internet? Todos los cálculos son locales y se sincronizan después.',
  '🎯 Si mantenés un promedio de 8h diarias, en 22 días hábiles completás un mes de trabajo.',
  '💼 Los intereses de cesantías son el 12% anual sobre el saldo acumulado. Se pagan en enero de cada año.',
  '🩺 La EPS y ARL son obligatorias desde el primer día de trabajo. El empleador paga la mayor parte.',
  '📈 El salario mínimo en Colombia sube cada 1° de enero — revisá tus cálculos a inicio de año.',
  '⏰ Las horas extra diurnas (6am-9pm) pagan 25% sobre el valor hora. Las nocturnas pagan 75%.',
  '🛡️ Si te despiden sin justa causa, tenés derecho a indemnización: entre 20 y 45 días de salario por año.',
  '💎 La liquidación incluye: cesantías + intereses + prima + vacaciones + dotación pendiente.',
  '🔄 Podés negociar con tu empleador compensar horas extra con tiempo libre en vez de plata.'
];

var _aiCuriosidadUsadas = {};

// ─── BANCO DE MINI-DESAFÍOS (TRIVIA LABORAL) ──────────────────
// Preguntas tipo quiz que entretienen y educan.
var _aiTrivia = [
  {
    q: '¿Cuánto paga una hora extra diurna?',
    opts: ['+25%', '+35%', '+50%', '+75%'],
    correcta: 0,
    explicacion: 'La hora extra diurna tiene un recargo del 25% sobre el valor hora ordinario.'
  },
  {
    q: '¿Cuántos días de vacaciones te corresponden por año?',
    opts: ['10 días', '15 días', '20 días', '30 días'],
    correcta: 1,
    explicacion: 'Por ley, tenés derecho a 15 días hábiles de vacaciones por cada año trabajado.'
  },
  {
    q: '¿Cuánto paga un domingo trabajado?',
    opts: ['+25%', '+50%', '+75%', '+100%'],
    correcta: 2,
    explicacion: 'Los domingos y festivos pagan con recargo del 75% sobre el valor hora ordinario.'
  },
  {
    q: '¿Cuál es el máximo de horas extra por semana?',
    opts: ['8h', '10h', '12h', '16h'],
    correcta: 2,
    explicacion: 'El límite legal es de 12 horas extra por semana y máximo 2 por día.'
  },
  {
    q: '¿Cada cuánto se paga la prima de servicios?',
    opts: ['Mensual', 'Trimestral', 'Semestral', 'Anual'],
    correcta: 2,
    explicacion: 'La prima se paga en dos cuotas: junio (50%) y diciembre (50%).'
  },
  {
    q: '¿Cuánto paga una hora extra nocturna?',
    opts: ['+35%', '+50%', '+75%', '+100%'],
    correcta: 2,
    explicacion: 'La hora extra nocturna (después de las 9pm) tiene recargo del 75%.'
  },
  {
    q: '¿Qué son los intereses de cesantías?',
    opts: [
      'Bonificación anual',
      '12% anual sobre cesantías',
      '5% mensual',
      'Un mes extra de salario'
    ],
    correcta: 1,
    explicacion: 'Son el 12% anual sobre el saldo de cesantías acumulado. Se pagan en enero.'
  },
  {
    q: '¿Cuántos días de licencia de maternidad otorga la ley?',
    opts: ['90 días', '112 días', '126 días', '180 días'],
    correcta: 1,
    explicacion: 'La ley colombiana otorga 112 días de licencia de maternidad remunerada.'
  },
  {
    q: '¿Qué es el auxilio de transporte?',
    opts: [
      'Dinero para taxi',
      'Subsidio legal si ganás hasta 2 SMMLV',
      'Préstamo del empleador',
      'Bonificación semestral'
    ],
    correcta: 1,
    explicacion:
      'Es un subsidio obligatorio para trabajadores que ganen hasta 2 salarios mínimos. No aplica para domicilio.'
  },
  {
    q: '¿Cuándo se pagan las cesantías?',
    opts: [
      'Cada mes',
      'En junio y diciembre',
      'Al 15 de febrero al fondo',
      'Al finalizar el contrato'
    ],
    correcta: 2,
    explicacion:
      'El empleador debe consignar las cesantías al fondo antes del 15 de febrero de cada año.'
  },
  {
    q: '¿Qué recargo aplica a la hora nocturna ordinaria (sin ser extra)?',
    opts: ['0%', '+25%', '+35%', '+75%'],
    correcta: 2,
    explicacion:
      'Las horas ordinarias entre 9pm y 6am tienen recargo del 35% sobre el valor hora diurna.'
  },
  {
    q: '¿La jornada máxima semanal en Colombia (2026) es de?',
    opts: ['40 horas', '42 horas', '44 horas', '48 horas'],
    correcta: 1,
    explicacion:
      'Desde 2023 (Ley 2101), la jornada máxima bajó a 42 horas semanales, camino a 40h en 2026.'
  },
  {
    q: '¿La dotación de trabajo se entrega cuántas veces al año?',
    opts: ['1 vez', '2 veces', '3 veces', '4 veces'],
    correcta: 2,
    explicacion: 'Se entrega 3 veces al año: 30 de abril, 31 de agosto y 20 de diciembre.'
  },
  {
    q: '¿Cuánto paga una hora extra diurna en domingo?',
    opts: ['+75%', '+100%', '+125%', '+150%'],
    correcta: 1,
    explicacion:
      'Hora extra diurna en domingo o festivo = 75% (domingo) + 25% (extra diurna) = 100% de recargo.'
  }
];

var _aiTriviaUsadas = {};

// ─── API PRINCIPAL ────────────────────────────────────────────

var _aiEngageUsados = {};

/**
 * Selecciona una entrada del banco para el intent dado.
 * Evita repetir la misma entrada en la sesión.
 * @private
 */
function _aiEngagePick(intent) {
  var pool = _aiEngageQuestions[intent] || _aiEngageQuestions['default'];
  if (!pool || !pool.length) pool = _aiEngageQuestions['default'];

  var key = 'engage_' + intent;
  var candidatas = [];
  var i, j, k;
  for (i = 0; i < pool.length; i++) {
    if (!_aiEngageUsados[key + '_' + i]) candidatas.push(i);
  }
  if (candidatas.length === 0) {
    for (j = 0; j < pool.length; j++) _aiEngageUsados[key + '_' + j] = false;
    candidatas = [];
    for (k = 0; k < pool.length; k++) candidatas.push(k);
  }
  var idx = candidatas[Math.floor(Math.random() * candidatas.length)];
  _aiEngageUsados[key + '_' + idx] = true;
  return pool[idx];
}

/**
 * Devuelve la pregunta de seguimiento y 2 botones de acción para el intent.
 * Siempre retorna {q, actions} — nunca vacío.
 *
 * @param {string} intent
 * @param {object} userContext
 * @param {number} convLevel
 * @param {string} [strategy] - estrategia de engagement determinada por aiThink()
 * @returns {{q: string|null, actions: Array<{label, query}>}}
 */
function aiEngageQuestion(intent, userContext, convLevel, strategy) {
  // Si hay estrategia no-financiera con pool disponible, usarla con 30% de probabilidad
  // (o siempre si el intent no tiene pool propio)
  var stratPool = strategy && _aiEngageQuestions['_' + strategy];
  if (stratPool && stratPool.length && strategy !== 'financial' && strategy !== 'trivia') {
    if (Math.random() < 0.3 || !_aiEngageQuestions[intent]) {
      var stratKey = 'engage__' + strategy;
      var stratCandidatas = [];
      var si;
      for (si = 0; si < stratPool.length; si++) {
        if (!_aiEngageUsados[stratKey + '_' + si]) stratCandidatas.push(si);
      }
      if (stratCandidatas.length === 0) {
        for (si = 0; si < stratPool.length; si++) _aiEngageUsados[stratKey + '_' + si] = false;
        stratCandidatas = [];
        for (si = 0; si < stratPool.length; si++) stratCandidatas.push(si);
      }
      var stratIdx = stratCandidatas[Math.floor(Math.random() * stratCandidatas.length)];
      _aiEngageUsados[stratKey + '_' + stratIdx] = true;
      var stratEntry = stratPool[stratIdx];
      var stratActions = [];
      if (stratEntry.a1)
        stratActions.push({ label: stratEntry.a1, query: stratEntry.a1, intent: stratEntry.i1 });
      if (stratEntry.a2)
        stratActions.push({ label: stratEntry.a2, query: stratEntry.a2, intent: stratEntry.i2 });
      return { q: stratEntry.q || null, actions: stratActions.slice(0, 2) };
    }
  }

  var entry = _aiEngagePick(intent);
  var actions = [];

  if (entry.a1) actions.push({ label: entry.a1, query: entry.a1, intent: entry.i1 });
  if (entry.a2) actions.push({ label: entry.a2, query: entry.a2, intent: entry.i2 });

  if (actions.length < 2) {
    var defEntry = _aiEngagePick('default');
    if (actions.length === 0 && defEntry.a1)
      actions.push({ label: defEntry.a1, query: defEntry.a1 });
    if (actions.length < 2 && defEntry.a2) actions.push({ label: defEntry.a2, query: defEntry.a2 });
  }

  return { q: entry.q || null, actions: actions.slice(0, 2) };
}

/**
 * Compatibilidad: devuelve solo el array de actions (sin la pregunta).
 * Preferir aiEngageQuestion() en código nuevo.
 */
function aiEngageActions(intent, userContext, convLevel) {
  return aiEngageQuestion(intent, userContext, convLevel).actions;
}

/**
 * Inserta una curiosidad si la respuesta es corta y no hay ya una.
 * Nunca repite la misma en la misma sesión.
 *
 * @param {string} text - respuesta actual
 * @returns {string}
 */
function aiEngageCuriosidad(text) {
  if (!text) return text;
  // Solo si la respuesta es relativamente corta (< 300 chars)
  if (text.length > 350) return text;
  // No repetir curiosidades
  var disponibles = [];
  for (var i = 0; i < _aiCuriosidades.length; i++) {
    if (!_aiCuriosidadUsadas[i]) disponibles.push(i);
  }
  if (disponibles.length === 0) {
    for (var j = 0; j < _aiCuriosidades.length; j++) _aiCuriosidadUsadas[j] = false;
    disponibles = [];
    for (var k = 0; k < _aiCuriosidades.length; k++) disponibles.push(k);
  }
  var idx = disponibles[Math.floor(Math.random() * disponibles.length)];
  _aiCuriosidadUsadas[idx] = true;
  return text + '\n\n📚 ' + _aiCuriosidades[idx];
}

/**
 * Selecciona un mini-desafío (trivia) si el usuario ya conversó al menos 3 turnos.
 * Devuelve un objeto {triviaOptions} con los datos del quiz para renderizar
 * como botones tapeables, o null si no aplica.
 *
 * @param {string} text - respuesta actual (para chequear longitud)
 * @returns {{triviaOptions: object}|null}
 */
function aiEngageTrivia(text) {
  if (!text || text.length > 350) return null;
  if (_aiMemory && _aiMemory.history && _aiMemory.history.length < 4) return null;

  var disponibles = [];
  var i, j, k;
  for (i = 0; i < _aiTrivia.length; i++) {
    if (!_aiTriviaUsadas[i]) disponibles.push(i);
  }
  if (disponibles.length === 0) {
    for (j = 0; j < _aiTrivia.length; j++) _aiTriviaUsadas[j] = false;
    disponibles = [];
    for (k = 0; k < _aiTrivia.length; k++) disponibles.push(k);
  }
  var idx = disponibles[Math.floor(Math.random() * disponibles.length)];
  _aiTriviaUsadas[idx] = true;

  return { triviaOptions: _aiTrivia[idx] };
}

/**
 * Verifica si el usuario acertó una trivia y devuelve la respuesta.
 * Se llama desde el clasificador NLP o desde el envío de mensajes.
 *
 * @param {string} text - texto del usuario
 * @returns {string|null}
 */
function aiEngageCheckTrivia(text) {
  var t = (text || '').trim();
  // Solo verificar si parece respuesta numérica (1-4)
  var num = parseInt(t, 10);
  if (isNaN(num) || num < 1 || num > 4) return null;

  // Buscar la trivia activa
  var activa = null;
  for (var i = _aiTrivia.length - 1; i >= 0; i--) {
    if (_aiTriviaUsadas[i]) {
      activa = _aiTrivia[i];
      break;
    }
  }
  if (!activa) return null;

  if (num - 1 === activa.correcta) {
    return '✅ ¡Correcto! ' + activa.explicacion + ' 🎉\n\n¿Seguimos?';
  } else {
    return (
      '❌ ¡Casi! La respuesta correcta es la ' +
      (activa.correcta + 1) +
      '. ' +
      activa.explicacion +
      '\n\n¿Otra pregunta?'
    );
  }
}

// ─── LIMPIEZA ─────────────────────────────────────────────────

function aiEngageReset() {
  _aiEngageUsados = {};
  _aiCuriosidadUsadas = {};
  _aiTriviaUsadas = {};
}

// ─── EXPORT ────────────────────────────────────────────────────
window.aiEngageQuestion = aiEngageQuestion;
window.aiEngageActions = aiEngageActions;
window.aiEngageCuriosidad = aiEngageCuriosidad;
window.aiEngageTrivia = aiEngageTrivia;
window.aiEngageCheckTrivia = aiEngageCheckTrivia;
window.aiEngageReset = aiEngageReset;

console.log('[MT] ai-engage.js cargado — motor de engagement');
