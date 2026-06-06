import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar, Users } from "lucide-react";

import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function TournamentDetails() {
  const { id } = useParams();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tournament-details", id],
    queryFn: async () => {
      const res = await api.get(`/tournaments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  async function generate() {
    await api.post(`/tournaments/${id}/generate-fixtures`, {
      random: true,
    });

    refetch();
  }

  if (isLoading || !data) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen flex items-center justify-center bg-[#071028] text-white">
          <p className="text-lg font-semibold">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen bg-cover bg-center bg-fixed relative"
        style={{
          backgroundImage:
            "url('https://png.pngtree.com/thumb_back/fh260/background/20250705/pngtree-cricket-stadium-at-night-filled-with-spectators-and-bright-spotlights-illuminating-image_17468260.webp')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#071028]/85 backdrop-blur-sm" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
          {/* Tournament Header */}
          <div className="bg-[#0d1735]/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                  <Trophy className="text-emerald-400" size={28} />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                    {data.tournament.name}
                  </h1>

                  <div className="flex flex-wrap gap-4 mt-3 text-slate-400 text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} />
                      <span className="capitalize">{data.tournament.mode}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users size={18} />
                      <span>{data.teams.length} Teams</span>
                    </div>

                    <span>{data.tournament.overs} Overs</span>
                  </div>
                </div>
              </div>

              <button
                onClick={generate}
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20"
              >
                Generate Fixtures
              </button>
            </div>
          </div>

          {/* Points Table */}
          <section className="bg-[#0d1735]/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Points Table</h2>

            <div className="overflow-x-auto">
              <table className="w-full `min-w-162.5` text-left text-white">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-3 px-2">Team</th>
                    <th className="py-3 px-2 text-center">P</th>
                    <th className="py-3 px-2 text-center">W</th>
                    <th className="py-3 px-2 text-center">L</th>
                    <th className="py-3 px-2 text-center">Pts</th>
                    <th className="py-3 px-2 text-center">NRR</th>
                  </tr>
                </thead>

                <tbody>
                  {data.teams.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-800 hover:bg-white/5 transition"
                    >
                      <td className="py-4 px-2 font-semibold">{t.name}</td>

                      <td className="py-4 px-2 text-center">{t.played}</td>

                      <td className="py-4 px-2 text-center">{t.won}</td>

                      <td className="py-4 px-2 text-center">{t.lost}</td>

                      <td className="py-4 px-2 text-center font-bold text-emerald-400">
                        {t.points}
                      </td>

                      <td className="py-4 px-2 text-center">
                        {t.nrr || "0.000"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          
          {/* Fixtures Banner */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">
            <img
              src="https://www.sakshi.com/gallery_images/2023/11/18/Captains%20Rohit%20Sharma%20and%20Pat%20Cummins%20with%20the%20trophy%20ahead%20of%202023%20World%20Cup%20final%20Photos_8.jpg"
              alt="Tournament Fixtures"
              className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover"
            />
          </div>

          {/* Match Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.matches.map((m) => (
              <div
                key={m.id}
                className="bg-[#0d1735]/90 border border-slate-800 rounded-3xl p-5 shadow-2xl hover:border-emerald-500/40 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-bold">
                    Match {m.match_no}
                  </span>

                  <span className="text-slate-400 text-sm">{m.round_name}</span>
                </div>

                <h3 className="text-xl font-bold text-white leading-relaxed">
                  {m.team_a_name}
                </h3>

                <p className="text-center text-emerald-400 font-bold my-3">
                  VS
                </p>

                <h3 className="text-xl font-bold text-white leading-relaxed">
                  {m.team_b_name}
                </h3>

                <div className="mt-5">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      m.status === "completed"
                        ? "bg-blue-500/15 text-blue-400"
                        : m.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Link
                    to={`/matches/${m.id}/admin`}
                    className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center transition"
                  >
                    Admin Score
                  </Link>

                  <Link
                    to={`/matches/${m.id}/live`}
                    className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                  >
                    Live View
                  </Link>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
