import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Plus,
  Activity,
  FileText,
  CheckCircle,
  ArrowRight,
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

  return (
    <>
      <Navbar />

     <main className="min-h-screen bg-[#071028] px-3 sm:px-4 lg:px-6 py-6 sm:py-10 text-white">
        <div className="max-w-7xl mx-auto space-y-8">
          <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold mb-4">
                <Trophy size={18} />
                Dashboard
              </div>

             <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Your Tournaments
              </h1>

              <p className="text-slate-400 mt-3 max-w-2xl">
                Manage cricket tournaments, matches, teams, players and live
                scoring from one professional dashboard.
              </p>
            </div>

            <Link
              to="/create"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
            >
              <Plus size={20} />
              Create Tournament
            </Link>
          </section>

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

          <section className="bg-[#0d1735] border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Tournament List</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {total} records found
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-10 sm:py-16 border border-dashed border-slate-700 rounded-2xl bg-[#111c40]/60">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">No tournaments yet</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {items.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tournaments/${t.id}`}
                   className="group rounded-2xl bg-[#111c40] border border-slate-700 p-4 sm:p-5" 
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold group-hover:text-emerald-400 transition">
                          {t.name}
                        </h3>

                        <p className="text-slate-500 text-sm mt-1">
                          ID: {String(t.id).slice(0, 8)}
                        </p>
                      </div>

                      <StatusBadge status={t.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <InfoBox label="Mode" value={t.mode} />
                      <InfoBox label="Overs" value={t.overs} />
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between">
                      <span className="text-slate-400 text-sm">
                        Open tournament
                      </span>

                      <ArrowRight
                        className="text-emerald-400 group-hover:translate-x-1 transition"
                        size={20}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
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
    <div className="rounded-2xl bg-[#0d1735] border border-slate-800 p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 font-medium">{title}</p>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[accent]}`}
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
    <div className="rounded-xl bg-[#071028]/80 border border-slate-800 p-3">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="font-semibold capitalize mt-1">{value}</p>
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
      className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${style}`}
    >
      {status}
    </span>
  );
}
