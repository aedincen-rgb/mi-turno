// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-advisor.js
//  Asesor financiero offline completo — el cerebro financiero.
//  Calculadoras, simulaciones, optimización y consejos.
//  Reemplaza y expande los módulos ai-insights.js y ai-proactive.js.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 1. CALCULADORA DE PRESTACIONES COMPLETA
// ═══════════════════════════════════════════════════════════════

function aiAdvisorLiquidacion(c) {
  if (!c || !c.salario) {
    return 'Para calcular tu liquidación y prestaciones, necesito saber tu salario base. Podés configurarlo en **Ajustes > Preferencias de pago** o decirme "mi salario es de X".';
  }
  var sal = c.salario || SMIN;
  var diasTrab = c.diasTrab || 0;
  var mesesAntiguedad = 12; // asumimos 1 año si no sabemos

  // Calcular días trabajados en el período actual
  var hoy = new Date();
  var diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  var diasProporcional = Math.min(diasTrab, diasDelMes);

  // Cesantías: 1 mes de salario por año trabajado
  var cesantiasAnual = sal;
  var cesantiasDiario = sal / 360;
  var cesantiasProporcional = cesantiasDiario * diasProporcional * (mesesAntiguedad / 12);

  // Intereses de cesantías: 12% anual sobre cesantías
  var intCesantias = cesantiasProporcional * 0.12;

  // Prima de servicios: 1 mes de salario por año (pagada en 2 cuotas)
  var primaAnual = sal;
  var primaDiario = sal / 360;
  var primaProporcional = primaDiario * diasProporcional;

  // Vacaciones: 15 días hábiles por año (≈ 1.25 días por mes)
  var vacacionesDiario = sal / 720; // fórmula estándar
  var vacacionesProporcional = vacacionesDiario * diasProporcional;

  // Auxilio de transporte (si aplica)
  var auxTransporte = 0;
  if (sal <= SMIN * 2) {
    auxTransporte = (AUX_TRANSPORTE_2026 / 30) * diasProporcional;
  }

  // Total prestaciones (vacaciones no incluye auxilio de transporte en su base)
  var totalPrestaciones =
    cesantiasProporcional + intCesantias + primaProporcional + vacacionesProporcional;

  // Descuentos de nómina (Salud y Pensión se calculan sobre el devengado SIN auxilio de transporte)
  var baseSeguridadSocial = c.totalCOP; // Asumimos que c.totalCOP no incluye auxilio de transporte aún
  var salud = baseSeguridadSocial * 0.04; // 4%
  var pension = baseSeguridadSocial * 0.04; // 4%
  var totalDeducciones = salud + pension;

  // El neto a pagar suma el auxilio de transporte DESPUÉS de las deducciones
  var netoPagar = baseSeguridadSocial - totalDeducciones + auxTransporte;

  var resp = '💰 **Liquidación y prestaciones**\n\n';

  resp += '**Devengado:**\n';
  resp += '• Total bruto: ' + fCOP(c.totalCOP) + '\n';
  resp += '• Salud (4%): -' + fCOP(salud) + '\n';
  resp += '• Pensión (4%): -' + fCOP(pension) + '\n';
  if (auxTransporte > 0) resp += '• Auxilio transporte: +' + fCOP(auxTransporte) + '\n';
  resp += '• **Neto a recibir: ' + fCOP(netoPagar) + '**\n\n';

  resp += '**Prestaciones acumuladas:**\n';
  resp +=
    '• Cesantías: ' +
    fCOP(cesantiasProporcional) +
    ' (' +
    (sal <= SMIN * 2 ? 'consignadas al fondo' : 'pagadas directamente') +
    ')\n';
  resp += '• Intereses cesantías: ' + fCOP(intCesantias) + ' (12% anual)\n';
  resp += '• Prima de servicios: ' + fCOP(primaProporcional) + ' (pagadero en junio y diciembre)\n';
  resp += '• Vacaciones: ' + fCOP(vacacionesProporcional) + ' (15 días por año trabajado)\n';
  resp += '• **Total prestaciones: ' + fCOP(totalPrestaciones) + '**\n\n';

  resp +=
    '💡 Las cesantías se consignan antes del 15 de febrero del año siguiente. La prima se paga la mitad en junio y la otra en diciembre. Las vacaciones se disfrutan, no se compensan en dinero (salvo terminación del contrato).';

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 2. SIMULADOR DE ESCENARIOS COMPLEJOS
// ═══════════════════════════════════════════════════════════════

function aiAdvisorSimular(c, horas, tipo) {
  if (!c || !c.vh) {
    return 'Para hacer simulaciones, necesito saber tu salario base. Podés configurarlo en **Ajustes > Preferencias de pago** o decirme "mi salario es de X".';
  }
  var vh = c.vh || 0;
  var sal = c.salario || SMIN;
  var escenarios = [];

  // Escenario 1: Solo diurno ordinario
  var s1 = { label: 'Solo diurno (sin recargos)', cop: vh * horas, factor: 1.0 };
  escenarios.push(s1);

  // Escenario 2: Diurno extra (25%)
  var s2 = { label: 'Extra diurno (+25%)', cop: vh * horas * 1.25, factor: 1.25 };
  escenarios.push(s2);

  // Escenario 3: Nocturno ordinario (35%)
  var s3 = { label: 'Nocturno ordinario (+35%)', cop: vh * horas * 1.35, factor: 1.35 };
  escenarios.push(s3);

  // Escenario 4: Nocturno extra (75%)
  var s4 = { label: 'Extra nocturno (+75%)', cop: vh * horas * 1.75, factor: 1.75 };
  escenarios.push(s4);

  // Escenario 5: Festivo diurno (75%)
  var s5 = { label: 'Festivo diurno (+75%)', cop: vh * horas * 1.75, factor: 1.75 };
  escenarios.push(s5);

  // Escenario 6: Festivo nocturno (110%)
  var s6 = { label: 'Extra festivo nocturno (+110%)', cop: vh * horas * 2.1, factor: 2.1 };
  escenarios.push(s6);

  var resp = '🔮 **Simulador avanzado**\n\n';
  resp += 'Valor hora base: ' + fCOP(vh) + '\n';
  resp += 'Horas: ' + horas + 'h\n\n';

  if (tipo === 'resumen') {
    // Mostrar solo el mejor y peor
    var mejor = escenarios[escenarios.length - 1];
    var peor = escenarios[0];
    resp += '• Mínimo (diurno normal): ' + fCOP(peor.cop) + '\n';
    resp += '• Máximo (festivo nocturno): ' + fCOP(mejor.cop) + '\n';
    resp +=
      '• Diferencia: ' +
      fCOP(mejor.cop - peor.cop) +
      ' (' +
      ((mejor.factor - peor.factor) * 100).toFixed(0) +
      '% más)\n\n';
    resp +=
      '💡 Elegir bien el horario puede duplicar tus ingresos por las mismas horas trabajadas.';
  } else {
    // Mostrar todos
    for (var i = 0; i < escenarios.length; i++) {
      var s = escenarios[i];
      resp += '• ' + s.label + ': ' + fCOP(s.cop) + '\n';
    }
    resp +=
      '\n💡 El mismo número de horas puede pagar hasta ' +
      fCOP(escenarios[5].cop) +
      ' si las hacés en festivo nocturno.';
  }

  // Agregar proyección mensual
  resp += '\n\n📅 **Proyección mensual** (si hicieras ' + horas + 'h/semana de cada tipo):\n';
  for (var j = 0; j < 3; j++) {
    var s = escenarios[j * 2]; // solo algunos
    var mensual = s.cop * 4;
    resp += '• ' + s.label + ': ' + fCOP(mensual) + '/mes\n';
  }

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 3. OPTIMIZADOR DE HORARIOS (SHIFT PLANNER)
// ═══════════════════════════════════════════════════════════════

function aiAdvisorOptimizador(c, metaExtra) {
  if (!c || !c.vh || !metaExtra || metaExtra <= 0) {
    return 'Para recomendarte turnos, necesito saber tu salario base y cuánto dinero extra quieres ganar. Por ejemplo: "Quiero ganar 150 lucas extra".';
  }

  var vh = c.vh;
  var resp =
    '🎯 **Optimizador de Horarios**\n\nPara ganar **' +
    fCOP(metaExtra) +
    '** extra con tu salario actual, tenés estas opciones:\n\n';

  // Opción A: Turnos nocturnos (8h)
  var valorTurnoNocturno = vh * 1.35 * 8;
  var turnosNocturnos = Math.ceil(metaExtra / valorTurnoNocturno);
  resp += '🌙 **Opción A: ' + turnosNocturnos + ' turnos nocturnos**\n';
  resp +=
    'Trabajando de noche (recargo 35%), cada turno de 8h te paga ' +
    fCOP(valorTurnoNocturno) +
    '.\n\n';

  // Opción B: Domingos/Festivos diurnos (8h)
  var valorTurnoDomingo = vh * 1.75 * 8;
  var turnosDomingos = Math.ceil(metaExtra / valorTurnoDomingo);
  resp += '⛪ **Opción B: ' + turnosDomingos + ' turnos dominicales/festivos**\n';
  resp +=
    'Trabajando un domingo de día (recargo 75%), cada turno de 8h te paga ' +
    fCOP(valorTurnoDomingo) +
    '.\n\n';

  // Opción C: Horas extra diurnas repartidas
  var valorExtraDiurna = vh * 1.25;
  var horasExtra = Math.ceil(metaExtra / valorExtraDiurna);
  resp += '⏱️ **Opción C: ' + horasExtra + ' horas extra diurnas**\n';
  resp +=
    'Repartidas en la semana (recargo 25%). Son aprox ' +
    (horasExtra / 5).toFixed(1) +
    ' horas extra por día durante 5 días.\n\n';

  resp +=
    '💡 *Consejo:* La Opción B es la más rápida, pero sacrifica tu fin de semana. La Opción C es más suave pero alarga tus jornadas diarias.';

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 4. PLANIFICADOR DE AHORRO
// ═══════════════════════════════════════════════════════════════

function aiAdvisorAhorro(c, meta, plazoMeses) {
  if (!c || !meta || meta <= 0) return '';
  var ingresoMensual = c.proy || c.totalCOP || 0;
  var plazo = plazoMeses || 12;
  var ahorroMensual = meta / plazo;
  var porcentaje = ingresoMensual > 0 ? (ahorroMensual / ingresoMensual) * 100 : 0;

  var resp = '🐷 **Plan de ahorro**\n\n';
  resp += '• Meta: ' + fCOP(meta) + '\n';
  resp += '• Plazo: ' + plazo + ' meses\n';
  resp += '• Ahorro mensual necesario: ' + fCOP(ahorroMensual) + '\n';
  resp += '• % de tu ingreso proyectado: ' + porcentaje.toFixed(1) + '%\n\n';

  if (porcentaje > 30) {
    resp += '⚠️ Ahorrar más del 30% de tu ingreso es ambicioso. Considerá:\n';
    resp +=
      '• Extender el plazo a ' +
      Math.ceil(plazo * 1.5) +
      ' meses → ' +
      fCOP(meta / Math.ceil(plazo * 1.5)) +
      '/mes (' +
      (porcentaje / 1.5).toFixed(1) +
      '%)\n';
    resp += '• Aumentar ingresos con horas extra o recargos\n';
  } else if (porcentaje <= 15) {
    resp +=
      '✅ Es un plan realista. Si ahorrás eso cada mes, en ' + plazo + ' meses alcanzás tu meta.\n';
  } else {
    resp += '💡 Es alcanzable con disciplina. Considerá automatizar el ahorro.\n';
  }

  // Simular horas extra necesarias
  if (c.vh && c.vh > 0) {
    var extraNecesario = ahorroMensual - ingresoMensual * 0.1; // asumiendo ya ahorra 10%
    if (extraNecesario > 0) {
      var horasExtras = extraNecesario / (c.vh * 1.25); // asumiendo extra diurna 25%
      resp +=
        '\n🔧 **Estrategia:** harías ≈' +
        horasExtras.toFixed(1) +
        'h extra al mes (a ' +
        fCOP(c.vh * 1.25) +
        '/h con recargo del 25%) para cubrir esta meta sin bajar tu nivel de vida.';
    }
  }

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 4. ASESOR DE OPTIMIZACIÓN FISCAL
// ═══════════════════════════════════════════════════════════════

function aiAdvisorFiscal(c) {
  if (!c || !c.salario) return '';
  var ingresoAnual = (c.proy || c.totalCOP || 0) * 12;
  var salarioAnual = (c.salario || 0) * 12;
  var ingresoTotal = Math.max(ingresoAnual, salarioAnual);

  var resp = '📊 **Análisis fiscal**\n\n';

  // Retención en la fuente (simplificado)
  var uvtAnual = 47065 * 365; // UVT aproximado 2026 (~$47,065)
  var enRenta = ingresoTotal > (uvtAnual * 1400) / 365;

  resp += '• Ingreso anual estimado: ' + fCOP(ingresoTotal) + '\n';
  resp +=
    '• ¿Debe declarar renta?: ' +
    (enRenta ? 'Posiblemente (supera topes)' : 'No (por debajo de topes)') +
    '\n\n';

  resp += '**Deducciones estimadas:**\n';
  resp += '• Aportes salud (4%): ' + fCOP(c.totalCOP * 0.04 * 12) + '/año\n';
  resp += '• Aportes pensión (4%): ' + fCOP(c.totalCOP * 0.04 * 12) + '/año\n';
  resp += '• Total deducible: ' + fCOP(c.totalCOP * 0.08 * 12) + '/año\n\n';

  resp +=
    '💡 Los aportes a salud y pensión son deducibles de la base de retención. Si ganás menos de 2 SMMLV, no te retienen. Si tu empleador no te está afiliando, exigilo — es tu derecho.';

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 5. OPTIMIZADOR DE HORARIOS
// ═══════════════════════════════════════════════════════════════

function aiAdvisorOptimizar(c) {
  if (!c || !c.vh || !c.dias || c.dias.length === 0) return '';
  var vh = c.vh;
  var dias = c.dias;

  // Analizar qué tipo de turno rinde más
  var mejorTipo = '';
  var mejorCopHora = 0;

  if (c.copPorHoraReal && c.copPorHoraReal > vh * 1.2) {
    mejorCopHora = c.copPorHoraReal;
    mejorTipo = 'estás maximizando';
  } else {
    mejorCopHora = vh * 1.35;
    mejorTipo = 'nocturno ordinario';
  }

  var resp = '⚡ **Optimizador de horarios**\n\n';

  resp += '• Tu valor hora efectivo: ' + fCOP(c.copPorHoraReal || vh) + '\n';
  resp += '• Mejor estrategia: ' + mejorTipo + ' (≈' + fCOP(mejorCopHora) + '/h)\n\n';

  // Recomendación de días
  resp += '**Recomendaciones para maximizar:**\n';

  if (c.bestDow && c.bestDow.dia === 0) {
    resp += '• 🏆 Los domingos son tu mejor día. Seguí trabajándolos.\n';
  } else if (c.bestDow && c.bestDow.count > 0) {
    var diasSem = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    resp += '• 📅 Tu mejor día es el ' + diasSem[c.bestDow.dia] + '. Priorizalo.\n';
  }

  // Sugerencia de cuánto ganaría cambiando
  var horasDiarias = c.totalMins / Math.max(1, c.diasTrab) / 60;
  var gananciaActual = c.totalCOP;
  var gananciaOptimizada = c.totalCOP + c.totalCOP * 0.15; // 15% más optimizando
  resp +=
    '• Si optimizaras tus horarios (más nocturnas/festivos), podrías ganar ≈' +
    fCOP(gananciaOptimizada) +
    ' este mes (≈+' +
    fCOP(gananciaOptimizada - gananciaActual) +
    ').\n';

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 6. COMPARADOR DE OFERTAS LABORALES
// ═══════════════════════════════════════════════════════════════

function aiAdvisorCompararOfertas(c, ofertaSalario, ofertaHoras) {
  if (!c || !c.vh || !ofertaSalario) return '';
  var actualVH = c.vh;
  var nuevaVH = ofertaSalario / 240;
  var actualMensual = c.salario || 0;
  var horasActuales = c.totalMins / 60 || c.diasTrab * 8 || 176;

  var resp = '⚖ **Comparador de ofertas**\n\n';

  resp += '**Tu situación actual:**\n';
  resp += '• Salario: ' + fCOP(actualMensual) + ' → ' + fCOP(actualVH) + '/h\n';
  resp += '• Horas/mes: ≈' + horasActuales.toFixed(0) + 'h\n\n';

  resp += '**Nueva oferta:**\n';
  resp += '• Salario: ' + fCOP(ofertaSalario) + ' → ' + fCOP(nuevaVH) + '/h\n';
  var difHora = nuevaVH - actualVH;
  var difMensual = ofertaSalario - actualMensual;
  resp +=
    '• Diferencia: ' +
    (difMensual >= 0 ? '+' : '') +
    fCOP(difMensual) +
    '/mes (' +
    ((difMensual / actualMensual) * 100).toFixed(1) +
    '%)\n\n';

  if (difHora > 0) {
    resp +=
      '✅ La nueva oferta paga ' +
      fCOP(Math.abs(difHora)) +
      '/h más. ' +
      'En un mes de 240h, son ' +
      fCOP(difHora * 240) +
      ' extra.\n';
  } else {
    resp +=
      '⚠️ La nueva oferta paga menos por hora. Pero considerá otros beneficios: ' +
      '¿es más cerca? ¿mejor horario? ¿más estabilidad?\n';
  }

  // Incluir recargos potenciales
  resp +=
    '\n💡 **Consejo:** No solo mires el salario base. Preguntá si hay recargos nocturnos, horas extra pagas, ' +
    'auxilio de transporte, bonos. Un salario menor con buenos recargos puede superar a uno mayor sin extras.';

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 7. INFORME FINANCIERO COMPLETO
// ═══════════════════════════════════════════════════════════════

function aiAdvisorInforme(c) {
  if (!c || c.diasTrab === 0)
    return 'Aún no hay suficientes datos para un informe completo. Registrá algunos turnos primero.';

  var secciones = [];

  // 1. Resumen ejecutivo
  secciones.push('📊 **Informe financiero completo**\n');

  // 2. Ingresos
  secciones.push(
    '**1. Ingresos del período**\n• Bruto: ' +
      fCOP(c.totalCOP) +
      '\n• Neto estimado: ' +
      fCOP(c.totalCOP * 0.92) +
      ' (después de salud y pensión 8%)' +
      '\n• Proyección al cierre: ' +
      fCOP(c.proy || c.totalCOP) +
      '\n• % del salario base: ' +
      (c.pctSalario || 0).toFixed(1) +
      '%'
  );

  // 3. Prestaciones (resumido)
  if (typeof aiAdvisorLiquidacion === 'function') {
    var liq = aiAdvisorLiquidacion(c);
    if (liq) secciones.push(liq);
  }

  // 4. Simulación
  if (c.vh && c.vh > 0) {
    var sim = aiAdvisorSimular(c, 8, 'resumen');
    if (sim) secciones.push(sim);
  }

  // 5. Fiscal
  if (c.salario && c.salario > 0) {
    var fiscal = aiAdvisorFiscal(c);
    if (fiscal) secciones.push(fiscal);
  }

  // 6. Optimización
  var opt = aiAdvisorOptimizar(c);
  if (opt) secciones.push(opt);

  return secciones.join('\n\n');
}

// ═══════════════════════════════════════════════════════════════
// 8. ANÁLISIS HISTÓRICO DE PATRONES
// ═══════════════════════════════════════════════════════════════

function aiAdvisorHistorico(turnosAll, vh, salario) {
  if (!turnosAll || turnosAll.length < 5) return '';
  var turnos = turnosAll || [];
  var meses = {};

  for (var i = 0; i < turnos.length; i++) {
    var t = turnos[i];
    if (!t.inicio || !t.fin) continue;
    var d = new Date(t.inicio);
    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!meses[key]) meses[key] = { turnos: [], dias: {} };
    meses[key].turnos.push(t);
    meses[key].dias[d.getDate()] = true;
  }

  var keys = Object.keys(meses).sort();
  if (keys.length < 2) return '';

  var datos = [];
  for (var m = 0; m < keys.length; m++) {
    var k = keys[m];
    var mes = meses[k];
    var calc = doCalc(
      mes.turnos,
      null,
      new Date(parseInt(k.split('-')[0]), parseInt(k.split('-')[1]) - 1, 28),
      vh
    );
    datos.push({ label: k, cop: Math.round(calc.totalCOP), mins: Math.round(calc.totalMins) });
  }

  var mejor = datos[0],
    peor = datos[0];
  var total = 0;
  for (var n = 0; n < datos.length; n++) {
    total += datos[n].cop;
    if (datos[n].cop > mejor.cop) mejor = datos[n];
    if (datos[n].cop < peor.cop) peor = datos[n];
  }
  var prom = Math.round(total / datos.length);

  var resp = '\n\n📈 **Análisis histórico** (' + keys.length + ' meses)\n\n';
  resp += '• 🏆 Mejor mes: ' + mejor.label + ' — ' + fCOP(mejor.cop) + '\n';
  resp += '• 📉 Mes más bajo: ' + peor.label + ' — ' + fCOP(peor.cop) + '\n';
  resp += '• 📊 Promedio mensual: ' + fCOP(prom) + '\n';
  resp += '• 💰 Total acumulado: ' + fCOP(total) + '\n\n';

  var restantes = 12 - datos.length;
  if (restantes > 0 && prom > 0) {
    var anual = total + prom * restantes;
    resp +=
      '🔮 Proyección 12 meses: ≈' +
      fCOP(anual) +
      ' (' +
      (anual / Math.max(1, salario) / 12).toFixed(1) +
      'x salario base mensual)\n';
  }

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 9. OPTIMIZADOR DE DESCANSO
// ═══════════════════════════════════════════════════════════════

function aiAdvisorDescansoOptimo(c) {
  if (!c || !c.dias || c.dias.length < 5) return '';
  var dias = c.dias;
  var diasSem = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var porDia = [
    { t: 0, c: 0 },
    { t: 0, c: 0 },
    { t: 0, c: 0 },
    { t: 0, c: 0 },
    { t: 0, c: 0 },
    { t: 0, c: 0 },
    { t: 0, c: 0 }
  ];

  for (var i = 0; i < dias.length; i++) {
    var d = dias[i];
    var dia = new Date(d.fecha + 'T12:00:00').getDay();
    porDia[dia].t += d.cop;
    porDia[dia].c++;
  }

  var mejorD = -1,
    peorD = -1;
  var mejorV = 0,
    peorV = Infinity;
  for (var j = 0; j < 7; j++) {
    if (porDia[j].c > 0) {
      var prom = porDia[j].t / porDia[j].c;
      if (prom > mejorV) {
        mejorV = prom;
        mejorD = j;
      }
      if (prom < peorV) {
        peorV = prom;
        peorD = j;
      }
    }
  }

  if (peorD < 0) return '';

  var resp = '\n\n🧘 **Optimizador de descanso**\n\n';
  resp += '• 📅 Día más flojo: **' + diasSem[peorD] + '** (promedio ' + fCOP(peorV) + '/día)\n';
  resp += '• 💡 Descansar ese día te cuesta ≈' + fCOP(peorV) + ' pero ganás en salud.\n';
  if (mejorD !== peorD && mejorD >= 0) {
    resp +=
      '• 🏆 Día más rentable: **' + diasSem[mejorD] + '** (promedio ' + fCOP(mejorV) + '/día)\n';
  }

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 10. PROYECCIÓN ANUAL
// ═══════════════════════════════════════════════════════════════

function aiAdvisorAnual(c, turnosAll, vh) {
  if (!c || !turnosAll || turnosAll.length < 10) return '';
  var meses = {};
  for (var i = 0; i < turnosAll.length; i++) {
    var t = turnosAll[i];
    if (!t.inicio || !t.fin) continue;
    var d = new Date(t.inicio);
    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!meses[key]) meses[key] = [];
    meses[key].push(t);
  }
  var keys = Object.keys(meses).sort();
  if (keys.length < 2) return '';

  var anual = 0;
  for (var m = 0; m < keys.length; m++) {
    var calc = doCalc(meses[keys[m]], null, new Date(2026, m, 28), vh);
    anual += calc.totalCOP || 0;
  }
  var prom = Math.round(anual / keys.length);
  var proy = prom * 12;

  var resp = '\n\n📆 **Proyección anual**\n\n';
  resp += '• 📊 Promedio mensual (últimos ' + keys.length + ' meses): ' + fCOP(prom) + '\n';
  resp += '• 💰 Proyección 12 meses: ≈' + fCOP(proy) + '\n';
  if (c.salario > 0) {
    resp += '• 📈 vs salario base: ' + ((proy / (c.salario * 12)) * 100).toFixed(1) + '%\n';
  }

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 8. RESPONDEDOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

/**
 * Despacha la consulta al módulo correcto según la intención.
 * @param {string} intent - intent NLP
 * @param {object} c - contexto
 * @param {object} state - estado original (para parámetros extra)
 * @returns {string|null}
 */
function aiAdvisorRespond(intent, c, state) {
  if (!c) return null;

  switch (intent) {
    case 'liquidacion':
      return aiAdvisorLiquidacion(c);

    case 'simulacion':
      var horas = (state && state.horas) || 8;
      return aiAdvisorSimular(c, horas, 'completo');

    case 'ahorro':
      var meta = (state && state.meta) || (c.salario || SMIN) * 3;
      return aiAdvisorAhorro(c, meta, 12);

    case 'ley':
      return aiAdvisorFiscal(c);

    case 'optimizar':
    case 'optimizador':
      return aiAdvisorOptimizar(c) + aiAdvisorDescansoOptimo(c);

    case 'total_ganado':
    case 'stats':
      return aiAdvisorInforme(c) + aiAdvisorDescansoOptimo(c);

    default:
      return null;
  }
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiAdvisorLiquidacion = aiAdvisorLiquidacion;
window.aiAdvisorSimular = aiAdvisorSimular;
window.aiAdvisorAhorro = aiAdvisorAhorro;
window.aiAdvisorFiscal = aiAdvisorFiscal;
window.aiAdvisorOptimizar = aiAdvisorOptimizar;
window.aiAdvisorCompararOfertas = aiAdvisorCompararOfertas;
window.aiAdvisorInforme = aiAdvisorInforme;
window.aiAdvisorRespond = aiAdvisorRespond;
window.aiAdvisorHistorico = aiAdvisorHistorico;
window.aiAdvisorDescansoOptimo = aiAdvisorDescansoOptimo;
window.aiAdvisorAnual = aiAdvisorAnual;
window.aiAdvisorOptimizador = aiAdvisorOptimizador;

console.log('[MT] ai-advisor.js cargado — asesor financiero offline completo ✓');
