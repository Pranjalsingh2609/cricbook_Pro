import { Link } from "react-router-dom";

const sports = [
  {
    name: "Volleyball",
    icon: "🏐",
    path: "/sports/volleyball",
  },
  {
    name: "Kabaddi",
    icon: "🤼",
    path: "/sports/kabaddi",
  },
  {
    name: "Football",
    icon: "⚽",
    path: "/sports/football",
  },
  {
    name: "Hockey",
    icon: "🏑",
    path: "/sports/hockey",
  },
  {
    name: "Basketball",
    icon: "🏀",
    path: "/sports/basketball",
  },
  {
    name: "Badminton",
    icon: "🏸",
    path: "/sports/badminton",
  },
];

export default function Sports() {
  return (
    <main className="min-h-screen bg-[#071028] p-6">
      <h1 className="text-4xl font-bold text-white mb-8">
        Other Games
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {sports.map((sport) => (
          <Link
            key={sport.name}
            to={sport.path}
            className="bg-[#0d1735] p-8 rounded-3xl border border-slate-800 hover:border-emerald-500 transition"
          >
            <div className="text-6xl mb-4">
              {sport.icon}
            </div>

            <h2 className="text-2xl font-bold text-white">
              {sport.name}
            </h2>
          </Link>
        ))}
      </div>
    </main>
  );
}