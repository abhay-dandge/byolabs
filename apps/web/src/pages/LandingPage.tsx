import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, Cpu, Layers, Play, CheckCircle2, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Real Isolated Kubernetes Pod Environments</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Master Linux & DevOps with <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Browser-Based Kubernetes Pods
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Instant hands-on practice in isolated Ubuntu, Docker, Git, Kubernetes, Ansible, and Terraform labs. Every session provisions a dedicated container workspace directly in Kubernetes.
          </p>

          <div className="mt-10 flex justify-center space-x-4">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-cyan-500/20 flex items-center space-x-2 transition transform hover:-translate-y-0.5"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/labs"
              className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-base flex items-center space-x-2 transition"
            >
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>Explore Lab Catalog</span>
            </Link>
          </div>
        </div>

        {/* Live Interactive Terminal Preview Mockup */}
        <div className="max-w-4xl mx-auto mt-14 px-4">
          <div className="bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-panel glow-cyan">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
              <div className="flex space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-xs font-mono text-slate-400">lab-session-7f8d29c4 (Pod: ubuntu-24-04)</span>
            </div>
            <div className="p-6 font-mono text-sm space-y-3 text-left">
              <div className="text-emerald-400">$ kubectl get pods -n lab-user-7f8d29</div>
              <div className="text-slate-300">
                NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; READY &nbsp;&nbsp; STATUS &nbsp;&nbsp;&nbsp; RESTARTS &nbsp;&nbsp; AGE<br />
                ubuntu-lab-7f8d29c4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1/1 &nbsp;&nbsp;&nbsp;&nbsp; Running &nbsp;&nbsp; 0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 12s
              </div>
              <div className="text-emerald-400">$ cat /etc/os-release</div>
              <div className="text-slate-300">
                NAME="Ubuntu"<br />
                VERSION="24.04 LTS (Noble Numbat)"<br />
                PRETTY_NAME="Ubuntu 24.04 LTS"
              </div>
              <div className="text-emerald-400">$ whoami && pwd</div>
              <div className="text-slate-300">
                root<br />
                /root/devops
              </div>
              <div className="flex items-center text-cyan-400">
                <span>$ &nbsp;</span>
                <span className="w-2.5 h-4 bg-cyan-400 animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white">Built for True Hands-On Learning</h2>
          <p className="mt-3 text-slate-400">Zero fake simulations. Every user receives a genuine container instance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Kubernetes Namespace Isolation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every lab session creates a dedicated K8s namespace and Pod spec enforced with CPU/Memory ResourceQuotas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition group">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Browser Terminal (xterm.js)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Stream interactive bash/sh TTY sessions directly over WebSockets without installing local dependencies.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition group">
            <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated In-Pod Validation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Click "Verify Task" to run background validation scripts directly inside your pod to confirm objective completion.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
