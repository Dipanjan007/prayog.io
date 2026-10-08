-- Supabase publishes every table in the public schema through its REST API,
-- and its public "anon" key ships with the Vercel integration. Turn on row
-- level security with no policies so that API sees nothing. The app connects
-- as the table owner, which bypasses RLS, so it keeps working.
alter table accounts enable row level security;
alter table children enable row level security;
alter table consents enable row level security;
alter table progress enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table sessions enable row level security;
alter table login_codes enable row level security;
alter table suggestions enable row level security;
alter table schema_migrations enable row level security;

-- Belt and braces: Supabase's API roles get no table rights at all, now or
-- for tables made later. Plain Postgres has no such roles, so skip there.
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on all tables in schema public from %I', r);
      execute format('revoke all on all sequences in schema public from %I', r);
      execute format('revoke all on all functions in schema public from %I', r);
      execute format('alter default privileges in schema public revoke all on tables from %I', r);
      execute format('alter default privileges in schema public revoke all on sequences from %I', r);
      execute format('alter default privileges in schema public revoke all on functions from %I', r);
    end if;
  end loop;
end $$;
