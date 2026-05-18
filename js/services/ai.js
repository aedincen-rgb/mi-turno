// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai.js
//  Motor de IA local 100% offline · 50+ capacidades
//  Sin red, sin LLM, sin dependencias externas
// ════════════════════════════════════════════════════════════════

// ─── NLP HELPERS ───────────────────────────────────────────────

function _aiNorm(s){
  return (s||'').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[¿¡?!.,;:\(\)\[\]"']/g,' ')
    .replace(/\s+/g,' ').trim();
}

function _aiHas(t){
  for(var i=1;i<arguments.length;i++){
    if(t.indexOf(arguments[i])>=0) return true;
  }
  return false;
}

function _aiAll(t,arr){
  for(var i=0;i<arr.length;i++) if(t.indexOf(arr[i])<0) return false;
  return true;
}

// Extrae primer número en texto. Soporta dígitos y palabras (uno..diez)
function _aiNum(t){
  var m=t.match(/(\d+(?:[.,]\d+)?)/);
  if(m) return parseFloat(m[1].replace(',','.'));
  var w={cero:0,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,quince:15,veinte:20,treinta:30};
  for(var k in w){ if(t.indexOf(k)>=0) return w[k]; }
  return null;
}

// ─── CONSTRUCCIÓN DE CONTEXTO ──────────────────────────────────

function buildContext(state){
  var ahora=new Date();
  var iniMes=new Date(ahora.getFullYear(),ahora.getMonth(),1);
  var diasMes=new Date(ahora.getFullYear(),ahora.getMonth()+1,0).getDate();
  var diaActual=ahora.getDate();
  var vh=state.vh||0;
  var salario=state.salario||SMIN;

  // Turnos del mes (state.turnos viene filtrado por mes)
  var turnosMes=(state.turnos||[]).filter(function(t){return new Date(t.inicio)>=iniMes && t.fin;});

  // Turnos absolutos (todos): usado para mes/semana pasados
  var turnosAll=state.turnosAll||state.turnos||[];

  // ── Mes actual ──
  var dias=calcPorDia(turnosMes, vh);
  var totalMins=state.calc.totalMins, totalCOP=state.calc.totalCOP;
  var diasTrab=dias.length;
  var prom=diasTrab>0?totalCOP/diasTrab:0;
  var promHoras=diasTrab>0?totalMins/diasTrab/60:0;
  var mejor=dias.length>0?dias.reduce(function(a,b){return b.cop>a.cop?b:a;},dias[0]):null;
  var peor=dias.length>0?dias.reduce(function(a,b){return b.cop<a.cop?b:a;},dias[0]):null;
  var festTrab=dias.filter(function(d){return d.fest;});
  var bd=state.calc.bd;
  var nocturnasMins=(bd.noctOrd.mins||0)+(bd.extraNoct.mins||0)+(bd.noctFest.mins||0)+(bd.extraFestNoct.mins||0);
  var nocturnasCOP=(bd.noctOrd.cop||0)+(bd.extraNoct.cop||0)+(bd.noctFest.cop||0)+(bd.extraFestNoct.cop||0);
  var festMins=(bd.diurnaFest.mins||0)+(bd.noctFest.mins||0)+(bd.extraFestDiur.mins||0)+(bd.extraFestNoct.mins||0);
  var festCOP=(bd.diurnaFest.cop||0)+(bd.noctFest.cop||0)+(bd.extraFestDiur.cop||0)+(bd.extraFestNoct.cop||0);
  var extraMins=(bd.extraDiurna.mins||0)+(bd.extraNoct.mins||0)+(bd.extraFestDiur.mins||0)+(bd.extraFestNoct.mins||0);
  var extraCOP=(bd.extraDiurna.cop||0)+(bd.extraNoct.cop||0)+(bd.extraFestDiur.cop||0)+(bd.extraFestNoct.cop||0);
  var diurnaOrdMins=bd.diurnaOrd.mins||0, diurnaOrdCOP=bd.diurnaOrd.cop||0;
  var proy=diasTrab>0?(totalCOP/diaActual)*diasMes:0;
  var pctSalario=(totalCOP/salario)*100;
  var falta=Math.max(0, salario-totalCOP);
  var horasParaMeta=vh>0?falta/vh:0;

  // ── Mes pasado ──
  var iniMesPasado=new Date(ahora.getFullYear(),ahora.getMonth()-1,1);
  var finMesPasado=new Date(ahora.getFullYear(),ahora.getMonth(),0);
  finMesPasado.setHours(23,59,59,999);
  var turnosMesPasado=turnosAll.filter(function(t){
    var d=new Date(t.inicio);
    return d>=iniMesPasado && d<=finMesPasado && t.fin;
  });
  var calcMesPasado=turnosMesPasado.length>0 ? doCalc(turnosMesPasado, null, finMesPasado, vh) : {totalMins:0,totalCOP:0,bd:{}};
  var diasTrabMesPasado=calcPorDia(turnosMesPasado, vh).length;

  // ── Semana actual (Lun-Dom) ──
  var iniSemana=semLun(ahora);
  var turnosSemana=turnosMes.filter(function(t){return new Date(t.inicio)>=iniSemana;});
  var diasSemana=calcPorDia(turnosSemana, vh);
  var totalCOPSemana=diasSemana.reduce(function(a,d){return a+d.cop;},0);
  var totalMinsSemana=diasSemana.reduce(function(a,d){return a+d.mins;},0);

  // ── Semana pasada ──
  var iniSemPas=new Date(iniSemana); iniSemPas.setDate(iniSemana.getDate()-7);
  var finSemPas=new Date(iniSemana); finSemPas.setMilliseconds(-1);
  var turnosSemPas=turnosAll.filter(function(t){
    var d=new Date(t.inicio);
    return d>=iniSemPas && d<=finSemPas && t.fin;
  });
  var diasSemPas=calcPorDia(turnosSemPas, vh);
  var totalCOPSemPas=diasSemPas.reduce(function(a,d){return a+d.cop;},0);
  var totalMinsSemPas=diasSemPas.reduce(function(a,d){return a+d.mins;},0);

  // ── Hoy / Ayer ──
  var hoyIni=new Date(ahora.getFullYear(),ahora.getMonth(),ahora.getDate());
  var ayerIni=new Date(hoyIni); ayerIni.setDate(hoyIni.getDate()-1);
  var turnosHoy=turnosMes.filter(function(t){return new Date(t.inicio)>=hoyIni;});
  var turnosAyer=turnosAll.filter(function(t){
    var d=new Date(t.inicio);
    return d>=ayerIni && d<hoyIni && t.fin;
  });
  var diasHoy=calcPorDia(turnosHoy, vh);
  var diasAyer=calcPorDia(turnosAyer, vh);
  var copHoy=diasHoy.reduce(function(a,d){return a+d.cop;},0);
  var minsHoy=diasHoy.reduce(function(a,d){return a+d.mins;},0);
  var copAyer=diasAyer.reduce(function(a,d){return a+d.cop;},0);
  var minsAyer=diasAyer.reduce(function(a,d){return a+d.mins;},0);

  // ── Turno más largo / corto ──
  var tLargo=null, tCorto=null;
  turnosMes.forEach(function(t){
    var dur=(new Date(t.fin)-new Date(t.inicio))/60000;
    if(dur<=0) return;
    if(!tLargo||dur>tLargo.dur) tLargo={t:t,dur:dur};
    if(!tCorto||dur<tCorto.dur) tCorto={t:t,dur:dur};
  });

  // ── Patrón día de semana (Lun=0 .. Dom=6) ──
  var dowMins=[0,0,0,0,0,0,0], dowCOP=[0,0,0,0,0,0,0], dowCount=[0,0,0,0,0,0,0];
  dias.forEach(function(d){
    var dt=new Date(d.fecha+'T12:00:00');
    var dow=(dt.getDay()+6)%7;
    dowMins[dow]+=d.mins; dowCOP[dow]+=d.cop; dowCount[dow]++;
  });
  var bestDow=0, worstDow=-1;
  for(var i=1;i<7;i++){
    if(dowCOP[i]>dowCOP[bestDow]) bestDow=i;
    if(dowCOP[i]>0 && (worstDow<0||dowCOP[i]<dowCOP[worstDow])) worstDow=i;
  }
  if(worstDow<0) worstDow=0;

  // ── Próximos festivos del año ──
  var festSet=getColombianHolidays(ahora.getFullYear());
  var proxFests=[];
  var probe=new Date(ahora); probe.setHours(0,0,0,0); probe.setDate(probe.getDate()+1);
  for(var n=0;n<366 && proxFests.length<5;n++){
    var key=probe.getFullYear()+'-'+probe.getMonth()+'-'+probe.getDate();
    if(festSet.has(key) && probe.getDay()!==0) proxFests.push(new Date(probe));
    probe.setDate(probe.getDate()+1);
    if(probe.getFullYear()!==ahora.getFullYear()) break;
  }

  // ── Velocidad efectiva (COP por hora trabajada real) ──
  var copPorHoraReal=totalMins>0 ? totalCOP/(totalMins/60) : vh;

  // ── Racha actual (días consecutivos trabajando, contando hacia atrás) ──
  var rachaActual=0;
  var probeR=new Date(ahora);
  for(var k=0;k<diasMes;k++){
    var keyR=probeR.getFullYear()+'-'+String(probeR.getMonth()+1).padStart(2,'0')+'-'+String(probeR.getDate()).padStart(2,'0');
    var trabajado=dias.some(function(d){return d.fecha===keyR;});
    if(trabajado) rachaActual++;
    else if(rachaActual>0) break;
    probeR.setDate(probeR.getDate()-1);
  }

  // ── Días hábiles restantes (no domingos ni festivos del calendario laboral, contando todos) ──
  var diasRestantes=diasMes-diaActual;

  return {
    // Tiempo
    ahora:ahora, diasMes:diasMes, diaActual:diaActual, diasRestantes:diasRestantes,
    // Configuración
    salario:salario, vh:vh,
    // Mes actual
    turnosMes:turnosMes, dias:dias,
    totalMins:totalMins, totalCOP:totalCOP, diasTrab:diasTrab,
    prom:prom, promHoras:promHoras,
    mejor:mejor, peor:peor,
    bd:bd,
    diurnaOrdMins:diurnaOrdMins, diurnaOrdCOP:diurnaOrdCOP,
    nocturnasMins:nocturnasMins, nocturnasCOP:nocturnasCOP,
    festMins:festMins, festCOP:festCOP, festTrab:festTrab,
    extraMins:extraMins, extraCOP:extraCOP,
    proy:proy, pctSalario:pctSalario,
    falta:falta, horasParaMeta:horasParaMeta,
    // Mes pasado
    totalCOPMesPasado:calcMesPasado.totalCOP||0,
    totalMinsMesPasado:calcMesPasado.totalMins||0,
    diasMesPasado:diasTrabMesPasado,
    // Semana actual
    totalCOPSemana:totalCOPSemana, totalMinsSemana:totalMinsSemana,
    diasSemanaCount:diasSemana.length,
    // Semana pasada
    totalCOPSemPas:totalCOPSemPas, totalMinsSemPas:totalMinsSemPas,
    diasSemPasCount:diasSemPas.length,
    // Hoy / ayer
    copHoy:copHoy, minsHoy:minsHoy, turnosHoy:turnosHoy.length,
    copAyer:copAyer, minsAyer:minsAyer, turnosAyer:turnosAyer.length,
    // Turnos extremo
    tLargo:tLargo, tCorto:tCorto,
    // Patrones
    dowMins:dowMins, dowCOP:dowCOP, dowCount:dowCount,
    bestDow:bestDow, worstDow:worstDow,
    // Festivos / extras
    proxFests:proxFests, copPorHoraReal:copPorHoraReal,
    // Rachas
    rachaActual:rachaActual
  };
}

// ─── HELPERS DE FORMATO ────────────────────────────────────────

var _DOW=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];

