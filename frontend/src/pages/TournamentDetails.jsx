import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
    return <p className="p-6">Loading...</p>;
  }

  return (
    <>
      <Navbar />

      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div className="card flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {data.tournament.name}
            </h1>

            <p className="text-slate-400">
              {data.tournament.mode} • {data.tournament.overs} overs
            </p>
          </div>

          <button onClick={generate} className="btn w-full sm:w-auto">
            Generate Random Fixtures
          </button>
        </div>

        <section className="card">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            Points Table
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-130 text-left">
              <thead>
                <tr className="text-slate-400">
                  <th className="py-2">Team</th>
                  <th className="py-2">P</th>
                  <th className="py-2">W</th>
                  <th className="py-2">L</th>
                  <th className="py-2">Pts</th>
                  <th className="py-2">NRR</th>
                </tr>
              </thead>

              <tbody>
                {data.teams.map((t) => (
                  <tr key={t.id} className="border-t border-slate-800">
                    <td className="py-2">{t.name}</td>
                    <td className="py-2">{t.played}</td>
                    <td className="py-2">{t.won}</td>
                    <td className="py-2">{t.lost}</td>
                    <td className="py-2">{t.points}</td>
                    <td className="py-2">{t.nrr || "0.000"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.matches.map((m) => (
            <div key={m.id} className="card">
              <p className="text-emerald-400">
                Match {m.match_no} • {m.round_name}
              </p>

              <h3 className="text-lg sm:text-xl font-bold">
                {m.team_a_name} vs {m.team_b_name}
              </h3>

              <p className="text-slate-400">Status: {m.status}</p>

              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Link className="btn text-center" to={`/matches/${m.id}/admin`}>
                  Admin Score
                </Link>

                <Link
                  className="rounded-lg bg-slate-800 px-4 py-2 text-center"
                  to={`/matches/${m.id}/live`}
                >
                  Live View
                </Link>
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}