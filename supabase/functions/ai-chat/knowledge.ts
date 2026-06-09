// ════════════════════════════════════════════════════════════════
// MI TURNO · Edge Function: ai-chat/knowledge.ts
// Documento maestro de conocimiento de la app para Gemini.
// Extraído de: globals.js (RC, SMIN, AUX), calculator.js (lógica),
// ai-knowledge.js (base laboral), ai-help.js (38 guías).
//
// Filosofía: Gemini entiende → la app calcula.
// Gemini NO debe inventar números. Si necesita un cálculo,
// devuelve JSON con {intent, params, needs_calculation:true}
// y el cliente llama a doCalc / aiAdvisorSimular con datos reales.
// ════════════════════════════════════════════════════════════════

export const APP_KNOWLEDGE = `
# Mi Turno — Documento de conocimiento completo

## Qué es Mi Turno
Mi Turno es una PWA (Progressive Web App) 100% offline de cálculo de nómina
para trabajadores por turnos en Colombia. Registra turnos con timestamps exactos,
calcula automáticamente los recargos legales sobre el valor hora del usuario, y
genera reportes/informes exportables. Funciona sin conexión gracias a Service Worker.

---

## Constantes 2026 (Fuente: Decretos 1469-1470, diciembre 2025)

- Salario mínimo legal vigente (SMMLV): $1.750.905/mes
- Auxilio de transporte: $249.095/mes
  → Solo aplica si el salario base ≤ 2 × SMMLV ($3.501.810)
- Fórmula valor hora ordinaria: salario_base / 240 horas
  → Ejemplo con SMMLV: $1.750.905 / 240 = $7.295/hora

---

## Tabla completa de recargos (fuente: RC en globals.js)

| Categoría              | Factor | Recargo | Condición legal |
|------------------------|--------|---------|-----------------|
| Diurna ordinaria       | 1.00x  | 0%      | 6:00–21:00, día hábil, dentro de la jornada |
| Nocturna ordinaria     | 1.35x  | +35%    | 21:00–6:00, día hábil, dentro de la jornada |
| Diurna festiva/dom.    | 1.75x  | +75%    | 6:00–21:00, domingo o festivo colombiano |
| Nocturna festiva/dom.  | 2.10x  | +110%   | 21:00–6:00, domingo o festivo colombiano |
| Extra diurna           | 1.25x  | +25%    | 6:00–21:00, día hábil, FUERA de la jornada |
| Extra nocturna         | 1.75x  | +75%    | 21:00–6:00, día hábil, FUERA de la jornada |
| Extra fest. diurna     | 2.00x  | +100%   | 6:00–21:00, domingo/festivo, FUERA de jornada |
| Extra fest. nocturna   | 2.50x  | +150%   | 21:00–6:00, domingo/festivo, FUERA de jornada |

Notas críticas:
- El recargo nocturno corre entre las 21:00 y las 6:00 (CST Art. 168).
- "Extra" = horas que superan la jornada máxima (8h/día o límite semanal).
- El sábado es día ordinario, salvo que sea festivo nacional.
- La nocturna festiva NO es 35%+75% = 110%. El factor 2.10x es el correcto (CST Art. 171).

---

## Fórmula de cálculo

valor_hora_ordinaria = salario_base / 240
cop_por_hora = valor_hora_ordinaria × factor_recargo
cop_turno = suma(minutos_en_cada_categoría / 60 × factor_categoría × valor_hora)

Ejemplo con salario $2.000.000:
- Valor hora: $2.000.000 / 240 = $8.333
- 3 horas nocturnas: 3 × $8.333 × 1.35 = $33.749
- 2 horas dominicales: 2 × $8.333 × 1.75 = $29.166

El motor doCalc() clasifica cada minuto del turno en las 8 categorías aplicando:
1. Límite diario: 8h ordinarias antes de generar extras
2. Límite semanal: Ley 2101/2021 (44h en 2026, baja a 42h en julio 2027)
3. Festivos: detectados automáticamente para Colombia (18 fijos + Semana Santa)

---

## Jornada máxima legal (Ley 2101/2021)

Cronograma de reducción gradual:
- Hasta junio 2023: 48h/semana
- Jun 2023 – Jun 2024: 47h/semana
- Jun 2024 – Jun 2025: 46h/semana
- Jun 2025 – Jun 2026: 45h/semana
- Jun 2026 – Jul 2027: 44h/semana
- Jul 2027 en adelante: 42h/semana (meta final)

Horas extra permitidas: máximo 2h/día y 12h/semana (CST Art. 159).

---

## Prestaciones sociales

- Cesantías: 1 mes de salario por año (consignadas antes del 15 de febrero)
- Intereses de cesantías: 12% anual sobre el saldo
- Prima de servicios: 1 mes de salario por año (mitad en junio, mitad en diciembre)
- Vacaciones: 15 días hábiles por año trabajado (~1.25 días por mes)
- Fórmula vacaciones: salario / 720 × días proporcionales

Seguridad social (descuentos al trabajador):
- Salud: 4% del salario
- Pensión: 4% del salario
- Base de cálculo: devengado SIN auxilio de transporte

---

## Marco legal principal

- CST Art. 158-159: Jornada ordinaria y máxima
- CST Art. 168-171: Recargos nocturnos, dominicales y festivos
- Ley 2101/2021: Reducción gradual de jornada
- Decreto 1469/2025: Salario mínimo 2026
- Decreto 1470/2025: Auxilio de transporte 2026

---

## Funcionalidades de la app (para responder preguntas de ayuda)

La app tiene 5 pestañas principales:

1. **Inicio (Home)**: Botón de iniciar/finalizar turno. Muestra ganancias en tiempo real
   durante el turno activo. Indicador de conexión. Botón de turno rápido.

2. **Historial**: Lista de todos los turnos del mes. Filtro por quincena. Detalle por turno
   con desglose de recargos. Edición y eliminación de turnos. Gráfico de distribución.

3. **Asistente (IA)**: Chat con el motor NLP local (100% offline). Chips de preguntas
   rápidas. Toggle Gemini para preguntas más complejas (requiere conexión).
   Comandos slash: /simular, /meta, /tendencia, /metas, /limpiar, etc.

4. **Informe**: Resumen financiero del período. Exportar PDF y Excel. Enviar por correo
   o WhatsApp. Selector de período (mes, quincena, personalizado).

5. **Ajustes**: Configurar salario base. Perfil de usuario (nombre, foto).
   Opciones: auxilio transporte, quincena, modo oscuro, notificaciones.
   Gestión de cuenta: PIN, contraseña, correo. Backup/restauración.

---

## Calculadoras del asistente local

1. Liquidación y prestaciones → aiAdvisorLiquidacion()
2. Simulador de escenarios → aiAdvisorSimular(c, horas, tipo)
3. Optimizador de horarios → aiAdvisorOptimizador(c, metaExtra)
4. Planificador de ahorro → aiAdvisorAhorro(c, meta, meses)
5. Análisis fiscal → aiAdvisorFiscal(c)
6. Comparador de ofertas → aiAdvisorCompararOfertas(c, salario, horas)
7. Informe financiero completo → aiAdvisorInforme(c)
8. Análisis histórico → aiAdvisorHistorico(turnos, vh, salario)
9. Optimizador de descanso → aiAdvisorDescansoOptimo(c)
10. Proyección anual → aiAdvisorAnual(c, turnos, vh)

---

## Intents que requieren cálculo (needs_calculation: true)

Cuando el usuario pide estos tipos de consultas, el motor local tiene los datos
exactos del usuario. NO inventes números — devolvé el intent y los params:

- simular: quiere saber cuánto ganaría con N horas de un tipo específico
- total_ganado: cuánto lleva ganado en el período
- proyeccion: estimado al cierre del mes
- liquidacion: prestaciones y neto a recibir
- valor_hora: su valor hora personalizado
- ahorro: cuánto necesita trabajar para llegar a una meta
- optimizador: cómo distribuir turnos para ganar una meta

## Preguntas conceptuales (needs_calculation: false)

Estas se pueden responder directamente con el conocimiento de este documento:
- Qué es el recargo nocturno / dominical / festivo
- Cuánto pagan legalmente (en abstracto, sin salario del usuario)
- Qué dice la ley sobre jornada máxima
- Cuándo aplica el auxilio de transporte
- Cómo funcionan las prestaciones
- Cómo usar una función de la app (registrar turno, exportar, etc.)

---

## Ejemplos de cálculo resueltos

### Ejemplo 1: Turno nocturno ordinario
Salario base: $2.000.000
Valor hora: $2.000.000 / 240 = $8.333
Turno: 8 horas de 10 PM a 6 AM (todas nocturnas ordinarias)
Cálculo: 8 × $8.333 × 1.35 = $89.996

### Ejemplo 2: Turno dominical mixto
Salario base: $1.750.905 (SMMLV)
Valor hora: $1.750.905 / 240 = $7.296
Turno: domingo, 8 AM a 8 PM (12 horas: 8 ordinarias + 4 extra)
- 8h diurnas fest.: 8 × $7.296 × 1.75 = $102.144
- 4h extra fest. diur.: 4 × $7.296 × 2.00 = $58.368
Total: $160.512

### Ejemplo 3: Simulación de 4 horas nocturnas extra
Usuario con salario $1.800.000
Valor hora: $1.800.000 / 240 = $7.500
Cálculo: 4 × $7.500 × 1.75 (extra nocturna) = $52.500
`;
