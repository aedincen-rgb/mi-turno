-- ════════════════════════════════════════════════════════════════
--  005_delete_my_account.sql  (v362)
--  GDPR: borrado de cuenta iniciado por el propio usuario.
--  Aplicada a producción vía MCP el 2026-06-29.
-- ════════════════════════════════════════════════════════════════
-- SECURITY DEFINER para poder eliminar la fila de auth.users del caller.
-- search_path fijado (hardening v46) para prevenir hijacking de funciones.
-- Opera SIEMPRE sobre auth.uid(): el cliente nunca pasa el uid.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  delete from public.turnos       where user_id = uid;
  delete from public.turno_activo where user_id = uid;
  delete from public.pin_lookup   where user_id = uid;
  delete from public.perfiles     where id = uid;
  delete from public.email_logs   where user_id = uid;
  delete from public.error_logs   where user_id = uid;
  delete from public.user_config  where user_id = uid;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
