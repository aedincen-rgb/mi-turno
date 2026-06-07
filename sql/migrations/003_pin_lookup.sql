-- ════════════════════════════════════════════════════════════════
-- MI TURNO · Migración 003: pin_lookup
-- Tabla de búsqueda de PIN por user_id (no por email).
-- Creado: v166 (2026-06-06)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pin_lookup (
  pin       TEXT PRIMARY KEY,
  user_id   UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pin_lookup_user
  ON pin_lookup (user_id);

ALTER TABLE pin_lookup ENABLE ROW LEVEL SECURITY;

-- Usuario autenticado: ve SOLO su propio PIN
DROP POLICY IF EXISTS "users read own pin" ON pin_lookup;
CREATE POLICY "users read own pin"
  ON pin_lookup FOR SELECT
  USING (auth.uid() = user_id);

-- Upsert de PIN: solo sobre su propio user_id
DROP POLICY IF EXISTS "users upsert own pin" ON pin_lookup;
CREATE POLICY "users upsert own pin"
  ON pin_lookup FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users update own pin" ON pin_lookup;
CREATE POLICY "users update own pin"
  ON pin_lookup FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Función: limpiar PIN viejo antes de upsert ─────────────────
CREATE OR REPLACE FUNCTION cleanup_old_pin_for_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  DELETE FROM pin_lookup WHERE user_id = target_user_id;
END;
$$;

-- ── Función: actualizar timestamp ──────────────────────────────
CREATE OR REPLACE FUNCTION update_pin_lookup_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pin_lookup_updated_at ON pin_lookup;
CREATE TRIGGER trg_pin_lookup_updated_at
  BEFORE UPDATE ON pin_lookup
  FOR EACH ROW EXECUTE FUNCTION update_pin_lookup_updated_at();

-- ── UNDO ────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_pin_lookup_updated_at ON pin_lookup;
-- DROP FUNCTION IF EXISTS update_pin_lookup_updated_at();
-- DROP FUNCTION IF EXISTS cleanup_old_pin_for_user(UUID);
-- DROP TABLE IF EXISTS pin_lookup;
