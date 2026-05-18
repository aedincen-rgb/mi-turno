// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/export-report.js
//  Modal exportar PDF/Excel + email
// ════════════════════════════════════════════════════════════════
function ExportReportModal(props){
  // props: {format ('pdf'|'xlsx'), turnos, calc, salario, session, onClose, onDownload}
  var format = props.format;
  var formatLabel = format==='pdf' ? 'PDF' : 'Excel';
  var formatIcon = format==='pdf' ? '📄' : '📊';
  
  var st = useState('menu'); var step=st[0], setStep=st[1];   // menu | email | sending | done | error
  var em = useState((props.session && props.session.email) || ''); var email=em[0], setEmail=em[1];
  var er = useState(null); var error=er[0], setError=er[1];
  var ok = useState(null); var success=ok[0], setSuccess=ok[1];
  
  function handleDownload(){
    haptic();
    try{
      if(format==='pdf') exportPDF(props.turnos, props.calc, props.salario);
      else exportExcel(props.turnos, props.calc, props.salario);
      setStep('done');
      setSuccess('✓ '+formatLabel+' descargado en tu dispositivo');
      setTimeout(function(){ if(props.onClose) props.onClose(); }, 1500);
    }catch(e){
      setStep('error');
      setError('No se pudo generar el archivo: '+(e.message||'error desconocido'));
    }
  }
  
  function handleEmail(){
    haptic();
    setError(null);
    
    // Validar email
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email.trim())){
      setError('Ingresa un correo electrónico válido');
      return;
    }
    
    if(!CLOUD_MODE){
      setError('Necesitas conexión a la nube para enviar correos');
      return;
    }
    
    setStep('sending');
    
    // Generar el archivo en base64
    var fileBase64;
    try{
      if(format==='pdf') fileBase64 = exportPDFBase64(props.turnos, props.calc, props.salario);
      else fileBase64 = exportExcelBase64(props.turnos, props.calc, props.salario);
    }catch(e){
      setStep('error');
      setError('Error generando el archivo: '+(e.message||'desconocido'));
      return;
    }
    
    // Nombre del archivo
    var fecha = new Date().toISOString().slice(0,10);
    var filename = 'mi-turno-reporte-'+fecha+'.'+(format==='pdf'?'pdf':'xlsx');
    
    // Llamar a la edge function
    enviarReportePorEmail({
      to: email.trim(),
      format: format,
      filename: filename,
      fileBase64: fileBase64
    }).then(function(res){
      setStep('done');
      setSuccess(res.message || '✓ Reporte enviado correctamente');
      setTimeout(function(){ if(props.onClose) props.onClose(); }, 2500);
    }).catch(function(e){
      setStep('error');
      setError(e.message || 'Error al enviar el correo');
    });
  }
  
  // ── Vista: paso terminado ──
  if(step==='done'){
    return h('div',{className:'modal-card', style:{maxWidth:380, textAlign:'center'}},
      h('div',{style:{fontSize:48, marginBottom:14}},'✅'),
      h('div',{style:{fontSize:17, fontWeight:800, color:'var(--text)', marginBottom:8}},'¡Listo!'),
      h('div',{style:{fontSize:13.5, color:'var(--muted)', lineHeight:1.5, marginBottom:18}}, success),
      h('button',{className:'btn btn-ghost btn-block', onClick:function(){haptic();props.onClose();}},'Cerrar'));
  }
  
  // ── Vista: enviando ──
  if(step==='sending'){
    return h('div',{className:'modal-card', style:{maxWidth:380, textAlign:'center'}},
      h('div',{style:{fontSize:36, marginBottom:14}},'📤'),
      h('div',{style:{fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6}},'Enviando reporte...'),
      h('div',{style:{fontSize:12.5, color:'var(--muted)', marginBottom:18}},'Esto puede tardar unos segundos'),
      h('div',{style:{display:'flex', justifyContent:'center'}},
        h('span',{className:'sp-in', style:{fontSize:24}})));
  }
  
  // ── Vista: error ──
  if(step==='error'){
    return h('div',{className:'modal-card', style:{maxWidth:400}},
      h('div',{style:{textAlign:'center', marginBottom:14}},
        h('div',{style:{fontSize:40, marginBottom:8}},'⚠'),
        h('div',{style:{fontSize:16, fontWeight:800, color:'var(--danger)'}},'No se pudo enviar')),
      h('div',{style:{
        padding:12,
        background:'var(--danger-dim)',
        borderRadius:'var(--radius-sm)',
        fontSize:13,
        color:'var(--danger)',
        marginBottom:14,
        lineHeight:1.5
      }}, error),
      h('div',{style:{display:'flex', gap:8}},
        h('button',{
          className:'btn btn-ghost', style:{flex:1},
          onClick:function(){haptic();setStep('menu');setError(null);}
        },'← Volver'),
        h('button',{
          className:'btn btn-ghost', style:{flex:1},
          onClick:function(){haptic();props.onClose();}
        },'Cerrar')));
  }
  
  // ── Vista: ingresar email ──
  if(step==='email'){
    return h('div',{className:'modal-card', style:{maxWidth:420}},
      h('div',{style:{textAlign:'center', marginBottom:14}},
        h('div',{style:{fontSize:32, marginBottom:6}},'✉'),
        h('div',{style:{fontSize:17, fontWeight:800, color:'var(--text)', marginBottom:4}},'Enviar por correo'),
        h('div',{style:{fontSize:12, color:'var(--muted)'}}, formatIcon+' Reporte en '+formatLabel)),
      
      h('div',{style:{marginBottom:14}},
        h('label',{style:{fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:6}}, 'Correo del destinatario'),
        h('input',{
          type:'email', inputMode:'email', autoComplete:'email',
          className:'inp',
          placeholder:'ejemplo@correo.com',
          value:email,
          onChange:function(e){setEmail(e.target.value);},
          onKeyDown:function(e){if(e.key==='Enter')handleEmail();},
          autoFocus:true
        })),
      
      error?h('div',{style:{
        padding:'9px 12px',
        background:'var(--danger-dim)',
        borderRadius:'var(--radius-sm)',
        fontSize:12.5,
        color:'var(--danger)',
        marginBottom:12
      }}, error):null,
      
      h('div',{style:{
        fontSize:11.5,
        color:'var(--muted)',
        background:'var(--surface2)',
        padding:'10px 12px',
        borderRadius:'var(--radius-sm)',
        marginBottom:14,
        lineHeight:1.5
      }}, '🔒 Envío seguro vía Resend. El reporte llegará como archivo adjunto.'),
      
      h('div',{style:{display:'flex', gap:8}},
        h('button',{
          className:'btn btn-ghost', style:{flex:1},
          onClick:function(){haptic();setStep('menu');setError(null);}
        },'← Atrás'),
        h('button',{
          className:'btn btn-accent', style:{flex:2},
          onClick:handleEmail,
          disabled:!email.trim()
        },'📤 Enviar')));
  }
  
  // ── Vista: menú principal ──
  return h('div',{className:'modal-card', style:{maxWidth:380}},
    h('div',{style:{textAlign:'center', marginBottom:18}},
      h('div',{style:{fontSize:36, marginBottom:6}}, formatIcon),
      h('div',{style:{fontSize:18, fontWeight:800, color:'var(--text)'}}, 'Exportar '+formatLabel),
      h('div',{style:{fontSize:12, color:'var(--muted)', marginTop:4}},'¿Cómo quieres recibirlo?')),
    
    h('div',{style:{display:'flex', flexDirection:'column', gap:10, marginBottom:14}},
      h('button',{
        onClick:handleDownload,
        style:{
          padding:'14px 16px',
          background:'var(--surface2)',
          border:'1px solid var(--border)',
          borderRadius:'var(--radius)',
          cursor:'pointer',
          display:'flex',
          alignItems:'center',
          gap:12,
          textAlign:'left'
        }
      },
        h('div',{style:{fontSize:24}},'📥'),
        h('div',{style:{flex:1}},
          h('div',{style:{fontSize:14, fontWeight:700, color:'var(--text)'}},'Descargar ahora'),
          h('div',{style:{fontSize:11.5, color:'var(--muted)', marginTop:2}},'Guarda el archivo en tu dispositivo')),
        h('span',{style:{color:'var(--muted)', fontSize:18}},'›')),
      
      h('button',{
        onClick:function(){haptic();setStep('email');setError(null);},
        disabled: !CLOUD_MODE,
        style:{
          padding:'14px 16px',
          background:CLOUD_MODE?'var(--accent-dim)':'var(--surface2)',
          border:'1px solid '+(CLOUD_MODE?'var(--accent)':'var(--border)'),
          borderRadius:'var(--radius)',
          cursor:CLOUD_MODE?'pointer':'not-allowed',
          opacity:CLOUD_MODE?1:0.5,
          display:'flex',
          alignItems:'center',
          gap:12,
          textAlign:'left'
        }
      },
        h('div',{style:{fontSize:24}},'✉'),
        h('div',{style:{flex:1}},
          h('div',{style:{fontSize:14, fontWeight:700, color:CLOUD_MODE?'var(--accent)':'var(--muted)'}},'Enviar por correo'),
          h('div',{style:{fontSize:11.5, color:'var(--muted)', marginTop:2}}, CLOUD_MODE?'Te llega a tu email · Gratis':'Requiere conexión a la nube')),
        h('span',{style:{color:CLOUD_MODE?'var(--accent)':'var(--muted)', fontSize:18}},'›'))),
    
    h('button',{className:'btn btn-ghost btn-block', onClick:function(){haptic();props.onClose();}}, 'Cancelar'));
}
