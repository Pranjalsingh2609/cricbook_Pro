import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Activity } from "lucide-react";

import { api } from "../api/client";
import { socket } from "../api/socket";

const bgImage = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAxgMBIgACEQEDEQH/...`;

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
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#071028] text-white">
        <div className="text-center">
          <Activity className="mx-auto animate-pulse text-emerald-400 mb-4" size={40} />
          <p className="text-lg">Loading live score...</p>
        </div>
      </main>
    );
  }

  const { matchData, summary } = data;

  return (
    <main
      className="min-h-screen bg-cover bg-center relative"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#071028]/85 backdrop-blur-sm" />

      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-10 max-w-5xl mx-auto space-y-6">

        {/* Match Header */}
        <div className="bg-[#0d1735]/90 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>

          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <Trophy className="text-emerald-400" size={28} />
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
            {matchData.match.team_a_name}
          </h1>

          <p className="text-emerald-400 font-bold text-lg sm:text-2xl my-2">
            VS
          </p>

          <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
            {matchData.match.team_b_name}
          </h1>
        </div>

        {/* Innings */}
        <div className="grid gap-5">
          {summary?.innings?.map((i) => (
            <div
              key={i.id}
              className="bg-[#0d1735]/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl"
            >
              <div className="text-center">

                <p className="text-slate-400 uppercase tracking-widest text-sm">
                  Score
                </p>

                <h2 className="text-5xl sm:text-7xl font-black text-emerald-400 mt-2">
                  {i.runs}/{i.wickets}
                </h2>

                <div className="grid grid-cols-2 gap-4 mt-8">

                  <div className="rounded-2xl bg-[#071028] border border-slate-800 p-4">
                    <p className="text-slate-400 text-sm">
                      Overs
                    </p>

                    <p className="text-2xl font-bold mt-1 text-white">
                      {i.overs}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#071028] border border-slate-800 p-4">
                    <p className="text-slate-400 text-sm">
                      Run Rate
                    </p>

                    <p className="text-2xl font-bold mt-1 text-white">
                      {i.runRate}
                    </p>
                  </div>

                </div>

                {i.requiredRate && (
                  <div className="mt-5 inline-flex items-center px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 font-semibold">
                    Required RR: {i.requiredRate}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Target */}
        {summary?.target && (
          <div className="bg-emerald-500 text-slate-950 rounded-3xl p-5 text-center shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wider">
              Target
            </p>

            <h2 className="text-3xl sm:text-5xl font-black mt-2">
              {summary.target}
            </h2>
          </div>
        )}
      </div>
    </main>
  );
}