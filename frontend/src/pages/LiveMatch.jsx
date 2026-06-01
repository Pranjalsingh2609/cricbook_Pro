import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { socket } from "../api/socket";

export default function LiveMatch() {
  const { id } = useParams();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["live-match", id],
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

  useEffect(() => {
    socket.emit("join_match", id);

    socket.on("score_updated", refetch);

    return () => {
      socket.emit("leave_match", id);
      socket.off("score_updated", refetch);
    };
  }, [id, refetch]);

  if (isLoading || !data) {
    return <p className="p-6">Loading live score...</p>;
  }

  const { matchData, summary } = data;

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="card text-center">
        <p className="text-emerald-400">LIVE SCORE</p>

        <h1 className="text-2xl sm:text-4xl font-bold">
          {matchData.match.team_a_name} vs {matchData.match.team_b_name}
        </h1>
      </div>

      {summary?.innings?.map((i) => (
        <div key={i.id} className="card text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-emerald-400">
            {i.runs}/{i.wickets}
          </h2>

          <p className="text-lg sm:text-2xl">Overs: {i.overs}</p>
          <p className="text-slate-400">Run Rate: {i.runRate}</p>

          {i.requiredRate && (
            <p className="text-yellow-300">Required RR: {i.requiredRate}</p>
          )}
        </div>
      ))}

      {summary?.target && (
        <div className="card text-center text-lg sm:text-xl">
          Target: {summary.target}
        </div>
      )}
    </main>
  );
}