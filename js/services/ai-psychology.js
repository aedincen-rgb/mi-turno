// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-psychology.js
//  Psicología aplicada al entorno laboral — timing, empatía y
//  motivación basada en evidencia para trabajadores por turnos.
//  100% offline · ES5 · sin dependencias externas.
//
//  Técnicas:
//    · Growth mindset (Dweck) — progreso > resultado
//    · Self-Determination Theory — autonomía, competencia, relación
//    · Micro-affirmations — validaciones breves post-esfuerzo
//    · Circadian-aware timing — mensajes según hora biológica
//    · Financial psychology — framing positivo de números
// ════════════════════════════════════════════════════════════════

// ─── DETECCIÓN DE HORA CRÍTICA ────────────────────────────────

/**
 * Determina si la hora actual es un momento psicológicamente crítico.
 * @param {Date} d - fecha/hora
 * @returns {object} { critical: bool, type: string, intensity: number }
 */
function aiPsychDetectHour(d) {
  var h = d && typeof d.getHours === 'function' ? d.getHours() : new Date().getHours();
  var min = d ? d.getMinutes() : 0;
  var horaDecimal = h + min / 60;

  // 3:00 AM - 5:00 AM: punto más bajo del ritmo circadiano
  if (horaDecimal >= 3 && horaDecimal < 5) {
    return { critical: true, type: 'circadian_low', intensity: 0.9, msg: 'madrugada_profunda' };
  }
  // 5:00 AM - 6:00 AM: transición amanecer
  if (horaDecimal >= 5 && horaDecimal < 6) {
    return { critical: true, type: 'dawn_transition', intensity: 0.7, msg: 'amanecer' };
  }
  // 14:00 - 15:00: bajón post-almuerzo
  if (horaDecimal >= 14 && horaDecimal < 15) {
    return { critical: true, type: 'afternoon_slump', intensity: 0.5, msg: 'bajon_tarde' };
  }
  // 21:00 - 22:00: inicio turno nocturno
  if (horaDecimal >= 21 && horaDecimal < 22) {
    return { critical: true, type: 'night_shift_start', intensity: 0.6, msg: 'inicio_nocturno' };
  }

  return { critical: false, type: 'normal', intensity: 0, msg: null };
}

// ─── MENSAJES SEGÚN MOMENTO ───────────────────────────────────

function aiPsychMensajePorHora(d, c) {
  var ctx = aiPsychDetectHour(d);
  if (!ctx.critical) return null;

  var nm =
    typeof _aiNombrePersonal === 'function' ? _aiNombrePersonal({ session: { uid: null } }) : '';
  var nombre = nm ? nm + ', ' : '';

  var mensajes = {
    madrugada_profunda: [
      nombre +
        'sé que esta hora es dura. Lo que hacés ahora, cuando casi todos duermen, habla de tu compromiso. Cada minuto cuenta y estás sumando.',
      nombre +
        'las 3 AM son la hora más difícil del cuerpo humano. Si estás trabajando ahora, recordá que tu esfuerzo vale 35% más que de día. Eso es reconocimiento real.',
      nombre +
        'madrugada. El silencio de esta hora es solo tuyo. Aprovechalo — rendís más de lo que creés a esta hora.'
    ],
    amanecer: [
      nombre +
        'ya está amaneciendo. Pasaste la noche. El cuerpo empieza a despertar y con él, tu energía. Ya casi termina el turno más duro.',
      nombre +
        'el sol está saliendo. Tu turno nocturno está por terminar. Lo lograste una vez más. Cuando llegues a casa, descansá con orgullo.',
      nombre + 'amanecer. Terminaste la parte más difícil. Lo que queda del día es ganancia pura.'
    ],
    bajon_tarde: [
      nombre +
        'es normal sentir el bajón de las 2 PM. El cuerpo pide siesta, pero vos seguís. Un café, un estiramiento, y para adelante.',
      nombre +
        'media tarde. Ya pasaste más de la mitad del día. Lo que queda es cuesta abajo. Un respiro y seguimos.',
      nombre +
        'tarde. El bajón post-almuerzo es biológico, no es falta de ganas. Hidratate, movete un poco, y vas a ver que remontás.'
    ],
    inicio_nocturno: [
      nombre +
        'arranca la noche. Tu cuerpo está en su pico de alerta ahora. Aprovechá las primeras horas que son las más productivas.',
      nombre +
        'turno nocturno empezando. Las próximas 3-4 horas son tu ventana de máxima energía. Después, bajá el ritmo sin culpa.',
      nombre +
        'empezando la noche. Cada hora de ahora en adelante paga 35% más. Tu tiempo vale más que durante el día.'
    ]
  };

  var opts = mensajes[ctx.msg];
  return opts ? opts[Math.floor(Math.random() * opts.length)] : null;
}

