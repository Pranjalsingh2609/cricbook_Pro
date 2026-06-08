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
SELECT
  m.*,
  ta.name AS team_a_name,
  tb.name AS team_b_name,
  wt.name AS winner_team_name
FROM matches m
JOIN teams ta ON ta.id = m.team_a_id
JOIN teams tb ON tb.id = m.team_b_id
LEFT JOIN teams wt ON wt.id = m.winner_team_id
WHERE m.id = $1
`,
    [id],
  );
  if (!match.rows[0])
    return res.status(404).json({ message: "Match not found" });
  const innings = await query(
    "SELECT * FROM innings WHERE match_id=$1 ORDER BY innings_no",
    [id],
  );
  res.json({ match: match.rows[0], innings: innings.rows });
}

export async function startMatch(req, res) {
  const { id } = req.params;
  const { tossWinnerId, battingFirstTeamId } = req.body;
  const m = await query("SELECT * FROM matches WHERE id=$1", [id]);
  const match = m.rows[0];
  if (!match) return res.status(404).json({ message: "Match not found" });
  const bowlingTeamId =
    battingFirstTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;
  await query(
    "UPDATE matches SET status=$1,toss_winner_id=$2,batting_first_team_id=$3 WHERE id=$4",
    ["live", tossWinnerId, battingFirstTeamId, id],
  );
  const inn = await query(
    "INSERT INTO innings(match_id,batting_team_id,bowling_team_id,innings_no) VALUES($1,$2,$3,1) ON CONFLICT(match_id, innings_no) DO UPDATE SET batting_team_id=$2 RETURNING *",
    [id, battingFirstTeamId, bowlingTeamId],
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
    wicketType = null,
    note = "",
  } = req.body;

  // Prevent scoring after completion
  const matchCheck = await query("SELECT status FROM matches WHERE id=$1", [
    matchId,
  ]);

  if (matchCheck.rows[0]?.status === "completed") {
    return res.status(400).json({
      message: "Match already completed",
    });
  }

  const inningsResult = await query(
    "SELECT * FROM innings WHERE match_id=$1 AND innings_no=$2",
    [matchId, inningsNo],
  );

  const innings = inningsResult.rows[0];

  if (!innings) {
    return res.status(404).json({
      message: "Innings not started",
    });
  }

  const legal = isLegalBall(extraType);

  const nextBallNo = Number(innings.valid_balls) + (legal ? 1 : 0);

  const ball = await query(
    `
  INSERT INTO balls
  (
    innings_id,
    batsman_id,
    bowler_id,
    batsman_out_id,
    ball_no,
    runs_bat,
    extra_runs,
    extra_type,
    is_wicket,
    wicket_type,
    is_legal,
    note
  )
  VALUES
  (
    $1,$2,$3,$4,
    $5,$6,$7,$8,
    $9,$10,$11,$12
  )
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
      wicketType,
      legal,
      note,
    ],
  );

  await query(
    `
  INSERT INTO batting_scorecards
  (
    innings_id,
    player_id,
    runs,
    balls,
    fours,
    sixes
  )
  VALUES
  (
    $1,
    $2,
    $3,
    CASE WHEN $4 THEN 1 ELSE 0 END,
    CASE WHEN $3 = 4 THEN 1 ELSE 0 END,
    CASE WHEN $3 = 6 THEN 1 ELSE 0 END
  )
  ON CONFLICT (innings_id, player_id)
  DO UPDATE SET
    runs = batting_scorecards.runs + $3,
    balls = batting_scorecards.balls +
      CASE WHEN $4 THEN 1 ELSE 0 END,
    fours = batting_scorecards.fours +
      CASE WHEN $3 = 4 THEN 1 ELSE 0 END,
    sixes = batting_scorecards.sixes +
      CASE WHEN $3 = 6 THEN 1 ELSE 0 END
  `,
    [innings.id, batsmanId, runsBat, legal],
  );

  await query(
    `
  INSERT INTO bowling_scorecards
  (
    innings_id,
    player_id,
    balls,
    runs_conceded,
    wickets
  )
  VALUES
  (
    $1,
    $2,
    CASE WHEN $3 THEN 1 ELSE 0 END,
    $4,
    CASE WHEN $5 THEN 1 ELSE 0 END
  )
  ON CONFLICT (innings_id, player_id)
  DO UPDATE SET
    balls = bowling_scorecards.balls +
      CASE WHEN $3 THEN 1 ELSE 0 END,

    runs_conceded =
      bowling_scorecards.runs_conceded + $4,

    wickets =
      bowling_scorecards.wickets +
      CASE WHEN $5 THEN 1 ELSE 0 END
  `,
    [innings.id, bowlerId, legal, runsBat + extraRuns, isWicket],
  );

  const runs = Number(innings.runs) + Number(runsBat) + Number(extraRuns);

  const wickets = Number(innings.wickets) + (isWicket ? 1 : 0);

  const validBalls = Number(innings.valid_balls) + (legal ? 1 : 0);

  const extras = Number(innings.extras) + Number(extraRuns);

  const updated = await query(
    `UPDATE innings
     SET runs=$1,
         wickets=$2,
         valid_balls=$3,
         extras=$4
     WHERE id=$5
     RETURNING *`,
    [runs, wickets, validBalls, extras, innings.id],
  );

  // SECOND INNINGS CHASE CHECK

  if (Number(inningsNo) === 2) {
    const firstInningsResult = await query(
      `SELECT *
       FROM innings
       WHERE match_id=$1
         AND innings_no=1`,
      [matchId],
    );

    const firstInnings = firstInningsResult.rows[0];

    if (firstInnings) {
      const target = Number(firstInnings.runs) + 1;

      if (runs >= target) {
        await query(
          `UPDATE matches
           SET status='completed',
               winner_team_id=$1
           WHERE id=$2`,
          [innings.batting_team_id, matchId],
        );

        req.io?.to(matchId).emit("match_completed", {
          matchId,
          winnerTeamId: innings.batting_team_id,
        });

        return res.status(201).json({
          innings: updated.rows[0],
          ball: ball.rows[0],
          matchCompleted: true,
          winnerTeamId: innings.batting_team_id,
        });
      }
    }
  }

  // OVERS LIMIT

  const matchResult = await query(
    `SELECT m.*, t.overs
     FROM matches m
     JOIN tournaments t
       ON t.id = m.tournament_id
     WHERE m.id = $1`,
    [matchId],
  );

  const match = matchResult.rows[0];

  const ballsLimit = Number(match.overs) * 6;

  const inningsFinished = validBalls >= ballsLimit || wickets >= 10;

  // INNINGS COMPLETE

  if (inningsFinished) {
    // FIRST INNINGS COMPLETE
    if (Number(inningsNo) === 1) {
      const secondInnings = await query(
        `SELECT *
           FROM innings
           WHERE match_id=$1
             AND innings_no=2`,
        [matchId],
      );

      if (!secondInnings.rows.length) {
        await query(
          `INSERT INTO innings
          (
            match_id,
            batting_team_id,
            bowling_team_id,
            innings_no
          )
          VALUES ($1,$2,$3,2)`,
          [matchId, innings.bowling_team_id, innings.batting_team_id],
        );
      }

      req.io?.to(matchId).emit("innings_changed", {
        inningsNo: 2,
      });
    } else {
      // SECOND INNINGS COMPLETE

      const firstInningsResult = await query(
        `SELECT *
           FROM innings
           WHERE match_id=$1
             AND innings_no=1`,
        [matchId],
      );

      const first = firstInningsResult.rows[0];

      let winnerTeamId = null;

      if (first) {
        if (first.runs > runs) {
          winnerTeamId = first.batting_team_id;
        } else if (runs > first.runs) {
          winnerTeamId = innings.batting_team_id;
        }
      }

      await query(
        `UPDATE matches
         SET status='completed',
             winner_team_id=$1
         WHERE id=$2`,
        [winnerTeamId, matchId],
      );

      req.io?.to(matchId).emit("match_completed", {
        matchId,
        winnerTeamId,
      });
    }
  }

  req.io?.to(matchId).emit("score_updated", {
    innings: updated.rows[0],
    ball: ball.rows[0],
  });

  return res.status(201).json({
    innings: updated.rows[0],
    ball: ball.rows[0],
  });
}

