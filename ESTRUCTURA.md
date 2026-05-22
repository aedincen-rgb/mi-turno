# 📁 Mi Turno · Estructura Fragmentada

Refactorización máxima en archivos pequeños para facilitar pruebas en móviles empresariales.

---

## 📊 Estadísticas

- **78 archivos** (38 CSS + 40 JS)
- Tamaño promedio: ~50-80 líneas por archivo
- Mantiene **100% de la funcionalidad** original
- Sin build tools, funciona con HTML/JS/CSS puro

---

## 📂 Estructura completa

```
mi-turno-BETA/
├── index.html              · Punto de entrada (carga 77 archivos)
├── manifest.json           · PWA manifest
├── sw.js                   · Service Worker
├── icon-*.png              · Iconos PWA
│
├── sql/
│   └── email_logs.sql      · Tabla para Resend
├── supabase/
│   └── functions/
│       └── send-report/    · Edge Function
│
├── css/                    · 38 archivos
│   ├── base/               · 5 archivos
│   │   ├── variables.css       · Colores, espaciados, sombras
│   │   ├── reset.css           · Reset CSS universal
│   │   ├── typography.css      · Fuentes y body
│   │   ├── background.css      · Formas de fondo flotantes
│   │   └── media-queries.css   · Modo reducido y bajo consumo
│   │
│   ├── layout/             · 9 archivos
│   │   ├── header.css          · Barra superior flotante
│   │   ├── scroll.css          · Contenedor scroll principal
│   │   ├── hero-card.css       · Tarjeta principal de turno
│   │   ├── progress-bar.css    · Barra de avance del salario
│   │   ├── action-button.css   · Botón Iniciar/Finalizar turno
│   │   ├── shapes.css          · Formas decorativas
│   │   ├── fade-animations.css · Animaciones fadeUp
│   │   ├── misc-animations.css · Animaciones varias
│   │   └── misc.css            · Resto del layout
│   │
│   ├── components/         · 15 archivos
│   │   ├── cards.css           · Tarjetas .card
│   │   ├── buttons.css         · Botones .btn
│   │   ├── buttons-glass.css   · Botones glass
│   │   ├── inputs.css          · Campos de texto
│   │   ├── switches.css        · Switch tipo iOS
│   │   ├── config-rows.css     · Filas de configuración
│   │   ├── dashboard-hero.css  · Análisis: proyección
│   │   ├── dashboard-kpis.css  · Análisis: tarjetas KPI
│   │   ├── dashboard-chart.css · Análisis: gráficos
│   │   ├── dashboard-tip.css   · Análisis: caja de consejo
│   │   ├── assistant-chat.css  · Estilos chat
│   │   ├── history-list.css    · Listas del historial
│   │   ├── auth-screen.css     · Pantalla auth
│   │   ├── misc.css            · Componentes varios
│   │   └── dark-mode-overrides.css · Overrides modo oscuro
│   │
│   ├── modals/             · 9 archivos
│   │   ├── overlay.css         · Capa de overlay
│   │   ├── modal-card.css      · Tarjeta modal principal
│   │   ├── bottom-sheets.css   · Hojas inferiores
│   │   ├── auth-screen.css     · Estilos auth
│   │   ├── assistant-chat.css  · Chat asistente
│   │   ├── time-picker.css     · Selector de hora
│   │   ├── splash.css          · Pantalla inicial
│   │   ├── misc.css            · Misceláneos
│   │   └── dark-overrides.css  · Overrides modo oscuro
│   │
│   └── animations/         · 1 archivo
│       └── keyframes.css       · Todos los @keyframes
│
└── js/                     · 40 archivos
    ├── config.js               · Credenciales Supabase
    ├── theme-boot.js           · Tema inicial
    │
    ├── config/             · 4 archivos
    │   ├── react-init.js       · Verificación React + aliases
    │   ├── env.js              · Detección iOS/Safari
    │   ├── viewport-fix.js     · Fix viewport iOS
    │   └── globals.js          · Variables globales
    │
    ├── utils/              · 9 archivos
    │   ├── storage.js          · safeStorage, leer, grabar
    │   ├── format.js           · fCOP, fDur
    │   ├── haptic.js           · Vibración
    │   ├── network.js          · withTimeout, traducirError
    │   ├── uuid.js             · generateUUID, hashP
    │   ├── festivos.js         · Festivos colombianos
    │   ├── time.js             · Helpers temporales
    │   ├── validation.js       · Validación de datos
    │   └── otp.js              · OTP local y PINs
    │
    ├── services/           · 8 archivos
    │   ├── supabase.js         · Helpers CRUD Supabase
    │   ├── supabase-init.js    · Inicialización cliente
    │   ├── session-sync.js     · Cierre de sesión sincronizado entre dispositivos
    │   ├── calculator.js       · Motor de cálculo turnos
    │   ├── data.js             · CRUD local/nube
    │   ├── ai.js               · Asistente IA
    │   ├── export-files.js     · Exportar PDF/Excel local
    │   └── export-email.js     · Exportar y enviar por email
    │
    ├── tabs/               · 6 archivos
    │   ├── home.js             · Tab Inicio
    │   ├── dashboard.js        · Tab Análisis
    │   ├── sync-queue.js       · Cola de sincronización offline-first
    │   ├── assistant.js        · Tab Asistente
    │   ├── history.js          · Tab Historial
    │   └── config.js           · Tab Ajustes
    │
    ├── modals/             · 7 archivos
    │   ├── forgot-password.js  · Recuperar contraseña
    │   ├── pin-setup.js        · Configurar PIN
    │   ├── manage-account.js   · Gestionar cuenta
    │   ├── diagnostico.js      · Diagnóstico admin
    │   ├── asignar-pins.js     · Asignar PINs (admin)
    │   ├── usuarios.js         · Usuarios (admin)
    │   └── export-report.js    · Exportar reportes
    │
    └── app/                · 5 archivos
        ├── auth-screen.js      · Pantalla login/registro
        ├── app-main.js         · Componente App principal
        ├── root.js             · Componente Root
        ├── sw-register.js      · Registro Service Worker
        └── init.js             · Render del Root
```

