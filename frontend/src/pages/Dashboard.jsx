import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../api/client';

export default function Dashboard() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/tournaments').then(r => setItems(r.data));
  }, []);

  const total = items.length;
  const active = items.filter(t => t.status === 'active').length;
  const completed = items.filter(t => t.status === 'completed').length;
  const draft = items.filter(t => t.status === 'draft').length;

  return (
    <>
      <Navbar />

      <main className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-emerald-400 font-semibold">Dashboard</p>
            <h1 className="text-4xl font-extrabold">Your Tournaments</h1>
            <p className="text-slate-400 mt-2">
              Manage tournaments, matches, teams, players and live scoring from one place.
            </p>
          </div>

          <Link
            to="/create"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl text-center"
          >
            + Create Tournament
          </Link>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-slate-400">Total Tournaments</p>
            <h2 className="text-3xl font-bold">{total}</h2>
          </div>

          <div className="card">
            <p className="text-slate-400">Active</p>
            <h2 className="text-3xl font-bold text-emerald-400">{active}</h2>
          </div>

          <div className="card">
            <p className="text-slate-400">Draft</p>
            <h2 className="text-3xl font-bold text-yellow-400">{draft}</h2>
          </div>

          <div className="card">
            <p className="text-slate-400">Completed</p>
            <h2 className="text-3xl font-bold text-blue-400">{completed}</h2>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Tournament List</h2>
            <p className="text-slate-400">{total} records found</p>
          </div>

          {items.length === 0 ? (
            <div className="card text-center py-12">
              <h3 className="text-2xl font-bold mb-2">No tournaments yet</h3>
              <p className="text-slate-400 mb-5">
                Create your first cricket tournament and start managing matches.
              </p>
              <Link
                to="/create"
                className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl"
              >
                Create Tournament
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map(t => (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.id}`}
                  className="card group hover:border-emerald-500 hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-emerald-400">
                        {t.name}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Tournament ID: {String(t.id).slice(0, 8)}
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      t.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : t.status === 'completed'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="bg-slate-900/70 rounded-xl p-3">
                      <p className="text-slate-400 text-sm">Mode</p>
                      <p className="font-semibold capitalize">{t.mode}</p>
                    </div>

                    <div className="bg-slate-900/70 rounded-xl p-3">
                      <p className="text-slate-400 text-sm">Overs</p>
                      <p className="font-semibold">{t.overs}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-700 flex items-center justify-between">
                    <p className="text-slate-400 text-sm">Open tournament</p>
                    <span className="text-emerald-400 group-hover:translate-x-1 transition">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}