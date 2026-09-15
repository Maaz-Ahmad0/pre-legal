create table if not exists public.documents (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null,
  title text not null,
  status text not null check (status in ('Draft', 'Review', 'Ready')),
  values jsonb not null default '{}'::jsonb,
  updated_at date not null default current_date
);

alter table public.documents enable row level security;

create policy "Users can view their documents"
  on public.documents for select using (auth.uid() = user_id);
create policy "Users can create their documents"
  on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can update their documents"
  on public.documents for update using (auth.uid() = user_id);
create policy "Users can delete their documents"
  on public.documents for delete using (auth.uid() = user_id);
