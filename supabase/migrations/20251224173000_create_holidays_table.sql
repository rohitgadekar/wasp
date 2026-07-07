create table if not exists holidays (
    id uuid primary key default gen_random_uuid(),
    date date not null unique,
    description text default 'Holiday',
    created_at timestamp with time zone default now()
);

-- Enable RLS
alter table holidays enable row level security;

-- Policies
create policy "Enable read access for all users" on holidays
    for select using (true);

create policy "Enable insert for authenticated users" on holidays
    for insert with check (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on holidays
    for delete using (auth.role() = 'authenticated');
