-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES
-- ==========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  birth_date date,
  height_cm numeric(5, 2),
  training_years numeric(4, 1) default 0 not null,
  last_regular_workout_date date,
  equipment_available text[] default array['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'] not null,
  available_days_per_week integer default 4 not null check (available_days_per_week between 1 and 7),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- ==========================================
-- 2. MUSCLES
-- ==========================================
create table public.muscles (
  id text primary key,
  name_en text not null,
  name_fa text not null,
  group_name text not null,
  max_sets_per_session integer default 10 not null,
  default_mev numeric(4, 1) default 8 not null,
  default_mrv numeric(4, 1) default 20 not null,
  created_at timestamptz default now() not null
);

alter table public.muscles enable row level security;
create policy "Public can read muscles" on public.muscles
  for select using (true);

-- ==========================================
-- 3. EXERCISES
-- ==========================================
create table public.exercises (
  id text primary key,
  name_en text not null,
  name_fa text not null,
  movement_pattern text not null,
  equipment text not null,
  primary_muscles jsonb not null,   -- array of { muscle_id: string, weight: number }
  secondary_muscles jsonb default '[]'::jsonb not null,
  sfr_prior numeric(3, 2) default 0.8 not null,
  joint_fatigue jsonb default '{}'::jsonb not null,
  systemic_fatigue numeric(3, 2) default 0.5 not null,
  length_bias numeric(3, 2) default 0.5 not null,
  estimated_time_sec integer default 150 not null,
  default_load_increment_kg numeric(4, 2) default 2.5 not null,
  e1rm_conversion_factor numeric(4, 2) default 1.0 not null,
  source text default 'prior' not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

alter table public.exercises enable row level security;
create policy "Public can read exercises" on public.exercises
  for select using (true);

-- ==========================================
-- 4. MESOCYCLES
-- ==========================================
create table public.mesocycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
  name text not null,
  start_date date not null,
  weeks_count integer default 4 not null check (weeks_count between 1 and 12),
  phase text default 'accumulation' not null,
  goal text default 'hypertrophy' not null,
  status text default 'draft' not null,
  model_version text default 'engine@0.1.0' not null,
  created_at timestamptz default now() not null
);

alter table public.mesocycles enable row level security;
create policy "Users manage own mesocycles" on public.mesocycles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 5. PLANNED SESSIONS & SETS
-- ==========================================
create table public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  mesocycle_id uuid references public.mesocycles(id) on delete cascade not null,
  week_number integer not null,
  day_number integer not null,
  name text not null,
  target_duration_min integer default 60 not null,
  rationale jsonb,
  created_at timestamptz default now() not null
);

alter table public.planned_sessions enable row level security;
create policy "Users manage planned sessions via mesocycle" on public.planned_sessions
  for all using (
    exists (
      select 1 from public.mesocycles m
      where m.id = planned_sessions.mesocycle_id and m.user_id = auth.uid()
    )
  );

create table public.planned_sets (
  id uuid primary key default gen_random_uuid(),
  planned_session_id uuid references public.planned_sessions(id) on delete cascade not null,
  exercise_id text references public.exercises(id) not null,
  set_order integer not null,
  target_load_kg numeric(6, 2),
  target_reps integer,
  target_rir numeric(3, 1),
  rationale jsonb,
  created_at timestamptz default now() not null
);

alter table public.planned_sets enable row level security;
create policy "Users manage planned sets via planned sessions" on public.planned_sets
  for all using (
    exists (
      select 1 from public.planned_sessions ps
      join public.mesocycles m on m.id = ps.mesocycle_id
      where ps.id = planned_sets.planned_session_id and m.user_id = auth.uid()
    )
  );

-- ==========================================
-- 6. SESSIONS (ACTUAL EXECUTED WORKOUTS)
-- ==========================================
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid not null unique,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
  mesocycle_id uuid references public.mesocycles(id) on delete set null,
  planned_session_id uuid references public.planned_sessions(id) on delete set null,
  name text default 'تمرین باشگاه' not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  readiness_score numeric(3, 2),
  srpe numeric(3, 1),
  notes text,
  created_at timestamptz default now() not null
);

alter table public.sessions enable row level security;
create policy "Users manage own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 7. SETS (APPEND-ONLY RAW DATA)
-- ==========================================
create table public.sets (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid not null unique,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
  exercise_id text references public.exercises(id) not null,
  set_number integer not null,
  load_kg numeric(6, 2) not null,
  reps integer not null check (reps > 0),
  rir numeric(3, 1),
  rest_seconds integer default 90 not null,
  is_warmup boolean default false not null,
  superseded_by uuid references public.sets(id) on delete set null,
  performed_at timestamptz not null,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.sets enable row level security;
create policy "Users manage own sets" on public.sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 8. DAILY CHECK-INS & BODY METRICS
-- ==========================================
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
  checkin_date date not null,
  sleep_hours numeric(3, 1) not null,
  sleep_quality integer not null check (sleep_quality between 1 and 5),
  stress_level integer not null check (stress_level between 1 and 5),
  motivation integer not null check (motivation between 1 and 5),
  muscle_soreness jsonb default '{}'::jsonb not null,
  resting_heart_rate integer,
  hrv_ms numeric(5, 1),
  notes text,
  created_at timestamptz default now() not null,
  unique (user_id, checkin_date)
);

