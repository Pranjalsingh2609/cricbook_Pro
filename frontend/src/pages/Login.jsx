import { useState } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    const url = isRegister ? '/auth/register' : '/auth/login';
    if (isRegister) await api.post(url, form);
    const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
    localStorage.setItem('token', data.token);
    navigate('/');
  }

  return <main className="min-h-screen grid place-items-center p-4">
    <form onSubmit={submit} className="card w-full max-w-md space-y-4">
      <h1 className="text-3xl font-bold">{isRegister ? 'Create account' : 'Login'} to CricArena</h1>
      {isRegister && <input className="input" placeholder="Name" onChange={e=>setForm({...form,name:e.target.value})} />}
      <input className="input" placeholder="Email" type="email" onChange={e=>setForm({...form,email:e.target.value})} />
      <input className="input" placeholder="Password" type="password" onChange={e=>setForm({...form,password:e.target.value})} />
      <button className="btn w-full">Continue</button>
      <button type="button" className="text-emerald-400" onClick={()=>setIsRegister(!isRegister)}>{isRegister ? 'Already have account?' : 'New user? Register'}</button>
    </form>
  </main>;
}
