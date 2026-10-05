-- Ideas sent from the in-app suggestion box. Only the writer's role and class
-- are kept, never who they are; contact details are removed from the text first.
create table suggestions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('student', 'parent', 'teacher')),
  area text not null check (area in ('lesson', 'sim', 'broken', 'other')),
  class_num smallint check (class_num between 7 and 10),
  page text,
  body text not null,
  -- new -> planned / declined / shipped, set during the weekly review.
  status text not null default 'new' check (status in ('new', 'planned', 'declined', 'shipped')),
  github_issue integer,
  created_at timestamptz not null default now()
);
create index suggestions_status_idx on suggestions(status, created_at);
