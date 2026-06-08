// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/export-email.js
//  Exportar a base64 y enviar por email
// ════════════════════════════════════════════════════════════════
function exportPDFBase64(turnos, calc, salario, session) {
  // Generar el PDF en memoria sin descargar, devolver base64
  var doc = new jspdf.jsPDF();
  var hoy = new Date();
  var mes = hoy.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  doc.setFontSize(18);
  doc.setTextColor(82, 127, 204);
  doc.text('Mi Turno · Colombia', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Reporte de turnos · ' + mes, 14, 28);

  // Línea de empleado y PIN (solo si hay sesión)
  var cursorY = 36;
  if (session) {
    var empleadoNombre = (session.pname) || (session.email) || 'Anónimo';
    var empleadoTexto = 'Empleado: ' + empleadoNombre;
    if (session.pin) empleadoTexto = empleadoTexto + '   PIN: ' + session.pin;
    doc.text(empleadoTexto, 14, cursorY);
    cursorY = 44;
  }

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text('Salario base mensual: ' + fCOP(salario), 14, cursorY);
  doc.text('Total devengado: ' + fCOP(calc.total), 14, cursorY + 8);
  doc.text('Horas trabajadas: ' + fDur(calc.totalMin), 14, cursorY + 16);
  doc.text('Días con turno: ' + (turnos ? turnos.length : 0), 14, cursorY + 24);

  if (turnos && turnos.length) {
    var rows = turnos
      .slice()
      .reverse()
      .map(function (t) {
        var ini = new Date(t.inicio);
        var fin = t.fin ? new Date(t.fin) : null;
        var dur = fin ? Math.round((fin - ini) / 60000) : 0;
        return [
          ini.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
          ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          fin ? fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
          fDur(dur),
          fCOP(t.pago || 0)
        ];
      });
    doc.autoTable({
      head: [['Fecha', 'Inicio', 'Fin', 'Duración', 'Pago']],
      body: rows,
      startY: cursorY + 32,
      theme: 'striped',
      headStyles: { fillColor: [82, 127, 204] },
      styles: { fontSize: 9 }
    });
  }

  // Output como base64 (sin el prefijo "data:application/pdf;base64,")
  var pdfBase64 = doc.output('datauristring').split(',')[1];
  return pdfBase64;
}

function exportExcelBase64(turnos, calc, salario, session) {
  var wb = XLSX.utils.book_new();
  var hoy = new Date();

  var rows = [
    ['Mi Turno · Colombia'],
    ['Reporte: ' + hoy.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })]
  ];

  // Fila de empleado y PIN (solo si hay sesión)
  if (session) {
    var empleadoNombre = (session.pname) || (session.email) || 'Anónimo';
    var empleadoCelda = 'Empleado: ' + empleadoNombre;
    if (session.pin) empleadoCelda = empleadoCelda + '   PIN: ' + session.pin;
    rows.push([empleadoCelda]);
  }

  rows.push(
    [],
    ['Salario base mensual', salario],
    ['Total devengado', calc.total],
    ['Horas trabajadas', fDur(calc.totalMin)],
    ['Días con turno', turnos ? turnos.length : 0],
    [],
    ['Fecha', 'Inicio', 'Fin', 'Duración (min)', 'Pago (COP)']
  );

  if (turnos && turnos.length) {
    turnos
      .slice()
      .reverse()
      .forEach(function (t) {
        var ini = new Date(t.inicio);
        var fin = t.fin ? new Date(t.fin) : null;
        var dur = fin ? Math.round((fin - ini) / 60000) : 0;
        rows.push([
          ini.toLocaleDateString('es-CO'),
          ini.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          fin ? fin.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
          dur,
          t.pago || 0
        ]);
      });
  }

  var ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Turnos');

  // Exportar como base64
  var xlsxBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  return xlsxBase64;
}

async function enviarReportePorEmail(opts) {
  // opts: {to, format, filename, fileBase64, subject?, message?}
  if (!SUPA || !CLOUD_MODE) {
    throw new Error('Sin conexión a la nube');
  }

  // Obtener sesión actual; si expiró, intentar refresh antes de fallar
  var sessionRes = await SUPA.auth.getSession();
  if (!sessionRes.data.session) {
    var refreshRes = await SUPA.auth.refreshSession();
    if (!refreshRes.data.session) {
      throw new Error('Tu sesión expiró. Cerrá y volvé a entrar para enviar el reporte.');
    }
    sessionRes = refreshRes;
  }

  var token = sessionRes.data.session.access_token;
  var url = window.SUPABASE_CONFIG.url + '/functions/v1/send-report';

  var response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      apikey: window.SUPABASE_CONFIG.anonKey
    },
    body: JSON.stringify(opts)
  });

  var data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error enviando correo');
  }

  return data;
}

async function enviarPINPorEmail(opts) {
  // opts: {to, pin, userName?}
  if (!SUPA || !CLOUD_MODE) {
    throw new Error('Sin conexión a la nube');
  }
  var sessionRes = await SUPA.auth.getSession();
  if (!sessionRes.data.session) {
    var refreshRes = await SUPA.auth.refreshSession();
    if (!refreshRes.data.session) {
      throw new Error('Tu sesión expiró. Cerrá y volvé a entrar para enviar el reporte.');
    }
    sessionRes = refreshRes;
  }
  var token = sessionRes.data.session.access_token;
  var url = window.SUPABASE_CONFIG.url + '/functions/v1/send-pin';
  var response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      apikey: window.SUPABASE_CONFIG.anonKey
    },
    body: JSON.stringify(opts)
  });
  var data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error enviando correo');
  }
  return data;
}
