-- Create Players table
create table if not exists players (
  id text primary key,
  name text not null,
  lichess_url text not null
);

-- Create Matches table
create table if not exists matches (
  id text primary key,
  white text references players(id),
  black text references players(id),
  result text -- '1-0', '0-1', '0.5-0.5' or null
);

-- Add game_link column if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'matches' and column_name = 'game_link') then
    alter table matches add column game_link text;
  end if;
end $$;

-- Insert Players (on conflict do nothing to avoid errors if re-run)
insert into players (id, name, lichess_url) values
  ('flevour', 'Flevour', 'https://lichess.org/@/Flevour'),
  ('gso1010', 'gso1010', 'https://lichess.org/@/gso1010'),
  ('gianmarcosanti', 'Gianmarcosanti', 'https://lichess.org/@/Gianmarcosanti'),
  ('lbarasti', 'lbarasti', 'https://lichess.org/@/lbarasti')
on conflict (id) do nothing;

-- Generate Schedule (Simple Double Round Robin)
-- Only insert if table is empty (or check against specific IDs if we wanted to be more granular, but this is fine for initial setup)
insert into matches (id, white, black)
select 
  (row_number() over ())::text as id, -- Cast to text for consistency
  p1.id as white,
  p2.id as black
from players p1
cross join players p2
where p1.id != p2.id
and not exists (select 1 from matches);

-- Enable RLS (Security)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public Read
DROP POLICY IF EXISTS "Public Read Players" ON players;
CREATE POLICY "Public Read Players" ON players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Matches" ON matches;
CREATE POLICY "Public Read Matches" ON matches FOR SELECT USING (true);

-- 2. Public Update (for the tournament participants)
DROP POLICY IF EXISTS "Public Update Matches" ON matches;
CREATE POLICY "Public Update Matches" ON matches FOR UPDATE USING (true);

-- 3. Public Insert (if needed later, but we pre-seeded matches)
-- DROP POLICY IF EXISTS "Public Insert Matches" ON matches;
-- CREATE POLICY "Public Insert Matches" ON matches FOR INSERT WITH CHECK (true);
