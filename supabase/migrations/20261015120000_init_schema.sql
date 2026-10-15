-- Rad van Avontuur
-- Gastavonturen gaan via de service-rol. Anon en authenticated hebben geen
-- directe leesrechten op partner- of promotiedata.

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.destinations (
  id text primary key,
  provider_place_id text,
  name text not null,
  category text not null,
  latitude double precision not null,
  longitude double precision not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index destinations_place_idx on public.destinations (provider_place_id);
create index destinations_geo_idx on public.destinations (latitude, longitude);

create table public.destination_metadata (
  destination_id text primary key references public.destinations (id) on delete cascade,
  minimum_age_months integer,
  maximum_age_months integer,
  activity_level smallint,
  indoor_outdoor text,
  estimated_duration_minutes integer,
  age_suitability_known boolean not null default false
);

create table public.destination_data_sources (
  id bigint generated always as identity primary key,
  destination_id text not null references public.destinations (id) on delete cascade,
  source text not null,
  source_url text,
  fetched_at timestamptz
);

create index destination_sources_destination_idx on public.destination_data_sources (destination_id);

create table public.destination_verifications (
  id bigint generated always as identity primary key,
  destination_id text not null references public.destinations (id) on delete cascade,
  field_name text not null,
  status text not null,
  checked_at timestamptz not null default now()
);

create table public.destination_data_quality (
  id bigint generated always as identity primary key,
  destination_id text not null,
  field_name text not null,
  source text not null,
  last_checked_at timestamptz,
  confidence text not null,
  issue text,
  review_status text not null default 'open'
);

create index quality_destination_idx on public.destination_data_quality (destination_id);

create table public.adventure_sessions (
  id uuid primary key,
  share_token uuid not null unique,
  owner_token uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  status text not null,
  created_at timestamptz not null default now(),
  payload jsonb not null
);

create index adventure_sessions_owner_idx on public.adventure_sessions (owner_token);
create index adventure_sessions_user_idx on public.adventure_sessions (user_id);

create table public.participants (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.adventure_sessions (id) on delete cascade,
  age_months integer not null check (age_months >= 0 and age_months <= 1440)
);

create index participants_session_idx on public.participants (session_id);

create table public.selected_adventures (
  id uuid primary key,
  session_id uuid not null references public.adventure_sessions (id) on delete cascade,
  destination_id text not null,
  kind text not null,
  probability double precision not null,
  created_at timestamptz not null default now()
);

create index selected_adventures_session_idx on public.selected_adventures (session_id);

create table public.itinerary_stops (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.adventure_sessions (id) on delete cascade,
  kind text not null,
  destination_id text not null,
  reason text not null
);

create index itinerary_stops_session_idx on public.itinerary_stops (session_id);

create table public.visited_destinations (
  user_id uuid not null references auth.users (id) on delete cascade,
  destination_id text not null,
  session_id uuid,
  confirmed_at timestamptz not null default now(),
  primary key (user_id, destination_id)
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  destination_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, destination_id)
);

create table public.reviews (
  id uuid primary key,
  destination_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '',
  tags text[] not null default '{}',
  status text not null default 'published',
  created_at timestamptz not null default now(),
  unique (user_id, destination_id)
);

create index reviews_destination_idx on public.reviews (destination_id) where status = 'published';

create table public.review_reports (
  id bigint generated always as identity primary key,
  review_id uuid not null references public.reviews (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Partnerdata staat apart van de aanbevelingsmotor.
create table public.partners (
  id text primary key,
  destination_id text not null,
  agreement_status text not null,
  payload jsonb not null
);

create table public.promotions (
  id text primary key,
  destination_id text not null,
  active boolean not null default false,
  payload jsonb not null
);

create index promotions_destination_idx on public.promotions (destination_id);

create table public.promotion_interactions (
  id bigint generated always as identity primary key,
  promotion_id text not null references public.promotions (id) on delete cascade,
  session_id uuid,
  kind text not null,
  created_at timestamptz not null default now()
);

create table public.affiliate_offers (
  id text primary key,
  destination_id text not null,
  payload jsonb not null
);

create table public.analytics_events (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now(),
  session_id uuid,
  properties jsonb not null default '{}'
);

create index analytics_events_name_idx on public.analytics_events (name, created_at);

alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.destination_metadata enable row level security;
alter table public.destination_data_sources enable row level security;
alter table public.destination_verifications enable row level security;
alter table public.destination_data_quality enable row level security;
alter table public.adventure_sessions enable row level security;
alter table public.participants enable row level security;
alter table public.selected_adventures enable row level security;
alter table public.itinerary_stops enable row level security;
alter table public.visited_destinations enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.review_reports enable row level security;
alter table public.partners enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_interactions enable row level security;
alter table public.affiliate_offers enable row level security;
alter table public.analytics_events enable row level security;

-- Geen policies voor partners, promotions, affiliates of analytics.
-- De service-rol omzeilt RLS. Anon krijgt daar niets.

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy sessions_select_own on public.adventure_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy visited_own on public.visited_destinations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy favorites_own on public.favorites
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy reviews_select_visible on public.reviews
  for select to authenticated
  using (status = 'published' or (select auth.uid()) = user_id);

create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
