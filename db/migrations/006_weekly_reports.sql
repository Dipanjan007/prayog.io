-- The weekly parent report compares a child's progress now with where it
-- stood on Monday. The first save of each week keeps a copy of the progress
-- as it was. Kept 8 weeks, then the retention job deletes it.
create table progress_weeks (
  child_id uuid not null references children(id) on delete cascade,
  week_start date not null,
  data jsonb not null,
  xp integer not null,
  primary key (child_id, week_start)
);
alter table progress_weeks enable row level security;

-- Parents can turn the weekly email off.
alter table accounts add column report_emails boolean not null default true;

do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on table progress_weeks from %I', r);
    end if;
  end loop;
end $$;
