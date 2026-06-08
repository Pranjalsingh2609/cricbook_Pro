import { Trophy, Users, Calendar, Activity } from "lucide-react";

export default function Kabaddi() {
  const categories = [
    {
      title: "Circle Kabaddi",
      icon: "🤼",
      description:
        "Traditional Punjabi-style kabaddi played in a circular field with powerful raids and tackles.",
      teams: 20,
      matches: 40,
      color: "from-red-500 to-orange-500",
    },
    {
      title: "National Style Kabaddi",
      icon: "🏆",
      description:
        "Modern mat-based kabaddi played under national federation rules and tournament formats.",
      teams: 16,
      matches: 32,
      color: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <main className="min-h-screen bg-[#071028] text-white">
      {/* Header */}
      <div className="bg-linear-to-r from-red-900 via-orange-900 to-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-5xl font-bold mb-3">
            🤼 Kabaddi Tournament
          </h1>

          <p className="text-slate-300 text-lg">
            Manage kabaddi leagues, player registrations, fixtures and live
            scoring.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Users size={28} className="mb-3 text-cyan-400" />
            <h3 className="text-slate-400">Teams</h3>
            <p className="text-3xl font-bold">36</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Trophy size={28} className="mb-3 text-yellow-400" />
            <h3 className="text-slate-400">Tournaments</h3>
            <p className="text-3xl font-bold">2</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Calendar size={28} className="mb-3 text-green-400" />
            <h3 className="text-slate-400">Matches</h3>
            <p className="text-3xl font-bold">72</p>
          </div>

          <div className="bg-[#0d1735] rounded-2xl p-5 border border-slate-800">
            <Activity size={28} className="mb-3 text-red-400" />
            <h3 className="text-slate-400">Live Matches</h3>
            <p className="text-3xl font-bold">4</p>
          </div>
        </div>

        {/* Categories */}
        <h2 className="text-3xl font-bold mb-6">
          Kabaddi Categories
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div
              key={category.title}
              className="bg-[#0d1735] rounded-3xl border border-slate-800 overflow-hidden hover:border-red-500 transition-all"
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

                <button className="mt-6 w-full py-3 rounded-xl bg-linear-to-r from-red-500 to-orange-600 font-semibold hover:opacity-90 transition">
                  View Tournament
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Results */}
        <div className="mt-10 bg-[#0d1735] rounded-3xl border border-slate-800 p-6">
          <h2 className="text-2xl font-bold mb-5">
            Recent Matches
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Warriors Kabaddi Club vs Tigers</span>
              <span className="text-emerald-400">
                Warriors Won 42-35
              </span>
            </div>

            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Royal Raiders vs Panthers</span>
              <span className="text-yellow-400">
                Live • 2nd Half
              </span>
            </div>

            <div className="flex justify-between bg-slate-900 p-4 rounded-xl">
              <span>Town Challengers vs Thunder Squad</span>
              <span className="text-emerald-400">
                Challengers Won 38-30
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}