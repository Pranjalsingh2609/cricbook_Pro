import { Trophy, Users, Calendar, Activity } from "lucide-react";

export default function Volleyball() {
  const games = [
    {
      title: "Tennis Ball Volleyball",
      icon: "🎾",
      description:
        "Fast-paced volleyball played using a tennis ball. Popular in local town tournaments.",
      teams: 16,
      matches: 32,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Change Point Volleyball",
      icon: "🔄",
      description:
        "Traditional point-based volleyball format where sides change after fixed points.",
      teams: 12,
      matches: 24,
      color: "from-emerald-500 to-green-500",
    },
  ];

  return (
    <main className="min-h-screen bg-[#071028] text-white">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-900 via-blue-900 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-5xl font-bold mb-3">
            🏐 Volleyball Tournament
          </h1>

          <p className="text-slate-300 text-lg">
            Manage teams, matches, fixtures and live scoring.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Users size={28} className="mb-3 text-blue-400" />
            <h3 className="text-slate-400">Teams</h3>
            <p className="text-3xl font-bold">28</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Trophy size={28} className="mb-3 text-yellow-400" />
            <h3 className="text-slate-400">Tournaments</h3>
            <p className="text-3xl font-bold">2</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Calendar size={28} className="mb-3 text-green-400" />
            <h3 className="text-slate-400">Matches</h3>
            <p className="text-3xl font-bold">56</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Activity size={28} className="mb-3 text-red-400" />
            <h3 className="text-slate-400">Live Matches</h3>
            <p className="text-3xl font-bold">3</p>
          </div>
        </div>

        {/* Game Types */}
        <h2 className="text-3xl font-bold mb-6">
          Volleyball Categories
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {games.map((game) => (
            <div
              key={game.title}
              className="bg-[#0d1735] rounded-3xl border border-slate-800 overflow-hidden hover:border-emerald-500 transition-all"
            >
              <div
                className={`h-3 bg-linear-to-r ${game.color}`}
              ></div>

              <div className="p-6">
                <div className="text-6xl mb-4">
                  {game.icon}
                </div>

                <h3 className="text-2xl font-bold mb-3">
                  {game.title}
                </h3>

                <p className="text-slate-400 mb-6">
                  {game.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-slate-500 text-sm">
                      Teams
                    </p>
                    <p className="text-2xl font-bold">
                      {game.teams}
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-slate-500 text-sm">
                      Matches
                    </p>
                    <p className="text-2xl font-bold">
                      {game.matches}
                    </p>
                  </div>
                </div>

                <button className="mt-6 w-full py-3 rounded-xl bg-linear-to-r from-emerald-500 to-green-600 font-semibold hover:opacity-90 transition">
                  View Tournament
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-10 bg-[#0d1735] rounded-3xl border border-slate-800 p-6">
          <h2 className="text-2xl font-bold mb-5">
            Recent Matches
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Town Warriors vs City Smashers</span>
              <span className="text-emerald-400">
                Warriors Won
              </span>
            </div>

            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Rising Stars vs Thunder Club</span>
              <span className="text-yellow-400">
                Live
              </span>
            </div>

            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Royal Spikers vs Tigers</span>
              <span className="text-emerald-400">
                Tigers Won
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}