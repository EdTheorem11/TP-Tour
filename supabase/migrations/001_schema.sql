-- TP TOUR — Core schema
-- Run in the Supabase SQL editor, or via `supabase db push`, in order (001, 002, 003, 004).

create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

create type user_role as enum ('member', 'admin', 'super_admin');
create type member_status as enum ('pending', 'approved', 'suspended', 'rejected');

create type event_status as enum (
  'draft', 'coming_soon', 'entries_open', 'limited_spaces', 'sold_out', 'completed', 'cancelled'
);

create type competition_format as enum (
  'individual_stableford', 'strokeplay', 'pairs_betterball', 'texas_scramble',
  'team', 'matchplay', 'other'
);

create type entry_status as enum ('confirmed', 'withdrawn', 'cancelled');
create type waiting_list_status as enum ('waiting', 'promoted', 'removed');

create type payment_status as enum ('pending', 'paid', 'refunded', 'complimentary', 'not_required');

create type handicap_source as enum ('initial', 'member_submitted', 'admin_adjustment', 'event_recalc');
create type handicap_change_status as enum ('approved', 'pending');

create type sponsor_level as enum ('title_partner', 'official_partner', 'tour_partner', 'event_partner', 'prize_partner');

create type notification_type as enum (
  'welcome', 'membership_pending', 'membership_approved', 'membership_rejected',
  'event_entry_confirmed', 'event_reminder', 'waiting_list_confirmed', 'waiting_list_promoted',
  'event_updated', 'event_cancelled', 'results_published', 'handicap_updated'
);

create type notification_channel as enum ('email', 'whatsapp', 'push');
create type notification_status as enum ('pending', 'sent', 'failed');

-- ============================================================================
-- MEMBER PROFILES  (1:1 with auth.users)
-- ============================================================================

create table member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'member',
  status member_status not null default 'pending',

  first_name text not null,
  last_name text not null,
  email text not null unique,
  mobile text,
  nationality text,

  company text,
  job_title text,
  industry text,

  home_golf_club text,
  home_course text,

  current_handicap numeric(4,1),
  egf_whs_number text,
  linkedin_url text,
  avatar_url text,

  show_company_publicly boolean not null default true,
  show_job_title_publicly boolean not null default true,

  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,

  approved_at timestamptz,
  approved_by uuid references member_profiles(id),
  rejected_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_member_profiles_status on member_profiles(status);
create index idx_member_profiles_role on member_profiles(role);

-- ============================================================================
-- HANDICAP HISTORY
-- ============================================================================

create table handicap_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references member_profiles(id) on delete cascade,
  old_handicap numeric(4,1),
  new_handicap numeric(4,1) not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references member_profiles(id),
  reason text,
  source handicap_source not null default 'admin_adjustment',
  status handicap_change_status not null default 'approved',
  approved_by uuid references member_profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_handicap_history_member on handicap_history(member_id);

-- ============================================================================
-- GOLF CLUBS + COURSES
-- ============================================================================

create table golf_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  emirate text,
  website text,
  logo_url text,
  hero_image_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references member_profiles(id)
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  golf_club_id uuid not null references golf_clubs(id) on delete cascade,
  name text not null,
  par int,
  course_rating numeric(4,1),
  slope_rating int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_courses_club on courses(golf_club_id);

-- ============================================================================
-- SEASONS  (also carries Order of Merit configuration for that season)
-- ============================================================================

create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,                -- e.g. "2026/27"
  start_date date not null,
  end_date date,
  is_current boolean not null default false,

  -- Order of Merit configuration (admin-editable, never hardcoded)
  oom_points_table jsonb not null default '{
    "1": 100, "2": 80, "3": 70, "4": 65, "5": 60,
    "6": 55, "7": 50, "8": 45, "9": 40, "10": 35
  }'::jsonb,
  oom_default_points numeric(6,1) not null default 0,   -- points for finishers outside the table
  oom_major_multiplier numeric(4,2) not null default 2.0,
  oom_best_results_count int,               -- null = all events count
  oom_attendance_points numeric(6,1) not null default 0,
  oom_nearest_pin_bonus numeric(6,1) not null default 0,
  oom_longest_drive_bonus numeric(6,1) not null default 0,
  oom_other_bonus_label text,
  oom_other_bonus_points numeric(6,1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references member_profiles(id)
);

create unique index idx_seasons_one_current on seasons(is_current) where is_current;

-- ============================================================================
-- EVENTS
-- ============================================================================

