-- Family plan payments through Razorpay. A row is made when checkout opens
-- and marked paid once Razorpay's signature checks out. The plan is active
-- while a paid row's ends_at is in the future. No card or UPI details are
-- stored: Razorpay keeps those.
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  plan text not null check (plan in ('family')),
  period text not null check (period in ('month', 'year')),
  amount_paise integer not null,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  status text not null default 'created' check (status in ('created', 'paid')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create index subscriptions_account_idx on subscriptions(account_id, ends_at desc);

alter table subscriptions enable row level security;

do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on table subscriptions from %I', r);
    end if;
  end loop;
end $$;
