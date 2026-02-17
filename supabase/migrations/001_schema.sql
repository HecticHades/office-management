-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (custom auth, NOT Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'team_lead', 'member')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Temp passwords table
CREATE TABLE temp_passwords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  used_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_temp_passwords_user_id ON temp_passwords(user_id);

-- Auth audit log
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_log_action ON auth_audit_log(action);
CREATE INDEX idx_auth_audit_log_created_at ON auth_audit_log(created_at DESC);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team members (join table)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Zones (office areas)
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  floor INTEGER NOT NULL DEFAULT 1,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  boundary_path TEXT, -- SVG path for floor plan (future)
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_team_id ON zones(team_id);

-- Desks
CREATE TABLE desks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(50) NOT NULL,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  desk_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (desk_type IN ('standard', 'standing', 'private', 'shared')),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'reserved')),
  pos_x REAL DEFAULT 0,
  pos_y REAL DEFAULT 0,
  rotation REAL DEFAULT 0,
  equipment TEXT[], -- e.g., ['monitor', 'docking_station']
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_desks_zone_id ON desks(zone_id);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  desk_id UUID NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL DEFAULT 'full_day' CHECK (time_slot IN ('morning', 'afternoon', 'full_day')),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent double booking: unique on desk_id + date + time_slot for confirmed bookings
CREATE UNIQUE INDEX idx_bookings_no_double ON bookings(desk_id, date, time_slot) WHERE status = 'confirmed';
-- Also prevent full_day when morning/afternoon exists and vice versa
CREATE UNIQUE INDEX idx_bookings_no_overlap_fullday ON bookings(desk_id, date) WHERE status = 'confirmed' AND time_slot = 'full_day';

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_desk_date ON bookings(desk_id, date);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_zones_updated_at BEFORE UPDATE ON zones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_desks_updated_at BEFORE UPDATE ON desks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for Realtime (read-only via anon key)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read bookings" ON bookings FOR SELECT USING (true);

ALTER TABLE desks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read desks" ON desks FOR SELECT USING (true);
