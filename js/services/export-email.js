// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/export-email.js
//  Exportar a base64 y enviar por email
// ════════════════════════════════════════════════════════════════
function exportPDFBase64(turnos, calc, salario){
  // Generar el PDF en memoria sin descargar, devolver base64
  var doc = new jspdf.jsPDF();
  var hoy = new Date();
  var mes = hoy.toLocaleDateString('es-CO',{month:'long',year:'numeric'});
  
  doc.setFontSize(18);
  doc.setTextColor(82,127,204);
  doc.text('Mi Turno · Colombia', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Reporte de turnos · '+mes, 14, 28);
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text('Salario base mensual: '+fCOP(salario), 14, 42);
  doc.text('Total devengado: '+fCOP(calc.total), 14, 50);
  doc.text('Horas trabajadas: '+fDur(calc.totalMin), 14, 58);
  doc.text('Días con turno: '+(turnos?turnos.length:0), 14, 66);
  
  if(turnos && turnos.length){
    var rows = turnos.slice().reverse().map(function(t){
      var ini = new Date(t.inicio);
      var fin = t.fin ? new Date(t.fin) : null;
      var dur = fin ? Math.round((fin-ini)/60000) : 0;
      return [
        ini.toLocaleDateString('es-CO',{day:'2-digit',month:'short'}),
        ini.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
        fin?fin.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}):'—',
        fDur(dur),
        fCOP(t.pago||0)
      ];
    });
    doc.autoTable({
      head: [['Fecha','Inicio','Fin','Duración','Pago']],
      body: rows,
      startY: 76,
      theme:'striped',
      headStyles:{fillColor:[82,127,204]},
      styles:{fontSize:9}
    });
  }
  
  // Output como base64 (sin el prefijo "data:application/pdf;base64,")
  var pdfBase64 = doc.output('datauristring').split(',')[1];
  return pdfBase64;
}

function exportExcelBase64(turnos, calc, salario){
  var wb = XLSX.utils.book_new();
  var hoy = new Date();
  
  var rows = [
    ['Mi Turno · Colombia'],
    ['Reporte: '+hoy.toLocaleDateString('es-CO',{month:'long',year:'numeric'})],
    [],
    ['Salario base mensual', salario],
    ['Total devengado', calc.total],
    ['Horas trabajadas', fDur(calc.totalMin)],
    ['Días con turno', turnos?turnos.length:0],
    [],
    ['Fecha','Inicio','Fin','Duración (min)','Pago (COP)']
  ];
  
  if(turnos && turnos.length){
    turnos.slice().reverse().forEach(function(t){
      var ini = new Date(t.inicio);
      var fin = t.fin ? new Date(t.fin) : null;
      var dur = fin ? Math.round((fin-ini)/60000) : 0;
      rows.push([
        ini.toLocaleDateString('es-CO'),
        ini.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
        fin?fin.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}):'—',
        dur,
        t.pago||0
      ]);
    });
  }
  
  var ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Turnos');
  
  // Exportar como base64
  var xlsxBase64 = XLSX.write(wb, {type:'base64', bookType:'xlsx'});
  return xlsxBase64;
}

async function enviarReportePorEmail(opts){
  // opts: {to, format, filename, fileBase64, subject?, message?}
  if(!SUPA||!CLOUD_MODE){
    throw new Error('Sin conexión a la nube');
  }
  
  // Obtener sesión actual
  var sessionRes = await SUPA.auth.getSession();
  if(!sessionRes.data.session){
    throw new Error('Debes iniciar sesión para enviar correos');
  }
  
  var token = sessionRes.data.session.access_token;
  var url = window.SUPABASE_CONFIG.url + '/functions/v1/send-report';
  
  var response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'apikey': window.SUPABASE_CONFIG.anonKey
    },
    body: JSON.stringify(opts)
  });
  
  var data = await response.json();
  
  if(!response.ok){
    throw new Error(data.error || 'Error enviando correo');
  }
  
  return data;
}

async function enviarPINPorEmail(opts){
  // opts: {to, pin, userName?}
  if(!SUPA||!CLOUD_MODE){
    throw new Error('Sin conexión a la nube');
  }
  var sessionRes = await SUPA.auth.getSession();
  if(!sessionRes.data.session){
    throw new Error('Debes iniciar sesión para enviar correos');
  }
  var token = sessionRes.data.session.access_token;
  var url = window.SUPABASE_CONFIG.url + '/functions/v1/send-pin';
  var response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'apikey': window.SUPABASE_CONFIG.anonKey
    },
    body: JSON.stringify(opts)
  });
  var data = await response.json();
  if(!response.ok){
    throw new Error(data.error || 'Error enviando correo');
  }
  return data;
}
