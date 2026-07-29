-- ─── flight_events ──────────────────────────────────────────────

create table if not exists public.flight_events (
  event_id uuid primary key,
  event_type text not null check (event_type in (
    'mission.execution.started',
    'mission.execution.completed',
    'mission.waypoint.reached',
    'single_media.uploaded.completed'
  )),
  org_id text not null,
  flight_id text not null,
  timestamp timestamptz not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists idx_flight_events_org_flight on public.flight_events (org_id, flight_id);
create index if not exists idx_flight_events_org_received on public.flight_events (org_id, received_at desc);
create index if not exists idx_flight_events_flight_type_time on public.flight_events (flight_id, event_type, timestamp);

alter table public.flight_events replica identity full;
alter publication supabase_realtime add table public.flight_events;

alter table public.flight_events enable row level security;

create policy "Allow all on flight_events"
  on public.flight_events for all
  using (true)
  with check (true);

-- ─── flight_contexts ────────────────────────────────────────────

create table if not exists public.flight_contexts (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  flight_id text not null,
  site_id text,
  text text not null default '',
  image_notes jsonb not null default '{}'::jsonb,
  word_count integer not null default 0,
  started_at timestamptz not null default now(),
  last_edited_at timestamptz not null default now(),
  marked_complete boolean not null default false,
  source text not null default 'typed' check (source in ('typed', 'transcribed')),
  capture_mode text not null default 'retrospective' check (capture_mode in ('live', 'retrospective')),
  author_id text,
  constraint flight_contexts_org_flight_unique unique (org_id, flight_id)
);

create index if not exists idx_flight_contexts_org on public.flight_contexts (org_id);
create index if not exists idx_flight_contexts_flight on public.flight_contexts (flight_id);

alter table public.flight_contexts replica identity full;
alter publication supabase_realtime add table public.flight_contexts;

alter table public.flight_contexts enable row level security;

create policy "Allow all on flight_contexts"
  on public.flight_contexts for all
  using (true)
  with check (true);

-- ─── reports.flight_context_snapshot ────────────────────────────

alter table public.reports add column if not exists flight_context_snapshot jsonb;
