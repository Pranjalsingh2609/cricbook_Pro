import { useState } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();

    const url = isRegister
      ? '/auth/register'
      : '/auth/login';

    if (isRegister) {
      await api.post(url, form);
    }

    const { data } = await api.post(
      '/auth/login',
      {
        email: form.email,
        password: form.password,
      }
    );

    localStorage.setItem('token', data.token);
    navigate('/');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full top-0 left-0" />
      <div className="absolute w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full bottom-0 right-0" />

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-lg">
            <Trophy size={30} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white">
            CricBook Pro
          </h1>

          <p className="text-slate-300 mt-2 text-center">
            {isRegister
              ? 'Create your account and start scoring'
              : 'Welcome back to your cricket dashboard'}
          </p>
        </div>

        <div className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />
        </div>

        <button
          type="submit"
          className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 transition-all text-white font-semibold py-3 rounded-xl shadow-lg"
        >
          {isRegister ? 'Create Account' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() =>
            setIsRegister(!isRegister)
          }
          className="w-full mt-4 text-emerald-400 hover:text-emerald-300 transition"
        >
          {isRegister
            ? 'Already have an account? Login'
            : 'New user? Create Account'}
        </button>
      </form>
    </main>
  );
}