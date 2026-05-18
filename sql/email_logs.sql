-- ════════════════════════════════════════════════════════════════
-- MI TURNO · Tabla email_logs
-- Auditoría de correos enviados con Resend
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email    TEXT NOT NULL,
  format      TEXT NOT NULL CHECK (format IN ('pdf','xlsx')),
  filename    TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('sent','failed')),
  resend_id   TEXT,
  error_message TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para acelerar el rate-limiting check
CREATE INDEX IF NOT EXISTS idx_email_logs_user_time
  ON email_logs (user_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────
-- Row Level Security: cada usuario solo ve sus propios logs
-- ────────────────────────────────────────────────────────────────
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden leer SOLO sus propios logs
DROP POLICY IF EXISTS "users read own logs" ON email_logs;
CREATE POLICY "users read own logs"
  ON email_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Política: el service role (edge function) puede insertar
-- (esto sucede automáticamente desde la edge function autenticada)
DROP POLICY IF EXISTS "service role inserts" ON email_logs;
CREATE POLICY "service role inserts"
  ON email_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- Listo. Ejecuta este SQL en Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════
