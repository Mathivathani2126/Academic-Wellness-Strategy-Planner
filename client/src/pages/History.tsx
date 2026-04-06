import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, RotateCcw, Filter, ChevronDown, 
  TrendingUp, TrendingDown, Star, Sparkles, Plus, Clock
} from 'lucide-react';

export default function History() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Favorites'>('All');
  
  // Local storage for favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorite_strategies');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorite_strategies', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/strategies', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStrategies(data);
        }
      } catch (error) {
        console.error('Failed to fetch history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const filteredStrategies = filter === 'Favorites' 
    ? strategies.filter(s => favorites.includes(s._id || s.id))
    : strategies;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Strategy Journey</h1>
            <p className="text-slate-500">A timeline of your generated strategies</p>
        </div>
        
        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-xl border border-white/60 shadow-sm self-start">
            <button 
                onClick={() => setFilter('All')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white/60'}`}
            >
                All History
            </button>
            <button 
                onClick={() => setFilter('Favorites')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === 'Favorites' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white/60'}`}
            >
                Favorites
            </button>
        </div>
      </div>

      {filteredStrategies.length === 0 ? (
        <div className="glass min-h-[60vh] flex flex-col justify-center items-center p-12 text-center rounded-3xl border-white/60 relative overflow-hidden shadow-xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
            <div className="w-24 h-24 bg-white shadow-xl bg-opacity-60 rounded-full flex items-center justify-center mb-6">
                <Sparkles size={48} className="text-indigo-500 drop-shadow-md" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">No strategies found</h3>
            <p className="text-slate-500 text-lg max-w-md mb-8">
                {filter === 'Favorites' 
                    ? "You haven't favorited any strategies yet. Star a strategy to pin it here."
                    : "You haven't created any strategies yet. Start planning today!"}
            </p>
            {filter !== 'Favorites' && (
                <button onClick={() => navigate('/planner')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 hover:-translate-y-1">
                    <Plus size={20} /> Plan a Strategy
                </button>
            )}
        </div>
      ) : (
        <div className="relative pl-4 md:pl-8 space-y-8">
            {/* Timeline Line */}
            <div className="absolute left-[15px] md:left-[31px] top-4 bottom-4 w-0.5 bg-linear-to-b from-indigo-500 via-purple-400 to-transparent opacity-30"></div>

            <AnimatePresence>
                {filteredStrategies.map((strategy, index) => {
                    const strategyId = strategy._id || strategy.id;
                    const isFaved = favorites.includes(strategyId);
                    const isCurrent = index === 0 && filter === 'All';

                    return (
                        <motion.div 
                            key={strategyId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative pl-8 md:pl-12"
                        >
                            {/* Timeline Node */}
                            <div className={`absolute left-0 top-6 w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 transition-colors ${
                                isCurrent 
                                    ? 'bg-indigo-600 border-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.5)]' 
                                    : 'bg-white border-indigo-400 shadow-sm'
                            }`}>
                                {isCurrent ? <div className="w-2 h-2 bg-white rounded-full"></div> : <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>}
                            </div>
                            
                            <div className={`glass p-6 md:p-8 rounded-3xl border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 group ${isCurrent ? 'ring-2 ring-indigo-500/20' : ''}`}>
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{strategy.name || `Strategy ${new Date(strategy.createdAt || strategy.created_at).toLocaleDateString()}`}</h4>
                                            {isCurrent && (
                                                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-black rounded-lg uppercase tracking-wider shadow-sm">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                                            <span className="flex items-center gap-1.5 bg-white/50 px-2.5 py-1 rounded-md border border-slate-100 shadow-sm">
                                                <Calendar size={14} className="text-indigo-500" />
                                                {new Date(strategy.createdAt || strategy.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-white/50 px-2.5 py-1 rounded-md border border-slate-100 shadow-sm">
                                                <Clock size={14} className="text-amber-500" />
                                                {new Date(strategy.createdAt || strategy.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 items-center w-full md:w-auto mt-2 md:mt-0">
                                        <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 border flex-1 md:flex-none justify-center ${
                                            (strategy.wellnessScore || strategy.wellness_score) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            (strategy.wellnessScore || strategy.wellness_score) >= 50 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                            Score: {strategy.wellnessScore || strategy.wellness_score}
                                        </div>
                                        
                                        <button 
                                            onClick={(e) => toggleFavorite(strategyId, e)}
                                            className={`p-2.5 rounded-xl border shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-200 ${
                                                isFaved 
                                                    ? 'bg-amber-100 border-amber-200 text-amber-500 hover:bg-amber-200' 
                                                    : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50'
                                            }`}
                                            title="Favorite this strategy"
                                        >
                                            <Star size={18} fill={isFaved ? "currentColor" : "none"} />
                                        </button>

                                        <button 
                                            onClick={() => navigate('/planner', { state: strategy })}
                                            className="p-2.5 bg-white border border-slate-200 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100 flex items-center gap-2 font-medium"
                                            title="Reapply this strategy"
                                        >
                                            <RotateCcw size={18} />
                                            <span className="hidden md:inline text-sm font-semibold">Reapply</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white/40 rounded-2xl border border-white/60 shadow-inner">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">Study</p>
                                        <p className="font-bold text-slate-900 text-lg">{strategy.studyHours || strategy.study_hours} <span className="text-sm font-medium text-slate-500">hrs</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">Sleep</p>
                                        <p className="font-bold text-slate-900 text-lg">{strategy.sleepHours || strategy.sleep_hours} <span className="text-sm font-medium text-slate-500">hrs</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">Exam Freq</p>
                                        <p className="font-bold text-slate-900 text-lg capitalize">{strategy.examFrequency || strategy.exam_frequency}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Focus</p>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {strategy.subjects && strategy.subjects.length > 0 ? (
                                                strategy.subjects.slice(0, 2).map((s: string, i: number) => (
                                                    <span key={i} className="text-xs bg-indigo-100 border border-indigo-200 shadow-sm text-indigo-700 px-2 py-0.5 rounded-lg font-semibold truncate max-w-[80px]">
                                                        {s}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-slate-400 font-medium">-</span>
                                            )}
                                            {strategy.subjects && strategy.subjects.length > 2 && (
                                                <span className="text-xs bg-slate-100 border border-slate-200 shadow-sm text-slate-600 px-1.5 py-0.5 rounded-lg font-bold">
                                                    +{strategy.subjects.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
