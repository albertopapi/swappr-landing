-- =====================================================================
--  SWAPPR - database (Supabase / PostgreSQL)                versione 1
--
--  Come si usa: Supabase > SQL Editor > New query > incolla TUTTO > Run.
--  Si puo' eseguire anche piu' volte: aggiorna le funzioni senza cancellare i dati.
--
--  Come e' protetto:
--   - le tabelle hanno la sicurezza a livello di riga (RLS) attiva e NESSUN permesso diretto
--     per i ruoli "anon" e "authenticated": dal browser non si puo' leggere ne' scrivere
--     direttamente nelle tabelle, nemmeno con la chiave pubblica.
--   - il sito parla con il database solo attraverso le funzioni qui sotto (RPC), che controllano
--     chi sei, cosa puoi fare e quanto puoi fare (limiti anti-spam).
--   - l'indirizzo, l'email e i dati degli scambi degli altri non sono mai visibili agli utenti.
--   - le funzioni "staff_*" funzionano solo per chi e' nella tabella public.staff
--     (si compila solo da qui, vedi le istruzioni in LEGGIMI.txt).
-- =====================================================================

create table if not exists public.app_meta (
  key   text primary key,
  value text not null
);
insert into public.app_meta (key, value) values ('schema_version', '1')
  on conflict (key) do update set value = excluded.value;

-- ---------------------------------------------------------------------
-- TABELLE
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null,
  city         text not null default '',
  bio          text not null default '',
  avatar_color text not null default '',
  visible      boolean not null default true,
  status       text not null default 'active',
  terms_at     timestamptz,
  created_at   timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  constraint profiles_city_len        check (char_length(city) <= 40),
  constraint profiles_bio_len         check (char_length(bio) <= 140),
  constraint profiles_color_format    check (avatar_color = '' or avatar_color ~ '^#[0-9a-fA-F]{6}$'),
  constraint profiles_status_values   check (status in ('active', 'suspended'))
);
create unique index if not exists profiles_username_key on public.profiles (lower(username));

create table if not exists public.addresses (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  full_name   text not null,
  line1       text not null,
  line2       text not null default '',
  postal_code text not null,
  city        text not null,
  province    text not null default '',
  country     text not null default 'IT',
  phone       text not null default '',
  updated_at  timestamptz not null default now(),
  constraint addresses_len check (
    char_length(full_name) between 2 and 80 and char_length(line1) between 3 and 100 and char_length(line2) <= 100
    and char_length(postal_code) between 3 and 12 and char_length(city) between 2 and 60
    and char_length(province) <= 40 and char_length(country) between 2 and 40 and char_length(phone) <= 30)
);

create table if not exists public.binders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  position   int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint binders_name_len check (char_length(name) between 1 and 30)
);
create index if not exists binders_user_idx on public.binders (user_id);

create table if not exists public.binder_cards (
  binder_id uuid not null references public.binders (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  card_id   text not null,
  cond      text not null default 'NM',
  qty       int  not null default 1,
  card_name text not null default '',
  added_at  timestamptz not null default now(),
  primary key (binder_id, card_id, cond),
  constraint binder_cards_id   check (card_id ~ '^[a-z0-9]{1,20}-[A-Za-z0-9_!?]{1,15}$'),
  constraint binder_cards_cond check (cond in ('M', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO')),
  constraint binder_cards_qty  check (qty between 1 and 99),
  constraint binder_cards_name check (char_length(card_name) <= 80)
);
create index if not exists binder_cards_card_idx on public.binder_cards (card_id);
create index if not exists binder_cards_user_idx on public.binder_cards (user_id);

create table if not exists public.wishlist (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  card_id   text not null,
  card_name text not null default '',
  added_at  timestamptz not null default now(),
  primary key (user_id, card_id),
  constraint wishlist_id   check (card_id ~ '^[a-z0-9]{1,20}-[A-Za-z0-9_!?]{1,15}$'),
  constraint wishlist_name check (char_length(card_name) <= 80)
);
create index if not exists wishlist_card_idx on public.wishlist (card_id);

create table if not exists public.follows (
  follower   uuid not null references public.profiles (id) on delete cascade,
  followee   uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  constraint follows_not_self check (follower <> followee)
);
create index if not exists follows_followee_idx on public.follows (followee);

create table if not exists public.blocks (
  blocker    uuid not null references public.profiles (id) on delete cascade,
  blocked    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  constraint blocks_not_self check (blocker <> blocked)
);
create index if not exists blocks_blocked_idx on public.blocks (blocked);

create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  sender     uuid not null references public.profiles (id) on delete cascade,
  recipient  uuid not null references public.profiles (id) on delete cascade,
  kind       text not null default 'msg',
  body       text not null,
  card_id    text,
  trade_id   uuid,
  created_at timestamptz not null default now(),
  read_at    timestamptz,
  constraint messages_kind check (kind in ('msg', 'sys')),
  constraint messages_body check (char_length(body) between 1 and 1000)
);
create index if not exists messages_recipient_idx on public.messages (recipient, id desc);
create index if not exists messages_sender_idx    on public.messages (sender, id desc);

create table if not exists public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  text       text not null,
  href       text not null default '',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, id desc);

create table if not exists public.trades (
  id             uuid primary key default gen_random_uuid(),
  proposer       uuid references public.profiles (id) on delete set null,
  recipient      uuid references public.profiles (id) on delete set null,
  proposer_name  text not null,
  recipient_name text not null,
  status         text not null default 'proposed',
  note           text not null default '',
  staff_note     text not null default '',
  cancelled_by   text,
  p_sent_at      timestamptz,
  r_sent_at      timestamptz,
  p_tracking     text not null default '',
  r_tracking     text not null default '',
  p_recv_at      timestamptz,
  r_recv_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint trades_status check (status in ('proposed', 'accepted', 'sent', 'verifying', 'shipped', 'completed', 'cancelled', 'declined')),
  constraint trades_note_len check (char_length(note) <= 300 and char_length(staff_note) <= 500)
);
create index if not exists trades_proposer_idx  on public.trades (proposer);
create index if not exists trades_recipient_idx on public.trades (recipient);
create index if not exists trades_status_idx    on public.trades (status);

create table if not exists public.trade_items (
  id            bigint generated always as identity primary key,
  trade_id      uuid not null references public.trades (id) on delete cascade,
  from_proposer boolean not null,
  card_id       text not null,
  card_name     text not null default '',
  cond          text not null default 'NM',
  qty           int  not null default 1,
  constraint trade_items_id   check (card_id ~ '^[a-z0-9]{1,20}-[A-Za-z0-9_!?]{1,15}$'),
  constraint trade_items_cond check (cond in ('M', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO')),
  constraint trade_items_qty  check (qty between 1 and 9)
);
create index if not exists trade_items_trade_idx on public.trade_items (trade_id);

create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  reporter    uuid references public.profiles (id) on delete set null,
  target      uuid references public.profiles (id) on delete set null,
  target_name text not null,
  trade_id    uuid references public.trades (id) on delete set null,
  reason      text not null,
  details     text not null default '',
  status      text not null default 'open',
  staff_note  text not null default '',
  created_at  timestamptz not null default now(),
  closed_at   timestamptz,
  constraint reports_reason  check (reason in ('spam', 'fraud', 'abuse', 'other')),
  constraint reports_status  check (status in ('open', 'closed')),
  constraint reports_details check (char_length(details) <= 500 and char_length(staff_note) <= 500)
);
create index if not exists reports_status_idx on public.reports (status, id desc);
create index if not exists reports_reporter_idx on public.reports (reporter);
create index if not exists reports_target_idx   on public.reports (target);
create index if not exists reports_trade_idx    on public.reports (trade_id);

create table if not exists public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.staff_log (
  id         bigint generated always as identity primary key,
  staff_id   uuid,
  action     text not null,
  target     text not null default '',
  details    text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key   text primary key,
  value text not null default ''
);

create table if not exists public.cache_entries (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- FUNZIONI INTERNE (non richiamabili dal browser)
-- ---------------------------------------------------------------------
create or replace function public._clean(p text, n int) returns text
language sql immutable set search_path = public, pg_temp as $$
  select left(btrim(regexp_replace(coalesce(p, ''), '[\x01-\x1F\x7F]+', ' ', 'g')), n)
$$;

create or replace function public._clean_text(p text, n int) returns text
language sql immutable set search_path = public, pg_temp as $$
  select left(btrim(regexp_replace(coalesce(p, ''), '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]+', '', 'g')), n)
$$;

create or replace function public._card_ok(p text) returns boolean
language sql immutable set search_path = public, pg_temp as $$
  select p is not null and p ~ '^[a-z0-9]{1,20}-[A-Za-z0-9_!?]{1,15}$'
$$;

-- utente collegato (anche se sospeso): serve per leggere i propri dati
create or replace function public._uid() returns uuid
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := auth.uid();
begin
  if v is null then raise exception 'not_authenticated'; end if;
  return v;
end $$;

-- utente collegato e attivo: serve per ogni azione che scrive
create or replace function public._me() returns uuid
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := auth.uid(); s text;
begin
  if v is null then raise exception 'not_authenticated'; end if;
  select status into s from public.profiles where id = v;
  if s is null then raise exception 'profile_missing'; end if;
  if s <> 'active' then raise exception 'suspended'; end if;
  return v;
end $$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.staff where user_id = auth.uid())
$$;

create or replace function public._need_staff() returns uuid
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := auth.uid();
begin
  if v is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.staff where user_id = v) then raise exception 'not_allowed'; end if;
  return v;
end $$;

create or replace function public._blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a))
$$;

