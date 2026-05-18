// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai.js
//  Asistente IA
// ════════════════════════════════════════════════════════════════
function buildContext(state){
  var ahora=new Date();
  var iniMes=new Date(ahora.getFullYear(),ahora.getMonth(),1);
  var diasMes=new Date(ahora.getFullYear(),ahora.getMonth()+1,0).getDate();
  var diaActual=ahora.getDate();
  var turnosMes=state.turnos.filter(function(t){return new Date(t.inicio)>=iniMes;});
  var dias=calcPorDia(turnosMes, state.vh);
  var totalMins=state.calc.totalMins, totalCOP=state.calc.totalCOP;
  var diasTrab=dias.length;
  var prom=diasTrab>0?totalCOP/diasTrab:0;
  var promHoras=diasTrab>0?totalMins/diasTrab/60:0;
  var mejor=dias.length>0?dias.reduce(function(a,b){return b.cop>a.cop?b:a;},dias[0]):null;
  var festTrab=dias.filter(function(d){return d.fest;});
  var nocturnasMins=(state.calc.bd.noctOrd?.mins||0)+(state.calc.bd.extraNoct?.mins||0)+(state.calc.bd.noctFest?.mins||0)+(state.calc.bd.extraFestNoct?.mins||0);
  var festMins=(state.calc.bd.diurnaFest?.mins||0)+(state.calc.bd.noctFest?.mins||0)+(state.calc.bd.extraFestDiur?.mins||0)+(state.calc.bd.extraFestNoct?.mins||0);
  var extraMins=(state.calc.bd.extraDiurna?.mins||0)+(state.calc.bd.extraNoct?.mins||0)+(state.calc.bd.extraFestDiur?.mins||0)+(state.calc.bd.extraFestNoct?.mins||0);
  var extraCOP=(state.calc.bd.extraDiurna?.cop||0)+(state.calc.bd.extraNoct?.cop||0)+(state.calc.bd.extraFestDiur?.cop||0)+(state.calc.bd.extraFestNoct?.cop||0);
  var proy=diasTrab>0?(totalCOP/diaActual)*diasMes:0;
  var pctSalario=(totalCOP/state.salario)*100;
  return {
    totalMins:totalMins, totalCOP:totalCOP, diasTrab:diasTrab, diasMes:diasMes, diaActual:diaActual,
    prom:prom, promHoras:promHoras, mejor:mejor, festTrab:festTrab, festMins:festMins,
    nocturnasMins:nocturnasMins, extraMins:extraMins, extraCOP:extraCOP, proy:proy, pctSalario:pctSalario,
    salario:state.salario, dias:dias, ahora:ahora, bd:state.calc.bd
  };
}

