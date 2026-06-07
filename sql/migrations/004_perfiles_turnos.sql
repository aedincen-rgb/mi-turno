-- ════════════════════════════════════════════════════════════════
-- MI TURNO · Migración 004: perfiles + turnos + turno_activo
-- Tablas core de la app: perfil del usuario, turnos cerrados
-- y turno activo (el que está en curso).
-- Creado: v166 (2026-06-06)
-- ════════════════════════════════════════════════════════════════

-- Perfil del usuario (salario base)
CREATE TABLE IF NOT EXISTS perfiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  salario_base NUMERIC,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own profile" ON perfiles;
CREATE POLICY "users read own profile"
  ON perfiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users upsert own profile" ON perfiles;
CREATE POLICY "users upsert own profile"
  ON perfiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users update own profile" ON perfiles;
CREATE POLICY "users update own profile"
  ON perfiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Turnos cerrados
CREATE TABLE IF NOT EXISTS turnos (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inicio   TIMESTAMPTZ NOT NULL,
  fin      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_turnos_user
  ON turnos (user_id, inicio DESC);

ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own turnos" ON turnos;
CREATE POLICY "users manage own turnos"
  ON turnos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Turno activo (solo uno por usuario)
CREATE TABLE IF NOT EXISTS turno_activo (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id      UUID NOT NULL,
  inicio  TIMESTAMPTZ NOT NULL
);

ALTER TABLE turno_activo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own active turno" ON turno_activo;
CREATE POLICY "users manage own active turno"
  ON turno_activo FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Realtime: habilitar para turnos y turno_activo
ALTER PUBLICATION supabase_realtime ADD TABLE turnos;
ALTER PUBLICATION supabase_realtime ADD TABLE turno_activo;

-- ── Trigger: nuevo usuario → perfil automático ─────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO perfiles (id, email, salario_base)
  VALUES (NEW.id, NEW.email, NULL);
  RETURN NEW;
END;
$$;

-- Revocar execute para evitar llamadas REST RPC (v46 hardening)
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── UNDO ────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user();
-- ALTER PUBLICATION supabase_realtime DROP TABLE turno_activo;
-- ALTER PUBLICATION supabase_realtime DROP TABLE turnos;
-- DROP TABLE IF EXISTS turno_activo;
-- DROP TABLE IF EXISTS turnos;
-- DROP TABLE IF EXISTS perfiles;