-- trova l'utente dal nome (senza distinguere maiuscole); errore se non esiste
create or replace function public._user_id(p_username text) returns uuid
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid;
begin
  select id into v from public.profiles where lower(username) = lower(btrim(coalesce(p_username, '')));
  if v is null then raise exception 'user_not_found'; end if;
  return v;
end $$;

create or replace function public._notify(p_user uuid, p_text text, p_href text default '') returns void
language plpgsql volatile security definer set search_path = public, pg_temp as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, text, href) values (p_user, left(p_text, 300), left(coalesce(p_href, ''), 100));
  delete from public.notifications
   where user_id = p_user
     and id < coalesce((select id from public.notifications where user_id = p_user order by id desc offset 100 limit 1), 0);
end $$;

create or replace function public._sys_msg(p_from uuid, p_to uuid, p_text text, p_trade uuid default null) returns void
language plpgsql volatile security definer set search_path = public, pg_temp as $$
begin
  if p_from is null or p_to is null then return; end if;
  insert into public.messages (sender, recipient, kind, body, trade_id, read_at)
  values (p_from, p_to, 'sys', left(p_text, 300), p_trade, null);
end $$;

-- sceglie un nome utente libero (quello richiesto se valido, altrimenti "utente" + numero)
create or replace function public._pick_username(p_wanted text) returns text
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare w text := btrim(coalesce(p_wanted, '')); n int := 0; c text;
begin
  if w ~ '^[A-Za-z0-9_]{3,20}$' and not exists (select 1 from public.profiles where lower(username) = lower(w)) then
    return w;
  end if;
  loop
    c := 'utente' || (floor(random() * 900000) + 100000)::int::text;
    exit when not exists (select 1 from public.profiles where lower(username) = lower(c));
    n := n + 1;
    if n > 50 then raise exception 'username_taken'; end if;
  end loop;
  return c;
end $$;

-- ---------------------------------------------------------------------
-- NUOVO ACCOUNT: crea il profilo a partire dai dati inviati alla registrazione
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare md jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, username, city, bio, avatar_color, terms_at)
  values (
    new.id,
    public._pick_username(md ->> 'username'),
    public._clean(md ->> 'city', 40),
    public._clean(md ->> 'bio', 140),
    case when (md ->> 'avatar_color') ~ '^#[0-9a-fA-F]{6}$' then md ->> 'avatar_color' else '' end,
    case when (md ->> 'terms') = 'true' then now() else null end)
  on conflict (id) do nothing;
  return new;
end $$;

create or replace trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- account creati prima di installare questo schema: profilo mancante
do $$
declare r record;
begin
  for r in select u.id, u.raw_user_meta_data as md from auth.users u
            where not exists (select 1 from public.profiles p where p.id = u.id) loop
    insert into public.profiles (id, username, city, bio, avatar_color)
    values (r.id, public._pick_username(r.md ->> 'username'), public._clean(r.md ->> 'city', 40), public._clean(r.md ->> 'bio', 140),
            case when (r.md ->> 'avatar_color') ~ '^#[0-9a-fA-F]{6}$' then r.md ->> 'avatar_color' else '' end);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- STATO DEL SITO E DATI DELL'UTENTE
-- ---------------------------------------------------------------------
-- stato del sito: versione dello schema ed elenco delle funzioni che dovrebbero esserci e non ci sono (serve alla pagina "Controllo")
create or replace function public.app_status() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'ok', true,
    'schema_version', (select value from public.app_meta where key = 'schema_version'),
    'missing', coalesce((select jsonb_agg(n order by n)
                           from unnest(array[
    '_blocked', '_card_ok', '_check_cards', '_clean', '_clean_text', '_me', '_names', '_need_staff', '_notify',
    '_pick_item', '_pick_username', '_staff_log', '_staff_party', '_sys_msg', '_trade_json', '_uid',
    '_user_id', 'accept_terms', 'block_user', 'cancel_trade', 'card_people', 'confirm_received',
    'delete_address', 'delete_binder', 'delete_my_account', 'discover', 'export_my_data', 'find_matches',
    'follow_user', 'get_conversation', 'get_counters', 'get_my_data', 'get_profile', 'handle_new_user',
    'is_staff', 'list_conversations', 'mark_notifications_read', 'mark_sent', 'most_wanted', 'propose_trade',
    'report_user', 'respond_trade', 'save_address', 'save_binder', 'search_users', 'send_message',
    'staff_close_report', 'staff_find_user', 'staff_list_reports', 'staff_list_trades', 'staff_overview',
    'staff_recent_log', 'staff_set_setting', 'staff_set_user_status', 'staff_trade_set_status',
    'trade_ship_info', 'update_profile', 'username_available', 'wish_apply', 'app_status'
                           ]) as n
                          where not exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace s on s.oid = p.pronamespace
                                             where s.nspname = 'public' and p.proname = n)), '[]'::jsonb))
$$;

create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select p_username ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles where lower(username) = lower(p_username))
$$;

create or replace function public._trade_json(t public.trades, v uuid) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'id', t.id,
    'status', t.status,
    'note', t.note,
    'staff_note', t.staff_note,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'role', case when t.proposer = v then 'proposer' else 'recipient' end,
    'other', case when t.proposer = v then t.recipient_name else t.proposer_name end,
    'give', coalesce((select jsonb_agg(jsonb_build_object('card_id', i.card_id, 'card_name', i.card_name, 'cond', i.cond, 'qty', i.qty) order by i.id)
                        from public.trade_items i where i.trade_id = t.id and i.from_proposer = coalesce(t.proposer = v, false)), '[]'::jsonb),
    'recv', coalesce((select jsonb_agg(jsonb_build_object('card_id', i.card_id, 'card_name', i.card_name, 'cond', i.cond, 'qty', i.qty) order by i.id)
                        from public.trade_items i where i.trade_id = t.id and i.from_proposer <> coalesce(t.proposer = v, false)), '[]'::jsonb),
    'my_sent',     case when t.proposer = v then t.p_sent_at is not null else t.r_sent_at is not null end,
    'their_sent',  case when t.proposer = v then t.r_sent_at is not null else t.p_sent_at is not null end,
    'my_tracking', case when t.proposer = v then t.p_tracking else t.r_tracking end,
    'my_recv',     case when t.proposer = v then t.p_recv_at is not null else t.r_recv_at is not null end,
    'their_recv',  case when t.proposer = v then t.r_recv_at is not null else t.p_recv_at is not null end)
