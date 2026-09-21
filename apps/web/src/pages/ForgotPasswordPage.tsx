import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, KeyRound, ShieldAlert } from 'lucide-react';
import byolabsLogo from '../assets/byolabs-logo.png';

export const ForgotPasswordPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.forgotPassword({
        emailOrUsername,
        newPassword,
      });
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl glass-panel">
        <div className="text-center">
          <div className="bg-white/95 px-3 py-2 rounded-xl inline-block mx-auto mb-4 shadow-lg shadow-cyan-500/10">
            <img src={byolabsLogo} alt="BYOLabs.in" className="h-9 object-contain" />
          </div>
          <div className="flex items-center justify-center space-x-2 text-cyan-400 mb-2">
            <KeyRound className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-mono font-bold">Admin-Approved Reset</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Request Password Reset</h2>
          <p className="mt-2 text-xs text-slate-400">
            Submit your new password. Once an Administrator approves your request, your password will be updated with zero email authentication needed.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-sm flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-200 mb-1">Request Generated & Queued</p>
                <p className="text-xs text-emerald-300/90">{successMessage}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-800/40 text-xs text-slate-400 space-y-2">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>Next Step: Admin Approval</span>
              </div>
              <p>
                An Administrator will review your request in the <strong>Admin Dashboard &rarr; Password Resets</strong> tab. As soon as approved, you can immediately sign in with your new password.
              </p>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-xs text-slate-400 hover:text-white transition space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="you@example.com or username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Desired New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Desired Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-sm outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Submitting request...</span>
              ) : (
                <>
                  <span>Submit Password Reset Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800/60">
              Remember your current password?{' '}
              <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
