import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";

import Navbar from "../components/Navbar";
import { api } from "../api/client";

/* ================= OVER GROUPING ================= */
function groupOvers(balls = []) {
  const overs = {};
  let overIndex = 1;
  let ballCount = 0;

  balls.forEach((b) => {
    if (!overs[overIndex]) overs[overIndex] = [];

    const value = b.is_wicket
      ? "W"
      : b.extra_type === "wide"
        ? "Wd"
        : b.extra_type === "no_ball"
          ? "Nb"
          : b.runs_bat;

    overs[overIndex].push(value);

    if (b.is_legal) ballCount++;

    if (ballCount === 6) {
      overIndex++;
      ballCount = 0;
    }
  });

  return overs;
}

export default function MatchAdmin() {
  const { id } = useParams();

  /* ================= STATE ================= */
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");
  const [nextBatsman, setNextBatsman] = useState("");

  /* ================= DATA ================= */
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



  /* ================= MEMO (FIXED DEPENDENCY ISSUE) ================= */
  const overs = useMemo(() => {
    return groupOvers(data?.summary?.balls || []);
  }, [data?.summary?.balls]);

  /* ================= ACTIONS ================= */
  async function ball(
    runsBat,
    extraRuns = 0,
    extraType = null,
    isWicket = false,
  ) {
    if (!striker || !bowler) {
      return alert("Select striker and bowler");
    }

    await api.post(`/matches/${id}/ball`, {
      inningsNo: 1, // FIXED (was invalid {1})
      batsmanId: Number(striker),
      bowlerId: Number(bowler),
      batsmanOutId: isWicket ? Number(striker) : null,
      runsBat,
      extraRuns,
      extraType,
      isWicket,
    });

    refetch();
  }

  async function undo() {
    await api.post(`/matches/${id}/undo`, {
      inningsNo: 1, // FIXED (was invalid {1})
    });

    refetch();
  }

  /* ================= LOADING ================= */
  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#071028]">
        Loading...
      </div>
    );
  }

  const { matchData, summary } = data;

  const current = summary?.innings?.find(
    (i) => Number(i.innings_no) === Number(1),
  );

  /* ================= UI ================= */
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#071028] text-white px-3 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* HEADER */}
          <div className="bg-[#0d1735] p-4 sm:p-6 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Trophy className="text-emerald-400" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {matchData.match.team_a_name} vs {matchData.match.team_b_name}
              </h1>
              <p className="text-slate-400 text-sm">
                Status: {matchData.match.status}
              </p>
            </div>
          </div>

          {/* SCORE */}
          <div className="bg-[#0d1735] p-5 sm:p-6 rounded-2xl border border-slate-800 text-center">
            <h2 className="text-4xl sm:text-6xl font-black text-emerald-400">
              {current ? `${current.runs}/${current.wickets}` : "--/--"}
            </h2>
            <p className="text-slate-300 mt-2">
              Overs: {current?.overs || "0.0"}
            </p>
          </div>

          {/* PLAYER CONTROL */}
          <div className="bg-[#0d1735] p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-lg">Players Control</h3>

            <div className="grid sm:grid-cols-2 gap-3">
              {/* Striker Input */}
              <input
                className="p-2 bg-[#111c40] rounded"
                placeholder="Enter Striker Name"
                value={striker}
                onChange={(e) => setStriker(e.target.value)}
              />

              {/* Non Striker Input */}
              <input
                className="p-2 bg-[#111c40] rounded"
                placeholder="Enter Non Striker Name"
                value={nonStriker}
                onChange={(e) => setNonStriker(e.target.value)}
              />
            </div>

            {/* Bowler Input */}
            <input
              className="w-full p-2 bg-[#111c40] rounded"
              placeholder="Enter Bowler Name"
              value={bowler}
              onChange={(e) => setBowler(e.target.value)}
            />

            {/* Next Batsman Input */}
            <input
              className="w-full p-2 bg-[#111c40] rounded"
              placeholder="Enter Next Batsman Name"
              value={nextBatsman}
              onChange={(e) => setNextBatsman(e.target.value)}
            />
          </div>

          {/* RUNS */}
          <div className="bg-[#0d1735] p-4 sm:p-6 rounded-2xl border border-slate-800">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 6].map((r) => (
                <button
                  key={r}
                  onClick={() => ball(r)}
                  className="bg-emerald-500 text-black font-bold p-3 sm:p-4 rounded-xl"
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                onClick={() => ball(0, 1, "wide")}
                className="bg-blue-500 p-3 rounded"
              >
                Wide
              </button>

              <button
                onClick={() => ball(0, 1, "no_ball")}
                className="bg-purple-500 p-3 rounded"
              >
                No Ball
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                onClick={() => ball(0, 0, null, true)}
                className="bg-amber-500 text-black p-3 rounded"
              >
                Wicket
              </button>

              <button onClick={undo} className="bg-red-500 p-3 rounded">
                Undo
              </button>
            </div>
          </div>

          {/* OVER HISTORY */}
          <div className="bg-[#0d1735] p-4 sm:p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold mb-3">Over History</h3>

            {Object.entries(overs).map(([over, balls]) => (
              <div key={over} className="mb-3">
                <p className="font-bold">Over {over}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {balls.map((b, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-700 rounded">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
