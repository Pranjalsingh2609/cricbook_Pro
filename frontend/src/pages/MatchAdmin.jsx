import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function MatchAdmin() {
  const { id } = useParams();
  const [inningsNo, setInningsNo] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["match-admin", id],
    queryFn: async () => {
      const [matchRes, summaryRes] = await Promise.all([
        api.get(`/matches/${id}`),
        api.get(`/matches/${id}/summary`),
      ]);

      return {
        matchData: matchRes.data,
        summary: summaryRes.data,
      };
    },
    enabled: !!id,
  });

  async function start(teamId) {
    await api.post(`/matches/${id}/start`, {
      tossWinnerId: teamId,
      battingFirstTeamId: teamId,
    });

    refetch();
  }

  async function ball(
    runsBat,
    extraRuns = 0,
    extraType = null,
    isWicket = false,
  ) {
    await api.post(`/matches/${id}/ball`, {
      inningsNo: Number(inningsNo),
      runsBat,
      extraRuns,
      extraType,
      isWicket,
    });

    refetch();
  }

  async function undo() {
    await api.post(`/matches/${id}/undo`, {
      inningsNo: Number(inningsNo),
    });

    refetch();
  }

  if (isLoading || !data) {
    return <p className="p-6">Loading...</p>;
  }

  const { matchData, summary } = data;

  const current = summary?.innings?.find(
    (i) => Number(i.innings_no) === Number(inningsNo),
  );

  const secondInningsExists =
    summary?.innings?.some((i) => Number(i.innings_no) === 2) || false;

  return (
    <>
      <Navbar />

      <main className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        <div className="card">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {matchData.match.team_a_name} vs {matchData.match.team_b_name}
          </h1>

          <p className="text-slate-400">Status: {matchData.match.status}</p>

          {matchData.match.status === "completed" && (
            <div className="mt-4 rounded-xl bg-green-600 p-4 text-white text-xl font-bold">
              🏆 Winner: {matchData.match.winner_team_name}
            </div>
          )}
        </div>

        {matchData.match.status === "scheduled" && (
          <div className="card">
            <h2 className="text-xl font-bold mb-3">
              Start Match - Select Batting First
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="btn"
                onClick={() => start(matchData.match.team_a_id)}
              >
                {matchData.match.team_a_name}
              </button>

              <button
                className="btn"
                onClick={() => start(matchData.match.team_b_id)}
              >
                {matchData.match.team_b_name}
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-xl sm:text-2xl font-bold">
            Score:{" "}
            {current
              ? `${current.runs}/${current.wickets} (${current.overs})`
              : "Not started"}
          </h2>

          <p className="text-slate-400">
            Run Rate: {current?.runRate || "0.00"}
            {current?.requiredRate && ` • Required: ${current.requiredRate}`}
          </p>
        </div>

        <div className="card space-y-4">
          <select
            className="input max-w-xs"
            value={inningsNo}
            onChange={(e) => setInningsNo(Number(e.target.value))}
          >
            <option value={1}>1st Innings</option>

            {secondInningsExists && <option value={2}>2nd Innings</option>}
          </select>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <button key={r} className="btn" onClick={() => ball(r)}>
                {r}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="btn" onClick={() => ball(0, 1, "wide")}>
              Wide +1
            </button>

            <button className="btn" onClick={() => ball(0, 1, "no_ball")}>
              No Ball +1
            </button>

            <button className="btn" onClick={() => ball(0, 0, null, true)}>
              Wicket
            </button>

            <button
              className="rounded-lg bg-red-500 px-4 py-2 font-bold"
              onClick={undo}
            >
              Undo
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
