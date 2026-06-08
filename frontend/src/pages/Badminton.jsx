import { Trophy, Users, Calendar, Activity } from "lucide-react";

export default function Badminton() {
  const categories = [
    {
      title: "Singles Championship",
      icon: "🏸",
      description:
        "Individual badminton competition where players compete one-on-one for the championship title.",
      participants: 64,
      matches: 126,
      color: "from-cyan-500 to-blue-500",
    },
    {
      title: "Doubles Championship",
      icon: "🏆",
      description:
        "Team-based badminton tournament featuring men's, women's and mixed doubles categories.",
      participants: 32,
      matches: 64,
      color: "from-emerald-500 to-green-500",
    },
  ];

  return (
    <main className="min-h-screen bg-[#071028] text-white">
      {/* Header */}
      <div className="bg-linear-to-r from-cyan-900 via-blue-900 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-5xl font-bold mb-3">
            🏸 Badminton Tournament
          </h1>

          <p className="text-slate-300 text-lg">
            Manage badminton championships, players, fixtures and live scoring.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Users size={28} className="mb-3 text-cyan-400" />
            <h3 className="text-slate-400">Players</h3>
            <p className="text-3xl font-bold">96</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Trophy size={28} className="mb-3 text-yellow-400" />
            <h3 className="text-slate-400">Events</h3>
            <p className="text-3xl font-bold">2</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Calendar size={28} className="mb-3 text-green-400" />
            <h3 className="text-slate-400">Matches</h3>
            <p className="text-3xl font-bold">190</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Activity size={28} className="mb-3 text-red-400" />
            <h3 className="text-slate-400">Live Matches</h3>
            <p className="text-3xl font-bold">6</p>
          </div>
        </div>

        {/* Categories */}
        <h2 className="text-3xl font-bold mb-6">
          Tournament Categories
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div
              key={category.title}
              className="bg-[#0d1735] rounded-3xl border border-slate-800 overflow-hidden hover:border-cyan-500 transition-all"
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
                      Players
                    </p>
                    <p className="text-2xl font-bold">
                      {category.participants}
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

                <button className="mt-6 w-full py-3 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 font-semibold hover:opacity-90 transition">
                  View Championship
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Matches */}
        <div className="mt-10 bg-[#0d1735] rounded-3xl border border-slate-800 p-6">
          <h2 className="text-2xl font-bold mb-5">
            Recent Matches
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Rahul Sharma vs Aman Singh</span>
              <span className="text-emerald-400">
                Rahul Won 21-18, 21-16
              </span>
            </div>

            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Team Falcons vs Team Smashers</span>
              <span className="text-yellow-400">
                Live • Set 2
              </span>
            </div>

            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Vikram & Arjun vs Royals</span>
              <span className="text-emerald-400">
                Royals Won 2-1
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}