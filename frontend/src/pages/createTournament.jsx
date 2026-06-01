import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../api/client';

export default function CreateTournament() {
  const [name, setName] = useState('College Premier League');
  const [mode, setMode] = useState('league');
  const [overs, setOvers] = useState(10);
  const [teams, setTeams] = useState(['Team A','Team B','Team C','Team D']);
  const navigate = useNavigate();

  function changeTeam(i, value) {
    const next = [...teams]; next[i] = value; setTeams(next);
  }

  async function submit(e) {
    e.preventDefault();
    const payload = { name, mode, overs: Number(overs), teams: teams.filter(Boolean).map(t => ({ name: t })) };
    const { data } = await api.post('/tournaments', payload);
    navigate(`/tournaments/${data.tournament.id}`);
  }

  return <><Navbar /><main className="p-6 max-w-3xl mx-auto">
    <form onSubmit={submit} className="card space-y-4">
      <h1 className="text-3xl font-bold">Create Tournament</h1>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Tournament name" />
      <select className="input" value={mode} onChange={e=>setMode(e.target.value)}>
        <option value="single">Single Match</option><option value="league">League</option><option value="knockout">Knockout</option><option value="league_knockout">League + Knockout</option><option value="custom">Custom</option>
      </select>
      <input className="input" value={overs} type="number" onChange={e=>setOvers(e.target.value)} placeholder="Overs" />
      <div className="space-y-2">
        <div className="flex justify-between"><h2 className="font-bold">Teams</h2><button type="button" className="btn" onClick={()=>setTeams([...teams,''])}>Add Team</button></div>
        {teams.map((t,i)=><input key={i} className="input" value={t} onChange={e=>changeTeam(i,e.target.value)} placeholder={`Team ${i+1}`} />)}
      </div>
      <button className="btn w-full">Save Tournament</button>
    </form>
  </main></>;
}