// ─── FRAMING POSITIVO DE NÚMEROS ──────────────────────────────

/**
 * Convierte datos financieros en mensajes motivacionales.
 * Usa "progress framing" (lo que lograste) en vez de "gap framing" (lo que falta).
 * @param {object} c - contexto
 * @returns {string|null}
 */
function aiPsychFinancialFraming(c) {
  if (!c || c.diasTrab === 0) return null;
  var frases = [];

  // Progreso hacia el salario
  if (c.pctSalario >= 90) {
    frases.push(
      '🎯 ¡Estás a nada de tu salario base! Cada hora extra ahora es pura ganancia. Ya cubriste tus gastos fijos del mes.'
    );
  } else if (c.pctSalario >= 70) {
    frases.push(
      '💪 Ya superaste el 70% de tu salario base. Vas fuerte. Lo que sigue es construir sobre esa base sólida.'
    );
  } else if (c.pctSalario >= 50) {
    frases.push(
      '📈 Vas por la mitad. Cada turno te acerca más. Ya hiciste la parte más difícil: arrancar.'
    );
  } else if (c.pctSalario >= 25) {
    frases.push(
      '🌱 Vas construyendo. Un cuarto del mes ya es tuyo. Paso a paso, sin prisa pero sin pausa.'
    );
  }

  // Comparación con mes anterior
  if (c.totalCOPMesPasado > 0 && c.totalCOP > c.totalCOPMesPasado) {
    var dif = c.totalCOP - c.totalCOPMesPasado;
    frases.push(
      '📊 Vas ' + fCOP(dif) + ' arriba vs el mes pasado. Estás mejorando. Eso es crecimiento real.'
    );
  }

  // Eficiencia
  if (c.copPorHoraReal && c.vh && c.copPorHoraReal > c.vh * 1.3) {
    frases.push(
      '⚡ Tu valor hora efectivo es ' +
        fCOP(c.copPorHoraReal) +
        '. Estás rindiendo al máximo. Cada hora tuya vale más que la de muchos.'
    );
  }

  // Días trabajados
  if (c.diasTrab >= 15) {
    frases.push(
      '🗓 Más de medio mes trabajado. Ya pasaste la mitad. Cada día que queda es un paso más hacia tu meta.'
    );
  }

  return frases.length > 0 ? '\n\n' + frases[Math.floor(Math.random() * frases.length)] : null;
}

// ─── APOYO EN CONSULTA CRÍTICA ─────────────────────────────────

/**
 * Detecta si la conversación es sobre un tema estresante y
 * añade apoyo psicológico sutil (sin ser empalagoso).
 * @param {string} intent - intent NLP
 * @param {object} c - contexto
 * @returns {string|null}
 */
