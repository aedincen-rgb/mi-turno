// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/ai-synonyms.js
//  Diccionario de sinónimos exhaustivo para el NLP colombiano.
//  Formato: canónico → array de variantes/sinónimos.
//  ai-nlp.js construye el lookup inverso (variante→canónico) en boot.
//  100% offline · ES5 · sin dependencias externas.
// ════════════════════════════════════════════════════════════════

var AI_SYNONYMS_DICT = {
  // ── 1. TURNO / JORNADA ────────────────────────────────────────
  turno: [
    'jornada',
    'guardia',
    'guardias',
    'entrada',
    'salida',
    'servicio',
    'servicio laboral',
    'periodo',
    'labor',
    'sesion',
    'tarea',
    'trabajo del dia',
    'jornada laboral',
    'jornada de trabajo',
    'bloque',
    'ronda',
    'vuelta',
    'marque',
    'marcacion',
    'fichar',
    'fichaje',
    'dia de trabajo',
    'dia laboral',
    'dia trabajado',
    'dia de labores',
    'mi turno hoy',
    'arranque'
  ],

  // ── 2. SALARIO / DINERO ───────────────────────────────────────
  salario: [
    'sueldo',
    'nomina',
    'nomina mensual',
    'basico',
    'salario base',
    'mensual',
    'fijo',
    'paga',
    'remuneracion',
    'compensacion',
    'salario bruto',
    'salario neto',
    'salario mensual',
    'lo que me pagan',
    'mi pago mensual',
    'mi sueldo',
    'cuanto gano',
    'cuanto me pagan',
    'lo que gano',
    'sueldo base',
    'salario minimo',
    'minimo',
    'smmlv',
    'salario legal'
  ],

  dinero: [
    'plata',
    'billete',
    'lucas',
    'lana',
    'lanita',
    'guita',
    'money',
    'cash',
    'efectivo',
    'pago',
    'cobro',
    'cobre',
    'pagaron',
    'cobraron',
    'gane',
    'gané',
    'saque',
    'saqué',
    'junte',
    'junté',
    'cuanto saque',
    'cuanto junte',
    'ganancia',
    'ganancias',
    'ingreso',
    'ingresos',
    'devengado',
    'lo que gane',
    'lo que gané',
    'mis ganancias',
    'mis ingresos',
    'cuanto me hice',
    'cuanto me gane',
    'lo que me queda',
    'lo mio',
    'moneda',
    'menudo',
    'sencillo',
    'mosca',
    'real',
    'reales',
    'morlacos',
    'chirolas',
    'plata del mes',
    'plata de la quincena',
    'mis cobros'
  ],

  // ── 3. RECARGOS / EXTRAS ──────────────────────────────────────
  recargo: [
    'extra',
    'adicional',
    'plus',
    'bonificacion',
    'incremento',
    'porcentaje',
    'factor',
    'sobrecargo',
    'suplemento',
    'recargo laboral',
    'pago adicional',
    'pago extra',
    'lo que me dan extra',
    'lo que me pagan de mas',
    'lo adicional',
    'recargos legales',
    'tabla de recargos',
    'que me pagan de mas',
    'recargo por',
    'lo del recargo'
  ],

  // ── 4. HORA NOCTURNA ──────────────────────────────────────────
  nocturno: [
    'noche',
    'nocturna',
    'nocturnas',
    'nocturnos',
    'madrugada',
    'de noche',
    'en la noche',
    'horario nocturno',
    'turno nocturno',
    'turno de noche',
    'trabajo de noche',
    'trabajo nocturno',
    'jornada nocturna',
    'jornada de noche',
    'horas de noche',
    'horas nocturnas',
    'las de noche',
    'recargo nocturno',
    'recargo de noche',
    'nocturnidad',
    'trasnochada',
    'trasnoche',
    'de madrugada',
    'en madrugada',
    'turno madrugada',
    'tarde noche',
    'nochero',
    'trabajo nochero',
    'turno nochero',
    'cuanto vale la nocturna',
    'hora nocturna'
  ],

  // ── 5. HORA DOMINICAL ─────────────────────────────────────────
  dominical: [
    'domingo',
    'domingos',
    'dominicales',
    'dia dominical',
    'trabajar domingo',
    'turno domingo',
    'trabajo dominical',
    'horas del domingo',
    'recargo dominical',
    'domingo festivo',
    'turno dominical',
    'trabajar el domingo',
    'fin de semana',
    'finde',
    'findesemana',
    'finde semana',
    'fin semana',
    'sabado y domingo',
    'el fin de semana',
    'jornada dominical',
    'cuanto pagan domingo',
    'cuanto vale el domingo',
    'cuanto es un domingo',
    'pago dominical'
  ],

  // ── 6. HORA FESTIVA ───────────────────────────────────────────
  festivo: [
    'feriado',
    'festividad',
    'fiesta',
    'dia festivo',
    'festivos',
    'feriados',
    'fest',
    'dia feriado',
    'dia de fiesta',
    'puente festivo',
    'puente',
    'dia puente',
    'puentes',
    'dia patrio',
    'dias patrios',
    'dia libre obligatorio',
    'dia libre legal',
    'dia de descanso obligatorio',
    'dia no laborable',
    'proximo festivo',
    'proximos festivos',
    'cuando es festivo',
    'cuantos festivos',
    'festivos del mes',
    'festivo nacional',
    'dia de ley',
    'ley festivo',
    'festivo colombia',
    'feriado colombia',
    'horas festivas',
    'recargo festivo',
    'cuanto vale el festivo',
    'trabajar festivo'
  ],

  // ── 7. HORA EXTRA DIURNA ──────────────────────────────────────
  extra_diurna: [
    'hora extra',
    'horas extra',
    'hora extra diurna',
    'overtime',
    'sobretiempo',
    'sobretiempo diurno',
    'tiempo extra',
    'horas adicionales',
    'horas de mas',
    'mas horas',
    'trabajar de mas',
    'extra de dia',
    'extra diurno',
    'extra diurna',
    'extras del dia',
    'horas que pasan',
    'lo que pasa de las 8',
    'cuanto vale hora extra',
    'hora extra normal',
    'extra ordinaria',
    'extras normales'
  ],

  // ── 8. HORA EXTRA NOCTURNA ────────────────────────────────────
  extra_nocturna: [
    'extra de noche',
    'hora extra nocturna',
    'overtime nocturno',
    'sobretiempo nocturno',
    'extra nocturno',
    'extra nocturna',
    'horas extra de noche',
    'extras de noche',
    'extras nocturnas',
    'overtime de noche',
    'cuanto vale hora extra nocturna',
    'extra en la madrugada',
    'nocturnidad extra'
  ],

  // ── 9. HISTORIAL / REGISTRO ───────────────────────────────────
  historial: [
    'registro',
    'registros',
    'mis turnos',
    'turnos pasados',
    'turnos anteriores',
    'mis turnos pasados',
    'lo que trabaje',
    'lo que trabajé',
    'lista de turnos',
    'todos mis turnos',
    'mi registro',
    'mi historial',
    'historial de turnos',
    'ver mis turnos',
    'mis jornadas',
    'mis jornadas anteriores',
    'lo trabajado',
    'lo que llevo',
    'mi logbook',
    'bitacora',
    'bitácora',
    'mis dias trabajados',
    'los turnos que hice',
    'cuantos turnos llevo',
    'ver historial',
    'consultar historial',
    'abrir historial'
  ],

  // ── 10. INFORME / REPORTE ─────────────────────────────────────
  informe: [
    'reporte',
    'análisis',
    'analitica',
    'desglose',
    'detalle',
    'explicacion completa',
    'resumen detallado',
    'resumen completo',
    'informe detallado',
    'reporte completo',
    'ver todo',
    'descargar informe',
    'exportar',
    'pdf',
    'excel',
    'archivo',
    'documento',
    'bajar datos',
    'guardar informe',
    'descargar turnos',
    'mi informe',
    'mi reporte',
    'reporte mensual',
    'informe mensual',
    'datos completos',
    'ver mis datos',
    'mis datos',
    'el detalle'
  ],

  // ── 11. PROYECCIÓN / ESTIMADO ─────────────────────────────────
  proyeccion: [
    'estimado',
    'estimacion',
    'calculo',
    'cuanto voy a ganar',
    'cuanto me van a pagar',
    'me van a pagar',
    'cuanto me pagaran',
    'cuanto me pagaria',
    'meta',
    'objetivo',
    'al cierre',
    'al final del mes',
    'cuanto al final',
    'proyectar',
    'proyectame',
    'proyecta',
    'cuanto hare',
    'cuanto haré',
    'cuanto recibire',
    'cuanto recibiré',
    'cuanto me llega',
    'cuanto me hago',
    'fin de mes',
    'cierre de mes',
    'al terminar el mes',
    'al terminar',
    'cuanto acumulo',
    'cuanto ganaria',
    'cuanto ganaría',
    'pronostico',
    'tendencia',
    'como voy al cierre',
    'como termino el mes',
    'lo que voy a cobrar',
    'lo que me queda por cobrar'
  ],

  // ── 12. INICIO DE TURNO ───────────────────────────────────────
  iniciar_turno: [
    'iniciar',
    'empezar',
    'comenzar',
    'arrancar',
    'entré',
    'entre al trabajo',
    'llegue al trabajo',
    'llegué',
    'estoy trabajando',
    'ya estoy en el trabajo',
    'empece',
    'empecé',
    'comience',
    'comencé',
    'inicio turno',
    'empezar turno',
    'marcar entrada',
    'fichar entrada',
    'inicia mi turno',
    'empieza mi turno',
    'arrancar turno',
    'ya empece',
    'ya empecé',
    'acabo de entrar',
    'entre ya',
    'le di inicio',
    'di inicio',
    'arranque el turno',
    'empece el turno',
    'entré al camello'
  ],

  // ── 13. FIN DE TURNO ──────────────────────────────────────────
  cerrar_turno: [
    'terminar',
    'finalizar',
    'parar',
    'salí',
    'ya termine',
    'ya terminé',
    'ya sali',
    'ya salí',
    'cerrar turno',
    'terminar turno',
    'acabar',
    'acabar turno',
    'listo',
    'listo el turno',
    'fin de turno',
    'sali del trabajo',
    'salí del trabajo',
    'termine de trabajar',
    'terminé',
    'ya acabe',
    'ya acabé',
    'marcar salida',
    'fichar salida',
    'cierra mi turno',
    'cierra el turno',
    'parar el turno',
    'fin del camello',
    'ya sali del camello',
    'pare el turno'
  ],

  // ── 14. ASISTENTE / IA ───────────────────────────────────────
  asistente: [
    'ia',
    'inteligencia artificial',
    'bot',
    'chat',
    'chatbot',
    'preguntarle',
    'preguntale',
    'consultarle',
    'consultar',
    'inteligencia',
    'asistente virtual',
    'asistente ia',
    'el asistente',
    'la ia',
    'el bot',
    'el chat',
    'hablar con la ia',
    'hablar con el bot',
    'decirle',
    'escribirle',
    'pregunta',
    'pregunta a la ia'
  ],

  // ── 15. CONFIGURACIÓN / AJUSTES ──────────────────────────────
  ajustes: [
    'configuracion',
    'opciones',
    'settings',
    'preferencias',
    'mi cuenta',
    'perfil',
    'la config',
    'los ajustes',
    'ir a ajustes',
    'abrir ajustes',
    'abrir configuracion',
    'ir a configuracion',
    'mis preferencias',
    'mis opciones',
    'panel de control',
    'administracion',
    'parametros',
    'personalizar',
    'personalizar app',
    'configurar app'
  ],

  // ── 16. SALARIO MÍNIMO ───────────────────────────────────────
  salario_minimo: [
    'minimo',
    'smmlv',
    'salario base legal',
    'salario legal',
    'el minimo',
    'sueldo minimo',
    'salario minimo legal',
    'cuanto es el minimo',
    'cuanto es el smmlv',
    'salario minimo colombia',
    'cuanto es el salario minimo',
    'salario minimo 2026',
    'el basico legal',
    '1750905',
    'un millon setecientos',
    'el minimo legal vigente',
    'smmlv 2026',
    'cuanto es el minimo mensual'
  ],

  // ── 17. AUXILIO DE TRANSPORTE ─────────────────────────────────
  auxilio_transporte: [
    'auxilio',
    'transporte',
    'subsidio',
    'auxilio transporte',
    'cuanto es auxilio',
    'subsidio de transporte',
    'bono transporte',
    'ayuda transporte',
    'el auxilio',
    'auxilio de movilidad',
    'transporte legal',
    '249095',
    'doscientos cuarenta y nueve',
    'auxilio mensual',
    'el subsidio',
    'bono de transporte',
    'auxilio 2026'
  ],

  // ── 18. LIQUIDACIÓN ──────────────────────────────────────────
  liquidacion: [
    'liquidacion',
    'finiquito',
    'cuando me van a pagar',
    'me voy',
    'renuncia',
    'despido',
    'retiro',
    'me retiro',
    'cuanto me liquidan',
    'mis prestaciones al salir',
    'liquidar',
    'calcular liquidacion',
    'liquidacion laboral',
    'lo que me deben',
    'lo que me deben pagar al salir',
    'derechos al terminar',
    'al terminar el contrato',
    'finalizacion de contrato',
    'pago final',
    'cuando me vaya cuanto cobro',
    'al salir cuanto me pagan'
  ],

  // ── 19. CESANTÍAS ────────────────────────────────────────────
  cesantias: [
    'cesantia',
    'ahorros laborales',
    'fondo cesantias',
    'fondo de cesantias',
    'fondo',
    'ahorro obligatorio',
    'ahorro del trabajo',
    'mis cesantias',
    'mis ahorros laborales',
    'cuanto tengo en cesantias',
    'prima de cesantia',
    'consignar cesantias',
    'retiro cesantias',
    'cesantias parciales',
    'lo del fondo',
    'el fondo'
  ],

  // ── 20. PRIMA DE SERVICIOS ───────────────────────────────────
  prima: [
    'prima de servicios',
    'prima de navidad',
    'aguinaldo',
    'extra de diciembre',
    'prima semestral',
    'prima junio',
    'prima diciembre',
    'la prima',
    'mis primas',
    'la prima de junio',
    'la prima de diciembre',
    'cuanto me toca de prima',
    'cuando me pagan la prima',
    'prima legal',
    'prima de mitad de ano',
    'prima de fin de ano'
  ],

  // ── 21. VACACIONES ───────────────────────────────────────────
  vacaciones: [
    'descanso',
    'dias libres',
    'tiempo libre',
    'licencia',
    'dias de vacaciones',
    'mis vacaciones',
    'planear vacaciones',
    'quiero vacaciones',
    'pedir vacaciones',
    'calcular vacaciones',
    'irme de vacaciones',
    'cuantos dias de vacaciones',
    'dias de descanso',
    'dias de asueto',
    'periodo de descanso',
    'licencia vacaciones',
    'vacaciones remuneradas',
    'mis dias libres',
    'cuando puedo coger vacaciones',
    'cuando me toca vacaciones',
    'disfrute de vacaciones'
  ],

  // ── 22. SEGURIDAD SOCIAL ─────────────────────────────────────
  seguridad_social: [
    'eps',
    'pension',
    'aportes',
    'seguridad',
    'salud',
    'cotizacion',
    'parafiscales',
    'aportes a salud',
    'aportes a pension',
    'caja de compensacion',
    'sena',
    'icbf',
    'aportes parafiscales',
    'caja',
    'cajacom',
    'lo que descuentan',
    'descuentos de nomina',
    'lo que me descontaron',
    'el descuento',
    'las deducciones',
    'cuanto me descuentan',
    'cuanto me quitan'
  ],

  // ── 23. TIEMPO TRABAJADO / HORAS ─────────────────────────────
  horas: [
    'horas trabajadas',
    'tiempo trabajado',
    'total horas',
    'cuantas horas',
    'cuanto tiempo',
    'horas totales',
    'horas acumuladas',
    'tiempo total',
    'horas hoy',
    'horas ayer',
    'horas esta semana',
    'duracion',
    'duración',
    'minutos',
    'cuanto llevo trabajado',
    'tiempo en el trabajo',
    'las horas',
    'mi jornada',
    'horas de la jornada',
    'horas del turno',
    'duracion del turno',
    'cuanto dure',
    'cuánto duré',
    'cuanto duro el turno',
    'cuantas horas llevo'
  ],

  // ── 24. TRABAJO (VERBO / CONCEPTO) ───────────────────────────
  trabajo: [
    'laburo',
    'chamba',
    'camello',
    'curro',
    'brete',
    'labor',
    'empleo',
    'rebusque',
    'ocupacion',
    'camellar',
    'camellando',
    'trabajar',
    'trabajando',
    'estoy en el camello',
    'en el camello',
    'en la labor',
    'en el trabajo',
    'en el brete',
    'en la chamba',
    'mi camello',
    'mi chamba',
    'mi brete',
    'el laburo',
    'en el laburo',
    'mi jale'
  ],

  // ── 25. TOTAL / RESUMEN ───────────────────────────────────────
  total: [
    'resumen',
    'balance',
    'cuentas',
    'numeros',
    'números',
    'cifras',
    'consolidado',
    'acumulado',
    'cuanto llevo',
    'cuanto he ganado',
    'total ganado',
    'total del mes',
    'suma total',
    'el total',
    'lo de hoy',
    'lo del mes',
    'mis numeros',
    'cuanto tengo',
    'cuanto acumule',
    'cuanto acumulé',
    'el acumulado',
    'lo acumulado',
    'ver el total',
    'dame el total',
    'dime el total'
  ],

  // ── 26. SEMANA ────────────────────────────────────────────────
  semana: [
    'esta semana',
    'semana actual',
    'semana en curso',
    'la semana',
    'de la semana',
    'lo de la semana',
    'horas de la semana',
    'turnos de la semana',
    'lo que trabaje esta semana',
    'lo semanal',
    'semanal',
    'por semana',
    'a la semana'
  ],

  semana_pasada: [
    'la semana pasada',
    'semana anterior',
    'semana que paso',
    'la semana que pasó',
    'la semana pasada que fue',
    'la anterior',
    'anterior semana',
    'semana previa',
    'lo de la semana pasada',
    'lo semanal anterior'
  ],

  // ── 27. MES ───────────────────────────────────────────────────
  mes: [
    'este mes',
    'mes actual',
    'mes en curso',
    'el mes',
    'de este mes',
    'lo del mes',
    'mensual',
    'mes corriente',
    'cuanto este mes',
    'horas del mes',
    'turnos del mes'
  ],

  mes_pasado: [
    'el mes pasado',
    'mes anterior',
    'mes que paso',
    'el mes que pasó',
    'el anterior',
    'mes previo',
    'lo del mes pasado',
    'lo mensual anterior',
    'comparar con el mes pasado',
    'vs mes pasado'
  ],

  // ── 28. QUINCENA ──────────────────────────────────────────────
  quincena: [
    'quincenal',
    'pago quincenal',
    'cada 15 dias',
    'cada quince',
    'mi quincena',
    'quincena 1',
    'quincena 2',
    'q1',
    'q2',
    'primer quincena',
    'segunda quincena',
    'la quincena',
    'cuanto de la quincena',
    'lo de la quincena',
    'pago de quincena',
    'cobro quincenal',
    'cobro de quincena',
    'cada 15',
    'los quince',
    'el quince',
    'el ultimo',
    'cobro del quince',
    'cobro del ultimo',
    'pago del 15',
    'pago del ultimo'
  ],

  // ── 29. DÍAS DE LA SEMANA ─────────────────────────────────────
  lunes: [
    'el lunes',
    'este lunes',
    'el día lunes',
    'inicio de semana',
    'primer dia semana',
    'lunes de trabajo',
    'turno lunes'
  ],
  martes: ['el martes', 'este martes', 'el día martes', 'turno martes'],
  miercoles: [
    'el miercoles',
    'miércoles',
    'este miercoles',
    'el miércoles',
    'turno miercoles',
    'mitad de semana'
  ],
  jueves: ['el jueves', 'este jueves', 'el día jueves', 'turno jueves'],
  viernes: [
    'el viernes',
    'este viernes',
    'el día viernes',
    'turno viernes',
    'el viernes por la noche',
    'viernes por la noche'
  ],
  sabado: [
    'el sabado',
    'sábado',
    'este sabado',
    'el sábado',
    'turno sabado',
    'el fin de semana primer dia'
  ],
  domingo: [
    'el domingo',
    'este domingo',
    'el día domingo',
    'turno domingo',
    'trabajar domingo',
    'dominical'
  ],

  // ── 30. MESES DEL AÑO ────────────────────────────────────────
  enero: ['en enero', 'mes de enero', 'primer mes', 'el primero del año'],
  febrero: ['en febrero', 'mes de febrero', 'el segundo mes'],
  marzo: ['en marzo', 'mes de marzo', 'el tercer mes'],
  abril: ['en abril', 'mes de abril'],
  mayo: ['en mayo', 'mes de mayo'],
  junio: ['en junio', 'mes de junio', 'mitad de año'],
  julio: ['en julio', 'mes de julio'],
  agosto: ['en agosto', 'mes de agosto'],
  septiembre: ['en septiembre', 'mes de septiembre', 'septiembe'],
  octubre: ['en octubre', 'mes de octubre'],
  noviembre: ['en noviembre', 'mes de noviembre'],
  diciembre: ['en diciembre', 'mes de diciembre', 'el ultimo mes', 'navidad', 'fin de año'],

  // ── 31. PRESTACIONES SOCIALES ────────────────────────────────
  prestaciones: [
    'prestaciones sociales',
    'beneficios',
    'beneficios laborales',
    'mis prestaciones',
    'cuanto de prestaciones',
    'cesantias y prima',
    'prima y cesantias',
    'prestaciones legales',
    'lo que me corresponde',
    'mis derechos laborales',
    'beneficios sociales',
    'lo que me deben',
    'mis beneficios'
  ],

  // ── 32. LEY / NORMATIVA ───────────────────────────────────────
  ley: [
    'normativa',
    'legislacion',
    'legislación',
    'codigo laboral',
    'código laboral',
    'cst',
    'codigo sustantivo',
    'articulo',
    'artículo',
    'legal',
    'derechos',
    'obligacion',
    'jornada maxima',
    'jornada máxima',
    'ley 2101',
    '2101',
    'horas legales',
    'limite legal',
    'limite de horas',
    'maximo legal',
    'cuantas horas permite la ley',
    'que dice la ley',
    'mis derechos',
    'el codigo laboral',
    'la ley laboral',
    'normas laborales',
    'legislacion laboral'
  ],

  // ── 33. EMAIL / CORREO ───────────────────────────────────────
  email: [
    'correo',
    'correo electronico',
    'correo electrónico',
    'enviar correo',
    'mandar correo',
    'mail',
    'e-mail',
    'enviar reporte',
    'mandar reporte',
    'enviar informe',
    'enviar a jefe',
    'enviar a empresa',
    'enviar a rrhh',
    'enviar al jefe',
    'mandarlo',
    'enviarlo',
    'envio',
    'envío',
    'correo al jefe',
    'reporte por correo',
    'informe por correo',
    'mandar por correo',
    'enviame',
    'envíame',
    'mandame el correo',
    'redacta',
    'redactar correo',
    'correo formal',
    'carta'
  ],

  // ── 34. AYUDA / TUTORIAL ─────────────────────────────────────
  ayuda: [
    'auxilio',
    'socorro',
    'como uso',
    'como se usa',
    'como funciona',
    'como inicio',
    'como registro',
    'tutorial',
    'guia',
    'guía',
    'explicame',
    'explícame',
    'no entiendo',
    'ayudame',
    'ayúdame',
    'necesito ayuda',
    'tengo una duda',
    'me puedes explicar',
    'como hago',
    'que hago',
    'qué hago',
    'instrucciones',
    'pasos',
    'como se hace',
    'no se como',
    'no sé cómo'
  ],

  // ── 35. PROYECCIÓN DE AHORRO / META ──────────────────────────
  ahorro: [
    'ahorrar',
    'cuanto ahorro',
    'cuanto puedo ahorrar',
    'meta de ahorro',
    'objetivo de ahorro',
    'cuanto necesito',
    'cuanto debo trabajar',
    'cuantas horas para',
    'cuanto falta para',
    'para llegar a',
    'para ahorrar',
    'guardar plata',
    'guardar dinero',
    'reservar',
    'alcanzar meta',
    'mi meta',
    'mi objetivo',
    'lo que quiero ahorrar',
    'para que me alcance',
    'cuanto me falta'
  ],

  // ── 36. CONEXIÓN / SINCRONIZACIÓN ────────────────────────────
  conexion: [
    'conectado',
    'sincronizado',
    'sincronizando',
    'sync',
    'nube',
    'online',
    'offline',
    'sin internet',
    'sin conexion',
    'sin conexión',
    'hay red',
    'funciona internet',
    'estoy conectado',
    'hay conexion',
    'hay conexión',
    'tengo internet',
    'modo avion',
    'modo avión',
    'la conexion',
    'estado de conexion',
    'led verde',
    'led ambar',
    'led gris',
    'sincronizarse',
    'subir datos'
  ],

  // ── 37. PROMEDIO / RENDIMIENTO ───────────────────────────────
  promedio: [
    'media',
    'promedio por turno',
    'promedio diario',
    'cuanto gano por dia',
    'por turno',
    'por dia',
    'promedio por hora',
    'cuanto gano en promedio',
    'promedio de ingresos',
    'promedio de ganancias',
    'mi promedio',
    'el promedio',
    'en promedio',
    'por jornada',
    'cuanto me da cada turno',
    'cuanto me da cada dia',
    'rendimiento',
    'productividad',
    'eficiencia'
  ],

  // ── 38. FATIGA / BIENESTAR ───────────────────────────────────
  fatiga: [
    'cansado',
    'cansada',
    'agotado',
    'agotada',
    'reventado',
    'reventada',
    'mamado',
    'mamada',
    'fundido',
    'fundida',
    'muerto',
    'muerta',
    'exhausto',
    'exhausta',
    'estres',
    'estrés',
    'estresado',
    'estresada',
    'burnout',
    'quemado',
    'quemada',
    'maluqueado',
    'maluqueada',
    'no doy mas',
    'no doy más',
    'no aguanto',
    'rendido',
    'rendida',
    'partido',
    'fundido del cansancio',
    'duro el turno',
    'pesado el turno',
    'semana dura',
    'semana pesada'
  ],

  // ── 39. SIMULACIÓN / HIPOTÉTICO ──────────────────────────────
  simulacion: [
    'si trabajo',
    'si hago',
    'si meto',
    'cuanto si',
    'cuanto ganaria',
    'cuanto ganaría',
    'horas mas',
    'horas más',
    'simular',
    'que pasaria',
    'que pasaría',
    'hipotetico',
    'hipotético',
    'y si',
    'que pasa si',
    'qué pasa si',
    'suponiendo que',
    'si trabajara',
    'si hiciera',
    'cuanto seria',
    'cuánto sería',
    'calcular si',
    'proyectar si',
    'simula',
    'hagamos la simulacion'
  ],

  // ── 40. COMPARATIVA ──────────────────────────────────────────
  comparativa: [
    'comparar',
    'comparacion',
    'comparación',
    'diferencia',
    'vs',
    'versus',
    'contra',
    'cotejar',
    'mas que antes',
    'menos que antes',
    'mejor que',
    'peor que',
    'cuanto subi',
    'cuanto baje',
    'cuanto subí',
    'cuanto bajé',
    'como me fue vs',
    'como estuvo vs',
    'comparar mes',
    'comparar semana',
    'vs mes pasado',
    'vs semana pasada',
    'diferencia con el mes',
    'diferencia con la semana'
  ],

  // ── JERGA COLOMBIANA ADICIONAL ───────────────────────────────
  // Estas entradas mapean expresiones coloquiales a conceptos
  // que el NLP ya sabe manejar — enriquecen sin duplicar lógica.

  patron: [
    'el patron',
    'la patrona',
    'el jefe',
    'la jefa',
    'el empleador',
    'la empresa',
    'los de rrhh',
    'recursos humanos',
    'el de rrhh',
    'la administracion',
    'el dueño',
    'la dueña'
  ],

  pagar: [
    'cancelar',
    'abonar',
    'feriar',
    'consignar',
    'depositar',
    'me caen',
    'me van a caer',
    'cuando me caen',
    'cuando me pagan',
    'dia de pago',
    'cuando cobro',
    'cuándo me pagan',
    'cuando es el pago',
    'dia de cobro'
  ],

  descansar: [
    'descanso',
    'pausa',
    'reposo',
    'descansar',
    'libre',
    'dia libre',
    'dia de descanso',
    'no trabajo hoy',
    'estoy descansando',
    'descanse',
    'descansé',
    'me tome el dia',
    'me tomé el día',
    'no trabaje hoy',
    'no trabajé hoy',
    'tengo el dia libre'
  ]
};

