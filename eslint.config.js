// eslint.config.js — ESLint v9 flat config for Mi Turno (vanilla JS + React CDN)
import js from '@eslint/js';

// External CDN/browser globals only (not defined by this project)
const externalGlobals = {
  // Browser
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  fetch: 'readonly',
  caches: 'readonly',
  URL: 'readonly',
  Blob: 'readonly',
  FormData: 'readonly',
  FileReader: 'readonly',
  Image: 'readonly',
  Promise: 'readonly',
  Array: 'readonly',
  Object: 'readonly',
  Math: 'readonly',
  Date: 'readonly',
  JSON: 'readonly',
  String: 'readonly',
  Number: 'readonly',
  Boolean: 'readonly',
  RegExp: 'readonly',
  Error: 'readonly',
  Intl: 'readonly',
  atob: 'readonly',
  btoa: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  Uint8Array: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  alert: 'readonly',
  confirm: 'readonly',
  prompt: 'readonly',
  location: 'readonly',
  history: 'readonly',
  screen: 'readonly',
  // CDN libraries
  React: 'readonly',
  ReactDOM: 'readonly',
  supabase: 'readonly',
  XLSX: 'readonly',
  jspdf: 'readonly',
  jsPDF: 'readonly',
};

// All project-defined globals available across script tags
const projectGlobals = {
  // react-init.js
  h: 'readonly',
  useState: 'readonly',
  useEffect: 'readonly',
  useRef: 'readonly',
  useCallback: 'readonly',
  useMemo: 'readonly',

  // config/globals.js
  SUPA: 'writable',
  CLOUD_MODE: 'writable',
  CLOUD_ERROR: 'writable',
  SMIN: 'readonly',
  HSEM: 'readonly',
  SKEY: 'readonly',
  U12H: 'readonly',
  RC: 'readonly',
  AUX_TRANSPORTE_2026: 'readonly',
  PRESTACIONES_PCT: 'readonly',
  FEST_CACHE: 'writable',
  getEaster: 'readonly',

  // config/env.js
  IS_IOS: 'readonly',
  IS_SAFARI: 'readonly',
  IS_IOS_SAFARI: 'readonly',
  IS_STANDALONE: 'readonly',

  // utils/storage.js
  safeStorage: 'readonly',
  leer: 'readonly',
  grabar: 'readonly',
  borrarKey: 'readonly',
  dk: 'readonly',

  // utils/haptic.js
  haptic: 'readonly',

  // utils/network.js
  traducirError: 'readonly',
  withTimeout: 'readonly',

  // utils/validation.js
  validarSesion: 'readonly',
  validarTurnoActivo: 'readonly',
  validarTurnos: 'readonly',

  // utils/uuid.js
  generateUUID: 'readonly',

  // utils/storage.js / network.js
  hashP: 'readonly',

  // utils/format.js
  fCOP: 'readonly',
  fDur: 'readonly',
  fDurShort: 'readonly',

  // utils/time.js
  semLun: 'readonly',
  esNoct: 'readonly',

  // utils/festivos.js
  esFest: 'readonly',
  getColombianHolidays: 'readonly',

  // utils/otp.js
  otpGenerar: 'readonly',
  otpVerificar: 'readonly',
  otpLimpiar: 'readonly',
  generarPINUnico: 'readonly',
  guardarPINEnNube: 'readonly',

  // services/*.js
  cargarDatos: 'readonly',
  insertTurno: 'readonly',
  supaDeleteTurno: 'readonly',
  supaDeleteAllTurnos: 'readonly',
  supaInsertTurno: 'readonly',
  supaSetActivo: 'readonly',
  supaSetSalario: 'readonly',
  supaSyncDown: 'readonly',
  buildContext: 'readonly',
  supaUpsertPerfil: 'readonly', // New
  supaSubscribeUser: 'readonly', // v39 realtime
  supaUpdatePinLookup: 'readonly', // v38 sync cola
  supaPropagateEmail: 'readonly', // v38 sync cola

  // services/quincena.js
  QUINCENA_PREFS_DEFAULT: 'readonly',
  normalizePrefs: 'readonly',
  getQuincenaRange: 'readonly',
  getQuincenasMes: 'readonly',
  filterTurnosRango: 'readonly',
  calcularExtras: 'readonly',
  formatRangoCorto: 'readonly',

  // utils/network.js
  isOnline: 'readonly',
  onOnline: 'readonly',
  removeOnlineListener: 'readonly',

  // utils/icons.js
  tabIcon: 'readonly',

  // app/fast-pin-screen.js + modals/forgot-pin.js
  FastPinScreen: 'readonly',
  ForgotPinModal: 'readonly',

  // utils/error-logger.js
  getErrors: 'readonly',
  addErrorListener: 'readonly',
  removeErrorListener: 'readonly',
  clearErrors: 'readonly',

  // tabs/sync-queue.js
  queueAction: 'readonly',
  processQueue: 'readonly',
  clearSyncQueue: 'readonly',

  // services/session-sync.js
  startSessionSync: 'readonly',
  stopSessionSync: 'readonly',
  verificarSesion: 'readonly',

  // services/ai-history.js + services/ai-greeting.js
  // + modals/email-compose-card.js (extraídos de assistant.js en v48)
  _aiClearHistory: 'readonly',
  _aiLoadHistory: 'readonly',
  _aiSaveHistory: 'readonly',
  _aiFormat: 'readonly',
  _saludoHora: 'readonly',
  _aiNombrePersonal: 'readonly',
  _aiHeroPhrases: 'readonly',
  EmailComposeCard: 'readonly',

  // config/globals.js
  getHSEM: 'readonly',
  MT_APP_VERSION: 'readonly',

  // utils/password-hash.js (v49)
  hashPassword: 'readonly',
  verifyPassword: 'readonly',

  deleteError: 'readonly',
  aiAnswer: 'readonly',
  calcCats: 'readonly',
  calcPorDia: 'readonly',
  doCalc: 'readonly',
  exportPDF: 'readonly',
  exportExcel: 'readonly',
  exportPDFBase64: 'readonly',
  exportExcelBase64: 'readonly',
  enviarReportePorEmail: 'readonly',
  enviarPINPorEmail: 'readonly',

  // React components
  Root: 'readonly',
  App: 'readonly',
  SplashScreen: 'readonly',
  AuthScreen: 'readonly',
  AnimatedWaveDots: 'readonly',
  ManageAccountModal: 'readonly',
  ModalOlvidado: 'readonly',
  AsignarPINsModal: 'readonly',
  UsuariosModal: 'readonly',
  ExportReportModal: 'readonly',
  PinSetup: 'readonly',
  DiagnosticoModal: 'readonly',
  ErrorViewerModal: 'readonly',

  // Skeleton components
  SkeletonDashboard: 'readonly',
  SkeletonHistory: 'readonly',
  SkeletonHero: 'readonly',
  SkeletonCard: 'readonly',
  SkeletonKPIGrid: 'readonly',
  SkeletonChartWrap: 'readonly',
  SkeletonHistoryRow: 'readonly',

  // Tab components
  HomeTab: 'readonly',
  DashboardTab: 'readonly',
  AsistenteTab: 'readonly',
  HistoryTab: 'readonly',
  ConfigTab: 'readonly',
};

