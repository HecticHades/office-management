-- Zone-Teams many-to-many join table
CREATE TABLE IF NOT EXISTS zone_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(zone_id, team_id)
);

CREATE INDEX idx_zone_teams_zone_id ON zone_teams(zone_id);
CREATE INDEX idx_zone_teams_team_id ON zone_teams(team_id);

-- Migrate existing team_id data to zone_teams
INSERT INTO zone_teams (zone_id, team_id)
SELECT id, team_id FROM zones WHERE team_id IS NOT NULL
ON CONFLICT (zone_id, team_id) DO NOTHING;
