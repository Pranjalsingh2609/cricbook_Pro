import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#071028] text-white">
        Loading...
      </div>
    );
  }

  const { matchData, summary } = data;

  const current = summary?.innings?.find(
    (i) => Number(i.innings_no) === Number(inningsNo),
  );

  const battingTeamName =
    current?.batting_team_name || current?.battingTeamName || "Batting";

  const secondInningsExists =
    summary?.innings?.some((i) => Number(i.innings_no) === 2) || false;

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen bg-cover bg-center bg-fixed relative"
        style={{
          backgroundImage:
            "url('https://t4.ftcdn.net/jpg/11/81/03/43/360_F_1181034352_8YUOBN0p62I9qrGodQsAmbpPlMynmEax.jpg')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#071028]/85 backdrop-blur-sm" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-5">
          {/* Match Header */}
          <div className="rounded-3xl bg-[#0d1735]/90 border border-slate-800 p-5 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <Trophy className="text-emerald-400" size={28} />
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                  {matchData.match.team_a_name}
                </h1>

                <p className="text-emerald-400 font-bold text-lg">VS</p>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                  {matchData.match.team_b_name}
                </h1>
              </div>
            </div>

            <p className="text-slate-400 capitalize">
              Status: {matchData.match.status}
            </p>

            {matchData.match.status === "completed" && (
              <div className="mt-5 rounded-2xl bg-emerald-500 p-4 text-center text-slate-950 font-black text-lg sm:text-2xl">
                🏆 Winner: {matchData.match.winner_team_name}
              </div>
            )}
          </div>

          {/* Start Match */}
          {matchData.match.status === "scheduled" && (
            <div className="rounded-3xl bg-[#0d1735]/90 border border-slate-800 p-5 sm:p-8 shadow-2xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
                Select Batting First
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
                  onClick={() => start(matchData.match.team_a_id)}
                >
                  {matchData.match.team_a_name}
                </button>

                <button
                  className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
                  onClick={() => start(matchData.match.team_b_id)}
                >
                  {matchData.match.team_b_name}
                </button>
              </div>
            </div>
          )}

          {/* Score */}
          <div className="rounded-3xl bg-[#0d1735]/90 border border-slate-800 p-5 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Batting Team */}
              <div className="text-center sm:text-left">
                <p className="text-slate-400 text-sm uppercase tracking-wider">
                  Batting
                </p>

                <h3 className="text-xl sm:text-3xl font-bold text-white">
                  {battingTeamName}
                </h3>
              </div>

              <div className="text-center">
                <h3 className="text-xl sm:text-3xl font-bold text-white mb-2">
                  {battingTeamName}
                </h3>

                <h2 className="text-5xl sm:text-7xl font-black text-emerald-400">
                  {current ? `${current.runs}/${current.wickets}` : "--/--"}
                </h2>

                <p className="text-lg sm:text-2xl text-white mt-2">
                  Overs: {current?.overs || "0.0"}
                </p>

                <p className="text-slate-400 mt-2">
                  Run Rate: {current?.runRate || "0.00"}
                  {current?.requiredRate &&
                    ` • Required RR: ${current.requiredRate}`}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-3xl bg-[#0d1735]/90 border border-slate-800 p-5 sm:p-8 shadow-2xl space-y-6">
            <select
              className="w-full sm:w-60 h-12 rounded-xl bg-[#111c40] border border-slate-700 px-4 text-white"
              value={inningsNo}
              onChange={(e) => setInningsNo(Number(e.target.value))}
            >
              <option value={1}>1st Innings</option>

              {secondInningsExists && <option value={2}>2nd Innings</option>}
            </select>

            {/* Runs */}
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {[0, 1, 2, 3, 4, 6].map((r) => (
                <button
                  key={r}
                  onClick={() => ball(r)}
                  className=" h-24 sm:h-28 md:h-32 rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-4xl sm:text-5xl shadow-lg transition active:scale-95 "
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Extras */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <button
                className=" h-20 sm:h-24 md:h-28 rounded-3xl bg-blue-500 hover:bg-blue-400 text-base sm:text-xl md:text-2xl font-bold shadow-Lg transition active:scale-95 "
                onClick={() => ball(0, 1, "wide")}
              >
                Wide Ball
              </button>

              <button
                className="
                    h-20 sm:h-24 md:h-28
                    rounded-3xl
                  bg-purple-500 hover:bg-purple-400
                    text-base sm:text-xl md:text-2xl
                    font-bold
                    shadow-lg
                    transition active:scale-95
                    "
                onClick={() => ball(0, 1, "no_ball")}
              >
                No Ball
              </button>
            </div>

            {/* Wicket / Undo */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <button
                className="
                    h-20 sm:h-24 md:h-28
                    rounded-3xl
                    bg-amber-500 hover:bg-amber-400
                    text-slate-950
                    text-base sm:text-xl md:text-2xl
                    font-bold
                    shadow-lg
                    transition active:scale-95
                   "
                onClick={() => ball(0, 0, null, true)}
              >
                Wicket
              </button>

              <button
                className=" h-20 sm:h-24 md:h-28 rounded-3xl bg-red-500 hover:bg-red-400 text-base sm:text-xl md:text-2xl font-bold shadow-lg transition active:scale-95 "
                onClick={undo}
              >
                Undo
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
