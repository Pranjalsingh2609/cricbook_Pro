import { query } from "../config/db.js";
import { isLegalBall, oversText, runRate } from "../utils/score.js";

// looks up a player by name in a team; creates them if they don't exist yet
async function resolvePlayer(name, teamId) {
  if (!name?.trim()) throw new Error("Player name is required");

  const existing = await query(
    `SELECT id FROM players
     WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND team_id = $2`,
    [name, teamId]
  );

  if (existing.rows[0]) return existing.rows[0].id;

  const created = await query(
    `INSERT INTO players (name, team_id) VALUES ($1, $2) RETURNING id`,
    [name.trim(), teamId]
  );

  return created.rows[0].id;
}

export async function getMatch(req, res) {
  const { id } = req.params;

  const match = await query(
    `SELECT m.*,
            ta.name AS team_a_name,
            tb.name AS team_b_name,
            wt.name AS winner_team_name
     FROM matches m
     JOIN teams ta ON ta.id = m.team_a_id
     JOIN teams tb ON tb.id = m.team_b_id
     LEFT JOIN teams wt ON wt.id = m.winner_team_id
     WHERE m.id = $1`,
    [id]
  );

  if (!match.rows[0]) return res.status(404).json({ message: "Match not found" });

  const innings = await query(
    `SELECT
       i.*,
       s.name  AS striker_name,
       ns.name AS non_striker_name,
       b.name  AS current_bowler_name
     FROM innings i
     LEFT JOIN players s  ON s.id  = i.striker_id
     LEFT JOIN players ns ON ns.id = i.non_striker_id
     LEFT JOIN players b  ON b.id  = i.current_bowler_id
     WHERE i.match_id = $1
     ORDER BY i.innings_no`,
    [id]
  );

  res.json({ match: match.rows[0], innings: innings.rows });
}

export async function startMatch(req, res) {
  const { id } = req.params;
  const { tossWinnerId, battingFirstTeamId } = req.body;

  const m = await query("SELECT * FROM matches WHERE id = $1", [id]);
  const match = m.rows[0];

  if (!match) return res.status(404).json({ message: "Match not found" });

  // whichever team isn't batting first is bowling first
  const bowlingTeamId =
    battingFirstTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;

  await query(
    `UPDATE matches
     SET status = 'live', toss_winner_id = $1, batting_first_team_id = $2
     WHERE id = $3`,
    [tossWinnerId, battingFirstTeamId, id]
  );

  const inn = await query(
    `INSERT INTO innings(
       match_id, batting_team_id, bowling_team_id,
       innings_no, runs, wickets, valid_balls, extras
     ) VALUES ($1, $2, $3, 1, 0, 0, 0, 0)
     RETURNING *`,
    [id, battingFirstTeamId, bowlingTeamId]
  );

  res.json({ innings: inn.rows[0] });
}