export async function undoBall(req, res) {
  const { matchId } = req.params;
  const { inningsNo = 1 } = req.body;
  const inningsResult = await query(
    "SELECT * FROM innings WHERE match_id=$1 AND innings_no=$2",
    [matchId, inningsNo],
  );
  const innings = inningsResult.rows[0];
  if (!innings) return res.status(404).json({ message: "Innings not started" });

  const last = await query(
    "SELECT * FROM balls WHERE innings_id=$1 ORDER BY created_at DESC LIMIT 1",
    [innings.id],
  );
  const ball = last.rows[0];

  if (!ball) {
    return res.status(400).json({
      message: "No ball to undo",
    });
  }

  const battingRuns = ball.runs_bat;
  const legalBall = ball.is_legal;

  if (ball.batsman_id) {
    await query(
      `
    UPDATE batting_scorecards
    SET
      runs = GREATEST(0, runs - $1),
      balls = GREATEST(
        0,
        balls - CASE WHEN $2 THEN 1 ELSE 0 END
      ),
      fours = GREATEST(
        0,
        fours - CASE WHEN $1 = 4 THEN 1 ELSE 0 END
      ),
      sixes = GREATEST(
        0,
        sixes - CASE WHEN $1 = 6 THEN 1 ELSE 0 END
      )
    WHERE innings_id=$3
      AND player_id=$4
    `,
      [battingRuns, legalBall, innings.id, ball.batsman_id],
    );
  }

  if (ball.bowler_id) {
    await query(
      `
    UPDATE bowling_scorecards
    SET
      balls = GREATEST(
        0,
        balls - CASE WHEN $1 THEN 1 ELSE 0 END
      ),

      runs_conceded = GREATEST(
        0,
        runs_conceded - $2
      ),

      wickets = GREATEST(
        0,
        wickets - CASE WHEN $3 THEN 1 ELSE 0 END
      )
    WHERE innings_id=$4
      AND player_id=$5
    `,
      [
        legalBall,
        ball.runs_bat + ball.extra_runs,
        ball.is_wicket,
        innings.id,
        ball.bowler_id,
      ],
    );
  }

  await query("DELETE FROM balls WHERE id=$1", [ball.id]);
  const updated = await query(
    "UPDATE innings SET runs=runs-$1,wickets=wickets-$2,valid_balls=valid_balls-$3,extras=extras-$4 WHERE id=$5 RETURNING *",
    [
      ball.runs_bat + ball.extra_runs,
      ball.is_wicket ? 1 : 0,
      ball.is_legal ? 1 : 0,
      ball.extra_runs,
      innings.id,
    ],
  );
  req.io
    ?.to(matchId)
    .emit("score_updated", { innings: updated.rows[0], undo: true });
  res.json({ innings: updated.rows[0] });
}

