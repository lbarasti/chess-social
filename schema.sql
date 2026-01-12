-- Create Players table (stores lichess usernames)

create table if not exists players (
  id text primary key
);

-- Create Tournaments table

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  creator_id text, -- Lichess username of the creator
  created_at timestamptz default now(),
  challenge_settings jsonb -- Lichess challenge configuration (time control, rated, variant, rules)
);

-- Create Matches table

create table if not exists matches (
  id text primary key,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  white text references players(id),
  black text references players(id),
  result text, -- '1-0', '0-1', '0.5-0.5' or null
  game_link text -- URL to the game
);

-- Insert Players (on conflict do nothing to avoid errors if re-run)
insert into players (id) values
  ('flevour'),
  ('gso1010'),
  ('gianmarcosanti'),
  ('lbarasti')
on conflict (id) do nothing;

-- Create default tournament and matches (for fresh install)
insert into tournaments (id, name) values
  ('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 'XMAS Molesto 2024')
on conflict (id) do nothing;

-- Generate Schedule (Simple Double Round Robin)
-- Only insert if table is empty to avoid duplicates
insert into matches (id, tournament_id, white, black)
select
  (row_number() over ())::text as id,
  'a0b1c2d3-e4f5-6789-abcd-ef0123456789'::uuid as tournament_id,
  p1.id as white,
  p2.id as black
from players p1
cross join players p2
where p1.id != p2.id
and not exists (select 1 from matches);
