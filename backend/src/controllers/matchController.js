import { query } from "../config/db.js";
import {
  isLegalBall,
  oversText,
  runRate,
  requiredRate,
} from "../utils/score.js";


export async function getMatch(req, res) {
  const { id } = req.params;

  const match = await query(
    `
    SELECT m.*,
           ta.name AS team_a_name,
           tb.name AS team_b_name,
           wt.name AS winner_team_name
    FROM matches m
    JOIN teams ta ON ta.id = m.team_a_id
    JOIN teams tb ON tb.id = m.team_b_id
    LEFT JOIN teams wt ON wt.id = m.winner_team_id
    WHERE m.id = $1
    `,
    [id]
  );

  if (!match.rows[0])
    return res.status(404).json({ message: "Match not found" });

  const innings = await query(
    `SELECT * FROM innings WHERE match_id=$1 ORDER BY innings_no`,
    [id]
  );

  res.json({ match: match.rows[0], innings: innings.rows });
}


export async function startMatch(req, res) {
  const { id } = req.params;
  const { tossWinnerId, battingFirstTeamId } = req.body;

  const m = await query("SELECT * FROM matches WHERE id=$1", [id]);
  const match = m.rows[0];

  if (!match)
    return res.status(404).json({ message: "Match not found" });

  const bowlingTeamId =
    battingFirstTeamId === match.team_a_id
      ? match.team_b_id
      : match.team_a_id;

  await query(
    `
    UPDATE matches
    SET status='live',
        toss_winner_id=$1,
        batting_first_team_id=$2
    WHERE id=$3
    `,
    [tossWinnerId, battingFirstTeamId, id]
  );

  const inn = await query(
    `
    INSERT INTO innings(
      match_id,
      batting_team_id,
      bowling_team_id,
      innings_no,
      runs,
      wickets,
      valid_balls,
      extras
    )
    VALUES ($1,$2,$3,1,0,0,0,0)
    RETURNING *
    `,
    [id, battingFirstTeamId, bowlingTeamId]
  );

  res.json({ innings: inn.rows[0] });
}


export async function addBall(req, res) {
  const { matchId } = req.params;

  const {
    inningsNo = 1,
    batsmanId,
    bowlerId,
    batsmanOutId = null,
    runsBat = 0,
    extraRuns = 0,
    extraType = null,
    isWicket = false,
  } = req.body;

  const matchCheck = await query(
    "SELECT status FROM matches WHERE id=$1",
    [matchId]
  );

  if (matchCheck.rows[0]?.status === "completed") {
    return res.status(400).json({ message: "Match already completed" });
  }

  const inningsResult = await query(
    "SELECT * FROM innings WHERE match_id=$1 AND innings_no=$2",
    [matchId, inningsNo]
  );

  const innings = inningsResult.rows[0];

  if (!innings)
    return res.status(404).json({ message: "Innings not started" });

  const legal = isLegalBall(extraType);

  const nextBallNo = Number(innings.valid_balls) + (legal ? 1 : 0);

  const ball = await query(
    `
    INSERT INTO balls (
      innings_id,
      batsman_id,
      bowler_id,
      batsman_out_id,
      ball_no,
      runs_bat,
      extra_runs,
      extra_type,
      is_wicket,
      is_legal
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
    `,
    [
      innings.id,
      batsmanId,
      bowlerId,
      batsmanOutId,
      nextBallNo,
      runsBat,
      extraRuns,
      extraType,
      isWicket,
      legal,
    ]
  );

  /* ---------------- SCORE UPDATE ---------------- */
  const runs = Number(innings.runs) + runsBat + extraRuns;
  const wickets = Number(innings.wickets) + (isWicket ? 1 : 0);
  const validBalls = Number(innings.valid_balls) + (legal ? 1 : 0);
  const extras = Number(innings.extras) + extraRuns;

  const updated = await query(
    `
    UPDATE innings
    SET runs=$1,
        wickets=$2,
        valid_balls=$3,
        extras=$4
    WHERE id=$5
    RETURNING *
    `,
    [runs, wickets, validBalls, extras, innings.id]
  );

  const ballsRes = await query(
    `
    SELECT *
    FROM balls
    WHERE innings_id=$1
    ORDER BY id DESC
    LIMIT 12
    `,
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


  if (Number(inningsNo) === 2) {
    const first = await query(
      `SELECT * FROM innings WHERE match_id=$1 AND innings_no=1`,
      [matchId]
    );

    const target = first.rows[0]?.runs + 1;

    if (target && runs >= target) {
      await query(
        `
        UPDATE matches
        SET status='completed',
            winner_team_id=$1
        WHERE id=$2
        `,
        [innings.batting_team_id, matchId]
      );

      req.io?.to(matchId).emit("match_completed", {
        matchId,
        winnerTeamId: innings.batting_team_id,
      });

      return res.json({
        innings: updated.rows[0],
        ball: ball.rows[0],
        matchCompleted: true,
      });
    }
  }

 
  const matchInfo = await query(
    `SELECT m.*, t.overs
     FROM matches m
     JOIN tournaments t ON t.id=m.tournament_id
     WHERE m.id=$1`,
    [matchId]
  );

  const ballsLimit = Number(matchInfo.rows[0].overs) * 6;

  const inningsFinished =
    validBalls >= ballsLimit || wickets >= 10;

  
  if (inningsFinished) {
    if (Number(inningsNo) === 1) {
      const exists = await query(
        `SELECT * FROM innings WHERE match_id=$1 AND innings_no=2`,
        [matchId]
      );

      if (!exists.rows.length) {
        await query(
          `INSERT INTO innings(
            match_id,
            batting_team_id,
            bowling_team_id,
            innings_no,
            runs,
            wickets,
            valid_balls,
            extras
          )
          VALUES ($1,$2,$3,2,0,0,0,0)`,
          [
            matchId,
            innings.bowling_team_id,
            innings.batting_team_id,
          ]
        );
      }

      req.io?.to(matchId).emit("innings_changed", {
        inningsNo: 2,
      });
    }
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
  });
}


