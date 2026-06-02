<!-- ════════════════════════════════════════════════════════════════
     MI TURNO · ACCESIBILIDAD PARA INVIDENTES
     Guía de uso y características de accesibilidad
     ════════════════════════════════════════════════════════════════ -->

# 🦾 Mi Turno - Accesibilidad para Ciegos

Esta rama implementa soporte completo de accesibilidad para usuarios invidentes usando **screen readers** (lectores de pantalla) como NVDA (Windows), JAWS, VoiceOver (iOS/macOS) y TalkBack (Android).

## 📋 Características Implementadas

### 1. **Navegación por Teclado (100% sin ratón)**

#### Atajos Globales
- **Tab** → Navega entre elementos interactivos
- **Shift + Tab** → Navega hacia atrás
- **Enter** o **Space** → Activa botones
- **Escape** → Cierra diálogos/modales

#### Navegación Específica
- **Flechas ↑↓** → En listas de turnos/recargos, navega entre opciones
- **Flechas ↑↓** → En campos de números (salario, horas), incrementa/decrementa
- **Space** → En switches (on/off), alterna estado

#### Focus Trap en Modales
- El focus se mantiene **dentro del modal** cuando está abierto
- Al tabular en el último elemento, vuelve al primero
- Al cerrar modal, focus vuelve al botón que lo abrió

---

### 2. **ARIA & Semántica HTML**

Todos los componentes tienen:
- ✅ `role="button"`, `role="dialog"`, `role="tab"`, etc.
- ✅ `aria-label` descriptivos (ej: "Guardar turno")
- ✅ `aria-describedby` para textos de ayuda
- ✅ `aria-invalid` + `aria-describedby` para errores en formularios
- ✅ `aria-expanded` para acordeones/dropdowns
- ✅ `aria-live` para anuncios dinámicos
- ✅ `aria-busy` durante carga

---

### 3. **Validación Accesible de Formularios**

#### Validación en Tiempo Real
```javascript
// Validar campo al perder el focus
setupFormValidation(formElement, {
  salario: { required: true, min: 1750905, max: 999999999 },
  hora: { pattern: /^([0-1]\d|2[0-3]):[0-5]\d$/ }
});
```

#### Anuncios de Error
- Los errores se anuncian al screen reader **inmediatamente**
- Visual: mensaje de error bajo el campo en rojo
- Focus se mueve al primer campo inválido

#### Validadores Incluidos
```javascript
validateSalario(input)     // Valida salario mínimo
validateTime(input)        // Valida formato HH:MM
validateDate(input)        // Valida formato YYYY-MM-DD
validateForm(form, rules)  // Valida todo el formulario
```

---

### 4. **Anuncios para Screen Readers**

#### Sistema de Anuncios Centralizado
```javascript
// Anuncio simple
announceToScreenReader("Turno guardado exitosamente", "polite");

// Anuncios específicos de la app
announceTurnoSaved("2026-06-02", "06:00", "14:00");
announceCalculationComplete("$2.500.000 COP");
announceError("Salario inválido: debe ser mayor a $1.750.905");
announceTabChange("Dashboard");
```

#### Niveles de Prioridad
- **polite** (por defecto) → se anuncia cuando el usuario termina de hablar
- **assertive** → se anuncia inmediatamente (para errores críticos)

---

### 5. **Contraste & Alto Contraste**

#### Automático por Preferencias del Sistema
El CSS detecta `prefers-contrast: more`:
```css
@media (prefers-contrast: more) {
  /* Colores más fuertes, texto más oscuro */
  --text: #000000;
  --border: #1a202c;
  --accent: #0052cc;
}
```

#### WCAG Cumplidas
- ✅ **AA (4.5:1)** para texto regular sobre fondos
- ✅ **AAA (7:1)** donde sea posible
- ✅ Links subrayados y con color distinto
- ✅ Botones con bordes claros

---

### 6. **Modo de Movimiento Reducido**

Usuarios con discapacidades motoras pueden habilitar `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## 🎯 Cómo Usar

### Para Usuarios Ciegos

#### **Arranque**
1. Abre Mi Turno en tu navegador
2. **Presiona Tab** para comenzar a navegar
3. El screen reader anunciará: _"Mi Turno cargado. Utiliza Tab para navegar, Escape para cerrar diálogos."_

#### **Ingresar un Turno**
```
Tab → Ir al campo "Salario"
Escribe 2000000
Tab → Ir al campo "Fecha"
Escribe 2026-06-02
↓ ↓  (Flechas) → Cambiar hora en "Hora inicio"
Tab → Pasar al siguiente campo
Space → Activar botón "Guardar"
```

#### **Navegar por Pestañas**
```
Presiona Tab varias veces hasta encontrar "Dashboard", "Historial", etc.
Las pestaña se anuncian: "Pestaña: Dashboard"
```

#### **Cerrar Modales**
```
Cuando un modal está abierto (dialog, login, etc.):
Presiona Escape
El screen reader anuncia: "Diálogo cerrado: [nombre]"
```

### Para Desarrolladores

#### Agregar ARIA a Nuevo Componente
```javascript
// En tu componente React o HTML:
<div role="dialog" aria-label="Crear turno" aria-modal="true">
  <input 
    type="number" 
    aria-label="Salario en pesos"
    aria-describedby="salary-hint"
  />
  <div id="salary-hint">Mínimo $1.750.905</div>
