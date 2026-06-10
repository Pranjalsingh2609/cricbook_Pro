import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy, RotateCcw, Zap } from "lucide-react";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function MatchAdmin() {
  const { id } = useParams();
  const [inningsNo, setInningsNo] = useState(1);
  const [draft, setDraft] = useState({ strikerName: "", nonStrikerName: "", bowlerName: "" });
  const [newBatsmanName, setNewBatsmanName] = useState("");
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const newBatsmanRef = useRef(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["match-admin", id],
    queryFn: async () => {
      const [matchRes, summaryRes] = await Promise.all([
        api.get(`/matches/${id}`),
        api.get(`/matches/${id}/summary`),
      ]);
      return { matchData: matchRes.data, summary: summaryRes.data };
    },
    enabled: !!id,
  });

  const currentInnings = data?.matchData?.innings?.find(
    (i) => Number(i.innings_no) === Number(inningsNo)
  );

  const players = {
    strikerName: draft.strikerName || currentInnings?.striker_name || "",
    nonStrikerName: draft.nonStrikerName || currentInnings?.non_striker_name || "",
    bowlerName: draft.bowlerName || currentInnings?.current_bowler_name || "",
    isSet: !!currentInnings?.striker_id,
  };

  useEffect(() => {
    if (showWicketModal) newBatsmanRef.current?.focus();
  }, [showWicketModal]);

  function clearDraft() {
    setDraft({ strikerName: "", nonStrikerName: "", bowlerName: "" });
  }

  async function savePlayers(overrides = {}) {
    const payload = {
      strikerName: overrides.strikerName ?? players.strikerName,
      nonStrikerName: overrides.nonStrikerName ?? players.nonStrikerName,
      bowlerName: overrides.bowlerName ?? players.bowlerName,
    };

    const anyFilled = Object.values(payload).some((v) => v?.trim());
    if (!anyFilled) return;

    setSaving(true);
    try {
      await api.post(`/matches/${id}/innings/${inningsNo}/players`, payload);
      clearDraft();
      await refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleBall(runsBat, extraRuns = 0, extraType = null, isWicket = false) {
    if (!currentInnings?.striker_id || !currentInnings?.current_bowler_id) {
      alert("Save players before scoring");
      return;
    }

    await api.post(`/matches/${id}/ball`, { inningsNo, runsBat, extraRuns, extraType, isWicket });

    if (isWicket) setShowWicketModal(true);
    await refetch();
  }

  async function handleUndo() {
    await api.post(`/matches/${id}/undo`, { inningsNo });
    await refetch();
  }

  async function confirmNewBatsman() {
    if (!newBatsmanName.trim()) return;
    await savePlayers({ strikerName: newBatsmanName });
    setNewBatsmanName("");
    setShowWicketModal(false);
  }

  function buildCurrentOver() {
    const balls = data?.summary?.balls || [];
    const over = [];
    let count = 0;
    for (let i = balls.length - 1; i >= 0; i--) {
      if (count >= 6) break;
      const b = balls[i];
      over.unshift(
        b.is_wicket ? "W"
        : b.extra_type === "wide" ? "Wd"
        : b.extra_type === "no_ball" ? "Nb"
        : b.runs_bat
      );
      if (b.is_legal) count++;
    }
    return over;
  }

  const currentOver = buildCurrentOver();
  const matchCompleted = data?.matchData?.match?.status === "completed";

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#071028] text-white">
        Loading...
      </div>
    );
  }

  const { matchData } = data;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#071028] text-white px-3 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-4">

          <div className="bg-[#0d1735] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-emerald-400 w-5 h-5" />
              <div>
                <h1 className="font-bold text-lg">
                  {matchData.match.team_a_name} vs {matchData.match.team_b_name}
                </h1>
                <p className="text-slate-400 text-xs capitalize">{matchData.match.status}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => { setInningsNo(n); clearDraft(); }}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    inningsNo === n ? "bg-emerald-500 text-black" : "bg-slate-700 text-slate-300"
                  }`}
                >
                  Inn {n}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1735] p-5 rounded-2xl border border-slate-800 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Innings {inningsNo}</p>
            <h2 className="text-6xl font-black text-emerald-400 tabular-nums">
              {currentInnings ? `${currentInnings.runs}/${currentInnings.wickets}` : "0/0"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">{currentInnings?.overs || "0.0"} overs</p>

            {currentOver.length > 0 && (
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                {currentOver.map((b, i) => (
                  <span
                    key={i}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold ${
                      b === "W" ? "bg-red-600 text-white"
                      : b === "Wd" || b === "Nb" ? "bg-yellow-500 text-black"
                      : b === 4 || b === 6 ? "bg-emerald-500 text-black"
                      : "bg-slate-700 text-white"
                    }`}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0d1735] p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-300 uppercase tracking-wide">Players</h3>
              {players.isSet && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Set
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Striker</label>
                <input
                  className="w-full p-2 bg-[#111c40] rounded-lg text-sm border border-transparent focus:border-emerald-500 outline-none"
                  placeholder="Name"
                  value={players.strikerName}
                  onChange={(e) => setDraft((p) => ({ ...p, strikerName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Non-striker</label>
                <input
                  className="w-full p-2 bg-[#111c40] rounded-lg text-sm border border-transparent focus:border-emerald-500 outline-none"
                  placeholder="Name"
                  value={players.nonStrikerName}
                  onChange={(e) => setDraft((p) => ({ ...p, nonStrikerName: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Bowler</label>
              <input
                className="w-full p-2 bg-[#111c40] rounded-lg text-sm border border-transparent focus:border-emerald-500 outline-none"
                placeholder="Name"
                value={players.bowlerName}
                onChange={(e) => setDraft((p) => ({ ...p, bowlerName: e.target.value }))}
              />
            </div>

            <button
              onClick={() => savePlayers()}
              disabled={saving}
              className="w-full py-2 bg-emerald-500 text-black font-bold rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Players"}
            </button>
          </div>

          {!matchCompleted && (
            <div className="bg-[#0d1735] p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-semibold text-sm text-slate-300 uppercase tracking-wide">Score</h3>

              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleBall(r)}
                    className="bg-[#111c40] hover:bg-emerald-500 hover:text-black text-white font-black text-xl py-4 rounded-xl transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleBall(0, 1, "wide")} className="bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-colors">Wide</button>
                <button onClick={() => handleBall(0, 1, "no_ball")} className="bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold transition-colors">No Ball</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleBall(0, 0, null, true)} className="bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition-colors">Wicket</button>
                <button onClick={handleUndo} className="bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                  <RotateCcw className="w-4 h-4" /> Undo
                </button>
              </div>
            </div>
          )}

          {matchCompleted && (
            <div className="bg-emerald-500/10 border border-emerald-500 p-4 rounded-2xl text-center">
              <Trophy className="text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-emerald-400">Match Completed</p>
              <p className="text-sm text-slate-300 mt-1">Winner: {matchData.match.winner_team_name}</p>
            </div>
          )}

        </div>
      </main>

      {showWicketModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#0d1735] border border-slate-700 p-5 rounded-2xl w-full max-w-sm space-y-4">
            <div>
              <h3 className="font-bold text-lg">Wicket!</h3>
              <p className="text-slate-400 text-sm">Who's the new batsman?</p>
            </div>
            <input
              ref={newBatsmanRef}
              className="w-full p-2 bg-[#111c40] rounded-lg text-sm border border-transparent focus:border-emerald-500 outline-none"
              placeholder="New batsman name"
              value={newBatsmanName}
              onChange={(e) => setNewBatsmanName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmNewBatsman()}
            />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowWicketModal(false)} className="py-2 bg-slate-700 rounded-lg text-sm font-semibold">Cancel</button>
              <button onClick={confirmNewBatsman} className="py-2 bg-emerald-500 text-black rounded-lg text-sm font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