$$;

-- tutto quello che serve al sito dopo l'accesso, in una sola richiesta
create or replace function public.get_my_data() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid();
begin
  return jsonb_build_object(
    'profile', (select jsonb_build_object('id', p.id, 'username', p.username, 'city', p.city, 'bio', p.bio, 'avatar_color', p.avatar_color,
                                          'visible', p.visible, 'status', p.status, 'terms_at', p.terms_at, 'created_at', p.created_at)
                  from public.profiles p where p.id = v),
    'email', (select u.email from auth.users u where u.id = v),
    'address', (select jsonb_build_object('full_name', a.full_name, 'line1', a.line1, 'line2', a.line2, 'postal_code', a.postal_code,
                                          'city', a.city, 'province', a.province, 'country', a.country, 'phone', a.phone)
                  from public.addresses a where a.user_id = v),
    'binders', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name,
                           'cards', coalesce((select jsonb_agg(jsonb_build_object('card_id', c.card_id, 'card_name', c.card_name, 'qty', c.qty, 'cond', c.cond) order by c.added_at, c.card_id)
                                                from public.binder_cards c where c.binder_id = b.id), '[]'::jsonb)) order by b.position, b.created_at)
                           from public.binders b where b.user_id = v), '[]'::jsonb),
    'wishlist', coalesce((select jsonb_agg(jsonb_build_object('card_id', w.card_id, 'card_name', w.card_name) order by w.added_at desc, w.card_id)
                            from public.wishlist w where w.user_id = v), '[]'::jsonb),
    'follows', coalesce((select jsonb_agg(p.username order by lower(p.username)) from public.follows f join public.profiles p on p.id = f.followee where f.follower = v), '[]'::jsonb),
    'followers', (select count(*) from public.follows where followee = v),
    'blocks', coalesce((select jsonb_agg(p.username order by lower(p.username)) from public.blocks k join public.profiles p on p.id = k.blocked where k.blocker = v), '[]'::jsonb),
    'notifications', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'text', n.text, 'href', n.href, 'read', n.read, 'created_at', n.created_at) order by n.id desc)
                                 from (select * from public.notifications where user_id = v order by id desc limit 50) n), '[]'::jsonb),
    'unread_messages', (select count(*) from public.messages m where m.recipient = v and m.read_at is null and m.kind = 'msg'),
    'trades', (select coalesce(jsonb_agg(x.j order by x.created_at desc), '[]'::jsonb)
                 from (select public._trade_json(t, v) as j, t.created_at from public.trades t
                        where t.proposer = v or t.recipient = v order by t.created_at desc limit 100) x),
    'staff', exists (select 1 from public.staff s where s.user_id = v));
end $$;

-- contatori leggeri: il sito li chiede ogni tanto per sapere se c'e' qualcosa di nuovo, senza scaricare tutti i dati
create or replace function public.get_counters() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid();
begin
  return jsonb_build_object(
    'notifications', (select count(*) from public.notifications where user_id = v and not read),
    'notif_max', coalesce((select max(id) from public.notifications where user_id = v), 0),
    'messages', (select count(*) from public.messages where recipient = v and read_at is null and kind = 'msg'),
    'trades_updated', coalesce((select max(updated_at) from public.trades where proposer = v or recipient = v), 'epoch'::timestamptz));
end $$;

create or replace function public.update_profile(
  p_username text default null, p_city text default null, p_bio text default null,
  p_avatar_color text default null, p_visible boolean default null) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); u text;
begin
  if p_username is not null then
    u := btrim(p_username);
    if u !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'username_invalid'; end if;
    if exists (select 1 from public.profiles where lower(username) = lower(u) and id <> v) then raise exception 'username_taken'; end if;
  end if;
  if p_avatar_color is not null and p_avatar_color <> '' and p_avatar_color !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_input'; end if;
  update public.profiles set
    username     = coalesce(u, username),
    city         = case when p_city  is null then city else public._clean(p_city, 40) end,
    bio          = case when p_bio   is null then bio  else public._clean_text(p_bio, 140) end,
    avatar_color = coalesce(p_avatar_color, avatar_color),
    visible      = coalesce(p_visible, visible)
  where id = v;
  if u is not null then
    update public.trades set proposer_name  = u where proposer  = v;
    update public.trades set recipient_name = u where recipient = v;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.accept_terms() returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid();
begin
  update public.profiles set terms_at = now() where id = v;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.save_address(p_address jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); a jsonb := coalesce(p_address, '{}'::jsonb);
begin
  insert into public.addresses (user_id, full_name, line1, line2, postal_code, city, province, country, phone, updated_at)
  values (v, public._clean(a ->> 'full_name', 80), public._clean(a ->> 'line1', 100), public._clean(a ->> 'line2', 100),
          public._clean(a ->> 'postal_code', 12), public._clean(a ->> 'city', 60), public._clean(a ->> 'province', 40),
          coalesce(nullif(public._clean(a ->> 'country', 40), ''), 'IT'), public._clean(a ->> 'phone', 30), now())
  on conflict (user_id) do update set
    full_name = excluded.full_name, line1 = excluded.line1, line2 = excluded.line2, postal_code = excluded.postal_code,
    city = excluded.city, province = excluded.province, country = excluded.country, phone = excluded.phone, updated_at = now();
  return jsonb_build_object('ok', true);
exception when check_violation then raise exception 'invalid_address';
end $$;

create or replace function public.delete_address() returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me();
begin
  if exists (select 1 from public.trades where (proposer = v or recipient = v) and status in ('accepted', 'sent', 'verifying', 'shipped')) then
    raise exception 'trade_in_progress';
  end if;
  delete from public.addresses where user_id = v;
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- BINDER, WISHLIST, SEGUITI, BLOCCHI
-- ---------------------------------------------------------------------
create or replace function public.save_binder(p_binder jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); b jsonb := coalesce(p_binder, '{}'::jsonb); bid uuid; nm text; cards jsonb; n int;
begin
  begin bid := (b ->> 'id')::uuid; exception when others then raise exception 'invalid_input'; end;
  nm := public._clean(b ->> 'name', 30);
  cards := coalesce(b -> 'cards', '[]'::jsonb);
  if bid is null or char_length(nm) < 1 or jsonb_typeof(cards) <> 'array' then raise exception 'invalid_input'; end if;
  if jsonb_array_length(cards) > 1500 then raise exception 'too_many_items'; end if;
  if exists (select 1 from public.binders where id = bid and user_id <> v) then raise exception 'not_allowed'; end if;
  if not exists (select 1 from public.binders where id = bid) then
    if (select count(*) from public.binders where user_id = v) >= 40 then raise exception 'too_many_items'; end if;
    insert into public.binders (id, user_id, name, position)
    values (bid, v, nm, coalesce((select max(position) + 1 from public.binders where user_id = v), 0));
  else
    update public.binders set name = nm, updated_at = now() where id = bid;
  end if;
  delete from public.binder_cards where binder_id = bid;
  insert into public.binder_cards (binder_id, user_id, card_id, cond, qty, card_name)
  select bid, v, x.card_id, x.cond, least(99, sum(x.qty))::int, max(x.card_name)
    from (select c ->> 'card_id' as card_id,
                 coalesce(nullif(c ->> 'cond', ''), 'NM') as cond,
                 greatest(1, coalesce((c ->> 'qty')::int, 1)) as qty,
                 public._clean(c ->> 'card_name', 80) as card_name
            from jsonb_array_elements(cards) c) x
   group by x.card_id, x.cond;
  select count(*) into n from public.binder_cards where user_id = v;
  if n > 4000 then raise exception 'too_many_items'; end if;
  return jsonb_build_object('ok', true, 'cards', (select count(*) from public.binder_cards where binder_id = bid));
exception when check_violation or invalid_text_representation or numeric_value_out_of_range then raise exception 'invalid_input';
end $$;

create or replace function public.delete_binder(p_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me();
begin
  delete from public.binders where id = p_id and user_id = v;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.wish_apply(p_add jsonb default '[]'::jsonb, p_remove jsonb default '[]'::jsonb) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); n int;
