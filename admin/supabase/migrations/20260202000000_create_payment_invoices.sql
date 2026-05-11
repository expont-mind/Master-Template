create table if not exists payment_invoices (
  id text primary key,
  user_id uuid not null references auth.users(id),
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  paid_amount numeric,
  transaction_id text,
  payment_wallet text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table payment_invoices enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'payment_invoices' and policyname = 'Users can read own invoices') then
    create policy "Users can read own invoices" on payment_invoices for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'payment_invoices' and policyname = 'Users can insert own invoices') then
    create policy "Users can insert own invoices" on payment_invoices for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'payment_invoices' and policyname = 'Service role can update invoices') then
    create policy "Service role can update invoices" on payment_invoices for update using (true);
  end if;
end $$;
