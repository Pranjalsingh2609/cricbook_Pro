import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Plus, ChevronRight, Trash2 } from "lucide-react";

import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function CreateTournament() {
  const navigate = useNavigate();

  const [name, setName] = useState("College Premier League");
  const [mode, setMode] = useState("league");
  const [overs, setOvers] = useState(10);
  const [teams, setTeams] = useState(["Team A", "Team B", "Team C", "Team D"]);
  const [sport, setSport] = useState("cricket");
  function changeTeam(index, value) {
    const updated = [...teams];
    updated[index] = value;
    setTeams(updated);
  }

  function removeTeam(index) {
    if (teams.length <= 2) {
      alert("Minimum 2 teams required");
      return;
    }

    setTeams(teams.filter((_, i) => i !== index));
  }

  async function submit(e) {
    e.preventDefault();

    const payload = {
      sport,
      name,
      mode,
      overs: sport === "cricket" ? Number(overs) : null,
      teams: teams.filter(Boolean).map((t) => ({
        name: t,
      })),
    };

    const { data } = await api.post("/tournaments", payload);

    navigate(`/tournaments/${data.tournament.id}`);
  }


  const sportImages = {
  cricket:
    "https://png.pngtree.com/thumb_back/fh260/background/20250705/pngtree-cricket-stadium-at-night-filled-with-spectators-and-bright-spotlights-illuminating-image_17468260.webp",

  volleyball:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b",

  football:
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018",

  kabaddi:
    "https://images.unsplash.com/photo-1547347298-4074fc3086f0",

  hockey:
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974",

  basketball:
    "https://images.unsplash.com/photo-1546519638-68e109498ffc",

  badminton:
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea",
};

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#071028] px-4 py-6 sm:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">
            <img
               src={sportImages[sport]}
              alt="Cricket Stadium"
              className="w-full h-52 sm:h-72 md:h-80 object-cover"
            />

            <div className="absolute inset-0 bg-linear-to-t from-[#071028] via-black/40 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center mb-3">
                <Trophy className="text-emerald-400" size={28} />
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
                Create {sport.charAt(0).toUpperCase() + sport.slice(1)}{" "}
                Tournament
              </h1>

              <p className="text-slate-200 text-sm sm:text-lg mt-2 max-w-md">
                Organize your {sport} tournament professionally
              </p>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="bg-[#0d1735] border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Tournament Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tournament name"
                className="
                  w-full
                  h-12 sm:h-14
                  px-4 sm:px-5
                  rounded-xl
                  bg-[#111c40]
                  border border-slate-700
                  text-white
                  placeholder:text-slate-500
                  focus:outline-none
                  focus:ring-2
                  focus:ring-emerald-500
                  transition
                "
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Sport
              </label>

              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="
                    w-full
                     h-12 sm:h-14
                    px-4 sm:px-5
                    rounded-xl
                 bg-[#111c40]
                    border border-slate-700
                    text-white
                    focus:outline-none
                    focus:ring-2
                    focus:ring-emerald-500
                  "
              >
                <option value="cricket">🏏 Cricket</option>
                <option value="volleyball">🏐 Volleyball</option>
                <option value="kabaddi">🤼 Kabaddi</option>
                <option value="football">⚽ Football</option>
                <option value="hockey">🏑 Hockey</option>
                <option value="basketball">🏀 Basketball</option>
                <option value="badminton">🏸 Badminton</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Tournament Mode
                </label>

                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="
                    w-full
                    h-12 sm:h-14
                    px-4 sm:px-5
                    rounded-xl
                    bg-[#111c40]
                    border border-slate-700
                    text-white
                    focus:outline-none
                    focus:ring-2
                    focus:ring-emerald-500
                  "
                >
                  <option value="single">Single Match</option>
                  <option value="league">League</option>
                  <option value="knockout">Knockout</option>
                  <option value="league_knockout">League + Knockout</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {sport === "cricket" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Overs
                  </label>

                  <input
                    type="number"
                    value={overs}
                    onChange={(e) => setOvers(e.target.value)}
                    className="
                        w-full
                        h-12 sm:h-14
                        px-4 sm:px-5
                        rounded-xl
                      bg-[#111c40]
                        border border-slate-700
                      text-white
                        focus:outline-none
                        focus:ring-2
                      focus:ring-emerald-500
                        "
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <Users className="text-emerald-400" size={20} />

                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Teams
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setTeams([...teams, ""])}
                  className="
                    w-full sm:w-auto
                    flex items-center justify-center gap-2
                    px-4 py-3
                    rounded-xl
                    bg-emerald-500
                    hover:bg-emerald-400
                    text-black
                    font-semibold
                    transition
                  "
                >
                  <Plus size={18} />
                  Add Team
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team, index) => (
                  <div key={index} className="flex gap-2 items-stretch">
                    <input
                      value={team}
                      onChange={(e) => changeTeam(index, e.target.value)}
                      placeholder={`Team ${index + 1}`}
                      className="
                        flex-1
                        h-12 sm:h-14
                        px-4 sm:px-5
                        rounded-xl
                        bg-[#111c40]
                        border border-slate-700
                        text-white
                        placeholder:text-slate-500
                        focus:outline-none
                        focus:ring-2
                        focus:ring-emerald-500
                      "
                    />

                    {teams.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeTeam(index)}
                        className="
                          min-w-12 h-12 sm:min-w-14 sm:h-14
                          rounded-xl
                          bg-red-500/10
                          border border-red-500/30
                          text-red-400
                          hover:bg-red-500
                          hover:text-white
                          transition
                          flex items-center justify-center
                          shrink-0
                        "
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              className="
                w-full
                h-12 sm:h-14
                rounded-xl
                bg-emerald-500
                hover:bg-emerald-400
                text-black
                text-base sm:text-lg
                font-bold
                flex items-center justify-center gap-2
                transition
                shadow-lg shadow-emerald-500/20
              "
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
