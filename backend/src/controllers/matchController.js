import { query } from '../config/db.js';
import { isLegalBall, oversText, runRate, requiredRate } from '../utils/score.js';

export async function getMatch(req, res) {
  const { id } = req.params;
  const match = await query(`SELECT m.*, ta.name AS team_a_name, tb.name AS team_b_name
    FROM matches m JOIN teams ta ON ta.id=m.team_a_id JOIN teams tb ON tb.id=m.team_b_id WHERE m.id=$1`, [id]);
  if (!match.rows[0]) return res.status(404).json({ message: 'Match not found' });
  const innings = await query('SELECT * FROM innings WHERE match_id=$1 ORDER BY innings_no', [id]);
  res.json({ match: match.rows[0], innings: innings.rows });
}

export async function startMatch(req, res) {
  const { id } = req.params;
  const { tossWinnerId, battingFirstTeamId } = req.body;
  const m = await query('SELECT * FROM matches WHERE id=$1', [id]);
  const match = m.rows[0];
  if (!match) return res.status(404).json({ message: 'Match not found' });
  const bowlingTeamId = battingFirstTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;
  await query('UPDATE matches SET status=$1,toss_winner_id=$2,batting_first_team_id=$3 WHERE id=$4', ['live', tossWinnerId, battingFirstTeamId, id]);
  const inn = await query('INSERT INTO innings(match_id,batting_team_id,bowling_team_id,innings_no) VALUES($1,$2,$3,1) ON CONFLICT(match_id, innings_no) DO UPDATE SET batting_team_id=$2 RETURNING *', [id, battingFirstTeamId, bowlingTeamId]);
  res.json({ innings: inn.rows[0] });
}