begin
  p_add := coalesce(p_add, '[]'::jsonb); p_remove := coalesce(p_remove, '[]'::jsonb);
  if jsonb_typeof(p_add) <> 'array' or jsonb_typeof(p_remove) <> 'array' then raise exception 'invalid_input'; end if;
  if jsonb_array_length(p_add) > 300 or jsonb_array_length(p_remove) > 1000 then raise exception 'too_many_items'; end if;
  delete from public.wishlist where user_id = v and card_id in (select jsonb_array_elements_text(p_remove));
  insert into public.wishlist (user_id, card_id, card_name)
  select v, c ->> 'card_id', public._clean(c ->> 'card_name', 80) from jsonb_array_elements(p_add) c
  on conflict (user_id, card_id) do update set card_name = excluded.card_name;
  select count(*) into n from public.wishlist where user_id = v;
  if n > 1000 then raise exception 'too_many_items'; end if;
  return jsonb_build_object('ok', true, 'count', n);
exception when check_violation or invalid_text_representation or not_null_violation then raise exception 'invalid_input';
end $$;

create or replace function public.follow_user(p_username text, p_on boolean default true) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); t uuid := public._user_id(p_username); k int; me_name text;
begin
  if t = v then raise exception 'invalid_input'; end if;
  if not p_on then
    delete from public.follows where follower = v and followee = t;
    return jsonb_build_object('ok', true, 'following', false);
  end if;
  if public._blocked(v, t) then raise exception 'blocked'; end if;
  insert into public.follows (follower, followee) values (v, t) on conflict do nothing;
  get diagnostics k = row_count;
  if k > 0 then
    select username into me_name from public.profiles where id = v;
    perform public._notify(t, me_name || ' ha iniziato a seguirti.', 'profilo.html?u=' || me_name);
  end if;
  return jsonb_build_object('ok', true, 'following', true);
end $$;

create or replace function public.block_user(p_username text, p_on boolean default true) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); t uuid := public._user_id(p_username);
begin
  if t = v then raise exception 'invalid_input'; end if;
  if p_on then
    insert into public.blocks (blocker, blocked) values (v, t) on conflict do nothing;
    delete from public.follows where (follower = v and followee = t) or (follower = t and followee = v);
  else
    delete from public.blocks where blocker = v and blocked = t;
  end if;
  return jsonb_build_object('ok', true, 'blocked', p_on);
end $$;

-- ---------------------------------------------------------------------
-- PROFILI DEGLI ALTRI, SCOPERTA, MATCH
-- (si vedono solo profili attivi e "visibili"; chi ti ha bloccato non compare)
-- ---------------------------------------------------------------------
create or replace function public.get_profile(p_username text) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid(); t uuid := public._user_id(p_username); p public.profiles;
        i_blocked boolean; they_blocked boolean; staff boolean := public.is_staff();
begin
  select * into p from public.profiles where id = t;
  i_blocked := exists (select 1 from public.blocks where blocker = v and blocked = t);
  they_blocked := exists (select 1 from public.blocks where blocker = t and blocked = v);
  if t <> v and not staff and (they_blocked or i_blocked or p.status <> 'active' or not p.visible) then
    return jsonb_build_object('hidden', true, 'username', p.username, 'blocked', i_blocked, 'private', (not p.visible and not i_blocked and not they_blocked and p.status = 'active'));
  end if;
  return jsonb_build_object(
    'hidden', false, 'username', p.username, 'city', p.city, 'bio', p.bio, 'avatar_color', p.avatar_color, 'created_at', p.created_at,
    'status', p.status, 'is_me', t = v, 'blocked', i_blocked,
    'following', exists (select 1 from public.follows where follower = v and followee = t),
    'followers', (select count(*) from public.follows where followee = t),
    'following_count', (select count(*) from public.follows where follower = t),
    'binders', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name,
                           'cards', coalesce((select jsonb_agg(jsonb_build_object('card_id', c.card_id, 'card_name', c.card_name, 'qty', c.qty, 'cond', c.cond) order by c.added_at, c.card_id)
                                                from public.binder_cards c where c.binder_id = b.id), '[]'::jsonb)) order by b.position, b.created_at)
                           from public.binders b where b.user_id = t), '[]'::jsonb),
    'wishlist', coalesce((select jsonb_agg(jsonb_build_object('card_id', w.card_id, 'card_name', w.card_name) order by w.added_at desc, w.card_id)
                            from public.wishlist w where w.user_id = t), '[]'::jsonb));
end $$;

create or replace function public.search_users(p_query text) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid(); q text := lower(btrim(coalesce(p_query, '')));
begin
  if char_length(q) < 2 then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('username', x.username, 'city', x.city, 'avatar_color', x.avatar_color) order by lower(x.username))
                     from (select p.username, p.city, p.avatar_color from public.profiles p
                            where starts_with(lower(p.username), q) and p.id <> v and p.visible and p.status = 'active' and not public._blocked(v, p.id)
                            order by lower(p.username) limit 20) x), '[]'::jsonb);
end $$;

-- binder e wishlist recenti degli altri utenti
create or replace function public.discover(p_limit int default 24) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid(); lim int := least(greatest(coalesce(p_limit, 24), 1), 60);
begin
  return jsonb_build_object(
    'binders', coalesce((select jsonb_agg(x.j order by x.upd desc) from (
        select jsonb_build_object('username', p.username, 'binder_id', b.id, 'name', b.name,
                                  'total', (select coalesce(sum(c.qty), 0) from public.binder_cards c where c.binder_id = b.id),
                                  'distinct', (select count(*) from public.binder_cards c where c.binder_id = b.id)) as j,
               b.updated_at as upd
          from public.binders b join public.profiles p on p.id = b.user_id
         where p.visible and p.status = 'active' and p.id <> v and not public._blocked(v, p.id)
           and exists (select 1 from public.binder_cards c where c.binder_id = b.id)
         order by b.updated_at desc limit lim) x), '[]'::jsonb),
    'wishlists', coalesce((select jsonb_agg(y.j order by y.upd desc) from (
        select jsonb_build_object('username', p.username, 'count', count(*),
                 'cards', (select jsonb_agg(jsonb_build_object('card_id', w2.card_id, 'card_name', w2.card_name) order by w2.added_at desc)
                             from (select * from public.wishlist w3 where w3.user_id = p.id order by w3.added_at desc limit 12) w2)) as j,
               max(w.added_at) as upd
          from public.wishlist w join public.profiles p on p.id = w.user_id
         where p.visible and p.status = 'active' and p.id <> v and not public._blocked(v, p.id)
         group by p.id, p.username order by max(w.added_at) desc limit lim) y), '[]'::jsonb));
end $$;

-- il cuore di Swappr: chi ha le carte che cerchi e/o cerca le carte che hai
create or replace function public.find_matches() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object('username', r.username, 'avatar_color', r.avatar_color, 'recv', r.recv, 'give', r.give)
                     order by r.score desc, lower(r.username))
      from (
        select p.username, p.avatar_color,
               coalesce(rv.cards, '[]'::jsonb) as recv,
               coalesce(gv.cards, '[]'::jsonb) as give,
               (case when rv.cards is not null and gv.cards is not null then 1000 else 0 end)
                 + coalesce(jsonb_array_length(rv.cards), 0) + coalesce(jsonb_array_length(gv.cards), 0) as score
          from public.profiles p
          left join (select o.user_id as u, jsonb_agg(jsonb_build_object('card_id', o.card_id, 'card_name', o.card_name) order by o.card_id) as cards
                       from (select distinct on (bc.user_id, bc.card_id) bc.user_id, bc.card_id, bc.card_name
                               from public.binder_cards bc
                              where bc.user_id <> v and bc.card_id in (select w.card_id from public.wishlist w where w.user_id = v)
                              order by bc.user_id, bc.card_id) o
                      group by o.user_id) rv on rv.u = p.id
          left join (select w.user_id as u, jsonb_agg(jsonb_build_object('card_id', w.card_id, 'card_name', w.card_name) order by w.card_id) as cards
                       from public.wishlist w
                      where w.user_id <> v and w.card_id in (select bc.card_id from public.binder_cards bc where bc.user_id = v)
                      group by w.user_id) gv on gv.u = p.id
         where p.id <> v and p.visible and p.status = 'active'
           and (rv.cards is not null or gv.cards is not null) and not public._blocked(v, p.id)
         order by score desc limit 50) r), '[]'::jsonb);