function aiAnswer(question, state){
  var q=question.toLowerCase().trim();
  var c=buildContext(state);

  if(!q) return 'Pregúntame algo sobre tu mes.';

  if(/^(hola|buenas|hey|qué tal|qué hubo|saludos)/i.test(q))
    return '¡Hola! Soy tu asistente. Tengo acceso a todos tus turnos del mes. Pregúntame sobre tus ingresos, horas, festivos o cualquier dato.';

  if(c.diasTrab===0)
    return 'Aún no tienes turnos registrados este mes. Apenas inicies tu primer turno podré analizar tu información. 💼';

  if(/(cuánto|cuanto).*(gan|ingr|cobr|llev)|total.*(mes|ingreso)/i.test(q)){
    var bdLines=Object.keys(c.bd).filter(function(k){return c.bd[k].mins>0;}).map(function(k){
      return '• '+RC[k].label+': '+fCOP(c.bd[k].cop)+' ('+fDur(c.bd[k].mins)+')';
    }).join('\n');
    return 'Este mes llevas '+fCOP(c.totalCOP)+' brutos, distribuidos así:\n\n'+bdLines+'\n\nEso representa el '+c.pctSalario.toFixed(1)+'% de tu salario base.';
  }

  if(/(horas|tiempo).*(trab|reg|llev|mes)|cuant.*hora/i.test(q)){
    return 'Llevas '+fDur(c.totalMins)+' trabajadas en '+c.diasTrab+' turno'+(c.diasTrab!==1?'s':'')+'. Eso es un promedio de '+c.promHoras.toFixed(1)+'h por turno.';
  }

  if(/(extra|sobretiempo|adicional)/i.test(q)){
    if(c.extraMins===0) return 'No tienes horas extras este mes. Las horas extras se generan cuando superas las 46h semanales.';
    return 'Tienes '+fDur(c.extraMins)+' en horas extras, que te suman '+fCOP(c.extraCOP)+'. Recuerda que las extras se pagan con recargo entre 25% y 150% según la franja horaria.';
  }

  if(/(festiv|domingo|fest)/i.test(q)){
    if(c.festMins===0) return 'Aún no has trabajado en domingos ni festivos este mes.';
    return 'Has trabajado '+fDur(c.festMins)+' en domingos o festivos, en '+c.festTrab.length+' día'+(c.festTrab.length!==1?'s':'')+' diferentes. Estos días te pagan con recargo del 75% al 150% sobre tu hora base.';
  }

  if(/(nocturn|noche|noct|madrugad)/i.test(q)){
    if(c.nocturnasMins===0) return 'No has trabajado horas nocturnas este mes. El recargo nocturno aplica entre 9pm y 6am.';
    var pct=((c.nocturnasMins/c.totalMins)*100).toFixed(0);
    return 'Tienes '+fDur(c.nocturnasMins)+' nocturnas, que representan el '+pct+'% de tu tiempo total trabajado. Estas horas tienen un recargo del 35% mínimo.';
  }

  if(/(mejor|máximo|maxim|top|cuál.*día)/i.test(q) && c.mejor){
    var d=new Date(c.mejor.fecha+'T12:00:00');
    return 'Tu mejor día fue el '+d.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})+' con '+fCOP(c.mejor.cop)+' en '+fDur(c.mejor.mins)+'.'+(c.mejor.fest?' (Fue festivo, por eso pagó tan bien)':'');
  }

  if(/(promedio|prom|media)/i.test(q)){
    return 'Tu promedio diario es '+fCOP(c.prom)+' por turno trabajado, con '+c.promHoras.toFixed(1)+' horas en promedio.';
  }

  if(/(proyecc|ritmo|al cierr|fin de mes|fin mes|cuánto.*llegar|estim)/i.test(q)){
    var faltan=c.diasMes-c.diaActual;
    return 'Al ritmo actual ('+fCOP(c.prom)+'/turno) podrías cerrar el mes en '+fCOP(c.proy)+'. Te quedan '+faltan+' día'+(faltan!==1?'s':'')+' del mes y has trabajado '+c.diasTrab+'.';
  }

  if(/(salario|meta|base|sueldo)/i.test(q)){
    var falta=Math.max(0, c.salario-c.totalCOP);
    return 'Tu salario base es '+fCOP(c.salario)+' y llevas '+fCOP(c.totalCOP)+' ('+c.pctSalario.toFixed(1)+'%). Te faltan '+fCOP(falta)+' para llegar.';
  }

  if(/(día|turn|cuant.*día|cuant.*turn)/i.test(q)){
    return 'Has trabajado '+c.diasTrab+' día'+(c.diasTrab!==1?'s':'')+' este mes. Te quedan '+(c.diasMes-c.diaActual)+' días por delante.';
  }

  if(/(recarg|porcentaje|por qué.*paga|cómo.*calcul|ley)/i.test(q)){
    return 'Aplico la Ley 2101/2021:\n• Diurna ord. = base\n• Nocturna ord. = +35%\n• Festiva diurna = +75%\n• Festiva nocturna = +110%\n• Extra diurna = +25%\n• Extra nocturna = +75%\n• Extra fest. diurna = +100%\n• Extra fest. nocturna = +150%\n\nTodo sobre tu valor hora base de '+fCOP(c.salario/240)+'.';
  }

  if(/(resumen|análisis|analisis|cómo voy|como voy|panorama|estado)/i.test(q)){
    var faltan=c.diasMes-c.diaActual;
    var tip='';
    if(c.pctSalario>=100) tip='\n\n💪 Ya superaste tu salario base este mes.';
    else if(c.pctSalario>=80) tip='\n\n📈 Vas muy bien, cerca de la meta mensual.';
    else if(c.pctSalario>=50) tip='\n\n⚖️ Vas a buen ritmo, mitad de mes ideal.';
    else tip='\n\n📅 Aún estás en la primera mitad del mes.';
    return 'Resumen ejecutivo:\n\n• '+c.diasTrab+' turnos · '+fDur(c.totalMins)+'\n• Ingreso bruto: '+fCOP(c.totalCOP)+'\n• Promedio por turno: '+fCOP(c.prom)+'\n• Proyección al cierre: '+fCOP(c.proy)+'\n• Avance vs salario base: '+c.pctSalario.toFixed(1)+'%'+tip;
  }

  return 'Puedo ayudarte con datos sobre tu mes:\n\n• Cuánto has ganado y el desglose\n• Cuántas horas trabajaste\n• Tu mejor día\n• Horas extras, nocturnas o festivas\n• Tu ritmo y proyección al cierre\n• Cómo se calculan los recargos\n\nPrueba tocando una de las preguntas sugeridas arriba.';
}
