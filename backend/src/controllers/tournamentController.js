import { z } from "zod";
import { query } from "../config/db.js";
import {
  generateLeagueFixtures,
  generateKnockoutFixtures,
} from "../utils/fixtures.js";

const createSchema = z.object({
  name: z.string().min(2),
  mode: z.enum(["single", "league", "knockout", "league_knockout", "custom"]),
  overs: z.number().int().positive(),
  teams: z
    .array(
      z.object({
        name: z.string().min(2),
        shortName: z.string().optional(),
      }),
    )
    .min(2),
});

export async function createTournament(req, res) {
  const data = createSchema.parse(req.body);
  const t = await query(
    "INSERT INTO tournaments(user_id,name,mode,overs,status) VALUES($1,$2,$3,$4,$5) RETURNING *",
    [req.user.id, data.name, data.mode, data.overs, "draft"],
  );
  const tournament = t.rows[0];

  const createdTeams = [];
  for (const team of data.teams) {
    const r = await query(
      "INSERT INTO teams(tournament_id,name,short_name) VALUES($1,$2,$3) RETURNING *",
      [
        tournament.id,
        team.name,
        team.shortName || team.name.slice(0, 3).toUpperCase(),
      ],
    );
    createdTeams.push(r.rows[0]);
  }

  res.status(201).json({ tournament, teams: createdTeams });
}

export async function listTournaments(req, res) {
  const result = await query(
    "SELECT * FROM tournaments WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id],
  );
  res.json(result.rows);
}

export async function getTournament(req, res) {
  const { id } = req.params;
  const t = await query(
    "SELECT * FROM tournaments WHERE id=$1 AND user_id=$2",
    [id, req.user.id],
  );
  if (!t.rows[0])
    return res.status(404).json({ message: "Tournament not found" });
  const teams = await query(
    "SELECT *, ROUND(((runs_for/NULLIF(balls_for,0))*6 - (runs_against/NULLIF(balls_against,0))*6)::numeric, 3) AS nrr FROM teams WHERE tournament_id=$1 ORDER BY points DESC, nrr DESC NULLS LAST",
    [id],
  );
  const matches = await query(
    `SELECT m.*, ta.name AS team_a_name, tb.name AS team_b_name, tw.name AS winner_name
    FROM matches m
    JOIN teams ta ON ta.id=m.team_a_id
    JOIN teams tb ON tb.id=m.team_b_id
    LEFT JOIN teams tw ON tw.id=m.winner_team_id
    WHERE m.tournament_id=$1 ORDER BY m.match_no`,
    [id],
  );
  res.json({ tournament: t.rows[0], teams: teams.rows, matches: matches.rows });
}

export async function deleteTournament(req, res) {
  try {
    const { id } = req.params;

    const tournament = await query(
      "SELECT * FROM tournaments WHERE id=$1 AND user_id=$2",
      [id, req.user.id],
    );

    if (!tournament.rows[0]) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    /*
      Delete child records first
    */

    await query("DELETE FROM matches WHERE tournament_id=$1", [id]);

    await query("DELETE FROM teams WHERE tournament_id=$1", [id]);

    await query("DELETE FROM tournaments WHERE id=$1", [id]);

    res.json({
      success: true,
      message: "Tournament deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to delete tournament",
    });
  }
}

export async function generateFixtures(req, res) {
  const { id } = req.params;
  const { random = true } = req.body;
  const tournamentResult = await query(
    "SELECT * FROM tournaments WHERE id=$1 AND user_id=$2",
    [id, req.user.id],
  );
  const tournament = tournamentResult.rows[0];
  if (!tournament)
    return res.status(404).json({ message: "Tournament not found" });

  await query("DELETE FROM matches WHERE tournament_id=$1", [id]);
  const teamResult = await query(
    "SELECT id FROM teams WHERE tournament_id=$1",
    [id],
  );
  const teamIds = teamResult.rows.map((t) => t.id);

  let fixtures = [];
  if (tournament.mode === "single")
    fixtures = [
      {
        teamA: teamIds[0],
        teamB: teamIds[1],
        roundName: "Single Match",
        matchNo: 1,
      },
    ];
  else if (tournament.mode === "knockout")
    fixtures = generateKnockoutFixtures(teamIds, random);
  else fixtures = generateLeagueFixtures(teamIds, random);

  const inserted = [];
  for (const f of fixtures) {
    const r = await query(
      "INSERT INTO matches(tournament_id,team_a_id,team_b_id,round_name,match_no,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
      [id, f.teamA, f.teamB, f.roundName, f.matchNo, "scheduled"],
    );
    inserted.push(r.rows[0]);
  }
  await query("UPDATE tournaments SET status=$1 WHERE id=$2", ["active", id]);
  res.json({ fixtures: inserted });
}