end $$;

create or replace function public.card_people(p_card_id text) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid();
begin
  if not public._card_ok(p_card_id) then raise exception 'invalid_input'; end if;
  return jsonb_build_object(
    'offers', coalesce((select jsonb_agg(jsonb_build_object('username', o.username, 'qty', o.qty) order by o.upd desc) from (
        select p.username, sum(bc.qty)::int as qty, max(bc.added_at) as upd
          from public.binder_cards bc join public.profiles p on p.id = bc.user_id
         where bc.card_id = p_card_id and p.id <> v and p.visible and p.status = 'active' and not public._blocked(v, p.id)
         group by p.id, p.username order by max(bc.added_at) desc limit 20) o), '[]'::jsonb),
    'wants', coalesce((select jsonb_agg(jsonb_build_object('username', o.username) order by o.upd desc) from (
        select p.username, w.added_at as upd
          from public.wishlist w join public.profiles p on p.id = w.user_id
         where w.card_id = p_card_id and p.id <> v and p.visible and p.status = 'active' and not public._blocked(v, p.id)
         order by w.added_at desc limit 20) o), '[]'::jsonb));
end $$;

-- le carte piu' cercate (visibile anche a chi non ha fatto l'accesso; il nome di chi la offre solo a chi e' collegato).
-- La classifica si ricalcola al massimo ogni 10 minuti, cosi' la home resta veloce anche con tanti utenti.
create or replace function public.most_wanted(p_limit int default 6) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := auth.uid(); lim int := least(greatest(coalesce(p_limit, 6), 1), 30); base jsonb; upd timestamptz;
begin
  select value, updated_at into base, upd from public.cache_entries where key = 'most_wanted';
  if base is null or (upd < now() - interval '10 minutes' and pg_try_advisory_xact_lock(7340001)) then
    select coalesce(jsonb_agg(jsonb_build_object('card_id', x.card_id, 'card_name', x.card_name, 'wants', x.wants) order by x.wants desc, x.card_id), '[]'::jsonb)
      into base
      from (select w.card_id, max(w.card_name) as card_name, count(*)::int as wants
              from public.wishlist w join public.profiles p on p.id = w.user_id
             where p.visible and p.status = 'active'
             group by w.card_id order by count(*) desc, w.card_id limit 30) x;
    insert into public.cache_entries (key, value, updated_at) values ('most_wanted', base, now())
    on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('card_id', s.e ->> 'card_id', 'card_name', s.e ->> 'card_name', 'wants', (s.e ->> 'wants')::int,
             'owner', case when v is null then null else
               (select p2.username from public.binder_cards bc join public.profiles p2 on p2.id = bc.user_id
                 where bc.card_id = s.e ->> 'card_id' and p2.visible and p2.status = 'active' and p2.id <> v and not public._blocked(v, p2.id)
                 order by bc.added_at limit 1) end) order by s.ord)
      from (select t.e, t.ord from jsonb_array_elements(base) with ordinality as t(e, ord) order by t.ord limit lim) s), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- MESSAGGI E NOTIFICHE
-- ---------------------------------------------------------------------
create or replace function public.send_message(p_to text, p_body text, p_card_id text default null) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); t uuid := public._user_id(p_to); v_body text := public._clean_text(p_body, 500); st text; m public.messages;
begin
  if t = v or char_length(v_body) < 1 then raise exception 'invalid_input'; end if;
  if p_card_id is not null and not public._card_ok(p_card_id) then raise exception 'invalid_input'; end if;
  select status into st from public.profiles where id = t;
  if st <> 'active' then raise exception 'user_not_found'; end if;
  if public._blocked(v, t) then raise exception 'blocked'; end if;
  if (select count(*) from public.messages where sender = v and kind = 'msg' and created_at > now() - interval '1 minute') >= 12
     or (select count(*) from public.messages where sender = v and kind = 'msg' and created_at > now() - interval '1 day') >= 300
     or ((select count(distinct recipient) from public.messages where sender = v and kind = 'msg' and created_at > now() - interval '1 hour') >= 15
         and not exists (select 1 from public.messages where sender = v and recipient = t and kind = 'msg'))
  then raise exception 'rate_limited'; end if;
  insert into public.messages (sender, recipient, kind, body, card_id) values (v, t, 'msg', v_body, p_card_id) returning * into m;
  return jsonb_build_object('id', m.id, 'created_at', m.created_at);
end $$;

create or replace function public.list_conversations() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object('username', p.username, 'avatar_color', p.avatar_color, 'last_body', c.last_body, 'last_kind', c.last_kind,
                                        'last_mine', c.last_mine, 'last_at', c.last_at, 'unread', c.unread) order by c.last_at desc)
      from (select o.other,
                   (array_agg(o.body order by o.id desc))[1] as last_body,
                   (array_agg(o.kind order by o.id desc))[1] as last_kind,
                   (array_agg(o.mine order by o.id desc))[1] as last_mine,
                   max(o.created_at) as last_at,
                   count(*) filter (where not o.mine and o.read_at is null and o.kind = 'msg') as unread
              from (select m.id, m.body, m.kind, m.created_at, m.read_at, (m.sender = v) as mine,
                           case when m.sender = v then m.recipient else m.sender end as other
                      from public.messages m where m.sender = v or m.recipient = v) o
             group by o.other order by max(o.created_at) desc limit 100) c
      join public.profiles p on p.id = c.other), '[]'::jsonb);
end $$;

create or replace function public.get_conversation(p_username text, p_after bigint default 0) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid(); t uuid := public._user_id(p_username);
begin
  update public.messages set read_at = now() where recipient = v and sender = t and read_at is null;
  return jsonb_build_object(
    'other', (select jsonb_build_object('username', p.username, 'avatar_color', p.avatar_color, 'status', p.status) from public.profiles p where p.id = t),
    'blocked', public._blocked(v, t),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'mine', m.sender = v, 'kind', m.kind, 'body', m.body, 'card_id', m.card_id, 'created_at', m.created_at) order by m.id)
                            from (select * from public.messages
                                   where ((sender = v and recipient = t) or (sender = t and recipient = v)) and id > coalesce(p_after, 0)
                                   order by id desc limit 200) m), '[]'::jsonb));
end $$;

create or replace function public.mark_notifications_read(p_ids jsonb default null) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid();
begin
  update public.notifications set read = true
   where user_id = v and not read
     and (p_ids is null or jsonb_typeof(p_ids) <> 'array' or id in (select (jsonb_array_elements_text(p_ids))::bigint));
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- SCAMBI (le carte passano da Swappr, che le verifica)
--   proposed -> accepted -> sent -> verifying -> shipped -> completed
--   (declined / cancelled in qualunque momento prima della spedizione)
-- ---------------------------------------------------------------------
create or replace function public._check_cards(p_user uuid, p_items jsonb) returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare it jsonb; q int;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 10 then raise exception 'invalid_input'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    if not public._card_ok(it ->> 'card_id') then raise exception 'invalid_input'; end if;
    q := greatest(1, least(9, coalesce((it ->> 'qty')::int, 1)));
    if coalesce((select sum(qty) from public.binder_cards where user_id = p_user and card_id = it ->> 'card_id'), 0) < q then
      raise exception 'card_not_in_binder';
    end if;
  end loop;
exception when invalid_text_representation or numeric_value_out_of_range then raise exception 'invalid_input';
end $$;

create or replace function public._names(p_items jsonb) returns text
language sql immutable set search_path = public, pg_temp as $$
  select coalesce(string_agg(coalesce(nullif(public._clean(i ->> 'card_name', 80), ''), i ->> 'card_id'), ', '), '') from jsonb_array_elements(p_items) i
