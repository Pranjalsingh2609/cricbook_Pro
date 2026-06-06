import { useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();

    try {
      if (isRegister) {
        await api.post("/auth/register", form);
      }

      const { data } = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      alert(err?.response?.data?.message || "Something went wrong");
    }
  }
return (
  <main
    className="min-h-screen flex items-center justify-center px-4 py-6 relative overflow-hidden bg-cover bg-center bg-no-repeat"
style={{
  backgroundImage:
    "url('https://img.magnific.com/premium-vector/cricket-championship-design-concept-with-vector-illustration_30996-8233.jpg?semt=ais_hybrid&w=740&q=80')",
}}
  >
    {/* Dark Overlay */}
    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]" />

    {/* Background Effects */}
    <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-500/20 blur-[100px] sm:blur-[140px] rounded-full" />

    <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/20 blur-[100px] sm:blur-[140px] rounded-full" />

    {/* Login Card */}
    <form
      onSubmit={submit}
      className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-5 sm:p-8"
    >
      {/* Decorative Overlay */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col items-center mb-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg mb-4">
          <Trophy className="text-white w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
          CricBook Pro
        </h1>

        <p className="text-slate-300 text-center text-sm sm:text-base mt-2">
          {isRegister
            ? "Create your account and start scoring matches"
            : "Welcome back to your cricket dashboard"}
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-4 relative">
        {isRegister && (
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all duration-200 text-white font-semibold py-3 rounded-xl shadow-lg text-sm sm:text-base"
      >
        {isRegister ? "Create Account" : "Login"}
      </button>

      {/* Toggle */}
      <button
        type="button"
        onClick={() => setIsRegister(!isRegister)}
        className="w-full mt-4 text-sm sm:text-base text-emerald-400 hover:text-emerald-300 transition"
      >
        {isRegister
          ? "Already have an account? Login"
          : "New user? Create Account"}
      </button>
    </form>
  </main>
);
}