// ─── CONSTRUCCIÓN DEL LOOKUP INVERSO ──────────────────────────
// Construye variante→canónico a partir del diccionario anterior.
// Si una variante aparece en múltiples entradas, gana la última.
// Esto se ejecuta una sola vez en el boot y queda en AI_SYN_MAP.
var AI_SYN_MAP = (function () {
  var map = {};
  for (var canonical in AI_SYNONYMS_DICT) {
    if (!Object.prototype.hasOwnProperty.call(AI_SYNONYMS_DICT, canonical)) continue;
    var variants = AI_SYNONYMS_DICT[canonical];
    for (var i = 0; i < variants.length; i++) {
      // Normalizar la variante: minúsculas, sin tildes, recorte
      var raw = variants[i].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
      // También agregar el canónico mismo como su propia entrada
      map[raw] = canonical;
    }
    // El canónico también se mapea a sí mismo (normalizado)
    var rawCanon = canonical.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    map[rawCanon] = canonical;
  }
  return map;
})();

// ─── FUNCIÓN DE EXPANSIÓN ─────────────────────────────────────
// Recibe una palabra normalizada (sin tildes, minúsculas) y
// devuelve su forma canónica, o la misma palabra si no la encuentra.
function aiSynExpand(word) {
  return AI_SYN_MAP[word] || word;
}

