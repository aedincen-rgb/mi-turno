# Mi Turno · Guía para publicar en Google Play Store

> **Tu único paso antes de empezar:** pagar los **USD $25** (pago único de por vida) en [play.google.com/console](https://play.google.com/console). Es la registración de developer.
>
> **Todo lo demás está automatizado.** Una vez hecho el pago, subís un solo archivo.

---

## Estado actual (v163, 5 junio 2026)

- ✅ **Keystore TWA** generado y configurado: `twa/android.keystore` (alias `miturno`, password `miturno2026`, SHA256 `7D:04:95:...`)
- ✅ **Digital Asset Links** validados: `.well-known/assetlinks.json` con el SHA256 que coincide
- ✅ **Toolchain listo**: Java 17, Android SDK, Gradle wrapper
- ✅ **Script de build** automatizado: `scripts/build-twa.sh` (un solo comando)
- ✅ **PWA en producción**: https://miturno.one/app (v163, auditada WCAG AA, sin errores de parse)

---

## Pasos para vos (después del pago de USD $25)

### 1. Pagá la registración de developer (única vez)

1. Andá a https://play.google.com/console
2. Logueate con tu Google account
3. Aceptá los términos
4. Pagá USD $25 (tarjeta de crédito o Google Pay)
5. Completá el registro de developer:
   - Tipo: **Persona** (o "Organización" si querés registrar a nombre de una empresa)
   - Nombre del developer: tu nombre (lo que va a aparecer como publicador)
   - País: Colombia
   - Email de contacto
6. La activación es instantánea (a veces tarda hasta 24h)

### 2. Generá el AAB firmado

En tu laptop, abrí una terminal y corré:

```bash
cd ~/mi-turno
bash scripts/build-twa.sh
```

Eso va a:
- Verificar el keystore y la coherencia con `assetlinks.json`
- Compilar el AAB (Android App Bundle) en `app/build/outputs/bundle/release/app-release.aab`
- Mostrarte el resultado con el próximo paso

Tarda 2-5 minutos la primera vez (después es más rápido porque gradle cachea).

### 3. Creá la app en Play Console

1. En Play Console, hacé click en **"Crear app"**
2. Completá:
   - **Nombre**: `Mi Turno`
   - **Idioma predeterminado**: Español (Latinoamérica)
   - **App o juego**: App
   - **Gratis o de pago**: Gratis
   - **Declaraciones**: Aceptá todas
3. Te lleva al panel de la app. Andá a **"Configuración" → "Información de la app"** y completá:
   - **Nombre de la app**: Mi Turno
   - **Descripción corta** (80 chars): `Calculá tu salario real turno a turno con la Ley 2101/2021.`
   - **Descripción completa** (4000 chars): `Mi Turno es la calculadora de nómina para trabajadores por turnos en Colombia. Calcula automáticamente todos los recargos de ley: nocturno, dominical, festivo, horas extra y sus combinaciones. Funciona offline. 100% local, sincroniza entre dispositivos. Cumple Ley 2101/2021. WCAG 2.1 AA. Sin registro obligatorio.`

### 4. Subí el AAB

1. En el menú lateral: **"Liberación" → "Producción"** (o "Testing" → "Internal testing" para probar primero)
2. Click en **"Crear nueva liberación"**
3. Click en **"Explorar archivos"** y seleccioná:
   ```
   ~/mi-turno/app/build/outputs/bundle/release/app-release.aab
   ```
4. Asignale un nombre a la versión: `1.0.0`
5. Aceptá los checks de Play Console

### 5. Completá los assets gráficos

Play Console te pide:

| Asset | Tamaño | Dónde sacarlo |
|---|---|---|
| **Icono** | 512×512 PNG | `icon-512.png` (ya existe en el repo) |
| **Gráfico de feature** | 1024×500 PNG | Subí uno (sugerencia: marketing/design) |
| **Screenshots** (mín. 2) | Teléfono + Tablet | Tomalas con `npm run dev`, abrí en Chrome, capturá cada tab |

### 6. Categorización

- **Categoría**: Productividad (o Finanzas)
- **Tags**: nomina, colombia, recargos, turnos
- **Público objetivo**: Adultos (18+), sin restricción de edad
- **Contenido**: "Sin contenido generado por usuarios" (la app es local)

### 7. Política de privacidad

- **URL**: `https://miturno.one/privacy.html` (ya está desplegada)

### 8. Enviar a revisión

1. Revisá toda la información
2. Click en **"Enviar para revisión"**
3. Google revisa típicamente en **24-48 horas**
4. Si todo está bien, queda en "Internal testing" o "Producción" según lo que elegiste

---

## Datos útiles (referencia)

| Campo | Valor |
|---|---|
| **Package ID** | `one.miturno.twa` |
| **Nombre de la app** | Mi Turno |
| **URL de la PWA** | https://miturno.one |
| **Start URL** | /app |
| **Keystore alias** | miturno |
| **Keystore password** | `miturno2026` |
| **SHA256** | `7D:04:95:A9:38:E7:14:77:A4:91:9A:52:18:83:31:F0:E4:5E:E4:56:6D:08:8A:80:70:32:26:BA:85:45:AB:7B` |
| **Permisos requeridos** | INTERNET (solo para sync con Supabase) |
| **Permisos opcionales** | CAMERA (para foto de perfil, opcional) |
| **Versión mínima Android** | 5.0 (API 21) |
| **Versión objetivo Android** | 14 (API 35) |
| **Compile SDK** | 36 |

---

## ⚠️ Cosas importantes a NO hacer

- ❌ **NO regeneres el keystore después de subir a Play Store.** Una vez que subís un AAB firmado con un keystore, todas las actualizaciones futuras DEBEN estar firmadas con el mismo. Si lo perdés, no podés actualizar la app.
- ❌ **NO subas el keystore al repo** (ya está en `.gitignore`).
- ❌ **NO uses `playBilling` en el manifest** si no vas a vender contenido (no es tu caso, ya está deshabilitado en `twa-manifest.json`).
- ❌ **NO cambies el package ID** (`one.miturno.twa`) después de publicar — es permanente.

## 🆘 Si algo falla

| Síntoma | Causa probable | Fix |
|---|---|---|
| Build falla con "SDK not found" | `ANDROID_HOME` no apunta al SDK | Verificá con `echo $ANDROID_HOME` |
| AAB generado pero Play Console dice "firma inválida" | Keystore inconsistente | Re-corré `scripts/build-twa.sh` y revisá el log |
| "Digital Asset Links no valida" | El SHA256 de `assetlinks.json` no coincide | Re-regenerá el keystore + assetlinks en simultáneo |
| Play Console pide algo extra que no está en la guía | Nueva política de Google (cambia cada tanto) | Decime y te ayudo |

---

## Después de publicar

Una vez en Play Store, **cada vez que bumpees versión en el repo**:

1. Cambios normales: commit, push → Vercel auto-despliega
2. Si querés que la versión de Play Store también se actualice:
   ```bash
   bash scripts/build-twa.sh
   ```
   Y subí el nuevo AAB a Play Console en "Producción → Crear nueva release".

---

*Generado el 5 de junio de 2026. Mi Turno v163.*