export async function addBall(req, res) {
  const { matchId } = req.params;

  const {
    inningsNo = 1,
    runsBat = 0,
    extraRuns = 0,
    extraType = null,
    isWicket = false,
    wicketType = null,
    note = '',
  } = req.body;

  // Prevent scoring after completion
  const matchCheck = await query(
    'SELECT status FROM matches WHERE id=$1',
    [matchId]
  );

  if (matchCheck.rows[0]?.status === 'completed') {
    return res.status(400).json({
      message: 'Match already completed',
    });
  }

  const inningsResult = await query(
    'SELECT * FROM innings WHERE match_id=$1 AND innings_no=$2',
    [matchId, inningsNo]
  );

  const innings = inningsResult.rows[0];

  if (!innings) {
    return res.status(404).json({
      message: 'Innings not started',
    });
  }

  const legal = isLegalBall(extraType);

  const nextBallNo =
    Number(innings.valid_balls) + (legal ? 1 : 0);

  const ball = await query(
    `INSERT INTO balls
    (
      innings_id,
      ball_no,
      runs_bat,
      extra_runs,
      extra_type,
      is_wicket,
      wicket_type,
      is_legal,
      note
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      innings.id,
      nextBallNo,
      runsBat,
      extraRuns,
      extraType,
      isWicket,
      wicketType,
      legal,
      note,
    ]
  );

  const runs =
    Number(innings.runs) +
    Number(runsBat) +
    Number(extraRuns);

  const wickets =
    Number(innings.wickets) +
    (isWicket ? 1 : 0);

  const validBalls =
    Number(innings.valid_balls) +
    (legal ? 1 : 0);

  const extras =
    Number(innings.extras) +
    Number(extraRuns);

  const updated = await query(
    `UPDATE innings
     SET runs=$1,
         wickets=$2,
         valid_balls=$3,
         extras=$4
     WHERE id=$5
     RETURNING *`,
    [
      runs,
      wickets,
      validBalls,
      extras,
      innings.id,
    ]
  );

  // =========================
  // SECOND INNINGS CHASE CHECK
  // =========================
  if (Number(inningsNo) === 2) {

    const firstInningsResult = await query(
      `SELECT *
       FROM innings
       WHERE match_id=$1
         AND innings_no=1`,
      [matchId]
    );

    const firstInnings = firstInningsResult.rows[0];

    if (firstInnings) {

      const target =
        Number(firstInnings.runs) + 1;

      if (runs >= target) {

        await query(
          `UPDATE matches
           SET status='completed',
               winner_team_id=$1
           WHERE id=$2`,
          [
            innings.batting_team_id,
            matchId,
          ]
        );

        req.io?.to(matchId).emit(
          'match_completed',
          {
            matchId,
            winnerTeamId:
              innings.batting_team_id,
          }
        );

        return res.status(201).json({
          innings: updated.rows[0],
          ball: ball.rows[0],
          matchCompleted: true,
          winnerTeamId:
            innings.batting_team_id,
        });
      }
    }
  }

  // =========================
  // OVERS LIMIT
  // =========================
  const matchResult = await query(
    `SELECT m.*, t.overs
     FROM matches m
     JOIN tournaments t
       ON t.id = m.tournament_id
     WHERE m.id = $1`,
    [matchId]
  );

  const match = matchResult.rows[0];

  const ballsLimit =
    Number(match.overs) * 6;

  const inningsFinished =
    validBalls >= ballsLimit ||
    wickets >= 10;

  // =========================
  // INNINGS COMPLETE
  // =========================
  if (inningsFinished) {

    // FIRST INNINGS COMPLETE
    if (Number(inningsNo) === 1) {

      const secondInnings =
        await query(
          `SELECT *
           FROM innings
           WHERE match_id=$1
             AND innings_no=2`,
          [matchId]
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
          [
            matchId,
            innings.bowling_team_id,
            innings.batting_team_id,
          ]
        );
      }

      req.io?.to(matchId).emit(
        'innings_changed',
        {
          inningsNo: 2,
        }
      );

    } else {

      // SECOND INNINGS COMPLETE

      const firstInningsResult =
        await query(
          `SELECT *
           FROM innings
           WHERE match_id=$1
             AND innings_no=1`,
          [matchId]
        );

      const first =
        firstInningsResult.rows[0];

      let winnerTeamId = null;

      if (first) {

        if (first.runs > runs) {
          winnerTeamId =
            first.batting_team_id;
        }
        else if (runs > first.runs) {
          winnerTeamId =
            innings.batting_team_id;
        }
      }

      await query(
        `UPDATE matches
         SET status='completed',
             winner_team_id=$1
         WHERE id=$2`,
        [
          winnerTeamId,
          matchId,
        ]
      );

      req.io?.to(matchId).emit(
        'match_completed',
        {
          matchId,
          winnerTeamId,
        }
      );
    }
  }

  req.io?.to(matchId).emit(
    'score_updated',
    {
      innings: updated.rows[0],
      ball: ball.rows[0],
    }
  );

  return res.status(201).json({
    innings: updated.rows[0],
    ball: ball.rows[0],
  });
}

export async function undoBall(req, res) {
  const { matchId } = req.params;
  const { inningsNo = 1 } = req.body;
  const inningsResult = await query('SELECT * FROM innings WHERE match_id=$1 AND innings_no=$2', [matchId, inningsNo]);
  const innings = inningsResult.rows[0];
  if (!innings) return res.status(404).json({ message: 'Innings not started' });

  const last = await query('SELECT * FROM balls WHERE innings_id=$1 ORDER BY created_at DESC LIMIT 1', [innings.id]);
  const ball = last.rows[0];
  if (!ball) return res.status(400).json({ message: 'No ball to undo' });

  await query('DELETE FROM balls WHERE id=$1', [ball.id]);
  const updated = await query(
    'UPDATE innings SET runs=runs-$1,wickets=wickets-$2,valid_balls=valid_balls-$3,extras=extras-$4 WHERE id=$5 RETURNING *',
    [ball.runs_bat + ball.extra_runs, ball.is_wicket ? 1 : 0, ball.is_legal ? 1 : 0, ball.extra_runs, innings.id]
  );
  req.io?.to(matchId).emit('score_updated', { innings: updated.rows[0], undo: true });
  res.json({ innings: updated.rows[0] });
}

export async function scoreSummary(req, res) {
  const { matchId } = req.params;
  const tournament = await query('SELECT t.overs FROM matches m JOIN tournaments t ON t.id=m.tournament_id WHERE m.id=$1', [matchId]);
  const oversLimit = tournament.rows[0]?.overs || 20;
  const innings = await query('SELECT * FROM innings WHERE match_id=$1 ORDER BY innings_no', [matchId]);
  const first = innings.rows[0];
  const second = innings.rows[1];
  const target = first ? first.runs + 1 : null;
  const ballsLimit = oversLimit * 6;
  res.json({
    oversLimit,
    innings: innings.rows.map(i => ({
      ...i,
      overs: oversText(i.valid_balls),
      runRate: runRate(i.runs, i.valid_balls),
      requiredRate: i.innings_no === 2 && target ? requiredRate(target, i.runs, ballsLimit - i.valid_balls) : null
    })),
    target
  });
}
