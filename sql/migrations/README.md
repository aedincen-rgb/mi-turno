# Migraciones de Base de Datos

Cada archivo representa un cambio atómico en Supabase. Ejecutar en orden numérico.

## Cómo aplicar

```bash
# 1. Abrí Supabase SQL Editor
# 2. Pegá el contenido de cada migración en orden (001 → 002 → 003 → ...)
# 3. Ejecutá
```

## Cómo crear una migración nueva

```bash
# 1. Creá el archivo con el siguiente número:
#    sql/migrations/NNN_descripcion.sql
# 2. Escribí el SQL con CREATE IF NOT EXISTS (idempotente)
# 3. Incluí la sección UNDO al final (comentada)
# 4. Actualizá este README si agregás tablas nuevas
```

## Convenciones

- **Idempotente**: usar `CREATE IF NOT EXISTS`, `DROP IF EXISTS`, etc.
- **UNDO al final**: bloque comentado con el SQL para revertir.
- **RLS siempre**: cada tabla debe tener políticas definidas.
- **Formato**: `NNN_descripcion.sql` donde NNN es secuencial (001, 002, ...).

## Registro

| # | Archivo | Descripción | Versión |
|---|---|---|---|
| 001 | `001_error_logs.sql` | Tabla de errores de runtime | v166 |
| 002 | `002_email_logs.sql` | Auditoría de correos enviados | v166 |
| 003 | `003_pin_lookup.sql` | Búsqueda de PIN + triggers | v166 |
| 004 | `004_perfiles_turnos.sql` | Core: perfiles, turnos, turno_activo | v166 |
