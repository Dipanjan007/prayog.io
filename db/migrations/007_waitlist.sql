-- Parents who want the Family plan before payments open. One email each,
-- written to once when payments open, then deleted (retention job: 1 year).
create table waitlist (
  email text primary key,
  period text not null check (period in ('month', 'year')),
  account_id uuid references accounts(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table waitlist enable row level security;

do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on table waitlist from %I', r);
    end if;
  end loop;
end $$;
