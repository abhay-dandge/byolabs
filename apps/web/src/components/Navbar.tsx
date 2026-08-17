import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Shield, LogOut, LayoutDashboard, BookOpen, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center">
                BYOLabs<span className="text-cyan-400">.in</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase -mt-1">
                Kubernetes Pod Labs
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/labs"
              className="text-slate-300 hover:text-white text-sm font-medium flex items-center space-x-1.5 transition"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Lab Catalog</span>
            </Link>

            {user && (
              <Link
                to="/dashboard"
                className="text-slate-300 hover:text-white text-sm font-medium flex items-center space-x-1.5 transition"
              >
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                <span>My Dashboard</span>
              </Link>
            )}

            {user && user.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 hover:text-white text-sm font-medium flex items-center space-x-1.5 transition shadow-lg shadow-indigo-950/50"
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Admin Console</span>
              </Link>
            )}

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center">
                      <UserCheck className="w-3 h-3 mr-0.5" /> APPROVED
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white text-sm font-medium px-3 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
