DROP TABLE IF EXISTS balls CASCADE;
DROP TABLE IF EXISTS innings CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  mode VARCHAR(30) NOT NULL CHECK (mode IN ('single', 'league', 'knockout', 'league_knockout', 'custom')),
  overs INT NOT NULL CHECK (overs > 0),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  winner_team_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  short_name VARCHAR(20),
  played INT DEFAULT 0,
  won INT DEFAULT 0,
  lost INT DEFAULT 0,
  tied INT DEFAULT 0,
  points INT DEFAULT 0,
  runs_for INT DEFAULT 0,
  balls_for INT DEFAULT 0,
  runs_against INT DEFAULT 0,
  balls_against INT DEFAULT 0,
  UNIQUE(tournament_id, name)
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(30) DEFAULT 'player'
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_a_id UUID REFERENCES teams(id),
  team_b_id UUID REFERENCES teams(id),
  round_name VARCHAR(60) DEFAULT 'League',
  match_no INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed')),
  toss_winner_id UUID REFERENCES teams(id),
  batting_first_team_id UUID REFERENCES teams(id),
  winner_team_id UUID REFERENCES teams(id),
  result_text TEXT,
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE innings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  batting_team_id UUID REFERENCES teams(id),
  bowling_team_id UUID REFERENCES teams(id),
  innings_no INT NOT NULL CHECK (innings_no IN (1,2)),
  runs INT DEFAULT 0,
  wickets INT DEFAULT 0,
  valid_balls INT DEFAULT 0,
  extras INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  UNIQUE(match_id, innings_no)
);

CREATE TABLE balls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  innings_id UUID REFERENCES innings(id) ON DELETE CASCADE,
  ball_no INT NOT NULL,
  runs_bat INT DEFAULT 0,
  extra_runs INT DEFAULT 0,
  extra_type VARCHAR(20),
  is_wicket BOOLEAN DEFAULT false,
  wicket_type VARCHAR(30),
  is_legal BOOLEAN DEFAULT true,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_teams_tournament ON teams(tournament_id);
CREATE INDEX idx_innings_match ON innings(match_id);
CREATE INDEX idx_balls_innings ON balls(innings_id);