$$;

-- condizione e nome di una carta presi dal binder vero del proprietario (il valore scritto dal browser e' solo una preferenza)
create or replace function public._pick_item(p_user uuid, p_card text, p_cond text, p_name text) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'cond', coalesce(x.cond, 'NM'),
    'name', coalesce(nullif(x.card_name, ''), nullif(public._clean(p_name, 80), ''), p_card))
  from (select 1) d
  left join lateral (
    select c.cond, c.card_name from public.binder_cards c
     where c.user_id = p_user and c.card_id = p_card
     order by (c.cond = p_cond) desc, array_position(array['M', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'], c.cond), c.added_at
     limit 1) x on true
$$;

create or replace function public.propose_trade(p_to text, p_give jsonb, p_recv jsonb, p_note text default '') returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); t uuid := public._user_id(p_to); st text; my_name text; their_name text; tid uuid; it jsonb; pick jsonb;
begin
  if t = v then raise exception 'invalid_input'; end if;
  select status, username into st, their_name from public.profiles where id = t;
  if st <> 'active' then raise exception 'user_not_found'; end if;
  if public._blocked(v, t) then raise exception 'blocked'; end if;
  if not exists (select 1 from public.addresses where user_id = v) then raise exception 'no_address'; end if;
  p_give := coalesce(p_give, '[]'::jsonb); p_recv := coalesce(p_recv, '[]'::jsonb);
  perform public._check_cards(v, p_give);   -- le carte che do devono essere nei miei binder
  perform public._check_cards(t, p_recv);   -- le carte che ricevo devono essere nei binder dell'altro
  if (select count(*) from public.trades where (proposer = v or recipient = v) and status in ('proposed', 'accepted', 'sent', 'verifying', 'shipped')) >= 10
     or (select count(*) from public.trades where ((proposer = v and recipient = t) or (proposer = t and recipient = v))
                                              and status in ('proposed', 'accepted', 'sent', 'verifying', 'shipped')) >= 3
  then raise exception 'too_many_trades'; end if;
  if (select count(*) from public.trades where proposer = v and created_at > now() - interval '1 hour') >= 8 then raise exception 'rate_limited'; end if;
  select username into my_name from public.profiles where id = v;
  insert into public.trades (proposer, recipient, proposer_name, recipient_name, note)
  values (v, t, my_name, their_name, public._clean_text(p_note, 300)) returning id into tid;
  for it in select * from jsonb_array_elements(p_give) loop
    pick := public._pick_item(v, it ->> 'card_id', it ->> 'cond', it ->> 'card_name');
    insert into public.trade_items (trade_id, from_proposer, card_id, card_name, cond, qty)
    values (tid, true, it ->> 'card_id', pick ->> 'name', pick ->> 'cond', greatest(1, least(9, coalesce((it ->> 'qty')::int, 1))));
  end loop;
  for it in select * from jsonb_array_elements(p_recv) loop
    pick := public._pick_item(t, it ->> 'card_id', it ->> 'cond', it ->> 'card_name');
    insert into public.trade_items (trade_id, from_proposer, card_id, card_name, cond, qty)
    values (tid, false, it ->> 'card_id', pick ->> 'name', pick ->> 'cond', greatest(1, least(9, coalesce((it ->> 'qty')::int, 1))));
  end loop;
  perform public._sys_msg(v, t, 'Scambio proposto: ' || public._names(p_recv) || ' contro ' || public._names(p_give) || '.', tid);
  perform public._notify(t, my_name || ' ti ha proposto uno scambio.', 'scambi.html');
  return jsonb_build_object('ok', true, 'id', tid);
exception when check_violation or invalid_text_representation then raise exception 'invalid_input';
end $$;

create or replace function public.respond_trade(p_trade uuid, p_accept boolean) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); t public.trades;
begin
  select * into t from public.trades where id = p_trade for update;
  if not found or t.recipient is distinct from v then raise exception 'not_allowed'; end if;
  if t.status <> 'proposed' then raise exception 'invalid_state'; end if;
  if t.proposer is null then raise exception 'user_not_found'; end if;
  if p_accept then
    if not exists (select 1 from public.addresses where user_id = v) then raise exception 'no_address'; end if;
    update public.trades set status = 'accepted', updated_at = now() where id = t.id;
    perform public._sys_msg(v, t.proposer, 'Scambio accettato.', t.id);
    perform public._notify(t.proposer, t.recipient_name || ' ha accettato lo scambio: ora spedisci le carte a Swappr.', 'scambi.html');
  else
    update public.trades set status = 'declined', cancelled_by = 'recipient', updated_at = now() where id = t.id;
    perform public._sys_msg(v, t.proposer, 'Scambio rifiutato.', t.id);
    perform public._notify(t.proposer, t.recipient_name || ' ha rifiutato lo scambio.', 'scambi.html');
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.cancel_trade(p_trade uuid) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); t public.trades; other uuid; nm text;
begin
  select * into t from public.trades where id = p_trade for update;
  if not found or (v is distinct from t.proposer and v is distinct from t.recipient) then raise exception 'not_allowed'; end if;
  if t.status not in ('proposed', 'accepted') then raise exception 'invalid_state'; end if;
  if t.p_sent_at is not null or t.r_sent_at is not null then raise exception 'already_sent'; end if;
  update public.trades set status = 'cancelled', cancelled_by = case when v = t.proposer then 'proposer' else 'recipient' end, updated_at = now() where id = t.id;
  other := case when v = t.proposer then t.recipient else t.proposer end;
  nm := case when v = t.proposer then t.proposer_name else t.recipient_name end;
  perform public._sys_msg(v, other, 'Scambio annullato.', t.id);
  perform public._notify(other, nm || ' ha annullato lo scambio.', 'scambi.html');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.mark_sent(p_trade uuid, p_tracking text default '') returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); t public.trades; other uuid; nm text; track text := public._clean(p_tracking, 60);
begin
  select * into t from public.trades where id = p_trade for update;
  if not found or (v is distinct from t.proposer and v is distinct from t.recipient) then raise exception 'not_allowed'; end if;
  if t.status <> 'accepted' then raise exception 'invalid_state'; end if;
  if v = t.proposer then
    if t.p_sent_at is not null then raise exception 'invalid_state'; end if;
    update public.trades set p_sent_at = now(), p_tracking = track, updated_at = now() where id = t.id;
  else
    if t.r_sent_at is not null then raise exception 'invalid_state'; end if;
    update public.trades set r_sent_at = now(), r_tracking = track, updated_at = now() where id = t.id;
  end if;
  other := case when v = t.proposer then t.recipient else t.proposer end;
  nm := case when v = t.proposer then t.proposer_name else t.recipient_name end;
  select * into t from public.trades where id = p_trade;
  if t.p_sent_at is not null and t.r_sent_at is not null then
    update public.trades set status = 'sent', updated_at = now() where id = t.id;
    perform public._sys_msg(v, other, 'Entrambi avete spedito le carte a Swappr.', t.id);
    perform public._notify(other, 'Entrambi avete spedito le carte a Swappr: appena arrivano le verifichiamo.', 'scambi.html');
    perform public._notify(v, 'Entrambi avete spedito le carte a Swappr: appena arrivano le verifichiamo.', 'scambi.html');
  else
    perform public._sys_msg(v, other, nm || ' ha spedito le sue carte a Swappr.', t.id);
    perform public._notify(other, nm || ' ha spedito le sue carte a Swappr. Ora tocca a te.', 'scambi.html');
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.confirm_received(p_trade uuid) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); t public.trades; other uuid; nm text;
begin
  select * into t from public.trades where id = p_trade for update;
  if not found or (v is distinct from t.proposer and v is distinct from t.recipient) then raise exception 'not_allowed'; end if;
  if t.status <> 'shipped' then raise exception 'invalid_state'; end if;
  if v = t.proposer then
    if t.p_recv_at is not null then raise exception 'invalid_state'; end if;
    update public.trades set p_recv_at = now(), updated_at = now() where id = t.id;
  else
    if t.r_recv_at is not null then raise exception 'invalid_state'; end if;
    update public.trades set r_recv_at = now(), updated_at = now() where id = t.id;
  end if;
  other := case when v = t.proposer then t.recipient else t.proposer end;
  nm := case when v = t.proposer then t.proposer_name else t.recipient_name end;
  select * into t from public.trades where id = p_trade;
  if t.p_recv_at is not null and t.r_recv_at is not null then
    update public.trades set status = 'completed', updated_at = now() where id = t.id;
    perform public._sys_msg(v, other, 'Scambio completato. Grazie!', t.id);
    perform public._notify(other, 'Scambio con ' || nm || ' completato. Grazie!', 'scambi.html');
    perform public._notify(v, 'Scambio con ' || (case when v = t.proposer then t.recipient_name else t.proposer_name end) || ' completato. Grazie!', 'scambi.html');
  else
    perform public._notify(other, nm || ' ha ricevuto le carte.', 'scambi.html');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- dove spedire le carte (solo per chi partecipa e solo quando serve)
