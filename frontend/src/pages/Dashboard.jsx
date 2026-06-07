import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Plus,
  Activity,
  FileText,
  CheckCircle,
  ArrowRight,
  Trash2,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function Dashboard() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/tournaments").then((r) => setItems(r.data));
  }, []);

  const total = items.length;
  const active = items.filter((t) => t.status === "active").length;
  const completed = items.filter((t) => t.status === "completed").length;
  const draft = items.filter((t) => t.status === "draft").length;

  const handleDelete = async (id, e) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this tournament?",
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/tournaments/${id}`);

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete tournament.");
    }
  };

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen overflow-hidden text-white">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage:
              "url('https://i.pinimg.com/736x/9d/98/97/9d9897e66dcbade91c24545d00053320.jpg')",
            filter: "brightness(1.1)",
          }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-[#071028]/50 backdrop-blur-[1px]" />

        {/* Content */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 sm:py-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Hero */}
            <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold mb-4 backdrop-blur-md">
                  <Trophy size={18} />
                  Dashboard
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  Your Matches
                </h1>

                <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-2xl">
                  Manage cricket tournaments, matches, teams, players and live
                  scoring from one professional dashboard.
                </p>
              </div>

              <Link
                to="/create"
                className="
            w-full sm:w-auto
            inline-flex items-center justify-center gap-2
            h-12 sm:h-14
            px-6
            rounded-xl
            bg-emerald-500
            hover:bg-emerald-400
            text-slate-950
            font-bold
            transition-all duration-200
            hover:scale-[1.02]
            shadow-lg shadow-emerald-500/30
          "
              >
                <Plus size={20} />
                Create Tournament
              </Link>

              <Link
                to="/sports"
                className="
                   w-full sm:w-auto
                   inline-flex items-center justify-center gap-2
                   h-12 sm:h-14
                   px-6
                   rounded-xl
                 bg-blue-500
                 hover:bg-blue-400
                 text-white
                   font-bold
                   transition-all duration-200
                   shadow-lg
                    "
              >
                🏆 Other Games
              </Link>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              <StatCard
                title="Total Tournaments"
                value={total}
                icon={<Trophy />}
              />

              <StatCard
                title="Active"
                value={active}
                icon={<Activity />}
                accent="emerald"
              />

              <StatCard
                title="Draft"
                value={draft}
                icon={<FileText />}
                accent="amber"
              />

              <StatCard
                title="Completed"
                value={completed}
                icon={<CheckCircle />}
                accent="blue"
              />
            </section>

            {/* Tournament List */}
            <section className="bg-slate-900/55 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    Tournament List
                  </h2>

                  <p className="text-slate-400 text-sm mt-1">
                    {total} records found
                  </p>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 sm:py-16 border border-dashed border-slate-700 rounded-2xl bg-[#111c40]/60 backdrop-blur-md">
                  <h3 className="text-lg sm:text-2xl font-bold mb-2">
                    No tournaments yet
                  </h3>

                  <p className="text-slate-400 mb-6">
                    Create your first tournament and start managing matches.
                  </p>

                  <Link
                    to="/create"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
                  >
                    <Plus size={18} />
                    Create Tournament
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((t) => (
                    <Link
                      key={t.id}
                      to={`/tournaments/${t.id}`}
                      className="group rounded-2xl bg-slate-900/50 border border-white/10 p-4 sm:p-5 hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold wrap-break-words group-hover:text-emerald-400 transition">
                            {t.name}
                          </h3>

                          <p className="text-slate-500 text-sm mt-1">
                            ID: {String(t.id).slice(0, 8)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={t.status} />

                          <button
                            onClick={(e) => handleDelete(t.id, e)}
                            className="p-2 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition"
                            title="Delete Tournament"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-5">
                        <InfoBox label="Mode" value={t.mode} />
                        <InfoBox label="Overs" value={t.overs} />
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-slate-400 text-sm">
                          Open tournament
                        </span>

                        <ArrowRight
                          size={20}
                          className="text-emerald-400 group-hover:translate-x-1 transition"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ title, value, icon, accent = "slate" }) {
  const colors = {
    slate: "text-slate-300 bg-slate-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    blue: "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="group rounded-2xl bg-slate-900/50 border border-white/10 p-4 sm:p-5 hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300">
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-slate-400 font-medium">{title}</p>

        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${colors[accent]}`}
        >
          {icon}
        </div>
      </div>

      <h2 className="text-2xl sm:text-4xl font-extrabold mt-4">{value}</h2>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-900/50 border border-white/10 p-3">
      <p className="text-xs sm:text-sm text-slate-500">{label}</p>

      <p className="font-semibold capitalize mt-1 wrap-break-words">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const style =
    status === "active"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
      : status === "completed"
        ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
        : "bg-amber-500/15 text-amber-400 border-amber-500/20";

  return (
    <span
      className={`self-start whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold capitalize border ${style}`}
    >
      {status}
    </span>
  );
}