export async function undoBall(req, res) {
  const { matchId } = req.params;
  const { inningsNo = 1 } = req.body;

  const inningsRes = await query(
    `SELECT * FROM innings WHERE match_id=$1 AND innings_no=$2`,
    [matchId, inningsNo]
  );

  const innings = inningsRes.rows[0];

  if (!innings)
    return res.status(404).json({ message: "Innings not found" });

  const last = await query(
    `SELECT * FROM balls
     WHERE innings_id=$1
     ORDER BY id DESC
     LIMIT 1`,
    [innings.id]
  );

  const ball = last.rows[0];

  if (!ball)
    return res.status(400).json({ message: "No ball to undo" });

  await query(`DELETE FROM balls WHERE id=$1`, [ball.id]);

  const updated = await query(
    `
    UPDATE innings
    SET runs = runs - $1,
        wickets = wickets - $2,
        valid_balls = valid_balls - $3,
        extras = extras - $4
    WHERE id=$5
    RETURNING *
    `,
    [
      ball.runs_bat + ball.extra_runs,
      ball.is_wicket ? 1 : 0,
      ball.is_legal ? 1 : 0,
      ball.extra_runs,
      innings.id,
    ]
  );

  req.io?.to(matchId).emit("score_updated", {
    innings: updated.rows[0],
    undo: true,
  });

  res.json({ innings: updated.rows[0], undo: true });
}

export async function scoreSummary(req, res) {
  const { matchId } = req.params;

  const innings = await query(
    `SELECT * FROM innings WHERE match_id=$1 ORDER BY innings_no`,
    [matchId]
  );

  const formatted = innings.rows.map((i) => ({
    ...i,
    overs: oversText(i.valid_balls),
    runRate: runRate(i.runs, i.valid_balls),
  }));

  res.json({ innings: formatted });
}


export async function getMatchPlayers(req, res) {
  const { matchId } = req.params;

  const batting = await query(
    `
    SELECT p.id, p.name
    FROM players p
    JOIN match_players mp ON mp.player_id = p.id
    WHERE mp.match_id=$1 AND mp.role='batting'
    `,
    [matchId]
  );

  const bowling = await query(
    `
    SELECT p.id, p.name
    FROM players p
    JOIN match_players mp ON mp.player_id = p.id
    WHERE mp.match_id=$1 AND mp.role='bowling'
    `,
    [matchId]
  );

  res.json({
    battingPlayers: batting.rows,
    bowlingPlayers: bowling.rows,
  });
}