create or replace function public.trade_ship_info(p_trade uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid(); t public.trades;
begin
  select * into t from public.trades where id = p_trade;
  if not found or (v is distinct from t.proposer and v is distinct from t.recipient) then raise exception 'not_allowed'; end if;
  if t.status not in ('accepted', 'sent') then return jsonb_build_object('ship_to', '', 'ship_note', ''); end if;
  return jsonb_build_object(
    'ship_to',   coalesce((select value from public.app_settings where key = 'ship_to'), ''),
    'ship_note', coalesce((select value from public.app_settings where key = 'ship_note'), ''));
end $$;

-- ---------------------------------------------------------------------
-- SEGNALAZIONI, ESPORTAZIONE E CANCELLAZIONE DELL'ACCOUNT
-- ---------------------------------------------------------------------
create or replace function public.report_user(p_username text, p_reason text, p_details text default '', p_trade uuid default null) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._me(); t uuid := public._user_id(p_username); nm text;
begin
  if t = v or p_reason not in ('spam', 'fraud', 'abuse', 'other') then raise exception 'invalid_input'; end if;
  if (select count(*) from public.reports where reporter = v and created_at > now() - interval '1 day') >= 5 then raise exception 'rate_limited'; end if;
  select username into nm from public.profiles where id = t;
  insert into public.reports (reporter, target, target_name, trade_id, reason, details)
  values (v, t, nm, (select id from public.trades where id = p_trade and (proposer = v or recipient = v)), p_reason, public._clean_text(p_details, 500));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.export_my_data() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid();
begin
  return jsonb_build_object(
    'exported_at', now(),
    'account', public.get_my_data(),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'from', ps.username, 'to', pr.username, 'kind', m.kind, 'body', m.body, 'card_id', m.card_id, 'created_at', m.created_at) order by m.id)
                            from public.messages m join public.profiles ps on ps.id = m.sender join public.profiles pr on pr.id = m.recipient
                           where m.sender = v or m.recipient = v), '[]'::jsonb),
    'reports_filed', coalesce((select jsonb_agg(jsonb_build_object('target', r.target_name, 'reason', r.reason, 'details', r.details, 'status', r.status, 'created_at', r.created_at) order by r.id)
                                 from public.reports r where r.reporter = v), '[]'::jsonb));
end $$;

create or replace function public.delete_my_account() returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._uid();
begin
  if exists (select 1 from public.trades where (proposer = v or recipient = v) and status in ('accepted', 'sent', 'verifying', 'shipped')) then
    raise exception 'trade_in_progress';
  end if;
  update public.trades set status = 'cancelled', cancelled_by = case when proposer = v then 'proposer' else 'recipient' end, updated_at = now()
   where (proposer = v or recipient = v) and status = 'proposed';
  delete from auth.users where id = v;
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------------
-- AREA STAFF (solo per chi e' in public.staff)
-- ---------------------------------------------------------------------
create or replace function public._staff_log(p_staff uuid, p_action text, p_target text, p_details text default '') returns void
language sql volatile security definer set search_path = public, pg_temp as $$
  insert into public.staff_log (staff_id, action, target, details) values (p_staff, p_action, left(p_target, 100), left(coalesce(p_details, ''), 500))
$$;

create or replace function public._staff_party(p_user uuid, p_name text, p_sent timestamptz, p_tracking text, p_recv timestamptz) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'user_id', p_user,
    'username', coalesce((select p.username from public.profiles p where p.id = p_user), p_name),
    'email', (select u.email from auth.users u where u.id = p_user),
    'status', (select p.status from public.profiles p where p.id = p_user),
    'address', (select jsonb_build_object('full_name', a.full_name, 'line1', a.line1, 'line2', a.line2, 'postal_code', a.postal_code,
                                          'city', a.city, 'province', a.province, 'country', a.country, 'phone', a.phone)
                  from public.addresses a where a.user_id = p_user),
    'sent_at', p_sent, 'tracking', p_tracking, 'received_at', p_recv)
$$;

create or replace function public.staff_overview() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._need_staff();
begin
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'suspended', (select count(*) from public.profiles where status = 'suspended'),
    'open_reports', (select count(*) from public.reports where status = 'open'),
    'trades', coalesce((select jsonb_object_agg(s.status, s.n) from (select status, count(*) as n from public.trades group by status) s), '{}'::jsonb),
    'settings', coalesce((select jsonb_object_agg(key, value) from public.app_settings), '{}'::jsonb));
end $$;

create or replace function public.staff_list_trades(p_status text default null, p_limit int default 100) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._need_staff(); lim int := least(greatest(coalesce(p_limit, 100), 1), 300);
begin
  return coalesce((select jsonb_agg(x.j order by x.upd desc) from (
    select jsonb_build_object(
             'id', t.id, 'status', t.status, 'note', t.note, 'staff_note', t.staff_note, 'cancelled_by', t.cancelled_by,
             'created_at', t.created_at, 'updated_at', t.updated_at,
             'proposer', public._staff_party(t.proposer, t.proposer_name, t.p_sent_at, t.p_tracking, t.p_recv_at),
             'recipient', public._staff_party(t.recipient, t.recipient_name, t.r_sent_at, t.r_tracking, t.r_recv_at),
             'proposer_gives', coalesce((select jsonb_agg(jsonb_build_object('card_id', i.card_id, 'card_name', i.card_name, 'cond', i.cond, 'qty', i.qty) order by i.id)
                                           from public.trade_items i where i.trade_id = t.id and i.from_proposer), '[]'::jsonb),
             'recipient_gives', coalesce((select jsonb_agg(jsonb_build_object('card_id', i.card_id, 'card_name', i.card_name, 'cond', i.cond, 'qty', i.qty) order by i.id)
                                            from public.trade_items i where i.trade_id = t.id and not i.from_proposer), '[]'::jsonb)) as j,
           t.updated_at as upd
      from public.trades t where p_status is null or t.status = p_status
     order by t.updated_at desc limit lim) x), '[]'::jsonb);
end $$;

