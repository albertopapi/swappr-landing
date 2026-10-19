-- =====================================================================
--  SWAPPR - pulizia dei dati vecchi (FACOLTATIVA)                  versione 1
--
--  Serve a rispettare i tempi di conservazione scritti nella privacy (privacy.html, punto 6).
--  Va eseguita DOPO schema.sql.
--
--  Come si usa: Supabase > SQL Editor > New query > incolla TUTTO > Run.
--  Questo crea la funzione public.maintenance_run. Non cancella nulla finche' non la chiami tu:
--
--   1) PROVA A SECCO (conta soltanto, non cancella niente):
--          select public.maintenance_run();
--   2) CANCELLA DAVVERO:
--          select public.maintenance_run(false);
--   3) Per farla partire da sola ogni settimana: Supabase > Integrations > Cron > Create job
--      (tipo SQL Snippet), con il testo:   select public.maintenance_run(false);
--
--  Cosa toglie (i numeri sono quelli di default; per cambiarli: select public.maintenance_run(false, 12, 12, 30);
--  dove i tre numeri sono mesi per gli scambi, mesi per segnalazioni e registro staff, giorni per le notifiche):
--   - le schede degli scambi chiusi (completati, annullati, rifiutati) di cui almeno uno dei due utenti ha
--     eliminato l'account, dopo 24 mesi dall'ultimo aggiornamento
--   - le segnalazioni chiuse e il registro delle azioni dello staff piu' vecchi di 24 mesi
--   - le notifiche gia' lette piu' vecchie di 90 giorni
--  Non tocca mai: scambi in corso, scambi tra utenti ancora iscritti, profili, binder, wishlist, messaggi.
--  I periodi devono essere gli stessi che scrivi nella privacy: se li cambi li', cambiali anche qui.
--
--  Solo il proprietario del database la puo' chiamare (SQL Editor o Cron): dal sito non e' raggiungibile.
-- =====================================================================

create or replace function public.maintenance_run(
  p_dry_run      boolean default true,
  p_trade_months int     default 24,
  p_log_months   int     default 24,
  p_notif_days   int     default 90) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare n_trades int; n_reports int; n_log int; n_notif int;
begin
  if p_dry_run is null or p_trade_months is null or p_log_months is null or p_notif_days is null
     or p_trade_months < 1 or p_log_months < 1 or p_notif_days < 1 then
    raise exception 'invalid_input';
  end if;

  if p_dry_run then
    select count(*) into n_trades from public.trades
     where status in ('completed', 'cancelled', 'declined') and (proposer is null or recipient is null)
       and updated_at < now() - make_interval(months => p_trade_months);
    select count(*) into n_reports from public.reports
     where status = 'closed' and coalesce(closed_at, created_at) < now() - make_interval(months => p_log_months);
    select count(*) into n_log from public.staff_log
     where created_at < now() - make_interval(months => p_log_months);
    select count(*) into n_notif from public.notifications
     where read and created_at < now() - make_interval(days => p_notif_days);
  else
    with d as (
      delete from public.trades
       where status in ('completed', 'cancelled', 'declined') and (proposer is null or recipient is null)
         and updated_at < now() - make_interval(months => p_trade_months)
      returning 1) select count(*) into n_trades from d;
    with d as (
      delete from public.reports
       where status = 'closed' and coalesce(closed_at, created_at) < now() - make_interval(months => p_log_months)
      returning 1) select count(*) into n_reports from d;
    with d as (
      delete from public.staff_log
       where created_at < now() - make_interval(months => p_log_months)
      returning 1) select count(*) into n_log from d;
    with d as (
      delete from public.notifications
       where read and created_at < now() - make_interval(days => p_notif_days)
      returning 1) select count(*) into n_notif from d;
  end if;

  return jsonb_build_object('dry_run', p_dry_run, 'trades', n_trades, 'reports', n_reports, 'staff_log', n_log, 'notifications', n_notif);
end $$;

-- Nessuno puo' chiamarla dal sito (ne' con la chiave pubblica ne' dopo l'accesso): serve questa riga.
revoke all on function public.maintenance_run(boolean, int, int, int) from public, anon, authenticated;
