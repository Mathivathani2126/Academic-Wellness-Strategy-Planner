import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'motion/react';
import { 
  Brain, BarChart2, Clock, MessageSquare, Flame, Award, Sparkles, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

const QUOTES = [
  "Believe you can and you're halfway there.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Don't watch the clock; do what it does. Keep going.",
  "Education is the most powerful weapon which you can use to change the world."
];

export default function Dashboard() {
  const { user } = useAuth();
  const [quote, setQuote] = useState('');
  const [strategies, setStrategies] = useState<any[]>([]);
  
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    const fetchStrategies = async () => {
        try {
            const res = await fetch('/api/strategies', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    const sorted = data.sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());
                    setStrategies(sorted);
                }
            }
        } catch (error) {
            console.error('Failed to fetch strategies', error);
        }
    };
    fetchStrategies();
  }, []);

  const latestStrategy = strategies.length > 0 ? strategies[0] : null;

  const chartData = [...strategies].reverse().map(s => ({
      score: s.wellness_score || s.wellnessScore
  }));

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="glass p-8 rounded-3xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 w-full xl:w-auto">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600">{user?.username}</span> 👋
            </h1>
            <p className="text-slate-500 font-medium text-lg">Ready to optimize your academic journey today?</p>
            
            {/* Dashboard Mini Graph added here */}
            {strategies.length > 1 && (
                <div className="mt-6 p-4 bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp size={14} className="text-indigo-500" /> Recent Wellness Trend
                    </h4>
                    <div className="h-20 w-full max-w-sm">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorDashScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                <Tooltip cursor={false} contentStyle={{ borderRadius: '8px', border: 'none', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorDashScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
        
        {/* Mini Stats Snapshot */}
        {latestStrategy ? (
            <div className="flex gap-6 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10 w-full xl:w-auto overflow-x-auto self-start xl:self-auto">
                <div className="flex flex-col items-center px-4 min-w-[100px]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Wellness</p>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={16} className={(latestStrategy.wellness_score || latestStrategy.wellnessScore) >= 80 ? 'text-emerald-500' : 'text-indigo-500'} />
                      <p className={`text-2xl font-black ${
                          (latestStrategy.wellness_score || latestStrategy.wellnessScore) >= 80 ? 'text-emerald-600' : 
                          (latestStrategy.wellness_score || latestStrategy.wellnessScore) >= 50 ? 'text-indigo-600' : 'text-rose-500'
                      }`}>
                          {latestStrategy.wellness_score || latestStrategy.wellnessScore}
                      </p>
                    </div>
                </div>
                <div className="w-px bg-slate-200/60 hidden sm:block"></div>
                <div className="flex flex-col items-center px-4 min-w-[100px]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Study Hours</p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} className="text-blue-500" />
                      <p className="text-2xl font-black text-slate-700">{latestStrategy.study_hours || latestStrategy.studyHours}h</p>
                    </div>
                </div>
                <div className="w-px bg-slate-200/60 hidden sm:block"></div>
                <div className="flex flex-col items-center px-4 min-w-[100px]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Streak</p>
                    <div className="flex items-center gap-1.5 text-2xl font-black text-indigo-500">
                        <Flame size={20} fill="currentColor" /> {strategies.length}
                    </div>
                </div>
            </div>
        ) : (
             <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 relative z-10 w-full xl:w-auto text-center flex flex-col items-center justify-center min-w-[300px]">
                 <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-3">
                     <Brain size={24} />
                 </div>
                 <p className="text-lg font-black text-indigo-900 mb-1">No plan generated yet</p>
                 <p className="text-sm text-indigo-600/80 mb-4">You're seconds away from a custom strategy.</p>
                 <Link to="/planner" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all">
                     Start Planning
                 </Link>
             </div>
        )}
      </motion.div>

      {/* Motivation Banner */}
      <motion.div variants={itemVariants} className="bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-800 p-8 md:p-10 rounded-3xl shadow-xl shadow-indigo-200/50 text-white relative overflow-hidden min-h-[200px] flex flex-col justify-center transform transition-transform hover:scale-[1.01] duration-500">
        <div className="absolute top-0 right-0 w-160 h-160 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[20rem] h-80 bg-purple-400/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                    <Sparkles size={20} className="text-indigo-100" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-indigo-100/90 letter-spacing-2">Words to focus by</span>
            </div>
            <p className="text-2xl md:text-4xl font-semibold leading-tight tracking-tight text-white max-w-3xl">
                "{quote}"
            </p>
        </div>
      </motion.div>

      {/* Main Actions Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Strategy Planner */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ type: "spring" as const, stiffness: 300 }}>
          <Link to="/planner" className="block h-full bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-200/40 hover:border-indigo-300 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 z-10 relative">
              <Brain size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">Strategy Planner</h3>
            <p className="text-slate-500 font-medium relative z-10">Generate a personalized, AI-powered study & wellness plan.</p>
          </Link>
        </motion.div>

        {/* Analytics & Progress */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ type: "spring" as const, stiffness: 300 }}>
          <Link to="/analytics" className="block h-full bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-200/40 hover:border-indigo-300 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 z-10 relative">
              <BarChart2 size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">Analytics</h3>
            <p className="text-slate-500 font-medium relative z-10">Deep dive into your performance metrics and habits over time.</p>
          </Link>
        </motion.div>

        {/* Strategy History */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ type: "spring" as const, stiffness: 300 }}>
          <Link to="/history" className="block h-full bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-200/40 hover:border-indigo-300 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 z-10 relative">
              <Clock size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">History Logs</h3>
            <p className="text-slate-500 font-medium relative z-10">Review past wellness strategies and export them to PDF.</p>
          </Link>
        </motion.div>

        {/* Feedback */}
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ type: "spring" as const, stiffness: 300 }}>
          <Link to="/feedback" className="block h-full bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-200/40 hover:border-indigo-300 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 z-10 relative">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">Feedback</h3>
            <p className="text-slate-500 font-medium relative z-10">Help us improve the platform to serve you better.</p>
          </Link>
        </motion.div>
      </motion.div>

      {/* Gamification Badges */}
      <motion.div variants={itemVariants} className="glass p-8 rounded-3xl relative overflow-hidden border-white/80">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-linear-to-br from-amber-100 to-amber-200 rounded-2xl text-amber-600 shadow-inner">
                <Award size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-none">Your Achievements</h2>
              <p className="text-slate-500 text-sm mt-1">Unlock badges by staying consistent.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Badge 1: First Step */}
            <div className={`bg-white/60 border hover:border-indigo-200 rounded-3xl p-6 flex flex-col items-center text-center group transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 ${strategies.length < 1 ? 'opacity-70 grayscale border-transparent' : 'border-white'}`}>
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 text-4xl shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white">
                    🌅
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Planner Initiate</h3>
                <p className="text-xs text-slate-500 font-medium h-8">Created your first strategy outline</p>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner flex relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: strategies.length >= 1 ? '100%' : '0%' }} transition={{ duration: 1, delay: 0.5 }} className="bg-linear-to-r from-indigo-400 to-indigo-600 h-2 outline-none rounded-full relative z-10" />
                </div>
            </div>

            {/* Badge 2: Focus Master */}
            <div className={`bg-white/60 border hover:border-indigo-200 rounded-3xl p-6 flex flex-col items-center text-center group transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 ${strategies.length < 5 ? 'opacity-70 grayscale border-transparent' : 'border-white'}`}>
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 text-4xl shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 border border-white">
                    🎯
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Focus Master</h3>
                <p className="text-xs text-slate-500 font-medium h-8">Generated 5 strategies ({Math.min(5, strategies.length)}/5)</p>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner flex relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: Math.min(100, (strategies.length / 5) * 100) + '%' }} transition={{ duration: 1, delay: 0.6 }} className="bg-linear-to-r from-indigo-400 to-indigo-600 h-2 outline-none rounded-full relative z-10" />
                </div>
            </div>

            {/* Badge 3: Streak Keeper */}
            <div className={`bg-white/60 border hover:border-indigo-200 rounded-3xl p-6 flex flex-col items-center text-center group transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 ${strategies.length < 10 ? 'opacity-70 grayscale border-transparent' : 'border-white'}`}>
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 text-4xl shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white">
                    🔥
                </div>
                <h3 className="font-bold text-slate-800 mb-1">Streak Keeper</h3>
                <p className="text-xs text-slate-500 font-medium h-8">Generated 10 active plans ({Math.min(10, strategies.length)}/10)</p>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner flex relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: Math.min(100, (strategies.length / 10) * 100) + '%' }} transition={{ duration: 1, delay: 0.7 }} className="bg-linear-to-r from-indigo-400 to-indigo-600 h-2 outline-none rounded-full relative z-10" />
                    {strategies.length >= 10 && <Sparkles size={12} className="text-indigo-200 absolute right-0 -top-2 animate-pulse z-20" />}
                </div>
            </div>

            {/* Badge 4: Zen Master (Locked) */}
            <div className={`bg-white/60 border hover:border-indigo-200 rounded-3xl p-6 flex flex-col items-center text-center group transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 ${strategies.length < 20 ? 'opacity-70 grayscale border-transparent' : 'border-white'}`}>
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-4xl shadow-inner border border-slate-200 group-hover:scale-110 transition-transform duration-300">
                    🧘
                </div>
                <h3 className="font-bold text-slate-700 mb-1">Zen Master</h3>
                <p className="text-xs text-slate-400 font-medium h-8">Wellness Guru ({Math.min(20, strategies.length)}/20)</p>
                <div className="mt-4 w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner flex relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: Math.min(100, (strategies.length / 20) * 100) + '%' }} transition={{ duration: 1, delay: 0.8 }} className="bg-indigo-300 h-2 outline-none rounded-full" />
                </div>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
