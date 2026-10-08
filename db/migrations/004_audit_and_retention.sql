-- DPDP Rule 6: keep a log of who touched personal data, for at least a year,
-- so a breach can be found and investigated. Ids only, no names or emails,
-- and no foreign keys, so the trail outlives deleted accounts.
create table audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  action text not null,
  actor_account uuid,
  actor_child uuid,
  subject_id uuid,
  ip text,
  detail jsonb
);
create index audit_log_at_idx on audit_log(at);
create index audit_log_ip_idx on audit_log(ip, action, at desc);
alter table audit_log enable row level security;

-- Retention: accounts nobody has used for two years are warned, then deleted.
alter table accounts add column last_active_at timestamptz not null default now();
alter table accounts add column deletion_warned_at timestamptz;
