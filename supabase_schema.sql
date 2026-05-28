-- Math Star Database Schema
-- Run this in your Supabase SQL editor

-- Profiles table (multiple profiles per auth user, e.g. kids)
create table if not exists profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  username text not null,
  avatar text not null default '🦊',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users manage own profiles" on profiles
  for all using (auth.uid() = user_id);

-- Problem history
create table if not exists problem_history (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles not null,
  factor_a int not null,
  factor_b int not null,
  correct boolean not null,
  answered_at timestamptz default now()
);

alter table problem_history enable row level security;
create policy "Users manage own history" on problem_history
  for all using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- Spaced repetition state
create table if not exists spaced_repetition (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles not null,
  factor_a int not null,
  factor_b int not null,
  ease_factor float default 2.5,
  interval_days int default 1,
  next_review date default current_date,
  times_failed int default 0,
  updated_at timestamptz default now(),
  unique(profile_id, factor_a, factor_b)
);

alter table spaced_repetition enable row level security;
create policy "Users manage own sr" on spaced_repetition
  for all using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- Indexes for performance
create index if not exists idx_problem_history_profile on problem_history(profile_id, answered_at desc);
create index if not exists idx_sr_profile_review on spaced_repetition(profile_id, next_review);

-- ── Migration: add operation column ─────────────────────────────────────────
-- Run this block if the tables already exist from the initial schema above.

alter table problem_history
  add column if not exists operation text default 'multiplication';

alter table spaced_repetition
  add column if not exists operation text default 'multiplication';

-- Drop the old unique constraint (only two-column, missing operation)
alter table spaced_repetition
  drop constraint if exists spaced_repetition_profile_id_factor_a_factor_b_key;

-- New unique constraint includes operation so mult and div are tracked independently
alter table spaced_repetition
  add constraint if not exists spaced_repetition_unique
  unique (profile_id, factor_a, factor_b, operation);
