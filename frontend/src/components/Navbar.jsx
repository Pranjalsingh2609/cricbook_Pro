import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem('token');
    navigate('/login');
  }
  return <div className="flex justify-between items-center p-5 border-b border-slate-800">
    <Link to="/" className="text-2xl font-bold text-emerald-400">CricArena</Link>
    <div className="flex gap-3">
      <Link className="btn" to="/create">Create Tournament</Link>
      <button className="rounded-lg bg-slate-800 px-4 py-2" onClick={logout}>Logout</button>
    </div>
  </div>;
}
