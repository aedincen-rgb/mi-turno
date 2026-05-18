// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/usuarios.js
//  Modal usuarios admin
// ════════════════════════════════════════════════════════════════
function UsuariosModal(props){
  var session=props.session;
  var us=useState([]); var users=us[0], setUsers=us[1];
  var ld=useState(true); var loading=ld[0], setLoading=ld[1];
  var er=useState(null); var error=er[0], setError=er[1];
  var qs=useState(''); var query=qs[0], setQuery=qs[1];
  var fb=useState(null); var feedback=fb[0], setFeedback=fb[1];
  var dt=useState(null); var detail=dt[0], setDetail=dt[1];
  var so=useState('recent'); var sortBy=so[0], setSortBy=so[1];
  var fl=useState('all'); var filter=fl[0], setFilter=fl[1];
  var bs=useState(false); var busy=bs[0], setBusy=bs[1];
  var rs=useState(null); var resetUser=rs[0], setResetUser=rs[1];

  function fmtFecha(s){
    if(!s) return 'Nunca';
    try{
      var d=new Date(s);
      var diff=Date.now()-d.getTime();
      var dias=Math.floor(diff/86400000);
      if(dias===0) return 'Hoy';
      if(dias===1) return 'Ayer';
      if(dias<7) return 'Hace '+dias+' días';
      if(dias<30) return 'Hace '+Math.floor(dias/7)+' sem';
      return d.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'2-digit'});
    }catch(e){ return '—'; }
  }

  function cargar(){
    if(!CLOUD_MODE||!SUPA){ setError('Sin conexión a la nube'); setLoading(false); return; }
    setLoading(true); setError(null);
    withTimeout(
      SUPA.from('pin_lookup').select('*').order('updated_at',{ascending:false}),
      (IS_IOS_SAFARI?15000:8000),'Cargar usuarios'
    ).then(function(res){
      if(res&&res.error) throw res.error;
      setUsers(res.data||[]); setLoading(false);
    }).catch(function(e){
      setError(traducirError(e)||'Error al cargar usuarios'); setLoading(false);
    });
  }

  useEffect(function(){ cargar(); },[]);

  function copiar(texto){
    try{
      if(navigator.clipboard){ navigator.clipboard.writeText(String(texto)); }
      haptic();
      setFeedback({type:'ok',msg:'✓ Copiado'});
      setTimeout(function(){setFeedback(null);},1500);
    }catch(e){}
  }

  function enviarReset(email){
    if(!SUPA||!CLOUD_MODE) return;
    setBusy(true); setFeedback(null);
    SUPA.auth.resetPasswordForEmail(email).then(function(res){
      if(res&&res.error) throw res.error;
      setFeedback({type:'ok',msg:'✓ Email de reseteo enviado a '+email});
      setResetUser(null);
      setTimeout(function(){setFeedback(null);},3000);
    }).catch(function(e){
      setFeedback({type:'err',msg:traducirError(e)||'Error al enviar reseteo'});
    }).finally(function(){ setBusy(false); });
  }

  var q=query.trim().toLowerCase();
  var filtered=users.filter(function(u){
    if(filter==='admin' && u.pin!=='9999' && u.user_email!=='admin@miturno.com') return false;
    if(filter==='nopin' && u.pin) return false;
    if(filter==='conpin' && !u.pin) return false;
    if(!q) return true;
    return (u.user_email||'').toLowerCase().indexOf(q)>=0 || String(u.pin||'').indexOf(q)>=0;
  });

  filtered.sort(function(a,b){
    if(sortBy==='recent') return (new Date(b.updated_at||0)).getTime() - (new Date(a.updated_at||0)).getTime();
    if(sortBy==='email') return (a.user_email||'').localeCompare(b.user_email||'');
    if(sortBy==='pin') return String(a.pin||'9999').localeCompare(String(b.pin||'9999'));
    return 0;
  });

  var stats={
    total:users.length,
    activos:users.filter(function(u){ if(!u.updated_at) return false; return (Date.now()-new Date(u.updated_at).getTime())<7*86400000; }).length,
    admins:users.filter(function(u){return u.pin==='9999'||u.user_email==='admin@miturno.com';}).length,
    sinPin:users.filter(function(u){return !u.pin;}).length
  };

  // Vista detalle
  if(detail){
    var esAdm=detail.pin==='9999'||detail.user_email==='admin@miturno.com';
    var inicial=(detail.user_email||'?')[0].toUpperCase();
    return h('div',{className:'modal-card', style:{maxWidth:480}},
      h('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:14}},
        h('button',{onClick:function(){haptic();setDetail(null);},
          style:{background:'transparent',border:'none',fontSize:22,color:'var(--text)',cursor:'pointer',padding:'4px 8px',lineHeight:1}},'←'),
        h('div',{style:{fontSize:16,fontWeight:800,color:'var(--text)'}},'Detalle de usuario')),
      h('div',{style:{textAlign:'center',marginBottom:20,padding:'20px 0',
        background:esAdm?'linear-gradient(135deg, var(--accent-dim) 0%, var(--surface) 100%)':'var(--surface2)',
        borderRadius:'var(--radius)',border:'1px solid '+(esAdm?'var(--accent)':'var(--border)')}},
        h('div',{style:{width:72,height:72,margin:'0 auto 12px',borderRadius:'50%',
          background:esAdm?'var(--accent)':'var(--surface)',color:esAdm?'#fff':'var(--text)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,fontWeight:900,
          border:'3px solid '+(esAdm?'var(--accent)':'var(--border)')}},esAdm?'🔓':inicial),
        h('div',{style:{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:4,wordBreak:'break-all',padding:'0 14px'}},detail.user_email),
        esAdm?h('div',{style:{display:'inline-block',marginTop:4,fontSize:10,fontWeight:800,background:'var(--accent)',color:'#fff',padding:'3px 10px',borderRadius:6,letterSpacing:'0.5px'}},'ADMINISTRADOR'):null),
      h('div',{style:{display:'flex',flexDirection:'column',gap:8,marginBottom:16}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:'var(--surface2)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}},
          h('div',null,
            h('div',{style:{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:2}},'PIN de acceso'),
            h('div',{style:{fontSize:18,fontWeight:900,color:'var(--accent)',fontFamily:'ui-monospace,monospace',letterSpacing:'2px'}},detail.pin||'Sin asignar')),
          detail.pin?h('button',{onClick:function(){copiar(detail.pin);},
            style:{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',fontSize:11,fontWeight:600,color:'var(--text)',cursor:'pointer'}},'📋 Copiar'):null),
        h('div',{style:{padding:'12px 14px',background:'var(--surface2)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}},
          h('div',{style:{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:2}},'Última actualización'),
          h('div',{style:{fontSize:13,fontWeight:600,color:'var(--text)'}},fmtFecha(detail.updated_at)))),
      feedback?h('div',{style:{padding:'10px 14px',borderRadius:'var(--radius-sm)',marginBottom:12,fontSize:13,fontWeight:600,
        background:feedback.type==='ok'?'var(--success-dim,rgba(16,185,129,0.12))':'var(--danger-dim)',
        color:feedback.type==='ok'?'var(--success,#10b981)':'var(--danger)',
        border:'1px solid '+(feedback.type==='ok'?'var(--success,#10b981)':'var(--danger)')}},feedback.msg):null,
      resetUser?h('div',{style:{padding:14,borderRadius:'var(--radius)',marginBottom:12,background:'var(--accent-dim)',border:'2px solid var(--accent)'}},
        h('div',{style:{fontSize:13.5,fontWeight:700,color:'var(--accent)',marginBottom:6}},'📧 Enviar reseteo de contraseña'),
        h('div',{style:{fontSize:12,color:'var(--text)',marginBottom:10,lineHeight:1.5}},
          'Se enviará un email a ',h('strong',null,detail.user_email),' con un enlace.'),
        h('div',{style:{display:'flex',gap:8}},
          h('button',{onClick:function(){enviarReset(detail.user_email);}, disabled:busy,
            style:{flex:1,padding:'10px',borderRadius:'var(--radius-sm)',border:'none',background:'var(--accent)',color:'#fff',fontWeight:700,fontSize:12.5,cursor:'pointer'}},
            busy?'Enviando...':'✓ Sí, enviar'),
          h('button',{onClick:function(){setResetUser(null);},
            style:{flex:1,padding:'10px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'transparent',color:'var(--text)',fontWeight:600,fontSize:12.5,cursor:'pointer'}},'Cancelar'))):null,
      !resetUser?h('div',{style:{display:'flex',flexDirection:'column',gap:8,marginBottom:14}},
        h('button',{onClick:function(){copiar(detail.user_email);},
          style:{padding:'12px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--text)',fontWeight:600,fontSize:13,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:10}},
          h('span',{style:{fontSize:18}},'📧'),h('span',null,'Copiar correo')),
        h('button',{onClick:function(){setResetUser(detail);}, disabled:esAdm,
          style:{padding:'12px',borderRadius:'var(--radius-sm)',border:'1px solid var(--accent)',background:'var(--accent-dim)',color:esAdm?'var(--muted)':'var(--accent)',fontWeight:600,fontSize:13,cursor:esAdm?'not-allowed':'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:10,opacity:esAdm?0.5:1}},
          h('span',{style:{fontSize:18}},'🔑'),h('span',null,'Resetear contraseña (email)'))):null,
      h('button',{className:'btn btn-ghost btn-block',onClick:function(){haptic();setDetail(null);}},'← Volver a la lista'));
  }

  // Vista lista
  return h('div',{className:'modal-card', style:{maxWidth:520}},
    h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}},
      h('div',null,
        h('div',{style:{fontSize:19,fontWeight:800,color:'var(--text)',display:'flex',alignItems:'center',gap:8}},
          h('span',{style:{fontSize:22}},'👥'),
          h('span',null,'Gestión de Usuarios')),
        h('div',{style:{fontSize:11.5,color:'var(--muted)',marginTop:2}},
          'Panel administrativo · '+stats.total+' usuarios')),
      h('button',{onClick:function(){haptic();props.onClose();},
        style:{background:'transparent',border:'none',fontSize:24,color:'var(--muted)',cursor:'pointer',padding:'4px 8px',lineHeight:1}},'×')),

    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:6,marginBottom:14,marginTop:12}},
      h('div',{style:{background:'var(--surface2)',padding:'10px 6px',borderRadius:'var(--radius-sm)',textAlign:'center',border:'1px solid var(--border)'}},
        h('div',{style:{fontSize:18,fontWeight:900,color:'var(--text)',lineHeight:1}},stats.total),
        h('div',{style:{fontSize:9,color:'var(--muted)',marginTop:3,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.3px'}},'Total')),
      h('div',{style:{background:'var(--success-dim,rgba(16,185,129,0.12))',padding:'10px 6px',borderRadius:'var(--radius-sm)',textAlign:'center',border:'1px solid var(--success,#10b981)'}},
        h('div',{style:{fontSize:18,fontWeight:900,color:'var(--success,#10b981)',lineHeight:1}},stats.activos),
        h('div',{style:{fontSize:9,color:'var(--muted)',marginTop:3,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.3px'}},'Activos 7d')),
      h('div',{style:{background:'var(--accent-dim)',padding:'10px 6px',borderRadius:'var(--radius-sm)',textAlign:'center',border:'1px solid var(--accent)'}},
        h('div',{style:{fontSize:18,fontWeight:900,color:'var(--accent)',lineHeight:1}},stats.admins),
        h('div',{style:{fontSize:9,color:'var(--muted)',marginTop:3,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.3px'}},'Admins')),
      h('div',{style:{background:'var(--danger-dim)',padding:'10px 6px',borderRadius:'var(--radius-sm)',textAlign:'center',border:'1px solid var(--danger)'}},
        h('div',{style:{fontSize:18,fontWeight:900,color:'var(--danger)',lineHeight:1}},stats.sinPin),
        h('div',{style:{fontSize:9,color:'var(--muted)',marginTop:3,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.3px'}},'Sin PIN'))),

    h('input',{type:'text',className:'inp',placeholder:'🔍 Buscar por correo o PIN...',
      value:query, onChange:function(e){setQuery(e.target.value);}, style:{marginBottom:10}}),

    h('div',{style:{display:'flex',gap:6,marginBottom:10,overflowX:'auto',paddingBottom:2}},
      [{id:'all',label:'Todos',count:users.length},
       {id:'admin',label:'🔓 Admins',count:stats.admins},
       {id:'conpin',label:'Con PIN',count:users.length-stats.sinPin},
       {id:'nopin',label:'Sin PIN',count:stats.sinPin}].map(function(f){
        var active=filter===f.id;
        return h('button',{key:f.id,onClick:function(){haptic();setFilter(f.id);},
          style:{padding:'6px 12px',borderRadius:'var(--radius-sm)',
            border:'1px solid '+(active?'var(--accent)':'var(--border)'),
            background:active?'var(--accent-dim)':'transparent',
            color:active?'var(--accent)':'var(--text)',
            fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}, f.label+' · '+f.count);
      })),

    h('div',{style:{display:'flex',gap:6,marginBottom:12,fontSize:11}},
      h('span',{style:{color:'var(--muted)',fontWeight:600,alignSelf:'center'}},'Ordenar:'),
      ['recent','email','pin'].map(function(s){
        var labels={recent:'⏱ Reciente',email:'A-Z',pin:'PIN'};
        var active=sortBy===s;
        return h('button',{key:s,onClick:function(){haptic();setSortBy(s);},
          style:{padding:'4px 10px',borderRadius:6,
            border:'1px solid '+(active?'var(--accent)':'var(--border)'),
            background:active?'var(--accent-dim)':'transparent',
            color:active?'var(--accent)':'var(--muted)',
            fontSize:11,fontWeight:600,cursor:'pointer'}}, labels[s]);
      })),

    feedback?h('div',{style:{padding:'10px 14px',borderRadius:'var(--radius-sm)',marginBottom:12,fontSize:13,fontWeight:600,
      background:feedback.type==='ok'?'var(--success-dim,rgba(16,185,129,0.12))':'var(--danger-dim)',
      color:feedback.type==='ok'?'var(--success,#10b981)':'var(--danger)'}},feedback.msg):null,

    loading
      ?h('div',{style:{textAlign:'center',padding:'40px 0',color:'var(--muted)'}},
        h('span',{className:'sp-in'}), h('div',{style:{marginTop:8,fontSize:12}},'Cargando...'))
      :error
        ?h('div',{style:{padding:20,textAlign:'center',color:'var(--danger)',background:'var(--danger-dim)',borderRadius:'var(--radius)'}},error)
        :filtered.length===0
          ?h('div',{style:{padding:'30px 20px',textAlign:'center',color:'var(--muted)',fontSize:13}},'No hay usuarios en este filtro.')
          :h('div',{style:{display:'flex',flexDirection:'column',gap:6}},
            filtered.map(function(u){
              var esAdmin=u.pin==='9999'||u.user_email==='admin@miturno.com';
              var inicial=(u.user_email||'?')[0].toUpperCase();
              var activo=u.updated_at && (Date.now()-new Date(u.updated_at).getTime())<7*86400000;
              return h('button',{key:u.user_id,onClick:function(){haptic();setDetail(u);setFeedback(null);},
                style:{padding:'10px 12px',
                  background:esAdmin?'linear-gradient(135deg, var(--accent-dim) 0%, var(--surface) 100%)':'var(--surface)',
                  border:'1px solid '+(esAdmin?'var(--accent)':'var(--border)'),
                  borderRadius:'var(--radius)',cursor:'pointer',
                  display:'flex',alignItems:'center',gap:10,textAlign:'left',transition:'all 0.15s'}},
                h('div',{style:{width:36,height:36,borderRadius:'50%',
                  background:esAdmin?'var(--accent)':'var(--surface2)',
                  color:esAdmin?'#fff':'var(--text)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:15,fontWeight:800,flexShrink:0,
                  border:'2px solid '+(esAdmin?'var(--accent)':'var(--border)'),position:'relative'}},
                  esAdmin?'🔓':inicial,
                  activo?h('div',{style:{position:'absolute',bottom:-1,right:-1,width:10,height:10,borderRadius:'50%',background:'var(--success,#10b981)',border:'2px solid var(--surface)'}}):null),
                h('div',{style:{minWidth:0,flex:1}},
                  h('div',{style:{fontSize:12.5,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},u.user_email||'sin correo'),
                  h('div',{style:{fontSize:10.5,color:'var(--muted)',marginTop:2,display:'flex',alignItems:'center',gap:6}},
                    h('span',null,fmtFecha(u.updated_at)),
                    esAdmin?h('span',{style:{fontSize:8,fontWeight:800,background:'var(--accent)',color:'#fff',padding:'1px 5px',borderRadius:3}},'ADMIN'):null,
                    !u.pin?h('span',{style:{fontSize:8,fontWeight:800,background:'var(--danger)',color:'#fff',padding:'1px 5px',borderRadius:3}},'SIN PIN'):null)),
                h('div',{style:{display:'flex',alignItems:'center',gap:8,flexShrink:0}},
                  h('div',{style:{fontSize:14,fontWeight:900,
                    color:esAdmin?'var(--accent)':'var(--text)',
                    fontFamily:'ui-monospace,monospace',letterSpacing:'1px'}},u.pin||'----'),
                  h('span',{style:{color:'var(--muted)',fontSize:18}},'›')));
            })),

    h('div',{style:{marginTop:14,padding:'10px 12px',background:'var(--surface2)',borderRadius:'var(--radius-sm)',fontSize:11,color:'var(--muted)',lineHeight:1.5}},
      h('strong',null,'💡 '),'Toca un usuario para ver detalles.'),

    h('button',{className:'btn btn-ghost btn-block',onClick:function(){haptic();props.onClose();},style:{marginTop:12}},'Cerrar'));
}