alter table public.daily_checkins enable row level security;
create policy "Users manage own checkins" on public.daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
  recorded_at timestamptz not null,
  weight_kg numeric(5, 2) not null,
  waist_cm numeric(5, 2),
  chest_cm numeric(5, 2),
  arms_cm numeric(5, 2),
  thighs_cm numeric(5, 2),
  calves_cm numeric(5, 2),
  photo_storage_path text,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.body_metrics enable row level security;
create policy "Users manage own body metrics" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 9. NUTRITION DAILY
-- ==========================================
create table public.nutrition_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
  date date not null,
  calories numeric(6, 1),
  protein_grams numeric(5, 1),
  created_at timestamptz default now() not null,
  unique (user_id, date)
);

alter table public.nutrition_daily enable row level security;
create policy "Users manage own nutrition" on public.nutrition_daily
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 10. MODEL STATE & PARAMS
-- ==========================================
create table public.model_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
  kind text not null,
  key text not null,
  mean jsonb not null,
  cov jsonb not null,
  as_of timestamptz not null,
  version text default 'engine@0.1.0' not null,
  created_at timestamptz default now() not null,
  unique (user_id, kind, key, version)
);

alter table public.model_state enable row level security;
create policy "Users manage own model state" on public.model_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.model_params (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global', 'user')),
  user_id uuid references auth.users(id) on delete cascade,
  param_name text not null,
  param_value jsonb not null,
  source text default 'prior' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.model_params enable row level security;
create policy "Users read global or own params" on public.model_params
  for select using (scope = 'global' or auth.uid() = user_id);
create policy "Users manage own params" on public.model_params
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 11. DECISIONS LOG
-- ==========================================
create table public.decisions_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade not null,
  decision_timestamp timestamptz default now() not null,
  decision_type text not null,
  scope jsonb not null,
  inputs jsonb not null,
  estimates jsonb default '{}'::jsonb not null,
  rules_fired jsonb default '[]'::jsonb not null,
  counterfactual text,
  confidence text default 'medium' not null,
  explanation_en text not null,
  explanation_fa text not null,
  model_version text default 'engine@0.1.0' not null,
  created_at timestamptz default now() not null
);

alter table public.decisions_log enable row level security;
create policy "Users manage own decisions log" on public.decisions_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==========================================
-- 12. INDEXES FOR HIGH-SPEED QUERYING
-- ==========================================
create index idx_sets_user_exercise_perf on public.sets (user_id, exercise_id, performed_at desc);
create index idx_sets_user_perf on public.sets (user_id, performed_at desc);
create index idx_sets_session_id on public.sets (session_id);
create index idx_sets_client_uuid on public.sets (client_uuid);
create index idx_sessions_client_uuid on public.sessions (client_uuid);
create index idx_sessions_user_perf on public.sessions (user_id, started_at desc);
create index idx_checkins_user_date on public.daily_checkins (user_id, checkin_date desc);
create index idx_body_metrics_user_date on public.body_metrics (user_id, recorded_at desc);
create index idx_decisions_user_time on public.decisions_log (user_id, decision_timestamp desc);

-- ==========================================
-- 13. VIEW: EFFECTIVE SETS PER MUSCLE
-- Excludes warmups, discounts RIR > 4, unpacks secondary muscles
-- ==========================================
create or replace view public.view_effective_sets as
with active_sets as (
  select
    s.id as set_id,
    s.user_id,
    s.performed_at,
    s.exercise_id,
    s.reps,
    s.load_kg,
    s.rir,
    case
      when s.rir is null then 0.8
      when s.rir <= 3.5 then 1.0
      when s.rir <= 4.5 then 0.5
      else 0.0
    end as set_quality_factor
  from public.sets s
  where s.is_warmup = false
    and s.superseded_by is null
),
muscle_unpacked as (
  -- Primary muscles (weight from exercise)
  select
    a.set_id,
    a.user_id,
    a.performed_at,
    a.exercise_id,
    a.set_quality_factor,
    (m->>'muscleId')::text as muscle_id,
    (m->>'weight')::numeric as participation_weight
  from active_sets a
  cross join lateral jsonb_array_elements(
    (select primary_muscles from public.exercises e where e.id = a.exercise_id)
  ) as m

  union all

  -- Secondary muscles (weight from exercise)
  select
    a.set_id,
    a.user_id,
    a.performed_at,
    a.exercise_id,
    a.set_quality_factor,
    (m->>'muscleId')::text as muscle_id,
    (m->>'weight')::numeric as participation_weight
  from active_sets a
  cross join lateral jsonb_array_elements(
    coalesce((select secondary_muscles from public.exercises e where e.id = a.exercise_id), '[]'::jsonb)
  ) as m
)
select
  set_id,
  user_id,
  performed_at,
  exercise_id,
  muscle_id,
  participation_weight,
  set_quality_factor,
  (participation_weight * set_quality_factor) as effective_volume_contribution,
  date_trunc('week', performed_at) as week_start
from muscle_unpacked;
