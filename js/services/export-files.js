// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/export-files.js
//  Exportar PDF y Excel locales
// ════════════════════════════════════════════════════════════════
function exportPDF(turnos, calc, salario) {
  if (!window.jspdf) {
    alert('PDF no disponible');
    return;
  }
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF();
  var ahora = new Date();
  var mes = ahora.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  doc.setFontSize(18);
  doc.text('Mi Turno · Reporte', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Período: ' + mes, 14, 27);
  doc.text('Generado: ' + ahora.toLocaleString('es-CO'), 14, 32);

  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Resumen del mes', 14, 44);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text('Total: ' + fCOP(calc.totalCOP), 14, 52);
  doc.text('Horas: ' + fDur(calc.totalMins), 14, 58);
  doc.text(
    'Salario base: ' +
      fCOP(salario) +
      ' · Avance: ' +
      ((calc.totalCOP / salario) * 100).toFixed(1) +
      '%',
    14,
    64
  );

  var rows = Object.keys(calc.bd)
    .filter(function (k) {
      return calc.bd[k].mins > 0;
    })
    .map(function (k) {
      return [
        RC[k].label,
        fDur(calc.bd[k].mins),
        '×' + RC[k].factor.toFixed(2),
        fCOP(calc.bd[k].cop)
      ];
    });
  doc.autoTable({
    startY: 72,
    head: [['Tipo', 'Horas', 'Factor', 'Pago']],
    body: rows,
    headStyles: {
      fillColor: [184, 150, 90],
      textColor: [255, 255, 255],
      fontSize: 10,
      halign: 'left'
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' } },
    theme: 'striped'
  });

  var fy = doc.lastAutoTable.finalY || 100;
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Detalle de turnos', 14, fy + 12);

  var iniMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  var turnosMes = turnos.filter(function (t) {
    return new Date(t.inicio) >= iniMes;
  });
  var turnoRows = turnosMes.map(function (t) {
    var ini = new Date(t.inicio),
      fin = new Date(t.fin);
    var mins = Math.round((fin - ini) / 60000);
    return [
      ini.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      fDur(mins),
      esFest(ini) ? 'Fest' : '—'
    ];
  });
  doc.autoTable({
    startY: fy + 16,
    head: [['Fecha', 'Entrada', 'Salida', 'Dur.', 'Tipo']],
    body: turnoRows,
    headStyles: { fillColor: [184, 150, 90], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    theme: 'striped'
  });

  doc.save('mi-turno-' + ahora.toISOString().slice(0, 10) + '.pdf');
}

// Desprendible de pago formal (colilla de nómina) a partir de los datos
// que arma buildDesprendibleData (ai-advisor.js). Solo render — el cálculo
// vive en la capa IA para poder testearlo sin navegador.
function exportDesprendiblePDF(data) {
  if (!window.jspdf) {
    alert('PDF no disponible');
    return;
  }
  if (!data) return;
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text('Desprendible de pago', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Mi Turno · Comprobante de nómina', 14, 26);
  doc.setTextColor(60);
  doc.text('Trabajador: ' + data.nombre, 14, 36);
  doc.text('Período: ' + data.periodo, 14, 42);
  doc.text('Emitido: ' + data.emitido, 14, 48);
  if (data.diasTrab) doc.text('Días trabajados: ' + data.diasTrab, 14, 54);

  var rows = data.devengado.map(function (d) {
    return [d.label, fDur(d.mins), '×' + d.factor.toFixed(2), fCOP(d.cop)];
  });
  doc.autoTable({
    startY: 62,
    head: [['Concepto (devengado)', 'Horas', 'Factor', 'Valor']],
    body: rows,
    foot: [['Total devengado', '', '', fCOP(data.bruto)]],
    headStyles: { fillColor: [91, 134, 229], textColor: [255, 255, 255], fontSize: 10 },
    footStyles: { fillColor: [235, 240, 250], textColor: [40, 40, 40], fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' } },
    theme: 'striped'
  });

  var y = doc.lastAutoTable.finalY || 100;
  var ded = [
    ['Salud (4%)', '-' + fCOP(data.salud)],
    ['Pensión (4%)', '-' + fCOP(data.pension)]
  ];
  if (data.aux > 0) ded.push(['Auxilio de transporte', '+' + fCOP(data.aux)]);
  doc.autoTable({
    startY: y + 8,
    head: [['Deducciones y otros', 'Valor']],
    body: ded,
    foot: [['Neto a recibir', fCOP(data.neto)]],
    headStyles: { fillColor: [91, 134, 229], textColor: [255, 255, 255], fontSize: 10 },
    footStyles: {
      fillColor: [91, 134, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    theme: 'striped'
  });

  var y2 = doc.lastAutoTable.finalY || y + 40;
  doc.setFontSize(7.5);
  doc.setTextColor(130);
  var nota =
    'Documento generado por Mi Turno a partir de los turnos registrados por el trabajador. ' +
    'Recargos calculados segun el Codigo Sustantivo del Trabajo (Arts. 168-180) y la Ley 2101/2021. ' +
    'Salud y pension (4% c/u) estimadas sobre el devengado. Este comprobante NO reemplaza el ' +
    'desprendible oficial del empleador; sirve como soporte personal de ingresos.';
  doc.text(doc.splitTextToSize(nota, 182), 14, y2 + 10);

  doc.save('desprendible-' + new Date().toISOString().slice(0, 10) + '.pdf');
}

function exportExcel(turnos, calc, salario) {
  if (!window.XLSX) {
    alert('Excel no disponible');
    return;
  }
  var ahora = new Date();
  var iniMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  var turnosMes = turnos.filter(function (t) {
    return new Date(t.inicio) >= iniMes;
  });

  var detalle = turnosMes.map(function (t) {
    var ini = new Date(t.inicio),
      fin = new Date(t.fin);
    var mins = Math.round((fin - ini) / 60000);
    return {
      Fecha: ini.toLocaleDateString('es-CO'),
      Entrada: ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      Salida: fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      Duracion: fDur(mins),
      Horas: Number((mins / 60).toFixed(2)),
      Festivo: esFest(ini) ? 'Sí' : 'No',
      Nocturno: esNoct(ini) ? 'Sí' : 'No'
    };
  });

  var desglose = Object.keys(calc.bd)
    .filter(function (k) {
      return calc.bd[k].mins > 0;
    })
    .map(function (k) {
      return {
        Tipo: RC[k].label,
        Horas: Number((calc.bd[k].mins / 60).toFixed(2)),
        Factor: RC[k].factor,
        Pago: Math.round(calc.bd[k].cop)
      };
    });

  detalle.push(
    {},
    {
      Fecha: 'TOTAL',
      Duracion: fDur(calc.totalMins),
      Horas: Number((calc.totalMins / 60).toFixed(2))
    }
  );

  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalle), 'Turnos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(desglose), 'Desglose');
  XLSX.writeFile(wb, 'mi-turno-' + ahora.toISOString().slice(0, 10) + '.xlsx');
}
