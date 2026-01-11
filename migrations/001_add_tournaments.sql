-- Migration: Add tournaments support
-- Run this on existing databases to add multi-tournament support

-- 1. Create tournaments table
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Create default tournament for existing matches
insert into tournaments (id, name) values
  ('a0b1c2d3-e4f5-6789-abcd-ef0123456789', 'XMAS Molesto 2024');

-- 3. Add tournament_id column to matches (nullable initially for migration)
alter table matches add column if not exists tournament_id uuid references tournaments(id);

-- 4. Assign all existing matches to the default tournament
update matches set tournament_id = 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' where tournament_id is null;

-- 5. Make tournament_id required
alter table matches alter column tournament_id set not null;
