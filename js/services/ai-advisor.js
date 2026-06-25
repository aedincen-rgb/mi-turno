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

  resp += '**Devengado del mes**\n\n';
  resp += '| Concepto | Valor |\n|---|---|\n';
  resp += '| Total bruto | ' + fCOP(c.totalCOP) + ' |\n';
  resp += '| Salud (4%) | -' + fCOP(salud) + ' |\n';
  resp += '| Pensión (4%) | -' + fCOP(pension) + ' |\n';
  if (auxTransporte > 0) resp += '| Auxilio transporte | +' + fCOP(auxTransporte) + ' |\n';
  resp += '| **Neto a recibir** | **' + fCOP(netoPagar) + '** |\n\n';

  resp += '**Prestaciones acumuladas**\n\n';
  resp += '| Concepto | Valor |\n|---|---|\n';
  resp += '| Cesantías | ' + fCOP(cesantiasProporcional) + ' |\n';
  resp += '| Intereses cesantías (12%) | ' + fCOP(intCesantias) + ' |\n';
  resp += '| Prima de servicios | ' + fCOP(primaProporcional) + ' |\n';
  resp += '| Vacaciones | ' + fCOP(vacacionesProporcional) + ' |\n';
  resp += '| **Total prestaciones** | **' + fCOP(totalPrestaciones) + '** |\n\n';

  resp +=
    '💡 Las cesantías se consignan antes del 15 de febrero del año siguiente. La prima se paga la mitad en junio y la otra en diciembre. Las vacaciones se disfrutan, no se compensan en dinero (salvo terminación del contrato).';

  // Insight clave para quien trabaja por turnos: los recargos HABITUALES
  // (nocturno, dominical, festivo) integran el salario para liquidar
  // prestaciones (salario variable, CST Art. 127). Un error común —y costoso—
  // es que el empleador liquide cesantías/prima solo sobre el básico.
  if (c.totalCOP && c.salario && c.totalCOP > c.salario * 1.05) {
    var promedio = c.totalCOP; // devengado real del mes (incluye recargos)
    resp +=
      '\n\n⚖️ **Ojo con tu base de prestaciones:** este mes devengaste **' +
      fCOP(promedio) +
      '** (con recargos), no solo tu básico de **' +
      fCOP(sal) +
      '**. Tus recargos habituales **cuentan para la base** de cesantías y prima (salario variable, CST Art. 127). ' +
      'Si te las liquidan solo sobre el básico, te están pagando de menos: preguntá con qué salario promedio te las calculan.';
  }

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

  // Escenario 5: Festivo diurno (date-aware, Ley 2466/2025: 80% hoy)
  var _Ds = c.ahora || new Date();
  var _fFd = rcFactor('diurnaFest', _Ds);
  var s5 = {
    label: 'Festivo diurno (+' + Math.round((_fFd - 1) * 100) + '%)',
    cop: vh * horas * _fFd,
    factor: _fFd
  };
  escenarios.push(s5);

  // Escenario 6: Festivo nocturno (date-aware: 115% hoy)
  var _fFn = rcFactor('noctFest', _Ds);
  var s6 = {
    label: 'Festivo nocturno (+' + Math.round((_fFn - 1) * 100) + '%)',
    cop: vh * horas * _fFn,
    factor: _fFn
  };
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
    // Mostrar todos en tabla
    resp += '| Escenario | Factor | Pago |\n|---|---|---|\n';
    for (var i = 0; i < escenarios.length; i++) {
      var s = escenarios[i];
      resp += '| ' + s.label + ' | ' + s.factor.toFixed(2) + 'x | ' + fCOP(s.cop) + ' |\n';
    }
    resp +=
      '\n💡 El mismo número de horas puede pagar hasta ' +
      fCOP(escenarios[5].cop) +
      ' si las hacés en festivo nocturno.';
  }

  // Proyección mensual en tabla
  resp += '\n\n📅 **Proyección mensual** (si hicieras ' + horas + 'h/semana de cada tipo):\n\n';
  resp += '| Tipo | Al mes |\n|---|---|\n';
  for (var j = 0; j < 3; j++) {
    var sm = escenarios[j * 2]; // solo algunos
    resp += '| ' + sm.label + ' | ' + fCOP(sm.cop * 4) + ' |\n';
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

  // Opción B: Domingos/Festivos diurnos (8h) — factor date-aware (Ley 2466/2025)
  var _fDom = rcFactor('diurnaFest', c.ahora || new Date());
  var valorTurnoDomingo = vh * _fDom * 8;
  var turnosDomingos = Math.ceil(metaExtra / valorTurnoDomingo);
  resp += '⛪ **Opción B: ' + turnosDomingos + ' turnos dominicales/festivos**\n';
  resp +=
    'Trabajando un domingo de día (recargo ' +
    Math.round((_fDom - 1) * 100) +
    '%), cada turno de 8h te paga ' +
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

  // Declaración de renta: obligado si los ingresos brutos anuales superan
  // 1.400 UVT (Art. 592 ET). UVT 2026 = $52.374 (Resolución DIAN 000238/2025).
  var uvt = typeof UVT_2026 === 'number' ? UVT_2026 : 52374;
  var topeRenta = 1400 * uvt; // ~$73,3M
  var enRenta = ingresoTotal > topeRenta;

  resp += '• Ingreso anual estimado: ' + fCOP(ingresoTotal) + '\n';
  resp += '• Tope para declarar (1.400 UVT): ' + fCOP(topeRenta) + '\n';
  resp +=
    '• ¿Debe declarar renta?: ' +
    (enRenta
      ? 'Posiblemente sí — superás el tope de ingresos'
      : 'No por ingresos (revisá igual patrimonio y consumos)') +
    '\n\n';

  resp += '**Deducciones estimadas:**\n';
  resp += '• Aportes salud (4%): ' + fCOP(c.totalCOP * 0.04 * 12) + '/año\n';
  resp += '• Aportes pensión (4%): ' + fCOP(c.totalCOP * 0.04 * 12) + '/año\n';
  resp += '• Total deducible: ' + fCOP(c.totalCOP * 0.08 * 12) + '/año\n\n';

  resp +=
    '💡 Los aportes a salud y pensión son deducibles de la base de retención. Si ganás menos de 2 SMMLV, no te retienen. Si tu empleador no te está afiliando, exigilo — es tu derecho.\n\n' +
    'También declarás si tu patrimonio bruto supera 4.500 UVT (' +
    fCOP(4500 * uvt) +
    ') o tus consumos/consignaciones pasan de 1.400 UVT.';

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
  // Proyectar las horas a MES COMPLETO. Antes usaba c.totalMins (mes a la
  // fecha) → el día 13 mostraba "≈75h", subestimando la carga real.
  var horasMTD = c.totalMins > 0 ? c.totalMins / 60 : 0;
  var ratioProy = c.totalCOP > 0 && c.proy > 0 ? c.proy / c.totalCOP : 1;
  var horasMes =
    horasMTD > 0 ? Math.round(horasMTD * ratioProy) : c.diasTrab > 0 ? c.diasTrab * 8 : 240;

  var resp = '⚖ **Comparador de ofertas**\n\n';

  resp += '**Tu situación actual:**\n';
  resp += '• Salario: ' + fCOP(actualMensual) + ' → ' + fCOP(actualVH) + '/h\n';
  resp += '• Horas/mes (estimadas): ≈' + horasMes + 'h\n\n';

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
      'Sobre la base legal de 240h/mes, son ' +
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
// 11. INDEMNIZACIÓN POR DESPIDO SIN JUSTA CAUSA (Art. 64 CST)
// ═══════════════════════════════════════════════════════════════
// Contrato a término indefinido. Para salarios < 10 SMMLV:
//   · 30 días de salario por el primer año (proporcional la fracción)
//   · 20 días por cada año adicional (y proporcional)
// Para salarios >= 10 SMMLV: 20 días primer año + 15 por año adicional.
// La base es el salario ordinario mensual (no el devengado con recargos).

function aiAdvisorIndemnizacion(c, anios) {
  if (!c || !c.salario) {
    return 'Para estimar tu indemnización por despido sin justa causa necesito tu salario base. Configuralo en **Ajustes > Preferencias de pago** o decime "mi salario es de X".';
  }
  var sal = c.salario || SMIN;
  var ant = typeof anios === 'number' && anios > 0 ? anios : 1;
  var salDiario = sal / 30;

  // Tabla del Art. 64 según rango salarial
  var esAlto = sal >= SMIN * 10;
  var diasPrimerAnio = esAlto ? 20 : 30;
  var diasAnioAdic = esAlto ? 15 : 20;

  var dias;
  if (ant <= 1) {
    dias = diasPrimerAnio * ant; // proporcional la fracción del primer año
  } else {
    dias = diasPrimerAnio + diasAnioAdic * (ant - 1);
  }
  var indemn = salDiario * dias;

  var resp = '🛡️ **Indemnización por despido sin justa causa**\n\n';
  resp += '*(Contrato a término indefinido · Art. 64 CST)*\n\n';
  resp += '• Salario base: ' + fCOP(sal) + '\n';
  resp += '• Antigüedad estimada: ' + (ant === 1 ? '1 año' : ant + ' años') + '\n';
  resp += '• Días reconocidos: ' + dias.toFixed(0) + ' días de salario\n';
  resp += '• **Indemnización estimada: ' + fCOP(indemn) + '**\n\n';
  resp +=
    '💡 Esto es *adicional* a tu liquidación (cesantías, prima y vacaciones, que se pagan siempre). ' +
    'Si te despiden sin justa causa también te deben la indemnización. ' +
    'Decime cuántos años llevás (ej. "/indemnizacion 3") para afinar el cálculo, ' +
    'o pedime la **liquidación** completa.';

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 12. FONDO DE EMERGENCIA (colchón financiero)
// ═══════════════════════════════════════════════════════════════
// Regla práctica: 3 a 6 meses de gastos. Sin datos de gasto, se usa
// el ingreso mensual como proxy conservador del costo de vida.

function aiAdvisorEmergencia(c) {
  if (!c || (!c.proy && !c.totalCOP && !c.salario)) {
    return 'Para armar tu fondo de emergencia necesito una idea de tu ingreso mensual. Registrá algunos turnos o configurá tu salario base.';
  }
  var ingreso = c.proy || c.totalCOP || c.salario || SMIN;
  var minimo = ingreso * 3;
  var ideal = ingreso * 6;
  // Plan realista: el colchón mínimo (3 meses) en 1 año = 25% del
  // ingreso. Liderar con esto evita la trampa de pedir el 50% que exige
  // armar 6 meses de colchón en 12 (matemáticamente siempre la mitad).
  var ahorroReal = minimo / 12;
  var pctReal = ingreso > 0 ? (ahorroReal / ingreso) * 100 : 0;

  var resp = '🧯 **Fondo de emergencia**\n\n';
  resp += '• Ingreso mensual de referencia: ' + fCOP(ingreso) + '\n';
  resp += '• Colchón mínimo (3 meses): ' + fCOP(minimo) + '\n';
  resp += '• Colchón ideal (6 meses): ' + fCOP(ideal) + '\n\n';
  resp +=
    '🎯 Plan realista: apartá **' +
    fCOP(ahorroReal) +
    '/mes** (' +
    pctReal.toFixed(1) +
    '% de tu ingreso) y en 1 año cubrís el colchón mínimo. ' +
    'Manteniendo ese ritmo ~24 meses llegás al colchón ideal.\n\n';
  resp +=
    '⚠️ Armar los 6 meses en un solo año exigiría apartar el 50% del ingreso — poco realista. ' +
    'Mejor un ritmo sostenible que no abandones a los 2 meses.\n\n';

  resp +=
    '💡 El fondo de emergencia va en una cuenta aparte y líquida — no lo mezclés con el ahorro de metas. ' +
    'Es tu red para un mes sin turnos, una enfermedad o un imprevisto.\n\n' +
    '¿Te armo el **presupuesto 50/30/20** o miramos tu **capacidad de cuota**?';

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 13. CAPACIDAD DE ENDEUDAMIENTO (cuota sana)
// ═══════════════════════════════════════════════════════════════
// Regla del 30%: la suma de cuotas no debería superar el 30% del
// ingreso neto mensual. Opcionalmente evalúa una cuota deseada.

function aiAdvisorEndeudamiento(c, cuotaDeseada) {
  if (!c || (!c.proy && !c.totalCOP && !c.salario)) {
    return 'Para calcular tu capacidad de cuota necesito una idea de tu ingreso mensual. Registrá turnos o configurá tu salario.';
  }
  var bruto = c.proy || c.totalCOP || c.salario || SMIN;
  var neto = bruto * 0.92; // tras salud y pensión (8%)
  var cuotaMax = neto * 0.3;

  var resp = '🏦 **Capacidad de endeudamiento**\n\n';
  resp += '• Ingreso mensual estimado: ' + fCOP(bruto) + '\n';
  resp += '• Ingreso neto (tras 8% de ley): ' + fCOP(neto) + '\n';
  resp += '• **Cuota mensual sana (máx 30%): ' + fCOP(cuotaMax) + '**\n\n';

  if (typeof cuotaDeseada === 'number' && cuotaDeseada > 0) {
    var pct = neto > 0 ? (cuotaDeseada / neto) * 100 : 0;
    resp += 'Para una cuota de ' + fCOP(cuotaDeseada) + ':\n';
    resp += '• Representa el ' + pct.toFixed(1) + '% de tu ingreso neto.\n';
    if (pct > 40) {
      resp +=
        '🔴 Riesgo alto de sobreendeudamiento. Esa cuota compromete demasiado tu ingreso.\n\n';
    } else if (pct > 30) {
      resp += '🟡 Justo en el límite. Manejable, pero deja poco margen para imprevistos.\n\n';
    } else {
      resp += '🟢 Saludable. Cabe dentro de tu capacidad sin ahogar tu presupuesto.\n\n';
    }
  }

  resp +=
    '💡 La cuota máxima es la suma de **todas** tus deudas (tarjetas, créditos, electrodomésticos). ' +
    'Pasar del 30% te deja sin aire ante un mes flojo de turnos.\n\n' +
    '¿Querés que reparta tu sueldo con la regla **50/30/20** o que armemos tu **fondo de emergencia**?';

  return resp;
}

// ═══════════════════════════════════════════════════════════════
// 14. PRESUPUESTO PERSONALIZADO (regla 50/30/20)
// ═══════════════════════════════════════════════════════════════
// La pieza base de cualquier asesor: cómo repartir el sueldo. Se
// calcula sobre el ingreso NETO (lo que realmente llega al bolsillo)
// y conecta con el resto de herramientas (fondo de emergencia, cuota).
// ingresoOverride permite el diálogo: "¿y si gano 2 millones?".

function aiAdvisorPresupuesto(c, ingresoOverride) {
  var bruto =
    typeof ingresoOverride === 'number' && ingresoOverride > 0
      ? ingresoOverride
      : c
        ? c.proy || c.totalCOP || c.salario || 0
        : 0;
  if (!bruto) {
    return 'Para armar tu presupuesto necesito una idea de tu ingreso mensual. Registrá algunos turnos, configurá tu salario o decime cuánto ganás (ej. "mi sueldo es de 2 millones").';
  }

  var neto = Math.round(bruto * 0.92); // tras salud y pensión (8%)
  var nec = Math.round(neto * 0.5);
  var gustos = Math.round(neto * 0.3);
  var ahorro = Math.round(neto * 0.2);

  var resp = '📒 **Tu presupuesto — regla 50/30/20**\n\n';
  resp += 'Sobre tu ingreso neto de ' + fCOP(neto) + ' (ya restado el 8% de ley):\n\n';
  resp += '• 🏠 **50% Necesidades: ' + fCOP(nec) + '**\n';
  resp += '   arriendo, comida, servicios, transporte, salud\n';
  resp += '• 🎉 **30% Gustos: ' + fCOP(gustos) + '**\n';
  resp += '   salidas, ropa, antojos, lo que disfrutás\n';
  resp += '• 💰 **20% Ahorro y deudas: ' + fCOP(ahorro) + '**\n';
  resp += '   fondo de emergencia, metas, cuotas de crédito\n\n';

  resp +=
    '💡 Si estás arrancando, de ese 20% mandá primero al **fondo de emergencia** hasta juntar 3 meses de colchón; ' +
    'después repartilo entre metas y abono a deudas. ¿Calculamos tu fondo de emergencia o tu capacidad de cuota?';

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

    case 'indemnizacion':
      return aiAdvisorIndemnizacion(c, (state && state.anios) || 1);

    case 'emergencia':
      return aiAdvisorEmergencia(c);

    case 'endeudamiento':
      return aiAdvisorEndeudamiento(c, (state && state.cuota) || 0);

    case 'comparar_oferta':
      if (state && state.ofertaSalario) {
        return aiAdvisorCompararOfertas(c, state.ofertaSalario, state.ofertaHoras || 0);
      }
      return null;

    case 'fiscal':
      return aiAdvisorFiscal(c);

    case 'presupuesto':
      return aiAdvisorPresupuesto(c, (state && state.ingreso) || 0);

    case 'total_ganado':
    case 'stats':
      return aiAdvisorInforme(c) + aiAdvisorDescansoOptimo(c);

    default:
      return null;
  }
}

// ─── VERIFICADOR DE PAGO JUSTO (auditoría de nómina) ──────────
// "¿Me están pagando bien?" Compara lo que te pagaron contra lo que la
// ley manda por TUS turnos reales del mes (doCalc ya aplica todos los
// recargos), señala qué recargo se está quedando sin pagar y cita la
// norma (CST). Inspirado en apps de detección de wage theft (OverPay,
// WageWatch), adaptado al marco colombiano. Devuelve { text, card }.
function aiAuditarPago(c, montoPagado, periodoLabel) {
  if (!c) return { text: 'No tengo datos para verificar tu pago.', card: null };
  var per = periodoLabel || 'este mes';
  var vh = c.vh || 0;
  var owed = c.totalCOP || 0;
  var bd = c.bd || {};

  if (vh <= 0) {
    return {
      text:
        'Para revisar si te pagan bien necesito tu **salario base** configurado (Ajustes). ' +
        'Con eso calculo lo que te corresponde por tus turnos y lo comparo con lo que te pagaron.',
      card: null
    };
  }
  if (owed <= 0 || !c.diasTrab) {
    return {
      text:
        'Todavía no tengo turnos tuyos en ' +
        per +
        ' para verificar. Registrá tus turnos ' +
        '(o decime "registrá un turno ayer de 8 a 4") y te digo si te están pagando lo justo.',
      card: null
    };
  }

  // Premium (recargo sobre el básico) por grupo: cop - base
  function premio(cats) {
    var cop = 0;
    var mins = 0;
    for (var i = 0; i < cats.length; i++) {
      var x = bd[cats[i]];
      if (x) {
        cop += x.cop || 0;
        mins += x.mins || 0;
      }
    }
    return cop - (mins / 60) * vh;
  }
  var noctPrem = premio(['noctOrd']);
  var festPrem = premio(['diurnaFest', 'noctFest']);
  var extraPrem = premio(['extraDiurna', 'extraNoct', 'extraFestDiur', 'extraFestNoct']);
  var minsTot = 0;
  for (var k in bd) {
    if (Object.prototype.hasOwnProperty.call(bd, k) && bd[k]) minsTot += bd[k].mins || 0;
  }
  var recargosTotal = owed - (minsTot / 60) * vh;

  var _Dh = c.ahora || new Date();
  var _domPct = Math.round(getRecargoFestivo(_Dh) * 100); // 80 hoy (Ley 2466/2025)
  function lineasRecargos() {
    var filas = [];
    if (noctPrem > 1) {
      filas.push(
        '| 🌙 Recargo nocturno +35% | CST Art. 168 · Ley 2466/2025 | ' +
          fCOP(Math.round(noctPrem)) +
          ' |'
      );
    }
    if (festPrem > 1) {
      filas.push(
        '| ⛪ Recargo dominical/festivo +' +
          _domPct +
          '% | CST Art. 179-180 · Ley 2466/2025 | ' +
          fCOP(Math.round(festPrem)) +
          ' |'
      );
    }
    if (extraPrem > 1) {
      filas.push('| ⏱ Horas extra | CST Art. 159 | ' + fCOP(Math.round(extraPrem)) + ' |');
    }
    if (!filas.length) return '';
    return '\n\n| Recargo | Base legal | Valor |\n|---|---|---|\n' + filas.join('\n');
  }

  // Sin monto declarado: explicar y mostrar lo que le corresponde.
  if (!montoPagado || montoPagado < 10000) {
    var msg =
      '🔍 **Verificador de pago justo**\n\n' +
      'Por tus turnos de ' +
      per +
      ', la ley dice que te corresponden **' +
      fCOP(owed) +
      '**. De eso, **' +
      fCOP(Math.round(recargosTotal)) +
      '** son recargos que tu empleador debe pagarte aparte del básico:' +
      lineasRecargos() +
      '\n\nDecime cuánto te pagaron y lo comparo (ej. *"me pagaron 900 mil este mes"*).';
    return { text: msg, card: null };
  }

  var gap = owed - montoPagado;
  var tol = Math.max(3000, owed * 0.01);
  var card = {
    kind: 'audit',
    owed: owed,
    paid: montoPagado,
    gap: gap
  };

  if (gap <= tol) {
    card.status = montoPagado > owed + tol ? 'over' : 'ok';
    if (card.status === 'over') {
      return {
        text:
          '✅ Te pagaron **' +
          fCOP(montoPagado) +
          '** y por tus turnos te correspondían **' +
          fCOP(owed) +
          '**. Te pagaron ' +
          fCOP(montoPagado - owed) +
          ' de más — seguramente auxilio de transporte u otros conceptos. Todo en orden. 👍',
        card: card
      };
    }
    return {
      text:
        '✅ **Te están pagando bien.** Te pagaron ' +
        fCOP(montoPagado) +
        ' y por tus turnos te correspondían ' +
        fCOP(owed) +
        '. La diferencia es por redondeo, nada que reclamar. 🙌',
      card: card
    };
  }

  // Subpago detectado
  card.status = 'under';
  var pct = owed > 0 ? Math.round((gap / owed) * 100) : 0;
  var out =
    '⚠️ **Parece que te están pagando de menos.**\n\n' +
    'Por tus turnos de ' +
    per +
    ' te corresponden **' +
    fCOP(owed) +
    '** (con recargos de ley). Te pagaron **' +
    fCOP(montoPagado) +
    '**.\n\n' +
    '👉 Te faltarían **' +
    fCOP(gap) +
    '** (' +
    pct +
    '% por debajo).\n\n' +
    'Esto es lo que la ley te garantiza y conviene verificar que te lo paguen:' +
    lineasRecargos() +
    '\n\n📅 Tenés hasta **3 años** para reclamar lo que te deben (prescripción laboral, ' +
    'CST Art. 488-489). Guardá tus comprobantes de pago como soporte.';
  return { text: out, card: card };
}

// ─── OPTIMIZADOR DE INGRESOS PREDICTIVO ───────────────────────
// "¿Qué turno me conviene?" Mira hacia adelante: cruza los multiplicadores
// legales (un domingo/festivo de noche paga 2.1x) con el PRÓXIMO festivo
// real y con el mejor día del propio historial. Conciso y accionable —
// nada de muros de texto. Inspirado en la palanca de ingresos de las apps
// de optimización para trabajadores por turnos (+10-20%/hora).
function aiOptimizarProximo(c) {
  if (!c || !c.vh) {
    return 'Configurá tu salario base en **Ajustes** y te digo qué turnos te rinden más.';
  }
  var vh = c.vh;
  function t8(factor) {
    return Math.round(vh * factor * 8);
  }
  var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  var _Do = c.ahora || new Date();
  var _fNoctFest = rcFactor('noctFest', _Do); // 2.15 hoy (Ley 2466/2025)
  var _fDiurFest = rcFactor('diurnaFest', _Do); // 1.80 hoy
  var lineas = [
    '💰 **Qué turno te rinde más** (8h, tu hora vale ' + fCOP(vh) + '):',
    '',
    '| Turno | Pago | Factor |',
    '|---|---|---|',
    '| 🌙⛪ Domingo/festivo noche | **' +
      fCOP(t8(_fNoctFest)) +
      '** | ' +
      _fNoctFest.toFixed(2) +
      'x |',
    '| ⛪ Domingo/festivo día | **' +
      fCOP(t8(_fDiurFest)) +
      '** | ' +
      _fDiurFest.toFixed(2) +
      'x |',
    '| 🌙 Noche entre semana | **' + fCOP(t8(1.35)) + '** | 1.35x |'
  ];

  var extra = [];

  // Oportunidad concreta más próxima: el siguiente festivo del calendario.
  if (c.proxFests && c.proxFests.length) {
    var f = c.proxFests[0];
    var fLbl = f.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    extra.push(
      '📅 Próximo festivo: **' +
        fLbl +
        '** — un turno ahí te deja ≈' +
        fCOP(t8(_fDiurFest)) +
        ' (≈' +
        fCOP(t8(_fDiurFest) - t8(1)) +
        ' más que un día normal).'
    );
  }

  // Personalización: el mejor día del propio historial.
  if (c.bestDowInfo && c.bestDowInfo.count > 0 && c.bestDowInfo.cop > 0) {
    extra.push('🏆 Tu mejor día hasta ahora ha sido el **' + dias[c.bestDowInfo.dia] + '**.');
  }

  var out = lineas.join('\n');
  if (extra.length) out += '\n\n' + extra.join('\n');
  out += '\n\n👉 Si podés elegir, apuntá a noches y festivos: las mismas horas te pagan mucho más.';
  return out;
}

// ─── DESPRENDIBLE DE NÓMINA (datos) ───────────────────────────
// Arma los datos de un comprobante de pago formal a partir de los turnos
// del mes: devengado por recargo (CST), deducciones (salud/pensión 4%),
// auxilio de transporte prorrateado y neto. Devuelve un objeto plano
// (el render a PDF vive en export-files.js). Sirve como soporte personal
// de ingresos (créditos, arriendos, trámites) — gratis, para el trabajador.
function buildDesprendibleData(c, nombre) {
  if (!c) return null;
  var bruto = c.totalCOP || 0;
  var bd = c.bd || {};
  var ahora = new Date();

  var orden = [
    'diurnaOrd',
    'noctOrd',
    'diurnaFest',
    'noctFest',
    'extraDiurna',
    'extraNoct',
    'extraFestDiur',
    'extraFestNoct'
  ];
  var devengado = [];
  for (var i = 0; i < orden.length; i++) {
    var k = orden[i];
    var x = bd[k];
    if (x && x.mins > 0 && typeof RC !== 'undefined' && RC[k]) {
      devengado.push({
        label: RC[k].label,
        mins: x.mins,
        factor: RC[k].factor,
        cop: Math.round(x.cop)
      });
    }
  }

  var salud = Math.round(bruto * 0.04);
  var pension = Math.round(bruto * 0.04);
  var aux = 0;
  var sal = c.salario || 0;
  if (sal > 0 && sal <= SMIN * 2) {
    var diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    var diasTrab = Math.min(c.diasTrab || 0, diasMes);
    aux = Math.round((AUX_TRANSPORTE_2026 / 30) * diasTrab);
  }
  var neto = bruto - salud - pension + aux;

  return {
    nombre: nombre || 'Trabajador',
    periodo: ahora.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    emitido: ahora.toLocaleString('es-CO'),
    diasTrab: c.diasTrab || 0,
    devengado: devengado,
    bruto: bruto,
    salud: salud,
    pension: pension,
    aux: aux,
    neto: neto
  };
}

// ─── MINI-RAZONAMIENTO DE ASESORÍA ───────────────────────────
// Una sola línea de "porqué te importa a vos" para fusionar a las
// respuestas de asesoría legal/financiera: encadena tu dato real →
// implicación → acción. Corto y específico (nada de muros). Devuelve
// '' si no hay nada relevante que decir (no naguea).
function aiMiniRazonamiento(c, intent) {
  if (!c) return '';
  var LEGAL = { ley: 1, laboral: 1, liquidacion: 1 };
  var FIN = {
    presupuesto: 1,
    ahorro: 1,
    fiscal: 1,
    simulacion: 1,
    optimizador: 1,
    comparativa_mes: 1,
    proyeccion: 1
  };
  if (!LEGAL[intent] && !FIN[intent]) return '';

  var vh = c.vh || 0;
  var bd = c.bd || {};
  function prem(cats) {
    var cop = 0;
    var min = 0;
    for (var i = 0; i < cats.length; i++) {
      var x = bd[cats[i]];
      if (x) {
        cop += x.cop || 0;
        min += x.mins || 0;
      }
    }
    return cop - (min / 60) * vh;
  }

  var razon = '';

  if (LEGAL[intent]) {
    var noctPrem = prem(['noctOrd', 'noctFest', 'extraNoct', 'extraFestNoct']);
    var festPrem = prem(['diurnaFest', 'noctFest', 'extraFestDiur', 'extraFestNoct']);
    if (c.hrsSemanales && c.hrsSemanales > 44) {
      razon =
        'Como ya pasás de 44h/semana, lo de más es hora extra: verificá que te lo paguen aparte (CST Art. 159).';
    } else if (noctPrem > vh && vh > 0) {
      razon =
        'Tenés bastante trabajo nocturno; ahí está el +35% que más se pierde si no lo liquidan — vale revisarlo.';
    } else if (festPrem > vh && vh > 0) {
      razon =
        'Trabajaste en domingo/festivo: ese +' +
        Math.round(getRecargoFestivo(c.ahora || new Date()) * 100) +
        '% debe ir aparte en tu pago (CST Art. 179-180 · Ley 2466/2025).';
    }
  }

  if (!razon && FIN[intent]) {
    if (c.proy && c.salario >= 500000 && c.proy > c.salario * 1.1) {
      razon =
        'Vas a cerrar ~' +
        fCOP(Math.round(c.proy - c.salario)) +
        ' por encima de tu salario base: ese excedente es ahorro potencial, apartalo antes de gastarlo.';
    } else if (c.proy && c.salario >= 500000 && c.proy < c.salario * 0.9) {
      razon =
        'Al ritmo actual cerrás por debajo de tu salario; un par de turnos nocturnos o un festivo cierran la brecha rápido.';
    } else if (c.copPorHoraReal && vh > 0 && c.copPorHoraReal > vh * 1.1) {
      razon =
        'Tu hora real (' +
        fCOP(c.copPorHoraReal) +
        ') ya supera tu base por los recargos: concentrá horas en noches/festivos para estirarla más.';
    }
  }

  return razon ? '\n\n💭 ' + razon : '';
}

// ─── EXPORT ──────────────────────────────────────────────────
window.aiMiniRazonamiento = aiMiniRazonamiento;
window.buildDesprendibleData = buildDesprendibleData;
window.aiOptimizarProximo = aiOptimizarProximo;
window.aiAuditarPago = aiAuditarPago;
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
window.aiAdvisorIndemnizacion = aiAdvisorIndemnizacion;
window.aiAdvisorEmergencia = aiAdvisorEmergencia;
window.aiAdvisorEndeudamiento = aiAdvisorEndeudamiento;
window.aiAdvisorPresupuesto = aiAdvisorPresupuesto;

console.log('[MT] ai-advisor.js cargado — asesor financiero offline completo ✓');
