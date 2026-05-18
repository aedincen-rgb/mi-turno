// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/config.js
//  Tab Ajustes
// ════════════════════════════════════════════════════════════════
function ConfigTab(props){
  var salario=props.salario, vh=props.valorHora, session=props.session;
  var es=useState(false); var editSal=es[0], setEditSal=es[1];
  var st=useState(''); var tempSal=st[0], setTempSal=st[1];
  var gs=useState(false); var showMgtAcct=gs[0], setShowMgtAcct=gs[1];
  var dgs=useState(false); var showDiag=dgs[0], setShowDiag=dgs[1];
  var asg=useState(false); var showAsignar=asg[0], setShowAsignar=asg[1];
  var usg=useState(false); var showUsuarios=usg[0], setShowUsuarios=usg[1];

  function guardarSalario(){haptic();var v=parseFloat(tempSal)||SMIN;props.onSalario(v);setEditSal(false);}

  return h('div',{className:'fadeUp'},
    // ── TEMA ──
    h('div',{className:'card'},
      h('div',{className:'cfg-row'},
        h('span',{className:'cfg-k'},
          h('span',{style:{fontSize:18}}, props.theme==='dark'?'🌙':'☀'),
          h('span',null, props.theme==='dark'?'Modo oscuro':'Modo claro')),
        h('label',{className:'ios-sw'},
          h('input',{type:'checkbox', checked:props.theme==='dark',
            onChange:function(){haptic();props.onThemeChange(props.theme==='dark'?'light':'dark');}}),
          h('span',{className:'sw-track'})))),

    // ── SALARIO ──
    h('div',{className:'card'},
      h('div',{className:'card-ttl'},'Salario base mensual'),
      editSal
        ?h('div',{style:{display:'flex',gap:8,alignItems:'center'}},
            h('input',{type:'number', inputMode:'numeric', className:'inp',
              style:{marginBottom:0,flex:1}, value:tempSal,
              onChange:function(e){setTempSal(e.target.value);}, autoFocus:true}),
            h('button',{className:'btn btn-accent', onClick:guardarSalario, style:{padding:'12px 18px'}},'✓'))
        :h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
            h('div',null,
              h('div',{style:{fontSize:22,fontWeight:800,letterSpacing:'-0.6px',color:'var(--text)',fontVariantNumeric:'tabular-nums'}}, fCOP(salario)),
              h('div',{style:{fontSize:11.5,color:'var(--muted)',marginTop:3}},'Hora base · '+fCOP(vh))),
            h('button',{className:'btn-edit', onClick:function(){haptic();setTempSal(String(salario));setEditSal(true);}},'Editar'))),

    // ── GESTIÓN DE CUENTA ── (con botones Liquid Glass)
    h('div',{className:'card'},
      h('div',{className:'card-ttl'},'Mi cuenta'),
      h('div',{className:'user-row'},
        h('div',{className:'user-av',style:session.isAdmin?{background:'var(--accent)',border:'2px solid var(--accent)'}:{}}, 
          session.isAdmin?'🔓':
          session.guest?'?':(session.pinOnly?'📌':(session.email?session.email[0].toUpperCase():'U'))),
        h('div',{style:{minWidth:0,flex:1}},
          h('div',{className:'user-em',style:{display:'flex',alignItems:'center',gap:6}}, 
            h('span',null,session.pinOnly?('PIN: '+session.pin):
              session.guest?'Modo invitado':(session.email||'sin email')),
            session.isAdmin?h('span',{style:{fontSize:9,fontWeight:800,background:'var(--accent)',color:'var(--surface)',padding:'2px 6px',borderRadius:'4px',letterSpacing:'0.5px'}},'ADMIN'):null),
          h('div',{className:'user-sb'}, 
            session.isAdmin?'Acceso administrativo completo':
            session.pinOnly?'Datos locales (sin sincronización)':
            session.guest?'Datos en este dispositivo':(CLOUD_MODE?'Sincronizado en la nube':'Local')))),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}},
        h('button',{className:'btn-glass glass-account', onClick:function(){haptic();setShowMgtAcct(true);}},'⚙ Gestionar'),
        h('button',{className:'btn-glass glass-signout', onClick:function(){haptic();props.onSignOut();}},'⎋ Cerrar sesión')),
      // Diagnóstico de PINs solo visible para admin
      session.isAdmin?h('button',{className:'btn-glass glass-account', onClick:function(){haptic();setShowDiag(true);}, style:{width:'100%',marginTop:10}},'🔍 Diagnóstico de PINs (Admin)'):null),

    // ── RECARGOS ──
    h('div',{className:'card'},
      h('div',{className:'card-ttl'},'Recargos · Ley 2101/2021'),
      Object.keys(RC).map(function(k){
        var r=RC[k];
        return h('div',{key:k, className:'cfg-row'},
          h('span',{className:'cfg-k', style:{fontSize:13.5}},
            h('span',{className:'rec-chip', style:{background:r.bg,border:'1px solid '+r.bd,color:r.color}}, r.icon),
            r.label),
          h('span',{className:'cfg-v', style:{color:r.color}}, '+'+Math.round((r.factor-1)*100)+'%'));
      }),
      h('div',{style:{fontSize:11,color:'var(--muted)',marginTop:14,lineHeight:1.55,opacity:0.85}},
        'CST Arts. 168-171 · Calculados sobre valor hora base')),

    // ── PANEL ADMIN ──
    session.isAdmin?h('div',{className:'card',style:{background:'linear-gradient(135deg, var(--accent-dim) 0%, var(--surface) 100%)',border:'2px solid var(--accent)'}},
      h('div',{style:{fontSize:16,fontWeight:800,color:'var(--accent)',marginBottom:8,display:'flex',alignItems:'center',gap:6}},
        h('span',null,'🔓'),
        h('span',null,'Panel Administrador')),
      h('div',{style:{fontSize:12,color:'var(--muted)',marginBottom:12,lineHeight:1.5}},
        'Tienes acceso completo: gestionar usuarios, asignar PINs, cambiar contraseñas y ver diagnósticos del sistema.'),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}},
        h('button',{className:'btn-glass glass-account',onClick:function(){haptic();setShowDiag(true);}},'📊 Diagnóstico'),
        h('button',{className:'btn-glass glass-account',onClick:function(){haptic();setShowUsuarios(true);}},'👥 Usuarios')),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}},
        h('button',{className:'btn-glass glass-account',onClick:function(){haptic();setShowAsignar(true);}},'🔑 Asignar PINs'),
        h('button',{className:'btn-glass glass-account',onClick:function(){haptic();alert('Logs del sistema - Próximamente');}},'📝 Logs'))):null,

    showMgtAcct
      ?h('div',{className:'ovl', onClick:function(ev){if(ev.target===ev.currentTarget)setShowMgtAcct(false);}},
          h(ManageAccountModal, {session:session, onClose:function(){setShowMgtAcct(false);}}))
      :null,
    showDiag
      ?h('div',{className:'ovl', onClick:function(ev){if(ev.target===ev.currentTarget)setShowDiag(false);}},
          h(DiagnosticoModal, {session:session, onClose:function(){setShowDiag(false);}}))
      :null,
    showAsignar
      ?h('div',{className:'ovl', onClick:function(ev){if(ev.target===ev.currentTarget)setShowAsignar(false);}},
          h(AsignarPINsModal, {session:session, onClose:function(){setShowAsignar(false);}}))
      :null,
    showUsuarios
      ?h('div',{className:'ovl', onClick:function(ev){if(ev.target===ev.currentTarget)setShowUsuarios(false);}},
          h(UsuariosModal, {session:session, onClose:function(){setShowUsuarios(false);}}))
      :null);
}