// ─── FUNCIÓN DE EXPANSIÓN DE FRASE ───────────────────────────
// Intenta casar frases de 2-3 palabras antes de caer en palabras
// individuales. Esto permite que "fin de semana" → "dominical"
// o "auxilio de transporte" → "auxilio_transporte".
function aiSynExpandPhrase(text) {
  if (!text) return text;
  var t = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  // Intentar frases de 3 palabras primero, luego 2, luego 1
  var words = t.split(/\s+/);
  var result = [];
  var i = 0;
  while (i < words.length) {
    var found = false;
    // Trigrama
    if (i + 2 < words.length) {
      var tri = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
      if (AI_SYN_MAP[tri]) {
        result.push(AI_SYN_MAP[tri]);
        i += 3;
        found = true;
      }
    }
    // Bigrama
    if (!found && i + 1 < words.length) {
      var bi = words[i] + ' ' + words[i + 1];
      if (AI_SYN_MAP[bi]) {
        result.push(AI_SYN_MAP[bi]);
        i += 2;
        found = true;
      }
    }
    // Unigrama
    if (!found) {
      result.push(AI_SYN_MAP[words[i]] || words[i]);
      i++;
    }
  }
  return result.join(' ');
}

// ─── EXPORT ──────────────────────────────────────────────────
window.AI_SYNONYMS_DICT = AI_SYNONYMS_DICT;
window.AI_SYN_MAP = AI_SYN_MAP;
window.aiSynExpand = aiSynExpand;
window.aiSynExpandPhrase = aiSynExpandPhrase;

console.log(
  '[MT] ai-synonyms.js cargado — ' +
    Object.keys(AI_SYNONYMS_DICT).length +
    ' entradas canónicas, ' +
    Object.keys(AI_SYN_MAP).length +
    ' variantes totales'
);
