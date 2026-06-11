import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy, RotateCcw, ChevronDown, ChevronUp, Zap, AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function MatchAdmin() {
  const { id } = useParams();
  const [inningsNo, setInningsNo] = useState(1);
  const [draft, setDraft] = useState({ strikerName: "", nonStrikerName: "", bowlerName: "" });
  const [newBatsmanName, setNewBatsmanName] = useState("");
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showOverModal, setShowOverModal] = useState(false);
  const [newBowlerName, setNewBowlerName] = useState("");
  const [showBattingCard, setShowBattingCard] = useState(true);
  const [showBowlingCard, setShowBowlingCard] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const newBatsmanRef = useRef(null);
  const newBowlerRef  = useRef(null);

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
  const firstInnings = data?.matchData?.innings?.find(
    (i) => Number(i.innings_no) === 1
  );
  const target = inningsNo === 2 && firstInnings ? Number(firstInnings.runs) + 1 : null;

  const runRate =
    currentInnings && currentInnings.valid_balls > 0
      ? ((currentInnings.runs / currentInnings.valid_balls) * 6).toFixed(2)
      : "0.00";

  function oversText(validBalls) {
    const ov = Math.floor(validBalls / 6);
    const b  = validBalls % 6;
    return `${ov}.${b}`;
  }

  const players = {
    strikerName:    draft.strikerName    !== "" ? draft.strikerName    : currentInnings?.striker_name          ?? "",
    nonStrikerName: draft.nonStrikerName !== "" ? draft.nonStrikerName : currentInnings?.non_striker_name      ?? "",
    bowlerName:     draft.bowlerName     !== "" ? draft.bowlerName     : currentInnings?.current_bowler_name   ?? "",
    isSet: !!currentInnings?.striker_id,
  };

 const didAutoSwitchRef = useRef(false);
  useEffect(() => {
    if (didAutoSwitchRef.current) return;                        // already switched — skip
    const inn2Exists = data?.matchData?.innings?.some((i) => Number(i.innings_no) === 2);
    if (inn2Exists && inningsNo === 1) {
      const inn1 = data?.matchData?.innings?.find((i) => Number(i.innings_no) === 1);
      if (inn1 && Number(inn1.wickets) >= 10) {
        didAutoSwitchRef.current = true;                         // mark before setState
       
        clearDraft();
      }
    }
  }, [data, inningsNo]); 
  


  const lastOverModalBallRef = useRef(-1);
  useEffect(() => {
    if (!currentInnings) return;
    if (showWicketModal) return;                                  // wicket modal takes priority
    const vb = currentInnings.valid_balls;
    if (
      !currentInnings.current_bowler_id &&
      vb > 0 &&
      vb % 6 === 0 &&
      lastOverModalBallRef.current !== vb               // only open once per ball count
    ) {
      lastOverModalBallRef.current = vb;                // mark before setState
      setShowOverModal(true);
    }
  }, [currentInnings, showWicketModal]);                         // FIX 2: both deps present

  useEffect(() => {
    if (showWicketModal) newBatsmanRef.current?.focus();
  }, [showWicketModal]);

  useEffect(() => {
    if (showOverModal) newBowlerRef.current?.focus();
  }, [showOverModal]);

  function clearDraft() {
    setDraft({ strikerName: "", nonStrikerName: "", bowlerName: "" });
  }

  async function startMatch() {
    const { matchData } = data;
    await api.post(`/matches/${id}/start`, {
      tossWinnerId:       matchData.match.team_a_id,
      battingFirstTeamId: matchData.match.team_a_id,
    });
    await refetch();
  }

  async function savePlayers(overrides = {}) {
    const { matchData } = data;
    if (matchData.match.status !== "live") { alert("Start the match first."); return; }

    const payload = {
      strikerName:    overrides.strikerName    ?? players.strikerName,
      nonStrikerName: overrides.nonStrikerName ?? players.nonStrikerName,
      bowlerName:     overrides.bowlerName     ?? players.bowlerName,
    };

    const anyFilled = Object.values(payload).some((v) => v?.trim());
    if (!anyFilled) return;

    setSaving(true);
    setErrorMsg("");
    try {
      await api.post(`/matches/${id}/innings/${inningsNo}/players`, payload);
      clearDraft();
      await refetch();
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to save players.";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  }

  // FIX 3: removed unused `res` variable — result of api.post is not needed
  async function handleBall(runsBat, extraRuns = 0, extraType = null, isWicket = false) {
    if (!currentInnings?.striker_id || !currentInnings?.current_bowler_id) {
      alert("Save players before scoring");
      return;
    }
    setErrorMsg("");
    try {
      await api.post(`/matches/${id}/ball`, {           // FIX 3: no longer assigned to `res`
        inningsNo, runsBat, extraRuns, extraType, isWicket,
      });
      if (isWicket) setShowWicketModal(true);
      await refetch();
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Error recording ball.";
      setErrorMsg(msg);
    }
  }

  async function handleUndo() {
    setErrorMsg("");
    try {
      await api.post(`/matches/${id}/undo`, { inningsNo });
      await refetch();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message ?? "Undo failed.");
    }
  }

  async function confirmNewBatsman() {
    if (!newBatsmanName.trim()) return;
    await savePlayers({ strikerName: newBatsmanName });
    setNewBatsmanName("");
    setShowWicketModal(false);
  }

  async function confirmNewBowler() {
    if (!newBowlerName.trim()) return;
    await savePlayers({ bowlerName: newBowlerName });
    setNewBowlerName("");
    setShowOverModal(false);
  }

  function buildCurrentOver() {
    const balls = data?.summary?.balls || [];
    const over = [];
    let count = 0;
    for (let i = balls.length - 1; i >= 0; i--) {
      if (count >= 6) break;
      const b = balls[i];
      over.unshift(
        b.is_wicket             ? "W"
        : b.extra_type === "wide"    ? "Wd"
        : b.extra_type === "no_ball" ? "Nb"
        : b.runs_bat
      );
      if (b.is_legal) count++;
    }
    return over;
  }

  function getBattingStats() {
    const balls = data?.summary?.balls || [];
    const stats = {};
    for (const b of balls) {
      if (!b.batsman_name) continue;
      if (!stats[b.batsman_name]) stats[b.batsman_name] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      const r = Number(b.runs_bat) || 0;
      stats[b.batsman_name].runs += r;
      if (b.is_legal) stats[b.batsman_name].balls += 1;
      if (r === 4) stats[b.batsman_name].fours += 1;
      if (r === 6) stats[b.batsman_name].sixes += 1;
    }
    return Object.entries(stats).map(([name, s]) => ({ name, ...s }));
  }

  function getBowlingStats() {
    const balls = data?.summary?.balls || [];
    const stats = {};
    for (const b of balls) {
      if (!b.bowler_name) continue;
      if (!stats[b.bowler_name]) stats[b.bowler_name] = { runs: 0, wickets: 0, validBalls: 0 };
      stats[b.bowler_name].runs       += (Number(b.runs_bat) || 0) + (Number(b.extra_runs) || 0);
      if (b.is_wicket) stats[b.bowler_name].wickets += 1;
      if (b.is_legal)  stats[b.bowler_name].validBalls += 1;
    }
    return Object.entries(stats).map(([name, s]) => ({
      name,
      overs:   oversText(s.validBalls),
      runs:    s.runs,
      wickets: s.wickets,
    }));
  }

  const currentOver  = buildCurrentOver();
  const battingStats = getBattingStats();
  const bowlingStats = getBowlingStats();
  const matchCompleted = data?.matchData?.match?.status === "completed";
  const matchScheduled = data?.matchData?.match?.status === "scheduled";

  const needsNewBowler =
    currentInnings &&
    !currentInnings.current_bowler_id &&
    currentInnings.valid_balls > 0 &&
    currentInnings.valid_balls % 6 === 0;

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#071028] text-white">
        Loading…
      </div>
    );
  }

  const { matchData } = data;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#071028] text-white px-3 py-3 pb-8">
        <div className="max-w-lg mx-auto space-y-3">

          {/* ── Header ───────────────────────────────────────────────── */}
          <div className="bg-[#0d1735] p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="text-emerald-400 w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <h1 className="font-bold text-sm leading-tight truncate">
                  {matchData.match.team_a_name} <span className="text-slate-500">vs</span> {matchData.match.team_b_name}
                </h1>
                <span
                  className={`text-xs font-semibold uppercase tracking-widest ${
                    matchData.match.status === "live"        ? "text-red-400"
                    : matchData.match.status === "completed" ? "text-emerald-400"
                    : "text-slate-400"
                  }`}
                >
                  {matchData.match.status === "live" ? "🔴 LIVE" : matchData.match.status}
                </span>
              </div>
            </div>

            <div className="flex gap-1.5 shrink-0">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => { setInningsNo(n); clearDraft(); setErrorMsg(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
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

          {errorMsg && (
            <div className="flex items-start gap-2 bg-red-900/40 border border-red-600 rounded-xl px-3 py-2 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="bg-[#0d1735] p-4 rounded-2xl border border-slate-800 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
              Innings {inningsNo}
            </p>

            <h2 className="text-5xl font-black text-emerald-400 tabular-nums">
              {currentInnings ? `${currentInnings.runs}/${currentInnings.wickets}` : "0/0"}
            </h2>

            <p className="text-slate-400 text-sm mt-1">
              {oversText(currentInnings?.valid_balls || 0)} Overs
            </p>

            <div className="flex justify-center gap-5 mt-2 text-sm">
              <span className="text-slate-400">
                RR <span className="text-white font-semibold">{runRate}</span>
              </span>
              {target && (
                <span className="text-slate-400">
                  Target <span className="text-white font-semibold">{target}</span>{" "}
                  <span className="text-slate-500 text-xs">
                    (need {Math.max(0, target - (currentInnings?.runs ?? 0))} more)
                  </span>
                </span>
              )}
            </div>

            {currentInnings?.striker_name && (
              <div className="mt-3 text-left bg-[#111c40] rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-400 font-semibold">
                    ★ {currentInnings.striker_name}
                  </span>
                  <span className="text-slate-400 text-xs">on strike</span>
                </div>
                {currentInnings.non_striker_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{currentInnings.non_striker_name}</span>
                    <span className="text-slate-500 text-xs">non-striker</span>
                  </div>
                )}
                {currentInnings.current_bowler_name ? (
                  <div className="flex justify-between text-sm border-t border-slate-700 pt-1.5">
                    <span className="text-slate-400">Bowling</span>
                    <span className="text-emerald-300">{currentInnings.current_bowler_name}</span>
                  </div>
                ) : needsNewBowler ? (
                  <div className="flex justify-between text-sm border-t border-slate-700 pt-1.5">
                    <span className="text-yellow-400 font-semibold">⚠ New bowler needed</span>
                  </div>
                ) : null}
              </div>
            )}

            {currentOver.length > 0 && (
              <div className="mt-3">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">This Over</p>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {currentOver.map((b, i) => (
                    <span
                      key={i}
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                        b === "W"                        ? "bg-red-600 text-white"
                        : b === "Wd" || b === "Nb"       ? "bg-yellow-500 text-black"
                        : b === 4 || b === 6             ? "bg-emerald-500 text-black"
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

          {!matchCompleted && (
            <div className="bg-[#0d1735] p-3 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-widest">
                Quick Score
              </h3>

              <div className={needsNewBowler ? "opacity-40 pointer-events-none" : ""}>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[0, 1, 2, 3, 4, 6].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleBall(r)}
                      className="bg-[#111c40] active:bg-emerald-500 active:text-black hover:bg-emerald-500 hover:text-black text-white font-black text-2xl py-4 rounded-xl transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2 mb-2">
                  <button onClick={() => handleBall(0, 1, "wide")}    className="bg-blue-700 active:bg-blue-500 hover:bg-blue-600 py-3 rounded-xl font-bold text-sm transition-colors">Wide</button>
                  <button onClick={() => handleBall(0, 1, "no_ball")} className="bg-purple-700 active:bg-purple-500 hover:bg-purple-600 py-3 rounded-xl font-bold text-sm transition-colors">No Ball</button>
                  <button onClick={() => handleBall(0, 0, "bye")}     className="bg-slate-600 hover:bg-slate-500 py-3 rounded-xl font-bold text-sm transition-colors">Bye</button>
                  <button onClick={() => handleBall(0, 0, "leg_bye")} className="bg-slate-600 hover:bg-slate-500 py-3 rounded-xl font-bold text-sm transition-colors">LB</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleBall(0, 0, null, true)}
                    className="bg-red-700 active:bg-red-500 hover:bg-red-600 py-3 rounded-xl font-bold transition-colors"
                  >
                    🏏 Wicket
                  </button>
                  <button
                    onClick={handleUndo}
                    className="bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Undo
                  </button>
                </div>
              </div>

              {needsNewBowler && (
                <div className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-3 space-y-2">
                  <p className="text-yellow-400 font-semibold text-sm">Over complete — enter new bowler</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 p-2 bg-[#111c40] rounded-lg text-sm border border-transparent focus:border-emerald-500 outline-none"
                      placeholder="New bowler name"
                      value={draft.bowlerName}
                      onChange={(e) => setDraft((p) => ({ ...p, bowlerName: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && savePlayers()}
                    />
                    <button
                      onClick={() => savePlayers()}
                      disabled={saving}
                      className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg text-sm disabled:opacity-50"
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {battingStats.length > 0 && (
            <div className="bg-[#0d1735] rounded-2xl border border-slate-800 overflow-hidden">
              <button onClick={() => setShowBattingCard((v) => !v)} className="w-full flex items-center justify-between p-3 text-left">
                <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-widest">Batting</h3>
                {showBattingCard ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showBattingCard && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-5 gap-1 text-xs text-slate-500 uppercase tracking-widest mb-1.5">
                    <span className="col-span-2">Batsman</span>
                    <span className="text-right">R</span>
                    <span className="text-right">B</span>
                    <span className="text-right">4s/6s</span>
                  </div>
                  {battingStats.map((p) => (
                    <div key={p.name} className="grid grid-cols-5 gap-1 text-sm py-0.5">
                      <span className={`col-span-2 truncate ${p.name === currentInnings?.striker_name ? "text-yellow-400 font-semibold" : "text-slate-300"}`}>
                        {p.name === currentInnings?.striker_name ? "★ " : ""}{p.name}
                      </span>
                      <span className="text-right text-white font-semibold tabular-nums">{p.runs}</span>
                      <span className="text-right text-slate-400 tabular-nums">{p.balls}</span>
                      <span className="text-right text-slate-400 tabular-nums text-xs">{p.fours}/{p.sixes}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

         {bowlingStats.length > 0 && (
            <div className="bg-[#0d1735] rounded-2xl border border-slate-800 overflow-hidden">
              <button onClick={() => setShowBowlingCard((v) => !v)} className="w-full flex items-center justify-between p-3 text-left">
                <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-widest">Bowling</h3>
                {showBowlingCard ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showBowlingCard && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-4 gap-1 text-xs text-slate-500 uppercase tracking-widest mb-1.5">
                    <span className="col-span-2">Bowler</span>
                    <span className="text-right">Ov</span>
                    <span className="text-right">R/W</span>
                  </div>
                  {bowlingStats.map((b) => (
                    <div key={b.name} className="grid grid-cols-4 gap-1 text-sm py-0.5">
                      <span className={`col-span-2 truncate ${b.name === currentInnings?.current_bowler_name ? "text-emerald-400 font-semibold" : "text-slate-300"}`}>
                        {b.name}
                      </span>
                      <span className="text-right text-slate-400 tabular-nums">{b.overs}</span>
                      <span className="text-right text-slate-400 tabular-nums">{b.runs}/{b.wickets}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!matchCompleted && (
            <div className="bg-[#0d1735] p-3 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-widest">Match Actions</h3>
                {players.isSet && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Players set
                  </span>
                )}
              </div>

              {matchScheduled && (
                <button onClick={startMatch} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                  Start Match
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Striker</label>
                  <input className="w-full p-2 bg-[#111c40] rounded-lg text-sm border border-transparent focus:border-emerald-500 outline-none" placeholder="Name" value={players.strikerName} onChange={(e) => setDraft((p) => ({ ...p, strikerName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Non-striker</label>
                  <input className="w-full p-2 bg-[#111c40] rounded-lg text-sm border border-transparent focus:border-emerald-500 outline-none" placeholder="Name" value={players.nonStrikerName} onChange={(e) => setDraft((p) => ({ ...p, nonStrikerName: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Bowler</label>
                <input className="w-full p-2 bg-[#111c40] rounded-lg text-sm border border-transparent focus:border-emerald-500 outline-none" placeholder="Name" value={players.bowlerName} onChange={(e) => setDraft((p) => ({ ...p, bowlerName: e.target.value }))} />
              </div>

              <button onClick={() => savePlayers()} disabled={saving} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : "Save Players"}
              </button>
            </div>
          )}

          {matchCompleted && (
            <div className="bg-emerald-500/10 border border-emerald-500 p-4 rounded-2xl text-center">
              <Trophy className="text-emerald-400 mx-auto mb-2 w-8 h-8" />
              <p className="font-bold text-emerald-400 text-lg">Match Completed</p>
              <p className="text-sm text-slate-300 mt-1">🏆 {matchData.match.winner_team_name} won!</p>
            </div>
          )}

        </div>
      </main>

      {showWicketModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 px-4 pb-6 sm:pb-0">
          <div className="bg-[#0d1735] border border-red-700 p-5 rounded-2xl w-full max-w-sm space-y-4">
            <div>
              <h3 className="font-bold text-lg text-red-400">🏏 Wicket!</h3>
              <p className="text-slate-400 text-sm">Who's the new batsman?</p>
            </div>
            <input ref={newBatsmanRef} className="w-full p-3 bg-[#111c40] rounded-xl text-sm border border-transparent focus:border-emerald-500 outline-none" placeholder="New batsman name" value={newBatsmanName} onChange={(e) => setNewBatsmanName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmNewBatsman()} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowWicketModal(false)} className="py-3 bg-slate-700 rounded-xl text-sm font-semibold">Later</button>
              <button onClick={confirmNewBatsman} className="py-3 bg-emerald-500 text-black rounded-xl text-sm font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showOverModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 px-4 pb-6 sm:pb-0">
          <div className="bg-[#0d1735] border border-yellow-600 p-5 rounded-2xl w-full max-w-sm space-y-4">
            <div>
              <h3 className="font-bold text-lg text-yellow-400">⚡ Over Complete!</h3>
              <p className="text-slate-400 text-sm">
                Enter the new bowler. The same bowler cannot bowl consecutive overs.
              </p>
            </div>
            <input ref={newBowlerRef} className="w-full p-3 bg-[#111c40] rounded-xl text-sm border border-transparent focus:border-yellow-500 outline-none" placeholder="New bowler name" value={newBowlerName} onChange={(e) => setNewBowlerName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmNewBowler()} />
            {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
            <button onClick={confirmNewBowler} className="w-full py-3 bg-yellow-500 text-black font-bold rounded-xl text-sm">Set Bowler</button>
          </div>
        </div>
      )}
    </>
  );
}