</div>
```

#### Anunciar Acción Completada
```javascript
// En servicios/calculator.js o donde sea:
announceTurnoSaved("2026-06-02", "06:00", "14:00");
// Screen reader dirá: "Turno guardado el 2026-06-02 de 06:00 a 14:00"
```

#### Validar Formulario
```javascript
var form = document.getElementById('turno-form');
setupFormValidation(form, {
  salario: { required: true, min: 1750905 },
  fecha: { required: true }
});
```

---

## 📁 Estructura de Archivos

```
js/utils/
├── a11y-helpers.js          # Funciones ARIA base
├── a11y-announcements.js    # Sistema de anuncios
├── a11y-keyboard.js         # Navegación por teclado
└── a11y-form-validation.js  # Validación accesible

css/accessibility/
├── a11y-focus.css           # Focus visible y skip links
└── a11y-contrast.css        # Contraste WCAG

js/app/
└── a11y-init.js             # Inicialización global
```

---

## 🧪 Pruebas Recomendadas

### Con Screen Readers
1. **NVDA (Windows)** → Descargar en [nvaccess.org](https://www.nvaccess.org/)
2. **JAWS (Windows, pago)** → Más avanzado
3. **VoiceOver (macOS/iOS)** → Cmd + F5
4. **TalkBack (Android)** → Volumen + + (mantener 3 seg)

### Checklist de Prueba
- [ ] Tab navega todo el sitio sin ataques
- [ ] Escape cierra modales
- [ ] Los botones se activan con Enter/Space
- [ ] Las flechas funcionan en listas
- [ ] Los errores se anuncian
- [ ] El contraste es suficiente en alto contraste
- [ ] Los anuncios se escuchan correctamente

---

## 🔧 Configuración Recomendada en los Componentes

### Ejemplo: Componente de Turno

```javascript
// home.js o donde sea
function renderTurnoForm() {
  var form = document.createElement('form');
  form.setAttribute('aria-label', 'Formulario para agregar turno');
  
  var salarioInput = document.createElement('input');
  salarioInput.type = 'number';
  salarioInput.setAttribute('aria-label', 'Salario en pesos colombianos');
  salarioInput.setAttribute('aria-describedby', 'salary-min');
  
  var hint = document.createElement('div');
  hint.id = 'salary-min';
  hint.textContent = 'Mínimo $1.750.905 según ley 2101';
  
  form.appendChild(salarioInput);
  form.appendChild(hint);
  
  // Validar al blur
  salarioInput.addEventListener('blur', function() {
    validateSalario(salarioInput);
  });
  
  // Submit con validación
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (validateSalario(salarioInput)) {
      announceTurnoSaved(...);
      // Guardar turno
    }
  });
  
  return form;
}
```

---

## 📚 Referencias WCAG

- **2.1 Navegación por Teclado** → ✅ Implementado
- **2.4.3 Focus Order** → ✅ Tab order lógico
- **2.4.7 Focus Visible** → ✅ Outline 3px azul
- **3.3.1 Identificación de Errores** → ✅ Mensajes aria-invalid
- **4.1.2 Nombre, Role, Value** → ✅ ARIA completo
- **3.2.2 En el Foco** → ✅ No hay cambios inesperados

**Cumple: WCAG 2.1 Level AA** (la mayoría de componentes)

---

## 🐛 Troubleshooting

### El screen reader no anuncia cambios
**Solución:** Asegúrate que el elemento tiene `aria-live="polite"` o `aria-live="assertive"`

```javascript
announceToScreenReader("Tu mensaje aquí", "assertive");
```

### Tab no navega correctamente
**Solución:** Verifica que los elementos tienen `tabindex` correcto
```javascript
// Hacer elemento navegable
element.setAttribute('tabindex', '0');

// Sacarlo del orden de tab
element.setAttribute('tabindex', '-1');
```

### Errores no se anuncia
**Solución:** Usa `displayInputErrors()` en lugar de solo cambiar CSS
```javascript
displayInputErrors(input, ['El campo es requerido']);
// Esto anunciará: "Salario inválido: El campo es requerido"
```

---

## 🙏 Agradecimientos

Esta implementación de accesibilidad fue hecha con ❤️ para que **TODO el mundo** pueda usar Mi Turno, sin importar sus capacidades visuales.

¡Los cieguitos agradecen! 👨‍🦯👩‍🦯

---

## 📞 Contacto & Soporte

Si encuentras problemas de accesibilidad:
1. Abre un **issue** con tag `accessibility`
2. Describe: ¿Qué screen reader usas? ¿Qué falla?
3. Pasos para reproducir

---

**Rama:** `feat/a11y-blind-support`  
**Última actualización:** 2 de junio, 2026  
**Estado:** ✅ Listo para testing
