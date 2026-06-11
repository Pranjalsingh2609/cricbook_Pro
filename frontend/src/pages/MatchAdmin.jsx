import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy, RotateCcw, ChevronDown, ChevronUp, Zap } from "lucide-react";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function MatchAdmin() {
  const { id } = useParams();
  const [inningsNo, setInningsNo] = useState(1);
  const [draft, setDraft] = useState({ strikerName: "", nonStrikerName: "", bowlerName: "" });
  const [newBatsmanName, setNewBatsmanName] = useState("");
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBattingCard, setShowBattingCard] = useState(true);
  const [showBowlingCard, setShowBowlingCard] = useState(true);
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

  // pull current innings from match data, not summary
  const currentInnings = data?.matchData?.innings?.find(
    (i) => Number(i.innings_no) === Number(inningsNo)
  );

  // first innings for target calculation
  const firstInnings = data?.matchData?.innings?.find(
    (i) => Number(i.innings_no) === 1
  );

  const target = inningsNo === 2 && firstInnings ? Number(firstInnings.runs) + 1 : null;

  // derive run rate from current innings
  const runRate =
    currentInnings && currentInnings.valid_balls > 0
      ? ((currentInnings.runs / currentInnings.valid_balls) * 6).toFixed(2)
      : "0.00";

  // overs display like 17.2
  function oversText(validBalls) {
    const ov = Math.floor(validBalls / 6);
    const b = validBalls % 6;
    return `${ov}.${b}`;
  }

  // merge draft values over what's already saved
  const players = {
    strikerName: draft.strikerName !== "" ? draft.strikerName : currentInnings?.striker_name ?? "",
    nonStrikerName: draft.nonStrikerName !== "" ? draft.nonStrikerName : currentInnings?.non_striker_name ?? "",
    bowlerName: draft.bowlerName !== "" ? draft.bowlerName : currentInnings?.current_bowler_name ?? "",
    isSet: !!currentInnings?.striker_id,
  };

  useEffect(() => {
    if (showWicketModal) newBatsmanRef.current?.focus();
  }, [showWicketModal]);

  function clearDraft() {
    setDraft({ strikerName: "", nonStrikerName: "", bowlerName: "" });
  }

  async function startMatch() {
    const { matchData } = data;
    await api.post(`/matches/${id}/start`, {
      tossWinnerId: matchData.match.team_a_id,
      battingFirstTeamId: matchData.match.team_a_id,
    });
    await refetch();
  }

  async function savePlayers(overrides = {}) {
    const { matchData } = data;

    if (matchData.match.status !== "live") {
      alert("Start the match first.");
      return;
    }

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

    await api.post(`/matches/${id}/ball`, {
      inningsNo,
      runsBat,
      extraRuns,
      extraType,
      isWicket,
    });

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

    // walk backwards through all balls to find the current over
    for (let i = balls.length - 1; i >= 0; i--) {
      if (count >= 6) break;
      const b = balls[i];
      over.unshift(
        b.is_wicket
          ? "W"
          : b.extra_type === "wide"
          ? "Wd"
          : b.extra_type === "no_ball"
          ? "Nb"
          : b.runs_bat
      );
      if (b.is_legal) count++;
    }
    return over;
  }

  // batting scorecard derived from balls in summary
  function getBattingStats() {
    const balls = data?.summary?.balls || [];
    const stats = {};

    for (const b of balls) {
      if (!b.batsman_name) continue;
      if (!stats[b.batsman_name]) stats[b.batsman_name] = { runs: 0, balls: 0 };
      stats[b.batsman_name].runs += Number(b.runs_bat) || 0;
      if (b.is_legal) stats[b.batsman_name].balls += 1;
    }

    return Object.entries(stats).map(([name, s]) => ({ name, ...s }));
  }

  // bowling stats derived from balls in summary
  function getBowlingStats() {
    const balls = data?.summary?.balls || [];
    const stats = {};

    for (const b of balls) {
      if (!b.bowler_name) continue;
      if (!stats[b.bowler_name]) stats[b.bowler_name] = { runs: 0, wickets: 0, validBalls: 0 };
      stats[b.bowler_name].runs += (Number(b.runs_bat) || 0) + (Number(b.extra_runs) || 0);
      if (b.is_wicket) stats[b.bowler_name].wickets += 1;
      if (b.is_legal) stats[b.bowler_name].validBalls += 1;
    }

    return Object.entries(stats).map(([name, s]) => ({
      name,
      overs: oversText(s.validBalls),
      runs: s.runs,
      wickets: s.wickets,
    }));
  }

  const currentOver = buildCurrentOver();
  const battingStats = getBattingStats();
  const bowlingStats = getBowlingStats();

  const matchCompleted = data?.matchData?.match?.status === "completed";
  const matchScheduled = data?.matchData?.match?.status === "scheduled";

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
        <div className="max-w-2xl mx-auto space-y-3">

          {/* header: team names + innings tabs */}
          <div className="bg-[#0d1735] p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-emerald-400 w-5 h-5 shrink-0" />
              <div>
                <h1 className="font-bold text-base leading-tight">
                  {matchData.match.team_a_name} vs {matchData.match.team_b_name}
                </h1>
                <span
                  className={`text-xs font-semibold uppercase tracking-widest ${
                    matchData.match.status === "live"
                      ? "text-red-400"
                      : matchData.match.status === "completed"
                      ? "text-emerald-400"
                      : "text-slate-400"
                  }`}
                >
                  {matchData.match.status === "live" ? "🔴 LIVE" : matchData.match.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => { setInningsNo(n); clearDraft(); }}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    inningsNo === n
                      ? "bg-emerald-500 text-black"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  Inn {n}
                </button>
              ))}
            </div>
          </div>

          {/* main scoreboard */}
          <div className="bg-[#0d1735] p-5 rounded-2xl border border-slate-800 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
              Innings {inningsNo}
            </p>

            <h2 className="text-6xl font-black text-emerald-400 tabular-nums">
              {currentInnings ? `${currentInnings.runs}/${currentInnings.wickets}` : "0/0"}
            </h2>

            <p className="text-slate-400 text-sm mt-1">
              {oversText(currentInnings?.valid_balls || 0)} Overs
            </p>

            {/* RR and target */}
            <div className="flex justify-center gap-6 mt-2 text-sm">
              <span className="text-slate-400">
                RR: <span className="text-white font-semibold">{runRate}</span>
              </span>
              {target && (
                <span className="text-slate-400">
                  Target: <span className="text-white font-semibold">{target}</span>
                </span>
              )}
            </div>

            {/* active batsmen + bowler */}
            {currentInnings?.striker_name && (
              <div className="mt-4 text-left bg-[#111c40] rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-400 font-semibold">
                    ★ {currentInnings.striker_name}
                  </span>
                  <span className="text-slate-300 tabular-nums">batting</span>
                </div>
                {currentInnings.non_striker_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{currentInnings.non_striker_name}</span>
                    <span className="text-slate-500 tabular-nums">non-striker</span>
                  </div>
                )}
                {currentInnings.current_bowler_name && (
                  <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-1">
                    <span className="text-slate-400">Bowling</span>
                    <span className="text-slate-300">{currentInnings.current_bowler_name}</span>
                  </div>
                )}
              </div>
            )}

            {/* current over balls */}
            {currentOver.length > 0 && (
              <div className="mt-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Current Over</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {currentOver.map((b, i) => (
                    <span
                      key={i}
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold ${
                        b === "W"
                          ? "bg-red-600 text-white"
                          : b === "Wd" || b === "Nb"
                          ? "bg-yellow-500 text-black"
                          : b === 4 || b === 6
                          ? "bg-emerald-500 text-black"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* quick score buttons */}
          {!matchCompleted && (
            <div className="bg-[#0d1735] p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-widest">
                Quick Score
              </h3>

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

              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleBall(0, 1, "wide")}
                  className="bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Wide
                </button>
                <button
                  onClick={() => handleBall(0, 1, "no_ball")}
                  className="bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  No Ball
                </button>
                <button
                  onClick={() => handleBall(0, 0, "bye")}
                  className="bg-slate-600 hover:bg-slate-500 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Bye
                </button>
                <button
                  onClick={() => handleBall(0, 0, "leg_bye")}
                  className="bg-slate-600 hover:bg-slate-500 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Leg Bye
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleBall(0, 0, null, true)}
                  className="bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition-colors"
                >
                  Wicket
                </button>
                <button
                  onClick={handleUndo}
                  className="bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Undo
                </button>
              </div>
            </div>
          )}

          {/* batting scorecard */}
          {battingStats.length > 0 && (
            <div className="bg-[#0d1735] rounded-2xl border border-slate-800 overflow-hidden">
              <button
                onClick={() => setShowBattingCard((v) => !v)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <h3 className="font-semibold text-sm text-slate-300 uppercase tracking-wide">
                  Batting Scorecard
                </h3>
                {showBattingCard ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showBattingCard && (
                <div className="px-4 pb-4 space-y-2">
                  {battingStats.map((p) => (
                    <div key={p.name} className="flex justify-between text-sm">
                      <span
                        className={
                          p.name === currentInnings?.striker_name
                            ? "text-yellow-400 font-semibold"
                            : "text-slate-300"
                        }
                      >
                        {p.name === currentInnings?.striker_name ? "★ " : ""}
                        {p.name}
                      </span>
                      <span className="text-slate-400 tabular-nums">
                        {p.runs} ({p.balls})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* bowling scorecard */}
          {bowlingStats.length > 0 && (
            <div className="bg-[#0d1735] rounded-2xl border border-slate-800 overflow-hidden">
              <button
                onClick={() => setShowBowlingCard((v) => !v)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <h3 className="font-semibold text-sm text-slate-300 uppercase tracking-wide">
                  Bowling Scorecard
                </h3>
                {showBowlingCard ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showBowlingCard && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500 uppercase tracking-widest mb-2">
                    <span className="col-span-2">Bowler</span>
                    <span className="text-right">Ov</span>
                    <span className="text-right">R / W</span>
                  </div>
                  {bowlingStats.map((b) => (
                    <div key={b.name} className="grid grid-cols-4 gap-2 text-sm mb-1">
                      <span
                        className={
                          b.name === currentInnings?.current_bowler_name
                            ? "text-emerald-400 font-semibold col-span-2"
                            : "text-slate-300 col-span-2"
                        }
                      >
                        {b.name}
                      </span>
                      <span className="text-slate-400 tabular-nums text-right">{b.overs}</span>
                      <span className="text-slate-400 tabular-nums text-right">
                        {b.runs}/{b.wickets}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* match actions: edit players + start / finish */}
          <div className="bg-[#0d1735] p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-widest">
                Match Actions
              </h3>
              {players.isSet && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Players set
                </span>
              )}
            </div>

            {matchScheduled && (
              <button
                onClick={startMatch}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
              >
                Start Match
              </button>
            )}

            {/* player inputs always visible under actions */}
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
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-sm disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Players"}
            </button>

            {/* change bowler shortcut — just clears the bowler draft field visually */}
            <button
              onClick={() => setDraft((p) => ({ ...p, bowlerName: "" }))}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Change Bowler
            </button>

            {/* start second innings if first is done */}
            {inningsNo === 1 && data?.matchData?.innings?.length < 2 && (
              <button
                onClick={async () => {
                  // signal the backend via a dummy ball won't work; navigate user to inn 2
                  setInningsNo(2);
                  clearDraft();
                }}
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg text-sm transition-colors"
              >
                Start 2nd Innings
              </button>
            )}
          </div>

          {/* completed banner */}
          {matchCompleted && (
            <div className="bg-emerald-500/10 border border-emerald-500 p-4 rounded-2xl text-center">
              <Trophy className="text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-emerald-400">Match Completed</p>
              <p className="text-sm text-slate-300 mt-1">
                Winner: {matchData.match.winner_team_name}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* wicket modal — ask for new batsman */}
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
              <button
                onClick={() => setShowWicketModal(false)}
                className="py-2 bg-slate-700 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewBatsman}
                className="py-2 bg-emerald-500 text-black rounded-lg text-sm font-bold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
