import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Terminal, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.register({ name, email, username, password });
      setSuccessMsg(res.message);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl glass-panel">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create BYOLabs Account</h2>
          <p className="mt-2 text-xs text-slate-400">Join the interactive DevOps & Linux lab platform</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-800/60 text-amber-300 text-sm flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold text-amber-200 mb-1">Registration Submitted!</p>
              <p className="text-xs text-amber-300/90">{successMsg}</p>
              <div className="mt-3">
                <Link to="/login" className="inline-block px-3 py-1.5 rounded-lg bg-amber-900/60 text-white text-xs font-semibold hover:bg-amber-800">
                  Return to Sign In
                </Link>
              </div>
            </div>
          </div>
        )}

        {!successMsg && (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abhay Sharma"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abhay@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="abhay"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center transition mt-6"
            >
              {loading ? <span>Submitting Account...</span> : <span>Create Account</span>}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800/60">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