create or replace function public.staff_trade_set_status(p_trade uuid, p_status text, p_note text default '') returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._need_staff(); t public.trades; v_note text := public._clean_text(p_note, 500); txt_p text; txt_r text;
begin
  select * into t from public.trades where id = p_trade for update;
  if not found then raise exception 'not_allowed'; end if;
  if not ((t.status in ('proposed', 'accepted') and p_status = 'cancelled')
       or (t.status = 'sent' and p_status in ('verifying', 'cancelled'))
       or (t.status = 'verifying' and p_status in ('shipped', 'cancelled'))
       or (t.status = 'shipped' and p_status = 'completed')) then
    raise exception 'invalid_state';
  end if;
  update public.trades set status = p_status, staff_note = case when v_note <> '' then v_note else staff_note end,
         cancelled_by = case when p_status = 'cancelled' then 'staff' else cancelled_by end, updated_at = now()
   where id = t.id;
  if p_status = 'verifying' then
    txt_p := 'Swappr ha ricevuto le carte e sta verificando lo scambio con ' || t.recipient_name || '.';
    txt_r := 'Swappr ha ricevuto le carte e sta verificando lo scambio con ' || t.proposer_name || '.';
  elsif p_status = 'shipped' then
    txt_p := 'Verifica superata: le carte dello scambio con ' || t.recipient_name || ' sono state inoltrate. Conferma quando le ricevi.';
    txt_r := 'Verifica superata: le carte dello scambio con ' || t.proposer_name || ' sono state inoltrate. Conferma quando le ricevi.';
  elsif p_status = 'completed' then
    txt_p := 'Scambio con ' || t.recipient_name || ' completato. Grazie!';
    txt_r := 'Scambio con ' || t.proposer_name || ' completato. Grazie!';
  else
    txt_p := 'Scambio con ' || t.recipient_name || ' annullato da Swappr.' || case when v_note <> '' then ' Motivo: ' || v_note else '' end;
    txt_r := 'Scambio con ' || t.proposer_name || ' annullato da Swappr.' || case when v_note <> '' then ' Motivo: ' || v_note else '' end;
  end if;
  perform public._notify(t.proposer, txt_p, 'scambi.html');
  perform public._notify(t.recipient, txt_r, 'scambi.html');
  if t.proposer is not null and t.recipient is not null then
    perform public._sys_msg(t.proposer, t.recipient, case p_status when 'verifying' then 'Swappr sta verificando le carte.'
                                                                  when 'shipped' then 'Verifica superata: carte inoltrate.'
                                                                  when 'completed' then 'Scambio completato. Grazie!'
                                                                  else 'Scambio annullato da Swappr.' end, t.id);
  end if;
  perform public._staff_log(v, 'trade_status', t.id::text, p_status || case when v_note <> '' then ': ' || v_note else '' end);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.staff_list_reports(p_status text default 'open') returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._need_staff();
begin
  return coalesce((select jsonb_agg(jsonb_build_object(
            'id', r.id, 'status', r.status, 'reason', r.reason, 'details', r.details, 'staff_note', r.staff_note, 'created_at', r.created_at, 'trade_id', r.trade_id,
            'reporter', coalesce((select p.username from public.profiles p where p.id = r.reporter), '(account eliminato)'),
            'target', r.target_name, 'target_id', r.target,
            'target_status', (select p.status from public.profiles p where p.id = r.target)) order by r.id desc)
          from (select * from public.reports where p_status is null or status = p_status order by id desc limit 200) r), '[]'::jsonb);
end $$;

create or replace function public.staff_close_report(p_id bigint, p_action text default 'dismiss', p_note text default '') returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._need_staff(); r public.reports; v_note text := public._clean_text(p_note, 500);
begin
  select * into r from public.reports where id = p_id for update;
  if not found then raise exception 'not_allowed'; end if;
  if p_action not in ('dismiss', 'suspend') then raise exception 'invalid_input'; end if;
  if p_action = 'suspend' and r.target is not null then
    update public.profiles set status = 'suspended' where id = r.target;
    perform public._notify(r.target, 'Il tuo account e'' stato sospeso da Swappr. Scrivici per chiarire.', '');
  end if;
  update public.reports set status = 'closed', staff_note = v_note, closed_at = now() where id = p_id;
  perform public._staff_log(v, 'report_' || p_action, p_id::text, v_note);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.staff_find_user(p_query text) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._need_staff(); q text := lower(btrim(coalesce(p_query, '')));
begin
  if char_length(q) < 2 then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
            'user_id', p.id, 'username', p.username, 'email', u.email, 'status', p.status, 'visible', p.visible, 'created_at', p.created_at,
            'binders', (select count(*) from public.binders b where b.user_id = p.id),
            'wishlist', (select count(*) from public.wishlist w where w.user_id = p.id),
            'trades', (select count(*) from public.trades t where t.proposer = p.id or t.recipient = p.id),
            'reports_against', (select count(*) from public.reports r where r.target = p.id)) order by lower(p.username))
          from public.profiles p join auth.users u on u.id = p.id
         where starts_with(lower(p.username), q) or starts_with(lower(coalesce(u.email, '')), q)
         limit 20), '[]'::jsonb);
end $$;

create or replace function public.staff_set_user_status(p_user uuid, p_status text, p_reason text default '') returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._need_staff(); reason text := public._clean_text(p_reason, 300);
begin
  if p_status not in ('active', 'suspended') then raise exception 'invalid_input'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'user_not_found'; end if;
  update public.profiles set status = p_status where id = p_user;
  perform public._notify(p_user, case when p_status = 'suspended' then 'Il tuo account e'' stato sospeso da Swappr.' else 'Il tuo account e'' di nuovo attivo.' end
                                  || case when reason <> '' then ' ' || reason else '' end, '');
  perform public._staff_log(v, 'user_' || p_status, p_user::text, reason);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.staff_set_setting(p_key text, p_value text) returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v uuid := public._need_staff();
begin
  if p_key not in ('ship_to', 'ship_note') then raise exception 'invalid_input'; end if;
  insert into public.app_settings (key, value) values (p_key, public._clean_text(p_value, 500))
  on conflict (key) do update set value = excluded.value;
  perform public._staff_log(v, 'setting', p_key, '');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.staff_recent_log(p_limit int default 50) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := public._need_staff();
begin
  return coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'who', coalesce((select p.username from public.profiles p where p.id = l.staff_id), '?'),
                                                       'action', l.action, 'target', l.target, 'details', l.details, 'created_at', l.created_at) order by l.id desc)
                     from (select * from public.staff_log order by id desc limit least(greatest(coalesce(p_limit, 50), 1), 200)) l), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- SICUREZZA
--  1) RLS attiva su ogni tabella e nessuna "policy": dall'API pubblica non si legge e non si scrive nulla direttamente.
--  2) nessun permesso su tabelle e sequenze per i ruoli anon e authenticated.
--  3) si possono chiamare solo le funzioni elencate qui sotto.
-- ---------------------------------------------------------------------
alter table public.app_meta      enable row level security;
alter table public.app_settings  enable row level security;
alter table public.profiles      enable row level security;
alter table public.addresses     enable row level security;
alter table public.binders       enable row level security;
alter table public.binder_cards  enable row level security;
alter table public.wishlist      enable row level security;
alter table public.follows       enable row level security;
alter table public.blocks        enable row level security;
alter table public.messages      enable row level security;
alter table public.notifications enable row level security;
alter table public.trades        enable row level security;
alter table public.trade_items   enable row level security;
alter table public.reports       enable row level security;
alter table public.staff         enable row level security;
alter table public.staff_log     enable row level security;
alter table public.cache_entries enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

do $$
declare r record;
begin
  -- aperte a tutti (anche senza accesso): solo informazioni non personali
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname = any (array['app_status', 'username_available', 'most_wanted']) loop
    execute format('grant execute on function %s to anon, authenticated', r.sig);
  end loop;
  -- solo per chi ha fatto l'accesso
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname = any (array[
              'is_staff', 'get_my_data', 'get_counters', 'update_profile', 'accept_terms', 'save_address', 'delete_address',
              'save_binder', 'delete_binder', 'wish_apply', 'follow_user', 'block_user',
              'get_profile', 'search_users', 'discover', 'find_matches', 'card_people',
              'send_message', 'list_conversations', 'get_conversation', 'mark_notifications_read',
              'propose_trade', 'respond_trade', 'cancel_trade', 'mark_sent', 'confirm_received', 'trade_ship_info',
              'report_user', 'export_my_data', 'delete_my_account',
              'staff_overview', 'staff_list_trades', 'staff_trade_set_status', 'staff_list_reports', 'staff_close_report',
              'staff_find_user', 'staff_set_user_status', 'staff_set_setting', 'staff_recent_log']) loop
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- FINE. Per diventare staff (una volta sola), vedi le istruzioni in LEGGIMI.txt:
--   insert into public.staff (user_id) select id from auth.users where email = 'LA-TUA-EMAIL';
-- ---------------------------------------------------------------------