create table events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete restrict,
  name text not null,
  slug text not null unique,

  golf_club_id uuid references golf_clubs(id),
  course_id uuid references courses(id),
  location text,
  hero_image_url text,

  event_date date not null,
  registration_opens_at timestamptz,
  registration_deadline timestamptz,
  arrival_time text,
  first_tee_time text,
  shotgun_time text,

  format competition_format,
  max_players int,
  member_price numeric(8,2),
  guest_price numeric(8,2),

  description text,
  competition_rules text,
  prizes text,
  dress_code text,
  course_information text,

  handicap_allowance text,
  oom_eligible boolean not null default true,
  oom_multiplier numeric(4,2) not null default 1.0,
  is_major boolean not null default false,

  sponsor_id uuid,   -- references partners(id), fk added after partners table exists

  status event_status not null default 'draft',

  results_published boolean not null default false,
  results_published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references member_profiles(id)
);

create index idx_events_season on events(season_id);
create index idx_events_date on events(event_date);
create index idx_events_status on events(status);

-- ============================================================================
-- EVENT ENTRIES + WAITING LIST
-- ============================================================================

create table event_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references member_profiles(id) on delete cascade,

  entry_date timestamptz not null default now(),
  playing_handicap numeric(4,1),

  is_guest boolean not null default false,
  guest_name text,

  status entry_status not null default 'confirmed',
  withdrawn_at timestamptz,
  withdrawal_reason text,

  payment_required boolean not null default false,
  payment_amount numeric(8,2),
  payment_status payment_status not null default 'not_required',
  payment_reference text,
  payment_date timestamptz,

  agreed_to_rules boolean not null default false,

  -- tee sheet (future-ready: populated once tee times are published)
  tee_time text,
  starting_hole int,
  group_number int,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(event_id, member_id)
);

create index idx_event_entries_event on event_entries(event_id);
create index idx_event_entries_member on event_entries(member_id);

create table waiting_list (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references member_profiles(id) on delete cascade,
  position int not null,
  status waiting_list_status not null default 'waiting',
  joined_at timestamptz not null default now(),
  promoted_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_id, member_id)
);

create index idx_waiting_list_event on waiting_list(event_id, position);

-- ============================================================================
-- SCORES + RESULTS
-- ============================================================================

create table event_scores (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references member_profiles(id) on delete cascade,
  entry_id uuid references event_entries(id) on delete set null,

  playing_handicap numeric(4,1),
  gross_score int,
  nett_score numeric(5,1),
  stableford_points int,

  countback_data jsonb,

  entered_by uuid references member_profiles(id),
  entered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(event_id, member_id)
);

create table event_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references member_profiles(id) on delete cascade,
  score_id uuid references event_scores(id) on delete set null,

  position int not null,
  position_display text not null,        -- e.g. "1", "T2"
  oom_points numeric(6,1) not null default 0,

  is_countback_win boolean not null default false,
  manually_overridden boolean not null default false,
  override_reason text,

  published boolean not null default false,
  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(event_id, member_id)
);

create index idx_event_results_event on event_results(event_id, position);
create index idx_event_results_member on event_results(member_id);

-- ============================================================================
-- ORDER OF MERIT — standings cache + manual adjustments
-- ============================================================================

create table order_of_merit_points (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  member_id uuid not null references member_profiles(id) on delete cascade,

  total_points numeric(8,1) not null default 0,
  counting_points numeric(8,1) not null default 0,
  dropped_points numeric(8,1) not null default 0,
  adjustment_points numeric(8,1) not null default 0,

  events_played int not null default 0,
  wins int not null default 0,
  runner_ups int not null default 0,
  top3 int not null default 0,
  top10 int not null default 0,

  rank int,
  previous_rank int,

  updated_at timestamptz not null default now(),

  unique(season_id, member_id)
);

create index idx_oom_points_season_rank on order_of_merit_points(season_id, rank);

create table order_of_merit_adjustments (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  member_id uuid not null references member_profiles(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  points_adjustment numeric(8,1) not null,
  reason text not null,
  admin_id uuid references member_profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PARTNERS
-- ============================================================================

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website text,
  description text,
  sponsor_level sponsor_level not null default 'tour_partner',
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table events add constraint fk_events_sponsor foreign key (sponsor_id) references partners(id) on delete set null;

create table event_partners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(event_id, partner_id)
);

-- ============================================================================
-- NOTIFICATIONS  (email now; whatsapp/push future-ready)
-- ============================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references member_profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  event_id uuid references events(id) on delete set null,
  channel notification_channel not null default 'email',
  status notification_status not null default 'pending',
  read boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_member on notifications(member_id, read);

-- ============================================================================
-- SITE CONTENT  (admin-editable copy, no code changes required)
-- ============================================================================

create table site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,     -- e.g. 'homepage_hero', 'homepage_stats', 'about_copy'
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references member_profiles(id)
);

-- ============================================================================
-- ADMIN AUDIT LOG
-- ============================================================================

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references member_profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_entity on admin_audit_log(entity_type, entity_id);
