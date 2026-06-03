import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  Plus,
  ChevronRight,
} from 'lucide-react';

import Navbar from '../components/Navbar';
import { api } from '../api/client';

export default function CreateTournament() {
  const [name, setName] = useState('College Premier League');
  const [mode, setMode] = useState('league');
  const [overs, setOvers] = useState(10);
  const [teams, setTeams] = useState([
    'Team A',
    'Team B',
    'Team C',
    'Team D',
  ]);

  const navigate = useNavigate();

  function changeTeam(i, value) {
    const next = [...teams];
    next[i] = value;
    setTeams(next);
  }

  async function submit(e) {
    e.preventDefault();

    const payload = {
      name,
      mode,
      overs: Number(overs),
      teams: teams
        .filter(Boolean)
        .map((t) => ({ name: t })),
    };

    const { data } = await api.post(
      '/tournaments',
      payload
    );

    navigate(`/tournaments/${data.tournament.id}`);
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#071028] px-4 py-10">
        <div className="max-w-4xl mx-auto">

          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Trophy className="text-emerald-400" size={28} />
              </div>

              <div>
                <h1 className="text-4xl font-extrabold text-white">
                  Create Tournament
                </h1>

                <p className="text-slate-400 mt-1">
                  Organize your cricket tournament professionally
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}
          <form
            onSubmit={submit}
            className="bg-[#0d1735] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8"
          >
            {/* TOURNAMENT NAME */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Tournament Name
              </label>

              <input
                className="w-full h-14 px-5 rounded-xl bg-[#111c40] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter tournament name"
              />
            </div>

            {/* MODE + OVERS */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Tournament Mode
                </label>

                <select
                  className="w-full h-14 px-5 rounded-xl bg-[#111c40] border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  value={mode}
                  onChange={(e) =>
                    setMode(e.target.value)
                  }
                >
                  <option value="single">
                    Single Match
                  </option>

                  <option value="league">
                    League
                  </option>

                  <option value="knockout">
                    Knockout
                  </option>

                  <option value="league_knockout">
                    League + Knockout
                  </option>

                  <option value="custom">
                    Custom
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Overs
                </label>

                <input
                  type="number"
                  className="w-full h-14 px-5 rounded-xl bg-[#111c40] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  value={overs}
                  onChange={(e) =>
                    setOvers(e.target.value)
                  }
                  placeholder="Overs"
                />
              </div>
            </div>

            {/* TEAMS */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Users
                    className="text-emerald-400"
                    size={20}
                  />

                  <h2 className="text-xl font-bold text-white">
                    Teams
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setTeams([...teams, ''])
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all duration-200 hover:scale-105"
                >
                  <Plus size={18} />
                  Add Team
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {teams.map((t, i) => (
                  <div
                    key={i}
                    className="relative"
                  >
                    <input
                      className="w-full h-14 px-5 rounded-xl bg-[#111c40] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      value={t}
                      onChange={(e) =>
                        changeTeam(
                          i,
                          e.target.value
                        )
                      }
                      placeholder={`Team ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* BUTTON */}
            <button
              className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-emerald-500/20"
            >
              Save Tournament
              <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </main>
    </>
  );
}