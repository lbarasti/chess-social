-- Add challenge_settings column to tournaments table
-- This column stores Lichess challenge configuration (time control, rated, variant, rules)

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS challenge_settings jsonb;

-- Example challenge settings:
-- {
--   "timeControl": { "type": "clock", "limit": 300, "increment": 3 },
--   "rated": false,
--   "variant": "standard",
--   "rules": ["noAbort", "noRematch"]
-- }
