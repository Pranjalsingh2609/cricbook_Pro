import { Trophy, Users, Calendar, Activity } from "lucide-react";

export default function Hockey() {
  const categories = [
    {
      title: "Grass Hockey Tournament",
      icon: "🏑",
      description:
        "Traditional hockey competition played on natural grass grounds between local clubs and teams.",
      teams: 18,
      matches: 36,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Field Hockey Championship",
      icon: "🏆",
      description:
        "Professional-style field hockey league featuring group stages, semifinals and finals.",
      teams: 12,
      matches: 30,
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <main className="min-h-screen bg-[#071028] text-white">
      {/* Header */}
      <div className="bg-linear-to-r from-orange-900 via-amber-900 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-5xl font-bold mb-3">
            🏑 Hockey Tournament
          </h1>

          <p className="text-slate-300 text-lg">
            Manage hockey tournaments, fixtures, teams and live scoring.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Users size={28} className="mb-3 text-cyan-400" />
            <h3 className="text-slate-400">Teams</h3>
            <p className="text-3xl font-bold">30</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Trophy size={28} className="mb-3 text-yellow-400" />
            <h3 className="text-slate-400">Tournaments</h3>
            <p className="text-3xl font-bold">2</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Calendar size={28} className="mb-3 text-green-400" />
            <h3 className="text-slate-400">Matches</h3>
            <p className="text-3xl font-bold">66</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Activity size={28} className="mb-3 text-red-400" />
            <h3 className="text-slate-400">Live Matches</h3>
            <p className="text-3xl font-bold">2</p>
          </div>
        </div>

        {/* Categories */}
        <h2 className="text-3xl font-bold mb-6">
          Hockey Categories
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div
              key={category.title}
              className="bg-[#0d1735] rounded-3xl border border-slate-800 overflow-hidden hover:border-orange-500 transition-all"
            >
              <div
                className={`h-3 bg-linear-to-r ${category.color}`}
              ></div>

              <div className="p-6">
                <div className="text-6xl mb-4">
                  {category.icon}
                </div>

                <h3 className="text-2xl font-bold mb-3">
                  {category.title}
                </h3>

                <p className="text-slate-400 mb-6">
                  {category.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-slate-500 text-sm">
                      Teams
                    </p>
                    <p className="text-2xl font-bold">
                      {category.teams}
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-slate-500 text-sm">
                      Matches
                    </p>
                    <p className="text-2xl font-bold">
                      {category.matches}
                    </p>
                  </div>
                </div>

                <button className="mt-6 w-full py-3 rounded-xl bg-linear-to-r from-orange-500 to-amber-600 font-semibold hover:opacity-90 transition">
                  View Championship
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Results */}
        <div className="mt-10 bg-[#0d1735] rounded-3xl border border-slate-800 p-6">
          <h2 className="text-2xl font-bold mb-5">
            Recent Results
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Hockey Kings vs Thunder Sticks</span>
              <span className="text-emerald-400">
                Kings Won 4-2
              </span>
            </div>

            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Town XI vs Warriors HC</span>
              <span className="text-yellow-400">
                Live • 3rd Quarter
              </span>
            </div>

            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Royal Hockey Club vs Panthers</span>
              <span className="text-emerald-400">
                Panthers Won 3-1
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}