---

## ⚙️ Cómo funciona la carga

Como no hay build tools, cada archivo se carga secuencialmente con `<script src="...">` en el `index.html`.

**Orden crítico de carga JS:**

```
1. config/react-init.js     → verifica React + aliases
2. config/env.js            → detecta iOS
3. config/viewport-fix.js   → fix viewport
4. config/globals.js        → variables globales (SUPA, CLOUD_MODE)

5. utils/*.js               → utilidades (orden interno: storage → format → ...)

6. services/supabase.js     → primero los helpers CRUD
7. services/supabase-init.js → luego la inicialización
8. services/session-sync.js → vigilancia de sesión entre dispositivos
9. services/calculator.js   → motor de cálculo
10. services/data.js, ai.js, export-*.js

11. tabs/*.js               → 5 pestañas principales

12. modals/*.js             → 7 modales

13. app/auth-screen.js      → pantalla auth
14. app/app-main.js         → App principal
15. app/root.js             → Root container
16. app/sw-register.js      → registrar SW
17. app/init.js             → ¡renderizar!
```

**El orden importa** porque cada archivo usa funciones definidas en archivos anteriores.

---

## ✅ Validación

Todos los archivos JS han sido validados sintácticamente con Node.js.
La concatenación completa también es válida.

---

## 🧪 Cómo testear

### Probar un componente aislado:

1. **Modificar solo un archivo:** Por ejemplo `js/modals/usuarios.js`
2. **El resto sigue funcionando** porque cada archivo es independiente
3. **Recargar con Ctrl+Shift+R** para limpiar caché
4. **Verificar en consola** que solo ese archivo se actualizó

### Identificar qué archivo modificar:

| Si la falla está en... | Edita... |
|---|---|
| Login / pantalla auth | `js/app/auth-screen.js` |
| Pestaña Inicio | `js/tabs/home.js` |
| Pestaña Análisis | `js/tabs/dashboard.js` |
| Botón "Asignar PINs" | `js/modals/asignar-pins.js` |
| Cálculo de turnos | `js/services/calculator.js` |
| Conexión Supabase | `js/services/supabase-init.js` |
| Exportar PDF | `js/services/export-files.js` |
| Enviar por correo | `js/services/export-email.js` + `js/modals/export-report.js` |
| Color de un botón | `css/components/buttons.css` |
| Estilo del header | `css/layout/header.css` |
| Barra de avance | `css/layout/progress-bar.css` |

---

## 🚀 Cómo desplegar

1. **Sube TODO** este directorio a GitHub
2. **Vercel** auto-deploya (detecta `index.html`)
3. Las rutas relativas `css/...` y `js/...` funcionan tal cual

---

## 🆘 Si algo falla

1. Abre **DevTools** (F12) → **Console**
2. Busca el archivo que aparece en el error
3. Edita SOLO ese archivo
4. Recarga con Ctrl+Shift+R

---

**Sin cambios funcionales.** Misma app, misma lógica, mismo comportamiento.
Solo organizada en máxima granularidad para facilitar pruebas. ✨