const sharedRules = {
  'no-duplicate-case': 'error',
  'no-unreachable': 'error',
  'no-self-assign': 'error',
  'no-constant-condition': 'warn',
  'eqeqeq': ['warn', 'always', { null: 'ignore' }],
  // Empty catch blocks are intentional in many fallback/cleanup paths
  'no-empty': ['error', { allowEmptyCatch: true }],
  // Let Prettier handle all formatting
  'semi': 'off',
  'indent': 'off',
  'quotes': 'off',
  'no-trailing-spaces': 'off',
};

export default [
  js.configs.recommended,

  // ── Definition files (config, utils, services, tabs, app)
  // These files declare the globals — no-redeclare and no-unused-vars are
  // suppressed since usage happens cross-file in the browser.
  {
    files: [
      'js/*.js',
      'js/config/*.js',
      'js/utils/*.js',
      'js/services/*.js',
      'js/tabs/*.js',
      'js/app/*.js',
      'js/modals/*.js',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: { ...externalGlobals, ...projectGlobals },
    },
    rules: {
      ...sharedRules,
      'no-undef': 'error',
      // vars:'local' skips top-level declarations (cross-file globals in this multi-script app);
      // caughtErrors:'none' skips catch bindings (almost always unused intentionally)
      'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      // Definition files re-declare globals that are listed in the config —
      // suppress the false positive for those files.
      'no-redeclare': 'off',
    },
  },

  // ── Supabase Edge Functions (Deno / TypeScript)
  {
    files: ['supabase/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { Deno: 'readonly', console: 'readonly' },
    },
    rules: {
      'no-undef': 'off', // TypeScript handles this
    },
  },

  {
    ignores: ['node_modules/**', 'dist/**', '*.min.js'],
  },
];
