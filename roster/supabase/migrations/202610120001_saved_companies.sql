begin;
create table public.roster_saved_companies (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_slug text not null check (length(company_slug) <= 180 and company_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  primary key (user_id, company_slug)
);
alter table public.roster_saved_companies enable row level security;
alter table public.roster_saved_companies force row level security;
revoke all on public.roster_saved_companies from public, anon, authenticated;
grant select, delete on public.roster_saved_companies to authenticated;
grant insert (user_id, company_slug) on public.roster_saved_companies to authenticated;
create policy "Read own saved companies" on public.roster_saved_companies
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Save to own account" on public.roster_saved_companies
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Remove own saved companies" on public.roster_saved_companies
  for delete to authenticated using ((select auth.uid()) = user_id);
commit;