export async function setCurrentPlayers(req, res) {
  try {
    // note: the route uses :matchId and :inningsNo
    const { matchId, inningsNo } = req.params;
    const { strikerName, nonStrikerName, bowlerName } = req.body;

    const inningsRes = await query(
      `SELECT * FROM innings WHERE match_id = $1 AND innings_no = $2`,
      [matchId, inningsNo]
    );
    const innings = inningsRes.rows[0];
    if (!innings) return res.status(404).json({ message: "Innings not found" });

    // only resolve names that were actually provided
    const strikerId = strikerName
      ? await resolvePlayer(strikerName, innings.batting_team_id)
      : undefined;

    const nonStrikerId = nonStrikerName
      ? await resolvePlayer(nonStrikerName, innings.batting_team_id)
      : undefined;

    const bowlerId = bowlerName
      ? await resolvePlayer(bowlerName, innings.bowling_team_id)
      : undefined;

    const updated = await query(
      `UPDATE innings SET
         striker_id        = COALESCE($1, striker_id),
         non_striker_id    = COALESCE($2, non_striker_id),
         current_bowler_id = COALESCE($3, current_bowler_id)
       WHERE match_id = $4 AND innings_no = $5
       RETURNING *`,
      [
        strikerId ?? null,
        nonStrikerId ?? null,
        bowlerId ?? null,
        matchId,
        inningsNo,
      ]
    );

    // re-join with player names so the response includes readable names
    const withNames = await query(
      `SELECT i.*,
              s.name  AS striker_name,
              ns.name AS non_striker_name,
              b.name  AS current_bowler_name
       FROM innings i
       LEFT JOIN players s  ON s.id  = i.striker_id
       LEFT JOIN players ns ON ns.id = i.non_striker_id
       LEFT JOIN players b  ON b.id  = i.current_bowler_id
       WHERE i.id = $1`,
      [updated.rows[0].id]
    );

    req.io?.to(matchId).emit("players_updated", withNames.rows[0]);
    res.json({ innings: withNames.rows[0] });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function addBall(req, res) {
  // note: this route uses :matchId (not :id)
  const { matchId } = req.params;

  const {
    inningsNo = 1,
    runsBat = 0,
    extraRuns = 0,
    extraType = null,
    isWicket = false,
  } = req.body;

  // don't allow scoring on a completed match
  const matchCheck = await query("SELECT status FROM matches WHERE id = $1", [matchId]);
  if (matchCheck.rows[0]?.status === "completed")
    return res.status(400).json({ message: "Match already completed" });

  const inningsResult = await query(
    "SELECT * FROM innings WHERE match_id = $1 AND innings_no = $2",
    [matchId, inningsNo]
  );
  const innings = inningsResult.rows[0];
  if (!innings) return res.status(404).json({ message: "Innings not started" });

  const batsmanId = innings.striker_id;
  const bowlerId = innings.current_bowler_id;

  if (!batsmanId || !bowlerId) {
    return res.status(400).json({ message: "Set striker and bowler before scoring" });
  }

  const batsmanOutId = isWicket ? batsmanId : null;
  const legal = isLegalBall(extraType);
  const nextBallNo = Number(innings.valid_balls) + (legal ? 1 : 0);

  const ball = await query(
    `INSERT INTO balls (
       innings_id, batsman_id, bowler_id, batsman_out_id,
       ball_no, runs_bat, extra_runs, extra_type, is_wicket, is_legal
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      innings.id, batsmanId, bowlerId, batsmanOutId,
      nextBallNo, runsBat, extraRuns, extraType, isWicket, legal,
    ]
  );

  const runs = Number(innings.runs) + runsBat + extraRuns;
  const wickets = Number(innings.wickets) + (isWicket ? 1 : 0);
  const validBalls = Number(innings.valid_balls) + (legal ? 1 : 0);
  const extras = Number(innings.extras) + extraRuns;

  // clear striker on wicket so the UI prompts for a new batsman
  const updated = await query(
    `UPDATE innings SET
       runs = $1, wickets = $2, valid_balls = $3, extras = $4,
       striker_id = CASE WHEN $5 THEN NULL ELSE striker_id END
     WHERE id = $6
     RETURNING *`,
    [runs, wickets, validBalls, extras, isWicket, innings.id]
  );

  // build the current over display (last 6 legal balls + any extras in between)
  const ballsRes = await query(
    `SELECT * FROM balls WHERE innings_id = $1 ORDER BY id DESC LIMIT 12`,
    [innings.id]
  );

  const currentOver = [];
  let ballCount = 0;
  for (const b of ballsRes.rows) {
    if (ballCount >= 6) break;
    currentOver.unshift({
      type: b.is_wicket
        ? "W"
        : b.extra_type === "wide"
        ? "Wd"
        : b.extra_type === "no_ball"
        ? "Nb"
        : b.runs_bat,
    });
    if (b.is_legal) ballCount++;
  }

  // check if the chasing team has won in the second innings
  if (Number(inningsNo) === 2) {
    const first = await query(
      `SELECT * FROM innings WHERE match_id = $1 AND innings_no = 1`,
      [matchId]
    );
    const target = (first.rows[0]?.runs ?? 0) + 1;

    if (runs >= target) {
      await query(
        `UPDATE matches SET status = 'completed', winner_team_id = $1 WHERE id = $2`,
        [innings.batting_team_id, matchId]
      );
      req.io?.to(matchId).emit("match_completed", {
        matchId,
        winnerTeamId: innings.batting_team_id,
      });
      return res.json({
        innings: updated.rows[0],
        ball: ball.rows[0],
        currentOver,
        matchCompleted: true,
      });
    }
  }

  // check if the first innings is over (overs used up or all out)
  const matchInfo = await query(
    `SELECT m.*, t.overs FROM matches m
     JOIN tournaments t ON t.id = m.tournament_id
     WHERE m.id = $1`,
    [matchId]
  );
  const ballsLimit = Number(matchInfo.rows[0].overs) * 6;
  const inningsFinished = validBalls >= ballsLimit || wickets >= 10;

  if (inningsFinished && Number(inningsNo) === 1) {
    // auto-create the second innings row if it doesn't exist yet
    const exists = await query(
      `SELECT * FROM innings WHERE match_id = $1 AND innings_no = 2`,
      [matchId]
    );
    if (!exists.rows.length) {
      await query(
        `INSERT INTO innings(
           match_id, batting_team_id, bowling_team_id,
           innings_no, runs, wickets, valid_balls, extras
         ) VALUES ($1, $2, $3, 2, 0, 0, 0, 0)`,
        [matchId, innings.bowling_team_id, innings.batting_team_id]
      );
    }
    req.io?.to(matchId).emit("innings_changed", { inningsNo: 2 });
  }

  if (isWicket) {
    req.io?.to(matchId).emit("wicket_fallen", {
      outBatsmanId: batsmanOutId,
      message: "Set new batsman",
    });
  }

  req.io?.to(matchId).emit("score_updated", {
    innings: updated.rows[0],
    ball: ball.rows[0],
    currentOver,
  });

  res.json({
    innings: updated.rows[0],
    ball: ball.rows[0],
    currentOver,
    ...(isWicket && { wicketFallen: true, message: "Set new batsman" }),
  });
}

export async function undoBall(req, res) {
  const { matchId } = req.params;
  const { inningsNo = 1 } = req.body;

  const inningsRes = await query(
    `SELECT * FROM innings WHERE match_id = $1 AND innings_no = $2`,
    [matchId, inningsNo]
  );
  const innings = inningsRes.rows[0];
  if (!innings) return res.status(404).json({ message: "Innings not found" });

  const last = await query(
    `SELECT * FROM balls WHERE innings_id = $1 ORDER BY id DESC LIMIT 1`,
    [innings.id]
  );
  const ball = last.rows[0];
  if (!ball) return res.status(400).json({ message: "No ball to undo" });

  await query(`DELETE FROM balls WHERE id = $1`, [ball.id]);

  // if the undone ball was a wicket, restore the batsman as striker
  const updated = await query(
    `UPDATE innings SET
       runs        = runs        - $1,
       wickets     = wickets     - $2,
       valid_balls = valid_balls - $3,
       extras      = extras      - $4,
       striker_id  = CASE WHEN $5 THEN $6 ELSE striker_id END
     WHERE id = $7
     RETURNING *`,
    [
      ball.runs_bat + ball.extra_runs,
      ball.is_wicket ? 1 : 0,
      ball.is_legal ? 1 : 0,
      ball.extra_runs,
      ball.is_wicket,
      ball.batsman_id,
      innings.id,
    ]
  );

  req.io?.to(matchId).emit("score_updated", { innings: updated.rows[0], undo: true });
  res.json({ innings: updated.rows[0], undo: true });
}

export async function scoreSummary(req, res) {
  const { matchId } = req.params;

  const innings = await query(
    `SELECT * FROM innings WHERE match_id = $1 ORDER BY innings_no`,
    [matchId]
  );

  // also fetch balls with player names joined so the frontend can build scorecards
  const balls = await query(
    `SELECT
       b.*,
       bat.name  AS batsman_name,
       bowl.name AS bowler_name
     FROM balls b
     JOIN innings i ON i.id = b.innings_id
     LEFT JOIN players bat  ON bat.id  = b.batsman_id
     LEFT JOIN players bowl ON bowl.id = b.bowler_id
     WHERE i.match_id = $1
     ORDER BY b.id`,
    [matchId]
  );

  const formatted = innings.rows.map((i) => ({
    ...i,
    overs: oversText(i.valid_balls),
    runRate: runRate(i.runs, i.valid_balls),
  }));

  res.json({ innings: formatted, balls: balls.rows });
}

export async function getMatchPlayers(req, res) {
  const { matchId } = req.params;

  const batting = await query(
    `SELECT p.id, p.name FROM players p
     JOIN match_players mp ON mp.player_id = p.id
     WHERE mp.match_id = $1 AND mp.role = 'batting'`,
    [matchId]
  );

  const bowling = await query(
    `SELECT p.id, p.name FROM players p
     JOIN match_players mp ON mp.player_id = p.id
     WHERE mp.match_id = $1 AND mp.role = 'bowling'`,
    [matchId]
  );

  res.json({ battingPlayers: batting.rows, bowlingPlayers: bowling.rows });
}
