-- ════════════════════════════════════════════════════════════════
-- MI TURNO · Tabla error_logs
-- Auditoría de errores de runtime capturados en el frontend
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS error_logs (
  id          BIGSERIAL PRIMARY KEY,
  message     TEXT NOT NULL,
  source      TEXT,
  line        INTEGER,
  col         INTEGER,
  stack       TEXT,
  version     TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ua          TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para consultas por usuario y tiempo
CREATE INDEX IF NOT EXISTS idx_error_logs_user_time
  ON error_logs (user_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────
-- Row Level Security: cada usuario solo ve sus propios errores
-- ────────────────────────────────────────────────────────────────
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own error logs" ON error_logs;
CREATE POLICY "users read own error logs"
  ON error_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "anon can insert error logs" ON error_logs;
CREATE POLICY "anon can insert error logs"
  ON error_logs FOR INSERT
  WITH CHECK (true);
