import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../api/client';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/tournaments').then(r => setItems(r.data)); }, []);
  return <><Navbar /><main className="p-6 max-w-6xl mx-auto">
    <h1 className="text-3xl font-bold mb-5">Your Tournaments</h1>
    <div className="grid md:grid-cols-3 gap-4">
      {items.map(t => <Link key={t.id} to={`/tournaments/${t.id}`} className="card hover:border-emerald-500">
        <h2 className="text-xl font-bold">{t.name}</h2>
        <p className="text-slate-400">Mode: {t.mode}</p>
        <p className="text-slate-400">Overs: {t.overs}</p>
        <p className="text-emerald-400">{t.status}</p>
      </Link>)}
    </div>
  </main></>;
}
