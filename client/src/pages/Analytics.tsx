import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart2, TrendingUp, Zap, Activity, Brain, Moon, 
  AlertTriangle, ArrowUpRight, Flame, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

export default function Analytics() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
  if (strategies.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass min-h-[60vh] flex flex-col justify-center items-center p-12 text-center rounded-3xl border-white/60 shadow-xl overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="w-24 h-24 bg-white shadow-xl bg-opacity-60 rounded-full flex items-center justify-center mb-6">
            <BarChart2 size={48} className="text-indigo-500 drop-shadow-md" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-3">No Data Available</h3>
        <p className="text-slate-500 text-lg max-w-md">Analytics will appear here once you generate your first academic wellness strategy.</p>
    </motion.div>
  );

  const avgScore = Math.round(strategies.reduce((acc, curr) => acc + (curr.wellness_score || curr.wellnessScore), 0) / strategies.length);
  const latestScore = strategies[0].wellness_score || strategies[0].wellnessScore;
  const prevScore = strategies.length > 1 ? (strategies[1].wellness_score || strategies[1].wellnessScore) : latestScore;
  const improvementRate = prevScore > 0 ? Math.round(((latestScore - prevScore) / prevScore) * 100) : 0;

  const scatterData = strategies.map(s => ({
    study: s.study_hours || s.studyHours,
    sleep: s.sleep_hours || s.sleepHours,
    score: s.wellness_score || s.wellnessScore,
    index: 1
  }));

  const areaData = [...strategies].reverse().map(s => ({
    date: new Date(s.createdAt || s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: s.wellness_score || s.wellnessScore
  }));

  const highSleepStrategies = strategies.filter(s => (s.sleep_hours || s.sleepHours) >= 7);
  const lowSleepStrategies = strategies.filter(s => (s.sleep_hours || s.sleepHours) < 7);
  
  const highSleepAvgScore = highSleepStrategies.length > 0 
    ? Math.round(highSleepStrategies.reduce((acc, curr) => acc + (curr.wellness_score || curr.wellnessScore), 0) / highSleepStrategies.length) 
    : 0;
  const lowSleepAvgScore = lowSleepStrategies.length > 0 
    ? Math.round(lowSleepStrategies.reduce((acc, curr) => acc + (curr.wellness_score || curr.wellnessScore), 0) / lowSleepStrategies.length) 
    : 0;
  const sleepImpact = highSleepAvgScore - lowSleepAvgScore;

  // New Burnout Risk Calculation based on high study, low sleep
  const latestStudy = strategies[0].study_hours || strategies[0].studyHours;
  const latestSleep = strategies[0].sleep_hours || strategies[0].sleepHours;
  let burnoutRisk = "Low";
  let burnoutRiskColor = "text-emerald-500 bg-emerald-100";
  let burnoutPercentage = 25;
  if(latestStudy > 8 && latestSleep < 6) {
      burnoutRisk = "Critical";
      burnoutRiskColor = "text-red-500 bg-red-100";
      burnoutPercentage = 95;
  } else if (latestStudy > 6 || latestSleep < 7) {
      burnoutRisk = "Warning";
      burnoutRiskColor = "text-amber-500 bg-amber-100";
      burnoutPercentage = 65;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-4 rounded-xl shadow-lg border-white/60">
          <p className="font-bold text-slate-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Analytics Dashboard</h1>
            <p className="text-slate-500">Visualize your academic wellness metrics</p>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Current Score", value: latestScore, color: "text-indigo-600", secondary: "/ 100" },
          { label: "Average Score", value: avgScore, color: "text-slate-900", secondary: "/ 100" },
          { label: "Improvement", value: `${improvementRate > 0 ? '+' : ''}${improvementRate}%`, color: improvementRate >= 0 ? 'text-emerald-600' : 'text-red-600', icon: improvementRate !== 0 ? <ArrowUpRight size={24} className={improvementRate < 0 ? 'rotate-90 text-red-500' : 'text-emerald-500'} /> : null },
          { label: "Consistency", value: "High", color: "text-amber-500", secondary: "Streak" }
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -4 }} className="glass p-6 rounded-3xl border-white/60 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
            <p className="text-sm font-semibold text-slate-500 mb-2 relative z-10">{stat.label}</p>
            <div className="flex items-center gap-2 relative z-10">
                <h3 className={`text-4xl font-black ${stat.color}`}>{stat.value}</h3>
                {stat.secondary && <span className="text-sm text-slate-400 font-medium mb-1.5 self-end">{stat.secondary}</span>}
                {stat.icon && stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass p-8 rounded-3xl border-white/60 shadow-xl relative overflow-hidden">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="text-indigo-500" />
                Score Progression
            </h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        <Area type="monotone" dataKey="score" name="Score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Burnout Risk Meter */}
        <div className="space-y-6">
            <motion.div whileHover={{ scale: 1.02 }} className="glass p-8 rounded-3xl border-white/60 shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 ${burnoutRiskColor.split(' ')[1]} rounded-full blur-3xl opacity-50`}></div>
                <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2 relative z-10">
                    <Flame className={burnoutRiskColor.split(' ')[0]} />
                    Burnout Risk Gauge
                </h4>
                <div className="text-center relative z-10">
                    <div className="relative inline-flex items-center justify-center mb-4">
                        <svg className="w-32 h-32 transform -rotate-90 drop-shadow-md">
                            <circle className="text-slate-200" strokeWidth="12" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64"/>
                            <circle className={`${burnoutRiskColor.split(' ')[0]} transition-all duration-1000 ease-out drop-shadow-lg`} strokeWidth="12" strokeDasharray={364} strokeDashoffset={364 - (364 * burnoutPercentage) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64"/>
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className={`text-3xl font-black ${burnoutRiskColor.split(' ')[0]}`}>{burnoutPercentage}%</span>
                        </div>
                    </div>
                    <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${burnoutRiskColor}`}>
                        Status: {burnoutRisk}
                    </div>
                    <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
                        Based on your latest ratio of {latestStudy}h study to {latestSleep}h sleep.
                        {burnoutPercentage > 60 ? ' Prioritize recovery and reset.' : ' Maintaining healthy balance.'}
                    </p>
                </div>
            </motion.div>

            {/* Predictive */}
            <div className="bg-linear-to-br from-indigo-900 to-purple-900 border border-indigo-700/50 shadow-2xl p-8 rounded-3xl text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://patterns.dev/img/grid.svg')] opacity-10 bg-center" />
                <h4 className="font-bold mb-4 flex items-center gap-2 relative z-10 text-lg">
                    <Zap size={22} className="text-amber-400 fill-amber-400" />
                    AI Prediction
                </h4>
                <div className="relative z-10">
                    <p className="text-indigo-200 text-sm mb-2 font-medium tracking-wide">Next Estimated Score</p>
                    <h3 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-indigo-200 to-white mb-4">
                        {Math.min(100, Math.round(latestScore * 1.05))}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-emerald-300 bg-black/30 px-3 py-2 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                        <Activity size={16} /> Projected: Improving Flow
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Intelligence & Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scatter Chart */}
          <div className="glass p-8 rounded-3xl border-white/60 shadow-xl relative">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Brain className="text-purple-500" />
                Study vs Sleep Matrix
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.5} />
                        <XAxis type="number" dataKey="study" name="Study Hours" unit="h" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis type="number" dataKey="sleep" name="Sleep Hours" unit="h" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                        <ZAxis type="number" dataKey="score" range={[100, 500]} name="Score" />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }} />
                        <Scatter name="Strategies" data={scatterData}>
                            {scatterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#10b981' : entry.score > 50 ? '#6366f1' : '#f43f5e'} opacity={0.8} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-slate-400 mt-4 font-bold uppercase tracking-widest opacity-80">Bubble Size = Wellness Score</p>
          </div>

          {/* Behavior Insights */}
          <div className="glass p-8 rounded-3xl border-white/60 shadow-xl relative">
                <h4 className="font-bold text-indigo-900 mb-6 flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={24} />
                    Behavior Insights
                </h4>
                <div className="space-y-4">
                    <div className="bg-white/60 p-5 rounded-2xl border border-white/80 shadow-sm flex gap-4 hover:bg-white/80 transition-colors">
                        <div className="w-12 h-12 bg-indigo-100/80 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                            <Moon size={24} />
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-900 mb-1">Sleep Impact</h5>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {sleepImpact > 0 
                                    ? `On days with 7+ hours of sleep, your score is generally ~${sleepImpact} points higher.` 
                                    : "Your wellness score holds steady regardless of slight sleep variations."}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/60 p-5 rounded-2xl border border-white/80 shadow-sm flex gap-4 hover:bg-white/80 transition-colors">
                        <div className="w-12 h-12 bg-emerald-100/80 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h5 className="font-bold text-slate-900 mb-1">Study Efficiency</h5>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                {avgScore > 70 
                                    ? "You have a highly efficient study rhythm based on your positive score trend."
                                    : "Consider utilizing the Pomodoro technique to enhance study block efficiency."}
                            </p>
                        </div>
                    </div>
                </div>
          </div>
      </div>
    </motion.div>
  );
}
