-- Accounts, verified consent, child profiles, progress sync and school classes.
-- Children never have an email or a real name here: only a nickname, class,
-- avatar and their learning progress.

create table accounts (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('parent', 'teacher')),
  name text not null,
  email text not null unique,
  school_name text,
  created_at timestamptz not null default now()
);

create table children (
  id uuid primary key default gen_random_uuid(),
  -- Set for children a parent signed up. Null for children a school enrolled.
  parent_id uuid references accounts(id) on delete cascade,
  nickname text not null,
  class_num smallint not null check (class_num between 7 and 10),
  avatar text not null,
  show_on_leaderboard boolean not null default false,
  -- Picture password for children who sign in with a class code.
  picture_hash text,
  failed_attempts smallint not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
create index children_parent_idx on children(parent_id);

-- One row per consent given. Parents consent after proving their email with a
-- one-time code; for school classes the teacher consents on the school's behalf.
create table consents (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  given_by uuid references accounts(id) on delete set null,
  method text not null check (method in ('parent_email_otp', 'school')),
  version text not null,
  given_at timestamptz not null default now()
);
create index consents_child_idx on consents(child_id);

create table progress (
  child_id uuid primary key references children(id) on delete cascade,
  data jsonb not null,
  xp integer not null default 0,
  -- Weekly leaderboard: XP at the start of the current week (Monday, IST).
  week_start date not null,
  week_base_xp integer not null default 0,
  updated_at timestamptz not null default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  class_num smallint not null check (class_num between 7 and 10),
  join_code text not null unique,
  created_at timestamptz not null default now()
);
create index classes_teacher_idx on classes(teacher_id);

create table class_members (
  class_id uuid not null references classes(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, child_id)
);
create index class_members_child_idx on class_members(child_id);

create table sessions (
  token_hash text primary key,
  account_id uuid references accounts(id) on delete cascade,
  child_id uuid references children(id) on delete cascade,
  expires_at timestamptz not null,
  check ((account_id is null) <> (child_id is null))
);
create index sessions_account_idx on sessions(account_id);
create index sessions_child_idx on sessions(child_id);

create table login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index login_codes_email_idx on login_codes(email, created_at desc);
