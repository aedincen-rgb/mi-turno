// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/export-files.js
//  Exportar PDF y Excel locales
// ════════════════════════════════════════════════════════════════
function exportPDF(turnos, calc, salario){
  if(!window.jspdf){alert('PDF no disponible');return;}
  var jsPDF=window.jspdf.jsPDF;
  var doc=new jsPDF();
  var ahora=new Date();
  var mes=ahora.toLocaleDateString('es-CO',{month:'long',year:'numeric'});

  doc.setFontSize(18); doc.text('Mi Turno · Reporte', 14, 20);
  doc.setFontSize(10); doc.setTextColor(120);
  doc.text('Período: '+mes, 14, 27);
  doc.text('Generado: '+ahora.toLocaleString('es-CO'), 14, 32);

  doc.setFontSize(14); doc.setTextColor(40);
  doc.text('Resumen del mes', 14, 44);
  doc.setFontSize(10); doc.setTextColor(80);
  doc.text('Total: '+fCOP(calc.totalCOP), 14, 52);
  doc.text('Horas: '+fDur(calc.totalMins), 14, 58);
  doc.text('Salario base: '+fCOP(salario)+' · Avance: '+((calc.totalCOP/salario)*100).toFixed(1)+'%', 14, 64);

  var rows=Object.keys(calc.bd).filter(function(k){return calc.bd[k].mins>0;}).map(function(k){
    return [RC[k].label, fDur(calc.bd[k].mins), '×'+RC[k].factor.toFixed(2), fCOP(calc.bd[k].cop)];
  });
  doc.autoTable({
    startY:72,
    head:[['Tipo','Horas','Factor','Pago']],
    body:rows,
    headStyles:{fillColor:[184,150,90],textColor:[255,255,255],fontSize:10,halign:'left'},
    bodyStyles:{fontSize:9},
    columnStyles:{1:{halign:'center'},2:{halign:'center'},3:{halign:'right'}},
    theme:'striped'
  });

  var fy=doc.lastAutoTable.finalY||100;
  doc.setFontSize(12); doc.setTextColor(40);
  doc.text('Detalle de turnos', 14, fy+12);

  var iniMes=new Date(ahora.getFullYear(),ahora.getMonth(),1);
  var turnosMes=turnos.filter(function(t){return new Date(t.inicio)>=iniMes;});
  var turnoRows=turnosMes.map(function(t){
    var ini=new Date(t.inicio), fin=new Date(t.fin);
    var mins=Math.round((fin-ini)/60000);
    return [
      ini.toLocaleDateString('es-CO',{day:'2-digit',month:'short'}),
      ini.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
      fin.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
      fDur(mins),
      esFest(ini)?'Fest':'—'
    ];
  });
  doc.autoTable({
    startY:fy+16,
    head:[['Fecha','Entrada','Salida','Dur.','Tipo']],
    body:turnoRows,
    headStyles:{fillColor:[184,150,90],textColor:[255,255,255],fontSize:9},
    bodyStyles:{fontSize:8},
    theme:'striped'
  });

  doc.save('mi-turno-'+ahora.toISOString().slice(0,10)+'.pdf');
}

function exportExcel(turnos, calc, salario){
  if(!window.XLSX){alert('Excel no disponible');return;}
  var ahora=new Date();
  var iniMes=new Date(ahora.getFullYear(),ahora.getMonth(),1);
  var turnosMes=turnos.filter(function(t){return new Date(t.inicio)>=iniMes;});

  var detalle=turnosMes.map(function(t){
    var ini=new Date(t.inicio), fin=new Date(t.fin);
    var mins=Math.round((fin-ini)/60000);
    return {
      Fecha:ini.toLocaleDateString('es-CO'),
      Entrada:ini.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
      Salida:fin.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
      Duracion:fDur(mins),
      Horas:Number((mins/60).toFixed(2)),
      Festivo:esFest(ini)?'Sí':'No',
      Nocturno:esNoct(ini)?'Sí':'No'
    };
  });

  var desglose=Object.keys(calc.bd).filter(function(k){return calc.bd[k].mins>0;}).map(function(k){
    return {Tipo:RC[k].label, Horas:Number((calc.bd[k].mins/60).toFixed(2)), Factor:RC[k].factor, Pago:Math.round(calc.bd[k].cop)};
  });

  detalle.push({}, {Fecha:'TOTAL', Duracion:fDur(calc.totalMins), Horas:Number((calc.totalMins/60).toFixed(2))});

  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalle), 'Turnos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(desglose), 'Desglose');
  XLSX.writeFile(wb, 'mi-turno-'+ahora.toISOString().slice(0,10)+'.xlsx');
}