function _fechaLarga(fechaISO){
  var d=new Date(fechaISO+'T12:00:00');
  return d.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'});
}

function _bdLines(bd){
  return Object.keys(bd).filter(function(k){return bd[k].mins>0;}).map(function(k){
    return '• '+RC[k].label+': '+fCOP(bd[k].cop)+' ('+fDur(bd[k].mins)+')';
  }).join('\n');
}

function _trend(curr, prev){
  if(prev<=0) return curr>0?'+∞%':'sin cambio';
  var pct=((curr-prev)/prev)*100;
  var sig=pct>=0?'+':'';
  return sig+pct.toFixed(1)+'%';
}

// ─── MOTOR PRINCIPAL ───────────────────────────────────────────

function aiAnswer(question, state){
  var q=question.toLowerCase().trim();
  var t=_aiNorm(question);
  if(!q) return 'Pregúntame algo sobre tu mes.';

  // ── SLASH COMMANDS ──
  if(q==='/ayuda'||q==='/help'||q==='/?'){
    return '**Comandos disponibles:**\n• /ayuda · esta lista\n• /limpiar · borra la conversación\n• /capacidades · lista completa de funciones\n• /stats · resumen exprés del mes\n\n**Tip:** puedes preguntar en lenguaje natural. Soy 100% offline.';
  }
  if(q==='/capacidades'||q==='/funciones'||q==='/skills'){
    return '**Sé responder sobre:**\n\n📊 **Análisis del mes**\n• Total ganado · horas · turnos · mejor día · peor día\n• Horas extras · festivas · nocturnas · diurnas\n• Promedios · proyección · ritmo\n\n📅 **Periodos específicos**\n• Hoy · ayer · esta semana · semana pasada · mes pasado\n\n📈 **Comparativas**\n• Mes actual vs anterior · semana actual vs pasada\n\n🔮 **Predicciones**\n• Cuándo llego a la meta · cuánto si trabajo X horas más\n• Mejor/peor caso al cierre · simulación\n\n📌 **Patrones**\n• Día de semana más rentable · racha de días\n• Turno más largo / más corto · velocidad COP/h\n\n⚖️ **Legal Colombia**\n• Ley 2101/2021 · jornada nocturna · extras · máximo 46h\n• Próximos festivos\n\n💡 **Más**\n• Récords personales · motivación · ayuda app';
  }

  var c=buildContext(state);

  // ── /STATS ──
  if(q==='/stats'){
    return '⚡ **Stats exprés**\n• '+c.diasTrab+' turnos · '+fDur(c.totalMins)+'\n• '+fCOP(c.totalCOP)+' ('+c.pctSalario.toFixed(1)+'% meta)\n• Mejor día: '+(c.mejor?_fechaLarga(c.mejor.fecha):'—')+'\n• Proyección: '+fCOP(c.proy);
  }

  // ── INTERACCIÓN HUMANA ──
  if(_aiHas(t,'hola','buenas','hey','que tal','saludos','que hubo','holi','ola')){
    var hora=c.ahora.getHours();
    var saludo=hora<12?'¡Buenos días!':hora<19?'¡Buenas tardes!':'¡Buenas noches!';
    return saludo+' Soy tu asistente local 100% offline. Conozco tus turnos, recargos y proyecciones. **Tip:** escribe `/capacidades` para ver todo lo que sé hacer.';
  }
  if(_aiHas(t,'gracias','thanks','thx','genial','perfecto','excelente')){
    return '¡Con gusto! 🙌 Si necesitas otro dato, aquí estoy.';
  }
  if(_aiHas(t,'adios','chao','hasta luego','nos vemos','bye')){
    return '¡Hasta luego! Trabaja con pilas y descansa cuando puedas. ✦';
  }
  if(_aiHas(t,'quien eres','que eres','de donde','funcionas con internet','offline','online','sin internet')){
    return 'Soy un motor analítico 100% local. **No envío tus datos a ningún servidor**, todo se procesa en tu dispositivo. Conozco la Ley 2101/2021, los recargos colombianos, los festivos del año y tu historial completo.';
  }
  if(_aiHas(t,'broma','chiste','divierteme')){
    var chistes=[
      '¿Cómo se llama un turno nocturno que nunca termina? Hipotecario. 😅',
      '¿Por qué los recargos son tan honestos? Porque siempre te dan más de lo que pides.',
      'Mi jefe dice que no soy nada raro... aunque a las 3am, hasta los relojes lo dudan. ⏰'
    ];
    return chistes[Math.floor(Math.random()*chistes.length)];
  }

  // ── DATOS BASE: SIN TURNOS ──
  if(c.diasTrab===0 && !_aiHas(t,'recarg','ley','jornada','festiv','noctur','extra','salario','meta','ayuda','funcion','capacid','/')){
    return 'Aún no tienes turnos registrados este mes. Apenas inicies tu primer turno podré analizar tu información. 💼\n\nMientras tanto puedo explicarte sobre **recargos legales**, **jornada nocturna**, **horas extras** o **próximos festivos**.';
  }

  // ════════════════════════════════════════════════════════════
  //  PERIODOS ESPECÍFICOS
  // ════════════════════════════════════════════════════════════

  // Hoy
  if(_aiHas(t,'hoy') && !_aiHas(t,'mes','semana','ayer','llev')){
    if(c.minsHoy===0) return 'Hoy aún no has registrado turnos.';
    return 'Hoy llevas '+fDur(c.minsHoy)+' trabajados · '+fCOP(c.copHoy)+'.'+(c.turnosHoy>1?' En '+c.turnosHoy+' turnos.':'');
  }
  // Ayer
  if(_aiHas(t,'ayer','antier')){
    if(c.minsAyer===0) return 'No hay registros de ayer.';
    return 'Ayer trabajaste '+fDur(c.minsAyer)+' y ganaste '+fCOP(c.copAyer)+'.';
  }
  // Esta semana
  if(_aiHas(t,'esta semana','semana actual') || (_aiHas(t,'semana') && !_aiHas(t,'pasad','anterior','que viene','sigui'))){
    if(c.diasSemanaCount===0) return 'Esta semana aún no has trabajado.';
    return 'Esta semana llevas '+c.diasSemanaCount+' día'+(c.diasSemanaCount!==1?'s':'')+' · '+fDur(c.totalMinsSemana)+' · '+fCOP(c.totalCOPSemana)+'.';
  }
  // Semana pasada
  if(_aiHas(t,'semana pasad','semana anterior','semana previa')){
    if(c.diasSemPasCount===0) return 'No hay registros de la semana pasada.';
    return 'La semana pasada: '+c.diasSemPasCount+' día'+(c.diasSemPasCount!==1?'s':'')+' · '+fDur(c.totalMinsSemPas)+' · '+fCOP(c.totalCOPSemPas)+'.';
  }
  // Mes pasado
  if(_aiHas(t,'mes pasad','mes anterior','mes previo')){
    if(c.diasMesPasado===0) return 'No hay registros del mes pasado.';
    return 'El mes pasado: '+c.diasMesPasado+' día'+(c.diasMesPasado!==1?'s':'')+' · '+fDur(c.totalMinsMesPasado)+' · '+fCOP(c.totalCOPMesPasado)+'.';
  }

  // ════════════════════════════════════════════════════════════
  //  COMPARATIVAS
  // ════════════════════════════════════════════════════════════

  // Mes actual vs mes pasado
  if(_aiHas(t,'compar','vs','versus','contra') && (_aiHas(t,'mes pasad','anterior','mes previo') || _aiHas(t,'mes'))){
    if(c.totalCOPMesPasado===0) return 'No tengo datos del mes pasado para comparar.';
    var difCOP=c.totalCOP-c.totalCOPMesPasado;
    var tr=_trend(c.totalCOP, c.totalCOPMesPasado);
    var emoji=difCOP>=0?'📈':'📉';
    return emoji+' **Mes actual vs anterior:**\n• Ingresos: '+fCOP(c.totalCOP)+' vs '+fCOP(c.totalCOPMesPasado)+' ('+tr+')\n• Horas: '+fDur(c.totalMins)+' vs '+fDur(c.totalMinsMesPasado)+'\n• Días: '+c.diasTrab+' vs '+c.diasMesPasado+'\n\n'+(difCOP>=0?'Vas '+fCOP(Math.abs(difCOP))+' por delante.':'Vas '+fCOP(Math.abs(difCOP))+' por debajo, aún hay '+c.diasRestantes+' días.');
  }

  // Esta semana vs semana pasada
  if(_aiHas(t,'compar','vs') && _aiHas(t,'semana')){
    if(c.totalCOPSemPas===0 && c.totalCOPSemana===0) return 'No tengo registros recientes para comparar semanas.';
    var trS=_trend(c.totalCOPSemana, c.totalCOPSemPas);
    return '📊 **Esta semana vs pasada:**\n• '+fCOP(c.totalCOPSemana)+' vs '+fCOP(c.totalCOPSemPas)+' ('+trS+')\n• '+fDur(c.totalMinsSemana)+' vs '+fDur(c.totalMinsSemPas);
  }

  // Mejor que mes pasado?
  if(_aiHas(t,'mejor que','peor que','superado','superar') && _aiHas(t,'mes pasad','anterior')){
    if(c.totalCOPMesPasado===0) return 'No hay con qué comparar el mes pasado.';
    if(c.totalCOP>c.totalCOPMesPasado) return '✅ Sí, ya vas '+fCOP(c.totalCOP-c.totalCOPMesPasado)+' por encima del mes pasado.';
    var lf=c.totalCOPMesPasado-c.totalCOP;
    return '⏳ Te faltan '+fCOP(lf)+' ('+(lf/c.vh).toFixed(1)+'h aprox.) para igualar el mes pasado. Aún tienes '+c.diasRestantes+' días.';
  }

  // ════════════════════════════════════════════════════════════
  //  PREDICCIONES Y SIMULACIONES
  // ════════════════════════════════════════════════════════════

  // Simulación: "si trabajo X horas más"
  if(_aiHas(t,'si trabaj','si hago','si meto','cuanto si','cuanto ganaria','cuanto gano si') || (_aiNum(t)!==null && _aiHas(t,'mas','adicional','sumo','agreg'))){
    var hrs=_aiNum(t);
    if(hrs===null) hrs=4;
    var addCOP=hrs*c.vh*1.00; // diurna ord por defecto
    var addNoct=hrs*c.vh*1.35;
    var addExtra=hrs*c.vh*1.25;
    var addFest=hrs*c.vh*1.75;
    return 'Si trabajas **'+hrs+'h adicionales** te suman:\n• Diurna ordinaria: '+fCOP(addCOP)+'\n• Nocturna ordinaria: '+fCOP(addNoct)+'\n• Extra diurna: '+fCOP(addExtra)+'\n• Festiva diurna: '+fCOP(addFest)+'\n• Festiva nocturna: '+fCOP(hrs*c.vh*2.10)+'\n\nTotal mes proyectado con extras diurnas: '+fCOP(c.totalCOP+addExtra);
  }

  // Cuándo llego a la meta
  if(_aiHas(t,'cuando','cuando llego','cuanto falt','cuantas horas para','cuanto para llegar')){
    if(c.totalCOP>=c.salario) return '✅ Ya superaste tu salario base este mes en '+fCOP(c.totalCOP-c.salario)+'.';
    if(c.prom<=0) return 'Aún no tengo suficiente data para estimar cuándo llegas a la meta.';
    var diasFaltan=Math.ceil(c.falta/c.prom);
    return 'A tu ritmo actual ('+fCOP(c.prom)+'/turno) necesitas **aproximadamente '+diasFaltan+' turnos más** para llegar a '+fCOP(c.salario)+'.\n\nEso equivale a unas '+c.horasParaMeta.toFixed(1)+'h al valor hora base ('+fCOP(c.vh)+'/h).';
  }

  // Mejor caso / peor caso
  if(_aiHas(t,'mejor caso','peor caso','escenario','si todo sale bien','optimista','pesimista')){
    var optimista=c.totalCOP + (c.diasRestantes * c.mejor?.cop || 0);
    var pesimista=c.totalCOP + (c.diasRestantes * c.peor?.cop || 0);
    return '🔮 **Escenarios al cierre del mes** ('+c.diasRestantes+' días por delante):\n• Optimista (trabajas como tu mejor día): '+fCOP(optimista)+'\n• Conservador (ritmo actual): '+fCOP(c.proy)+'\n• Mínimo (solo turnos como el peor): '+fCOP(pesimista);
  }

  // Días hábiles / días que faltan
  if(_aiHas(t,'dias restant','dias falta','dias del mes','cuantos dias quedan','dias por delante')){
    return 'Quedan **'+c.diasRestantes+' días** del mes ('+c.diaActual+'/'+c.diasMes+'). Trabajaste '+c.diasTrab+'.';
  }

  // ════════════════════════════════════════════════════════════
  //  CORE INTENTS (mejorados)
  // ════════════════════════════════════════════════════════════

  // Total ganado
  if(_aiHas(t,'cuanto gan','cuanto cobr','cuanto llev','cuanto ingr','total ingres','ingreso mes','total mes') || (_aiHas(t,'total') && _aiHas(t,'gan','cop','plata','dinero')) || _aiAll(t,['cuanto','mes'])){
    return 'Este mes llevas **'+fCOP(c.totalCOP)+'** brutos, distribuidos así:\n\n'+_bdLines(c.bd)+'\n\nEso representa el '+c.pctSalario.toFixed(1)+'% de tu salario base.';
  }

  // Horas trabajadas
  if(_aiHas(t,'cuantas horas','horas mes','horas llev','tiempo trabajad','tiempo regist','cuanto trabaj') && !_aiHas(t,'extra','nocturn','festiv')){
    return 'Llevas **'+fDur(c.totalMins)+'** en '+c.diasTrab+' turno'+(c.diasTrab!==1?'s':'')+'. Promedio de '+c.promHoras.toFixed(1)+'h por turno. La velocidad efectiva real es '+fCOP(c.copPorHoraReal)+'/h (vs valor hora base '+fCOP(c.vh)+').';
  }

  // Horas extras
  if(_aiHas(t,'extra','sobretiempo','adicional','sobrejornad')){
    if(c.extraMins===0) return 'No tienes horas extras este mes. Las extras se generan al superar las **46h semanales**. Llevas '+fDur(c.totalMinsSemana)+' esta semana.';
    var pctExtra=((c.extraMins/c.totalMins)*100).toFixed(0);
    return 'Tienes **'+fDur(c.extraMins)+'** en extras que suman **'+fCOP(c.extraCOP)+'** ('+pctExtra+'% de tu tiempo total).\n\nLas extras se reparten así:\n• Extra diurna (+25%): '+fDur(c.bd.extraDiurna.mins)+' · '+fCOP(c.bd.extraDiurna.cop)+'\n• Extra nocturna (+75%): '+fDur(c.bd.extraNoct.mins)+' · '+fCOP(c.bd.extraNoct.cop)+'\n• Extra fest. diurna (+100%): '+fDur(c.bd.extraFestDiur.mins)+' · '+fCOP(c.bd.extraFestDiur.cop)+'\n• Extra fest. nocturna (+150%): '+fDur(c.bd.extraFestNoct.mins)+' · '+fCOP(c.bd.extraFestNoct.cop);
  }

  // Festivos
  if(_aiHas(t,'festiv','domingo','fest') && !_aiHas(t,'proxim','siguient','que viene')){
    if(c.festMins===0) return 'Aún no has trabajado en domingos ni festivos este mes.\n\n'+(c.proxFests.length>0?'Próximo festivo: **'+c.proxFests[0].toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})+'**.':'');
    return 'Has trabajado **'+fDur(c.festMins)+'** en '+c.festTrab.length+' día'+(c.festTrab.length!==1?'s':'')+' festivos · **'+fCOP(c.festCOP)+'**.\n\nEsos pagan +75% (diurna) o +110% (nocturna). Si fueran extras, +100% / +150%.';
  }

  // Nocturnas
  if(_aiHas(t,'nocturn','noche','noct','madrugad','21','3am','de noche')){
    if(c.nocturnasMins===0) return 'No has trabajado horas nocturnas este mes. El recargo nocturno aplica de **9pm a 6am**.';
    var pctN=((c.nocturnasMins/c.totalMins)*100).toFixed(0);
    return 'Tienes **'+fDur(c.nocturnasMins)+'** nocturnas ('+pctN+'% de tu tiempo) · **'+fCOP(c.nocturnasCOP)+'**.\n\nEstas horas tienen recargo del **+35% mínimo** (ordinaria) hasta **+150%** (extra festiva nocturna).';
  }

  // Mejor día
  if(_aiHas(t,'mejor dia','mejor día','dia max','mas gane','top dia') && c.mejor){
    return '🏆 Tu mejor día fue el **'+_fechaLarga(c.mejor.fecha)+'** con **'+fCOP(c.mejor.cop)+'** en '+fDur(c.mejor.mins)+'.'+(c.mejor.fest?' (Fue festivo, por eso pagó tan bien)':'');
  }

  // Peor día
  if(_aiHas(t,'peor dia','peor día','dia min','menos gane','dia mas bajo','dia mas corto productiv') && c.peor){
    return 'Tu día más bajo fue el **'+_fechaLarga(c.peor.fecha)+'** con '+fCOP(c.peor.cop)+' en '+fDur(c.peor.mins)+'. Cada día cuenta. 💪';
  }

  // Promedio
  if(_aiHas(t,'promedio','media','promedi','prom diario','prom turno')){
    return 'Promedio por turno: **'+fCOP(c.prom)+'** · **'+c.promHoras.toFixed(1)+'h**.\nVelocidad efectiva (COP/hora real): **'+fCOP(c.copPorHoraReal)+'/h**.';
  }

  // Proyección
  if(_aiHas(t,'proyecc','ritmo','al cierr','fin de mes','fin mes','cuanto llegar','cuanto cierr','estim','prono')){
    return 'A tu ritmo actual ('+fCOP(c.prom)+'/turno · '+c.diasTrab+' turnos en '+c.diaActual+' días) podrías cerrar el mes en **'+fCOP(c.proy)+'**.\n\n'+(c.proy>=c.salario?'✅ Eso superaría tu salario base en '+fCOP(c.proy-c.salario):'⏳ Te faltarían '+fCOP(c.salario-c.proy)+' para llegar al salario base.');
  }

  // Salario / Meta
  if(_aiHas(t,'salario','meta','base','sueldo','objetivo')){
    return 'Salario base: **'+fCOP(c.salario)+'** · valor hora **'+fCOP(c.vh)+'**.\nLlevas '+fCOP(c.totalCOP)+' ('+c.pctSalario.toFixed(1)+'%) · te faltan **'+fCOP(c.falta)+'** ('+c.horasParaMeta.toFixed(1)+'h al valor base).';
  }

  // Días trabajados
  if(_aiHas(t,'cuantos dias','cuantos turn','dias trab','turnos llev')){
    return 'Has trabajado **'+c.diasTrab+' día'+(c.diasTrab!==1?'s':'')+'** ('+c.turnosMes.length+' turnos) este mes. Quedan **'+c.diasRestantes+' días** por delante.\n\nRacha actual: **'+c.rachaActual+' día'+(c.rachaActual!==1?'s':'')+' consecutivo'+(c.rachaActual!==1?'s':'')+'**.';
  }

  // Recargos legales
  if(_aiHas(t,'recarg','porcentaje','por que paga','como calcul','ley','ley 2101','jornada legal') && !_aiHas(t,'extra','noctur','jornada nocturn')){
    return '⚖️ **Ley 2101/2021 (Colombia)** · factores sobre valor hora base ('+fCOP(c.vh)+'):\n\n• Diurna ord. (6am-9pm) = ×1.00\n• Nocturna ord. (9pm-6am) = ×1.35 (+35%)\n• Festiva diurna = ×1.75 (+75%)\n• Festiva nocturna = ×2.10 (+110%)\n• Extra diurna = ×1.25 (+25%)\n• Extra nocturna = ×1.75 (+75%)\n• Extra fest. diurna = ×2.00 (+100%)\n• Extra fest. nocturna = ×2.50 (+150%)\n\n**Las extras** arrancan al superar 46h semanales (jornada máxima legal).';
  }

  // Jornada nocturna legal
  if(_aiHas(t,'jornada nocturn','que es nocturn','horario nocturn','desde que hora nocturn')){
    return 'La **jornada nocturna** en Colombia va de **9:00pm a 6:00am**. Cualquier minuto trabajado en esa franja recibe recargo del **+35%** sobre el valor hora base (Ley 2101/2021).';
  }

  // Qué cuenta como hora extra
  if(_aiHas(t,'que es extra','cuando es extra','desde cuando extra','que cuenta como extra')){
    return 'Las **horas extras** son las que superan la **jornada máxima legal de 46h semanales** (Ley 2101/2021, vigente desde 2023). Mi motor las suma por semana (lunes a domingo) y todo lo que pase de 46h se cuenta como extra. El recargo varía: +25% diurna, +75% nocturna, +100% festiva diurna, +150% festiva nocturna.';
  }

  // Máximo legal de horas
  if(_aiHas(t,'maximo legal','jornada maxima','horas maxim','cuantas horas semana','cuanto puedo trabaj')){
    return 'Jornada máxima legal: **46h semanales** (Ley 2101/2021). Esta semana llevas '+fDur(c.totalMinsSemana)+' de '+fDur(46*60)+'.\n\nTodo lo que pase de 46h se paga como **hora extra** con sus respectivos recargos.';
  }

  // ════════════════════════════════════════════════════════════
  //  PATRONES / ESTADÍSTICAS
  // ════════════════════════════════════════════════════════════

  // Día de la semana más rentable
  if(_aiHas(t,'dia de la semana','que dia gano mas','que dia mejor','dia mas product','dia mas rent')){
    if(c.dowCount[c.bestDow]===0) return 'Aún no tengo datos suficientes por día de semana.';
    var best=_DOW[c.bestDow], worst=_DOW[c.worstDow];
    return '📅 **Patrón semanal:**\n• Mejor día: **'+best+'** ('+fCOP(c.dowCOP[c.bestDow])+' acumulado · '+c.dowCount[c.bestDow]+' veces)\n• Día más bajo: '+worst+' ('+fCOP(c.dowCOP[c.worstDow])+')\n\nDistribución:\n'+_DOW.map(function(d,i){return '• '+d+': '+(c.dowCount[i]>0?fCOP(c.dowCOP[i])+' · '+c.dowCount[i]+'×':'sin registros');}).join('\n');
  }

  // Turno más largo
  if(_aiHas(t,'turno mas largo','jornada larga','turno mas extens','dia mas largo')){
    if(!c.tLargo) return 'Aún no tienes turnos cerrados este mes.';
    var dt=new Date(c.tLargo.t.inicio);
    return 'Tu turno más largo del mes fue el **'+dt.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})+'** con **'+fDur(c.tLargo.dur)+'**. '+(c.tLargo.dur>720?'⚠️ Más de 12h: cuídate y respeta los descansos.':'');
  }

  // Turno más corto
  if(_aiHas(t,'turno mas corto','turno mas breve','jornada corta')){
    if(!c.tCorto) return 'Aún no tienes turnos cerrados.';
    var dtc=new Date(c.tCorto.t.inicio);
    return 'Tu turno más corto fue el **'+dtc.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})+'** con '+fDur(c.tCorto.dur)+'.';
  }

  // Velocidad / COP por hora
  if(_aiHas(t,'velocid','cop por hora','copporhora','cop/h','valor real','plata por hora')){
    return 'Velocidad efectiva: **'+fCOP(c.copPorHoraReal)+'/h** (vs valor hora base '+fCOP(c.vh)+').\n\nDiferencia: '+(c.copPorHoraReal>c.vh?'+'+fCOP(c.copPorHoraReal-c.vh)+' por encima del base — los recargos están sumando bien.':'aún por debajo del base, normal si llevas pocas horas con recargo.');
  }

  // Racha
  if(_aiHas(t,'racha','dias seguidos','dias consecut','sin descansar')){
    if(c.rachaActual<=1) return 'No tienes racha activa. Tu última jornada fue '+(c.rachaActual===1?'hoy.':'hace más de un día.');
    return '🔥 Llevas **'+c.rachaActual+' días consecutivos** trabajando. '+(c.rachaActual>=6?'⚠️ Considera un día de descanso pronto.':'¡Muy buen ritmo!');
  }

  // Distribución porcentual / "donde se va mi tiempo"
  if(_aiHas(t,'distribuci','porcentaje recarg','donde va','desglose','porcent tiempo','por categ')){
    var lines=Object.keys(c.bd).filter(function(k){return c.bd[k].mins>0;}).map(function(k){
      var pctM=((c.bd[k].mins/c.totalMins)*100).toFixed(1);
      var pctC=((c.bd[k].cop/c.totalCOP)*100).toFixed(1);
      return '• '+RC[k].label+': '+pctM+'% tiempo · '+pctC+'% ingreso';
    }).join('\n');
    return '📊 **Distribución porcentual:**\n\n'+lines+'\n\nNocturnas + festivas + extras representan el '+(((c.nocturnasMins+c.festMins+c.extraMins-c.bd.noctFest.mins-c.bd.extraNoct.mins-c.bd.extraFestNoct.mins)/c.totalMins)*100).toFixed(0)+'% del tiempo pero pagan mucho más por su recargo.';
  }

  // Diurna vs nocturna comparativa
  if(_aiAll(t,['diurn','noctur']) || _aiHas(t,'gano mas de dia','gano mas de noche')){
    var copDia=c.diurnaOrdCOP+c.bd.diurnaFest.cop+c.bd.extraDiurna.cop+c.bd.extraFestDiur.cop;
    var copNoche=c.nocturnasCOP;
    return '☀ Diurnas: '+fCOP(copDia)+'\n☾ Nocturnas: '+fCOP(copNoche)+'\n\n'+(copNoche>copDia?'Estás ganando más en la **noche** este mes. El recargo +35% pega fuerte.':'Las diurnas dominan tus ingresos. Pero un par de turnos nocturnos suben rápido por el +35%.');
  }

  // ════════════════════════════════════════════════════════════
  //  PRÓXIMOS FESTIVOS
  // ════════════════════════════════════════════════════════════

  if(_aiHas(t,'proxim','siguient','que viene','prox') && _aiHas(t,'festiv','fest')){
    if(c.proxFests.length===0) return 'No quedan festivos en lo que resta del año.';
    var lf=c.proxFests.slice(0,3).map(function(d){
      var dias=Math.ceil((d-c.ahora)/(1000*60*60*24));
      return '• **'+d.toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})+'** (en '+dias+' día'+(dias!==1?'s':'')+')';
    }).join('\n');
    return '📅 **Próximos festivos:**\n\n'+lf+'\n\nEn festivos el recargo arranca en +75% (diurna). Si además son nocturnos o extras, puede llegar a +150%.';
  }

  // ════════════════════════════════════════════════════════════
  //  OPTIMIZACIÓN / RECOMENDACIONES
  // ════════════════════════════════════════════════════════════

  // Qué jornada me conviene
  if(_aiHas(t,'que jornada conviene','jornada mas rent','jornada paga mas','cual paga mas','mas rentable')){
    return '💰 **Ranking de rentabilidad** (sobre tu valor hora '+fCOP(c.vh)+'):\n\n1️⃣ Extra fest. nocturna: '+fCOP(c.vh*2.50)+'/h (+150%)\n2️⃣ Festiva nocturna: '+fCOP(c.vh*2.10)+'/h (+110%)\n3️⃣ Extra fest. diurna: '+fCOP(c.vh*2.00)+'/h (+100%)\n4️⃣ Festiva diurna: '+fCOP(c.vh*1.75)+'/h (+75%)\n5️⃣ Extra nocturna: '+fCOP(c.vh*1.75)+'/h (+75%)\n6️⃣ Nocturna ordinaria: '+fCOP(c.vh*1.35)+'/h (+35%)\n7️⃣ Extra diurna: '+fCOP(c.vh*1.25)+'/h (+25%)\n8️⃣ Diurna ordinaria: '+fCOP(c.vh)+'/h\n\n👉 Un turno **nocturno en festivo** paga **2.1×** un turno diurno normal.';
  }

  // ¿Debería tomar extras?
  if(_aiHas(t,'debo tomar extra','conviene extra','vale la pena extra','hago extras')){
    if(c.totalMinsSemana < 46*60){
      var faltaPara46=46*60-c.totalMinsSemana;
      return 'Esta semana llevas '+fDur(c.totalMinsSemana)+'. Te faltan **'+fDur(faltaPara46)+'** para llegar al límite de 46h. Hasta ese punto trabajas como ordinaria. Después, **toda hora vale +25% mínimo**.';
    }
    return 'Esta semana ya superaste las 46h, así que cada hora extra se está pagando con recargo (+25% mín). Cuídate del cansancio igual.';
  }

  // Descanso
  if(_aiHas(t,'descanso','descansar','cuanto descanso','necesito descans','fatig','cansad','agotad')){
    if(c.rachaActual>=6) return '⚠️ Llevas **'+c.rachaActual+' días consecutivos** trabajando. El cuerpo lo nota. Considera **un día completo de descanso** esta semana.';
    if(c.tLargo && c.tLargo.dur>=720) return 'Tu jornada más larga del mes fue de '+fDur(c.tLargo.dur)+'. Si vas a hacer un turno largo, asegura un buen descanso después.';
    return 'Vas bien. Te recomiendo siempre un descanso mínimo de 8h entre turnos y al menos 1 día libre semanal.';
  }

  // ════════════════════════════════════════════════════════════
  //  AYUDA APP
  // ════════════════════════════════════════════════════════════

  if(_aiHas(t,'como registr','como iniciar turno','como uso','como funciona','como inicio','iniciar turno')){
    return '✦ **Cómo usar Mi Turno:**\n1. Tab **Inicio** → toca el botón **Iniciar** para arrancar un turno.\n2. El cronómetro corre en tiempo real con cálculo de recargos.\n3. Toca **Parar** al terminar — se guarda en tu historial.\n4. Tab **Análisis** ve tu desempeño · Tab **Historial** exporta a PDF/Excel.';
  }
  if(_aiHas(t,'como export','exportar pdf','exportar excel','generar reporte')){
    return 'Tab **Historial** (icono reloj) → en la parte superior tienes **Exportar PDF** y **Exportar Excel**. Generan reportes mensuales con desglose por recargo, firmados con tu cuenta.';
  }
  if(_aiHas(t,'como cambio salario','cambiar salario','editar salario','configur salario')){
    return 'Tab **Ajustes** (engranaje) → toca el campo de **Salario base** y escribe el nuevo valor. Se aplica al instante a todos los cálculos.';
  }

  // ════════════════════════════════════════════════════════════
  //  RESUMEN EJECUTIVO
  // ════════════════════════════════════════════════════════════

  if(_aiHas(t,'resumen','analisis','como voy','panorama','estado','dame todo','reporte')){
    var tip='';
    if(c.pctSalario>=100) tip='\n\n💪 Ya superaste tu salario base este mes.';
    else if(c.pctSalario>=80) tip='\n\n📈 Vas muy bien, cerca de la meta mensual.';
    else if(c.pctSalario>=50) tip='\n\n⚖️ Vas a buen ritmo, mitad de mes ideal.';
    else if(c.diaActual>15) tip='\n\n⚡ Vas un poco atrás, aprovecha festivos y nocturnas.';
    else tip='\n\n📅 Aún estás en la primera mitad del mes.';
    var rachaLine=c.rachaActual>0?'\n• Racha: '+c.rachaActual+' día'+(c.rachaActual!==1?'s':'')+' seguido'+(c.rachaActual!==1?'s':''):'';
    var compLine='';
    if(c.totalCOPMesPasado>0){
      compLine='\n• vs mes pasado: '+_trend(c.totalCOP, c.totalCOPMesPasado);
    }
    return '📋 **Resumen ejecutivo:**\n\n• '+c.diasTrab+' turnos · '+fDur(c.totalMins)+'\n• Ingreso bruto: '+fCOP(c.totalCOP)+'\n• Promedio por turno: '+fCOP(c.prom)+'\n• Proyección al cierre: '+fCOP(c.proy)+'\n• Avance vs salario base: '+c.pctSalario.toFixed(1)+'%'+rachaLine+compLine+tip;
  }

  // ════════════════════════════════════════════════════════════
  //  FALLBACK
  // ════════════════════════════════════════════════════════════

  return '🤔 No estoy seguro de qué buscas. Algunas cosas que puedo responder:\n\n• "¿Cuánto gané hoy?" · "¿Y ayer?"\n• "Compara con mes pasado"\n• "¿Cuándo llego a la meta?"\n• "¿Cuánto si trabajo 4h más?"\n• "Mejor día de la semana"\n• "Próximos festivos"\n• "Mi racha"\n\n💡 Escribe **/capacidades** para ver todo lo que sé.';
}