function aiPsychSupportResponse(intent, c) {
  if (!c) return null;

  // Mapeo de intents estresantes a mensajes de apoyo
  var support = {
    bienestar: [
      'Escucharte es el primer paso. Reconocer el cansancio no es debilidad — es inteligencia. Tu cuerpo te está diciendo algo.',
      'El burnout es real. No sos vos — es el sistema. Pero podés tomar el control: un día de descanso bien puesto rinde más que 3 días forzados.',
      'Está bien sentirte así. Todos los que trabajan duro pasan por esto. Lo importante es que lo estás notando y podés hacer algo.'
    ],
    liquidacion: [
      'Hablar de plata puede dar ansiedad. Pero informarte es poder. Saber exactamente cuánto te corresponde es el primer paso para estar tranquilo.',
      'Pensar en liquidación puede ser estresante. Pero mirá todo lo que construiste: cada hora trabajada suma a este número.'
    ],
    ley: [
      'Conocer tus derechos es empoderarte. La ley está de tu lado. Entenderla te da herramientas para exigir lo que te corresponde.',
      'La legislación laboral existe para protegerte. Saber esto no es solo información — es tranquilidad.'
    ],
    proyeccion: [
      'Pensar en el futuro puede dar vértigo. Pero cada proyección es solo una estimación — vos tenés el control de cómo termina el mes.',
      'Los números son solo números. Lo que hacés cada día es lo que importa. Y eso lo controlás vos.'
    ]
  };

  var opts = support[intent];
  if (!opts) return null;

  return '\n\n💭 ' + opts[Math.floor(Math.random() * opts.length)];
}

// ─── RECONOCIMIENTO POST-ESFUERZO ─────────────────────────────

/**
 * Después de un turno largo (8h+), ofrece reconocimiento sin ser excesivo.
 * @param {object} c - contexto
 * @returns {string|null}
 */
function aiPsychPostShift(c) {
  if (!c) return null;
  var minsHoy = c.minsHoy || 0;
  if (minsHoy < 480) return null; // menos de 8h, no aplica

  var nm =
    typeof _aiNombrePersonal === 'function' ? _aiNombrePersonal({ session: { uid: null } }) : '';
  var nombre = nm ? nm + ', ' : '';

  var mensajes = [
    nombre + '8 horas cumplidas. Eso es un día completo de trabajo. Bien hecho.',
    nombre + 'turno completo. Tu cuerpo y tu bolsillo te lo agradecen.',
    nombre + 'jornada completa. Ahora a descansar, que mañana hay más.'
  ];

  return '\n\n✅ ' + mensajes[Math.floor(Math.random() * mensajes.length)];
}

// ─── ORQUESTADOR ──────────────────────────────────────────────

/**
 * Orquesta todas las intervenciones psicológicas.
 * Se llama desde aiEnhancedRespond.
 * @param {object} c - contexto
 * @param {string} intent - intent NLP
 * @returns {string}
 */
function aiPsychRespond(c, intent) {
  if (!c) return '';
  var parts = [];
  var ahora = c.ahora || new Date();

  // 1. Mensaje por hora crítica (si aplica)
  var horaMsg = aiPsychMensajePorHora(ahora, c);
  if (horaMsg) parts.push('\n\n🕐 ' + horaMsg);

  // 2. Framing positivo de números (en respuestas de dinero o tiempo trabajado)
  if (
    intent === 'total_ganado' ||
    intent === 'stats' ||
    intent === 'proyeccion' ||
    intent === 'hoy' ||
    intent === 'ayer' ||
    intent === 'comparativa_mes' ||
    intent === 'horas_trabajadas'
  ) {
    var framing = aiPsychFinancialFraming(c);
    if (framing) parts.push(framing);
  }

  // 3. Apoyo en consulta crítica
  var support = aiPsychSupportResponse(intent, c);
  if (support) parts.push(support);

  // 4. Reconocimiento post-esfuerzo
  if (intent === 'hoy') {
    var shift = aiPsychPostShift(c);
    if (shift) parts.push(shift);
  }

  return parts.join('');
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiPsychDetectHour = aiPsychDetectHour;
window.aiPsychMensajePorHora = aiPsychMensajePorHora;
window.aiPsychFinancialFraming = aiPsychFinancialFraming;
window.aiPsychSupportResponse = aiPsychSupportResponse;
window.aiPsychPostShift = aiPsychPostShift;
window.aiPsychRespond = aiPsychRespond;

console.log('[MT] ai-psychology.js cargado — psicología laboral aplicada ✓');