export async function getScorecard(req, res) {
  const { matchId } = req.params;

  const batting = await query(
    `
    SELECT
      p.name,
      b.runs,
      b.balls,
      b.fours,
      b.sixes,
      ROUND(
        CASE
          WHEN b.balls = 0 THEN 0
          ELSE (b.runs::numeric * 100) / b.balls
        END,
        2
      ) AS strike_rate
    FROM batting_scorecards b
    JOIN players p
      ON p.id = b.player_id
    JOIN innings i
      ON i.id = b.innings_id
    WHERE i.match_id = $1
    ORDER BY b.runs DESC
  `,
    [matchId],
  );

  const bowling = await query(
    `
    SELECT
      p.name,
      bo.balls,
      bo.runs_conceded,
      bo.wickets,

      CONCAT(
        FLOOR(bo.balls / 6),
        '.',
        bo.balls % 6
      ) AS overs,

      ROUND(
        CASE
          WHEN bo.balls = 0 THEN 0
          ELSE
            (bo.runs_conceded::numeric * 6)
            / bo.balls
        END,
        2
      ) AS economy

    FROM bowling_scorecards bo
    JOIN players p
      ON p.id = bo.player_id
    JOIN innings i
      ON i.id = bo.innings_id
    WHERE i.match_id = $1
    ORDER BY bo.wickets DESC
  `,
    [matchId],
  );

  res.json({
    batting: batting.rows,
    bowling: bowling.rows,
  });
}

export async function scoreSummary(req, res) {
  const { matchId } = req.params;
  const tournament = await query(
    "SELECT t.overs FROM matches m JOIN tournaments t ON t.id=m.tournament_id WHERE m.id=$1",
    [matchId],
  );
  const oversLimit = tournament.rows[0]?.overs || 20;
  const innings = await query(
    "SELECT * FROM innings WHERE match_id=$1 ORDER BY innings_no",
    [matchId],
  );
  const first = innings.rows[0];
  const second = innings.rows[1];
  const target = first ? first.runs + 1 : null;
  const ballsLimit = oversLimit * 6;
  res.json({
    oversLimit,
    innings: innings.rows.map((i) => ({
      ...i,
      overs: oversText(i.valid_balls),
      runRate: runRate(i.runs, i.valid_balls),
      requiredRate:
        i.innings_no === 2 && target
          ? requiredRate(target, i.runs, ballsLimit - i.valid_balls)
          : null,
    })),
    target,
  });
}
