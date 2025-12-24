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
  result text, -- '1-0', '0-1', '0.5-0.5' or null
  game_link text -- URL to the game
);

-- Insert Players (on conflict do nothing to avoid errors if re-run)
insert into players (id, name, lichess_url) values
  ('flevour', 'Flevour', 'https://lichess.org/@/Flevour'),
  ('gso1010', 'gso1010', 'https://lichess.org/@/gso1010'),
  ('gianmarcosanti', 'Gianmarcosanti', 'https://lichess.org/@/Gianmarcosanti'),
  ('lbarasti', 'lbarasti', 'https://lichess.org/@/lbarasti')
on conflict (id) do nothing;

-- Generate Schedule (Simple Double Round Robin)
-- Only insert if table is empty to avoid duplicates
insert into matches (id, white, black)
select 
  (row_number() over ())::text as id, -- Cast to text for consistency
  p1.id as white,
  p2.id as black
from players p1
cross join players p2
where p1.id != p2.id
and not exists (select 1 from matches);

