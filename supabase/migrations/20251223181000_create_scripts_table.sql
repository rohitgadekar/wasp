-- Create scripts table
create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.scripts enable row level security;

-- Policies (Same as wiki_pages)
create policy "Scripts are viewable by everyone"
  on public.scripts for select
  using ( true );

create policy "Users can insert or moderators/owners can manage"
  on public.scripts for insert
  with check ( 
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
    public.has_role(auth.uid(), 'owner'::public.app_role)
  );

create policy "Users can update or moderators/owners can manage"
  on public.scripts for update
  using ( 
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
    public.has_role(auth.uid(), 'owner'::public.app_role)
  );

create policy "Users can delete or moderators/owners can manage"
  on public.scripts for delete
  using ( 
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'moderator'::public.app_role) OR 
    public.has_role(auth.uid(), 'owner'::public.app_role)
  );

-- Search optimization (optional but good)
create index scripts_title_idx on public.scripts using gin (to_tsvector('english', title));
create index scripts_content_idx on public.scripts using gin (to_tsvector('english', content));

-- Handle updated_at if function exists
do $$
begin
  if exists (select 1 from pg_proc where proname = 'handle_updated_at') then
    create trigger handle_updated_at_scripts
      before update on public.scripts
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;
