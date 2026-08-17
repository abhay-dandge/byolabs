import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Lab } from '@byolabs/shared';
import { Terminal, Search, Clock, Cpu, HardDrive, Play, Filter, AlertCircle } from 'lucide-react';

export const LabsCatalogPage: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [startingLabId, setStartingLabId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const res = await api.getLabs();
      setLabs(res.labs);
    } catch (err: any) {
      setError(err.message || 'Failed to load labs catalog');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Linux', 'Docker', 'Kubernetes', 'Git', 'Ansible', 'Terraform'];

  const filteredLabs = labs.filter((lab) => {
    const matchesCategory = selectedCategory === 'All' || lab.category === selectedCategory;
    const matchesSearch =
      lab.name.toLowerCase().includes(search.toLowerCase()) ||
      lab.description.toLowerCase().includes(search.toLowerCase()) ||
      lab.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStartLab = async (labId: string) => {
    setStartingLabId(labId);
    setError(null);

    try {
      const res = await api.startLab(labId);
      navigate(`/lab/${res.session.id}`);
    } catch (err: any) {
      setError(err.message || 'We could not start your lab environment.');
    } finally {
      setStartingLabId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Interactive Labs Catalog</h1>
          <p className="text-slate-400 text-sm mt-1">Select a DevOps environment to launch a dedicated Kubernetes Pod workspace.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search labs or tools..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Lab Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">Loading catalog...</div>
      ) : filteredLabs.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          No labs found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.map((lab) => (
            <div
              key={lab.id}
              className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800/50">
                    {lab.category}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      lab.difficulty === 'Beginner'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : lab.difficulty === 'Intermediate'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {lab.difficulty}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition">{lab.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">{lab.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">{lab.dockerImage}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{lab.durationMinutes}m max</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CPU: {lab.cpuLimit} core</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    <span>RAM: {lab.memoryLimit}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => handleStartLab(lab.id)}
                  disabled={startingLabId === lab.id}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition transform group-hover:scale-[1.02]"
                >
                  {startingLabId === lab.id ? (
                    <span>Provisioning Pod...</span>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>START LAB</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
