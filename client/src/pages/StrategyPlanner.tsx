import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { 
  Brain, ArrowLeft, Clock, Activity, BookOpen, Calendar, 
  Target, Zap, Plus, X, Info, CheckCircle2, AlertCircle,
  BarChart2, Moon, Flame, Lightbulb, Sun, Sunset, Battery,
  Download, Timer, Award, AlertTriangle, TrendingUp, TrendingDown, RotateCcw,
  Sparkles
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PomodoroTimer from '../components/PomodoroTimer';

const GOALS = [
  "Improve Grades",
  "Reduce Stress",
  "Better Sleep",
  "Exam Preparation",
  "Work-Life Balance"
];

const MODES = [
  { id: 'Balanced', label: 'Balanced Plan' },
  { id: 'Intensive', label: 'Intensive Plan' },
  { id: 'Recovery', label: 'Recovery Mode' }
];

const PRODUCTIVITY_PATTERNS = [
  { id: 'Morning', label: 'Early Bird 🌅', desc: 'Most active 6AM - 12PM' },
  { id: 'Afternoon', label: 'Daytime Flow ☀️', desc: 'Most active 12PM - 6PM' },
  { id: 'Evening', label: 'Evening Focus 🌇', desc: 'Most active 6PM - 10PM' },
  { id: 'Night', label: 'Night Owl 🌙', desc: 'Most active 10PM - 2AM' }
];

const STRESS_LEVELS = [
  { id: 'Low', label: 'Low', color: 'bg-emerald-500' },
  { id: 'Moderate', label: 'Moderate', color: 'bg-amber-500' },
  { id: 'High', label: 'High', color: 'bg-red-500' }
];

export default function StrategyPlanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studyHours: 4,
    sleepHours: 7,
    subjects: [] as string[],
    goals: [] as string[],
    mode: 'Balanced',
    examFrequency: 'Monthly Exams',
    productivityPattern: 'Morning',
    stressLevel: 'Moderate'
  });

  useEffect(() => {
    if (location.state) {
        // Map backend fields to frontend form data if necessary
        const { study_hours, sleep_hours, subjects, mode, exam_frequency } = location.state;
        setFormData(prev => ({
            ...prev,
            studyHours: study_hours || prev.studyHours,
            sleepHours: sleep_hours || prev.sleepHours,
            subjects: subjects || prev.subjects,
            mode: mode || prev.mode,
            examFrequency: exam_frequency || prev.examFrequency,
        }));
    }
  }, [location.state]);
  const [subjectInput, setSubjectInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Live Wellness Calculation
  const calculateWellness = () => {
    let score = 100;
    if (formData.sleepHours < 7) score -= 15;
    if (formData.sleepHours > 9) score -= 5;
    if (formData.studyHours > 6) score -= 10;
    if (formData.studyHours < 2) score -= 5;
    if (formData.mode === 'Intensive') score -= 5;
    if (formData.stressLevel === 'High') score -= 15;
    if (formData.stressLevel === 'Moderate') score -= 5;
    return Math.max(0, Math.min(100, score));
  };

  const wellnessScore = calculateWellness();
  
  const getWellnessStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-500', badge: 'bg-emerald-100' };
    if (score >= 60) return { label: 'Good', color: 'text-indigo-600', bg: 'bg-indigo-500', badge: 'bg-indigo-100' };
    if (score >= 40) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-500', badge: 'bg-amber-100' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-500', badge: 'bg-red-100' };
  };

  const status = getWellnessStatus(wellnessScore);

  const handleAddSubject = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && subjectInput.trim()) {
      e.preventDefault();
      if (!formData.subjects.includes(subjectInput.trim())) {
        setFormData(prev => ({ ...prev, subjects: [...prev.subjects, subjectInput.trim()] }));
      }
      setSubjectInput('');
    }
  };

  const removeSubject = (subject: string) => {
    setFormData(prev => ({ ...prev, subjects: prev.subjects.filter(s => s !== subject) }));
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => {
      const exists = prev.goals.includes(goal);
      return {
        ...prev,
        goals: exists ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error('Session expired. Please login again.');
      }

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        throw new Error(data.error || 'Failed to generate strategy');
      }
    } catch (error: any) {
      console.error('Failed to generate strategy', error);
      if (error.message.includes('Session expired')) {
          navigate('/login');
      }
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null);

  const handleExport = async (type: 'pdf' | 'png') => {
    const element = document.getElementById('strategy-result');
    if (!element) return;

    setExporting(type);
    try {
      // Small delay to allow UI to update and animations to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const filename = `wellness-strategy-${user?.username || 'plan'}-${new Date().toISOString().split('T')[0]}`;

      if (type === 'png') {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = url;
        link.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filename}.pdf`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export strategy. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  if (result) {
    const sHours = Number(result.studyHours || formData.studyHours || 4);
    const slHours = Number(result.sleepHours || formData.sleepHours || 7);
    const wScore = Number(result.wellnessScore || result.wellness_score || wellnessScore || 0);
    
    const chartData = [
        { name: 'Study', value: sHours, color: '#6366f1' },
        { name: 'Sleep', value: slHours, color: '#a855f7' },
        { name: 'Leisure', value: Math.max(0, 24 - sHours - slHours), color: '#cbd5e1' },
    ];

    const burnoutColor = 
        result.advice.burnoutRisk === 'High' ? 'text-red-600 bg-red-50 border-red-100' :
        result.advice.burnoutRisk === 'Moderate' ? 'text-amber-600 bg-amber-50 border-amber-100' :
        'text-emerald-600 bg-emerald-50 border-emerald-100';

    // Cognitive State Logic
    const getCognitiveState = () => {
        if (result.sleepHours >= 7 && formData.stressLevel === 'Low') return { label: 'Peak Flow 🚀', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
        if (result.sleepHours >= 6 && formData.stressLevel === 'Moderate') return { label: 'Balanced ⚖️', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
        return { label: 'Mental Fatigue 🧠', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    };
    const cognitiveState = getCognitiveState();

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto space-y-8 pb-12">
        <PomodoroTimer isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />
        
        <div className="flex items-center justify-between">
            <Link to="/" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-indigo-600 font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors">
                <ArrowLeft size={18} /> Back to Dashboard
            </Link>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsTimerOpen(true)} 
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
                    >
                        <Timer size={18} /> Focus Mode
                    </button>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleExport('pdf')} 
                            disabled={exporting !== null}
                            className={`px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2 transition-all shadow-sm active:scale-95 ${exporting === 'pdf' ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {exporting === 'pdf' ? (
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Download size={18} className="text-red-500" />
                            )}
                            PDF
                        </button>
                        <button 
                            onClick={() => handleExport('png')} 
                            disabled={exporting !== null}
                            className={`px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2 transition-all shadow-sm active:scale-95 ${exporting === 'png' ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {exporting === 'png' ? (
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <div className="text-emerald-500 font-black text-xs border-2 border-emerald-500 rounded px-0.5">IMG</div>
                            )}
                            PNG
                        </button>
                    </div>
                </div>
        </div>

        <div id="strategy-result" className="glass p-8 sm:p-10 rounded-3xl border-white/60 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">Your Wellness Strategy</h1>
                    <p className="text-slate-500">Generated for {user?.username?.toUpperCase()}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 px-6 py-4 rounded-2xl text-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-200/50 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 relative z-10">Wellness Score</p>
                    <p className="text-4xl font-black text-emerald-600 relative z-10">
                        {wScore}/100
                    </p>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border border-indigo-50/50 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><BookOpen size={20} /></div>
                        <h3 className="font-bold text-slate-700">Study Habits</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">
                        {sHours}h <span className="text-sm font-normal text-slate-400">/ day</span>
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Recommended: 4–8 hrs</p>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Well Balanced
                    </div>
                </div>
                <div className="bg-white border border-purple-50/50 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Moon size={20} /></div>
                        <h3 className="font-bold text-slate-700">Sleep Pattern</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">
                        {slHours}h <span className="text-sm font-normal text-slate-400">/ night</span>
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Ideal: 7–9 hrs</p>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Optimal Rest
                    </div>
                </div>
                <div className="bg-white border border-rose-50/50 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><Target size={20} /></div>
                        <h3 className="font-bold text-slate-700">Plan Focus</h3>
                    </div>
                    <p className="text-xl font-bold text-slate-900 mb-1">{result.mode || 'Balanced'}</p>
                    <p className="text-xs text-slate-400">Exam Freq: {formData.examFrequency}</p>
                </div>
            </div>

            {/* Visualization & Motivation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="border border-slate-100 rounded-2xl p-6">
                    <h3 className="font-bold text-slate-900 mb-6">Balance Visualization</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-indigo-600 rounded-2xl p-8 text-white flex flex-col justify-center relative overflow-hidden min-h-[200px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                                <Flame size={16} className="text-orange-300" />
                            </div>
                            <span className="text-xs font-bold tracking-widest uppercase text-indigo-200">Daily Motivation</span>
                        </div>
                        <p className="text-2xl md:text-3xl font-medium leading-snug tracking-tight text-white">
                            "The future belongs to those who believe in the beauty of their dreams."
                        </p>
                        <div className="mt-6 flex items-center gap-2">
                            <div className="h-0.5 w-8 bg-indigo-400/50"></div>
                            <p className="text-indigo-200 text-sm font-medium">Eleanor Roosevelt</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Insight Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Cognitive State Indicator (New) */}
                <div className={`border rounded-2xl p-6 ${cognitiveState.color}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Brain size={20} />
                        <h3 className="font-bold text-sm uppercase tracking-wide">Cognitive State</h3>
                    </div>
                    <p className="text-2xl font-black mb-1">{cognitiveState.label.split(' ')[0]}</p>
                    <p className="text-xs opacity-80 font-medium">{cognitiveState.label.split(' ').slice(1).join(' ')} Based on sleep & stress</p>
                </div>

                {/* Today's Focus Advice */}
                <div className="bg-linear-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl opacity-50" />
                    <div className="flex items-center gap-2 mb-3">
                        <Target className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Today&apos;s Focus</h3>
                    </div>
                    <p className="text-indigo-900 font-medium text-lg leading-snug">
                        &quot;{result.advice.focusAdvice || "Stay consistent with your study blocks"}&quot;
                    </p>
                </div>

                {/* Burnout Risk Indicator */}
                <div className={`border rounded-2xl p-6 ${burnoutColor}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Flame size={20} />
                        <h3 className="font-bold text-sm uppercase tracking-wide">Burnout Risk</h3>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-black">{result.advice.burnoutRisk || "Low"}</span>
                    </div>
                    <div className="w-full bg-black/5 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full ${result.advice.burnoutRisk === 'High' ? 'bg-red-500' : result.advice.burnoutRisk === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: result.advice.burnoutRisk === 'High' ? '90%' : result.advice.burnoutRisk === 'Moderate' ? '60%' : '20%' }} 
                        />
                    </div>
                </div>

                {/* Energy Optimization Tip */}
                <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="text-amber-600" size={20} />
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Energy Tip</h3>
                    </div>
                    <p className="text-amber-900 font-medium">
                        {result.advice.energyTip || "Take a 20-min power nap if you feel a slump."}
                    </p>
                </div>
            </div>

            {/* Burnout Prevention Alert (Conditional) */}
            {result.advice.burnoutRisk === 'High' && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8 animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 text-lg mb-1">Burnout Warning: High Risk Detected</h3>
                            <p className="text-red-700 text-sm">
                                Your current metrics indicate a high probability of burnout. We recommend immediate recovery actions.
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-4 border border-red-100">
                        <h4 className="font-bold text-red-800 text-sm uppercase tracking-wide mb-3">Recommended Recovery Actions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
                                <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">1</span>
                                5-min Box Breathing
                            </div>
                            <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
                                <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">2</span>
                                Switch to Light Revision
                            </div>
                            <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
                                <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs">3</span>
                                Sleep +1 Hour Tonight
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly Optimization & Smart Revision Nudges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Weekly Optimization Insight */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-indigo-500/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <TrendingUp className="text-indigo-300" size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wide text-indigo-100">Weekly Optimization</h3>
                        </div>
                        <p className="text-lg font-medium leading-relaxed mb-6 text-slate-200">
                            "Your sleep consistency is improving. Try shifting deep work blocks to <span className="text-white font-bold">{formData.productivityPattern}s</span> to maximize retention."
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
                            AI Analysis Active
                        </div>
                    </div>
                </div>

                {/* Smart Revision Nudges */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <RotateCcw size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Smart Revision Nudges</h3>
                    </div>
                    <div className="space-y-3">
                        {formData.subjects.length > 0 ? (
                            formData.subjects.slice(0, 3).map((sub, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover:bg-indigo-600 transition-colors"></div>
                                        <span className="font-bold text-slate-700 text-sm">{sub}</span>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                        Review in {24 + (i * 24)}h
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Add subjects to get personalized revision reminders.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Visual Timetable */}
            <div className="mb-8">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-indigo-600" />
                    Recommended Daily Schedule
                </h3>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 overflow-x-auto">
                    <div className="flex gap-4 min-w-[800px]">
                        {result.advice.timetable?.map((slot: any, i: number) => {
                            let typeColor = 'bg-white border-slate-200 text-slate-600';
                            if (slot.type === 'Deep Study') typeColor = 'bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-200';
                            else if (slot.type === 'Light Study') typeColor = 'bg-indigo-100 border-indigo-200 text-indigo-800';
                            else if (slot.type === 'Revision') typeColor = 'bg-violet-100 border-violet-200 text-violet-800';
                            else if (slot.type === 'Break' || slot.type === 'Relaxation') typeColor = 'bg-emerald-100 border-emerald-200 text-emerald-800';
                            else if (slot.type === 'Sleep') typeColor = 'bg-slate-800 border-slate-900 text-slate-300';
                            
                            return (
                                <div key={i} className="flex flex-col items-center relative group">
                                    <div className="text-xs font-bold text-slate-400 mb-2">{slot.time}</div>
                                    <div className={`w-36 p-3 rounded-xl border text-center transition-all hover:scale-105 ${typeColor}`}>
                                        <span className="text-sm font-bold block truncate">{slot.activity}</span>
                                        <span className="text-[10px] opacity-80 uppercase tracking-wider">{slot.type}</span>
                                    </div>
                                    {i < result.advice.timetable.length - 1 && (
                                        <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-slate-200 -translate-y-1/2" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Actionable Checklists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={20} /> Action Plan
                    </h4>
                    <div className="space-y-3">
                        {result.advice.do?.map((item: string, i: number) => {
                            const id = `do-${i}`;
                            const isChecked = checkedItems[id];
                            return (
                                <label key={i} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-emerald-100/50 border-emerald-200 opacity-60' : 'bg-white border-emerald-100 hover:shadow-sm'}`}>
                                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-emerald-300'}`}>
                                        {isChecked && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                    <span className={`text-sm select-none transition-all ${isChecked ? 'text-emerald-700/60 line-through' : 'text-emerald-900 font-medium'}`}>
                                        {item}
                                    </span>
                                    <input type="checkbox" className="hidden" checked={!!isChecked} onChange={() => toggleCheck(id)} />
                                </label>
                            );
                        })}
                    </div>
                </div>
                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                    <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                        <X size={20} /> What You Should Avoid
                    </h4>
                    <ul className="space-y-3">
                        {result.advice.avoid?.map((item: string, i: number) => (
                            <li key={i} className="text-red-800 text-sm flex items-start gap-3 bg-white/60 p-3 rounded-xl border border-red-100/50">
                                <div className="mt-0.5 w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
                                <span className="font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Subject Strategies */}
            {result.advice.subjectStrategy && result.advice.subjectStrategy.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-8 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-600" /> 
                        Subject-Specific Strategies & Resources
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {result.advice.subjectStrategy.map((strategy: any, i: number) => (
                            <div key={i} className="bg-slate-50/70 rounded-xl p-6 border border-slate-100 hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm font-bold text-indigo-600 flex-none">{strategy.subject.slice(0, 2).toUpperCase()}</div>
                                    <h5 className="font-bold text-slate-800 text-lg">{strategy.subject}</h5>
                                </div>
                                <p className="text-sm text-slate-600 mb-5 leading-relaxed">"{strategy.tips}"</p>
                                
                                {strategy.resources && strategy.resources.length > 0 && (
                                    <div className="bg-white p-4 rounded-lg border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-amber-500" /> Recommended Resources
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {strategy.resources.map((resource: string, j: number) => (
                                                <span key={j} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-default">
                                                    {resource}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommended Study Materials */}
            {result.advice.recommendedMaterials && result.advice.recommendedMaterials.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-8">
                    <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-600" /> 
                        Recommended Study Materials
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {result.advice.recommendedMaterials.map((item: any, i: number) => (
                            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <h5 className="font-bold text-slate-800 text-lg">{item.subject}</h5>
                                    {item.focusArea && (
                                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">
                                            Focus: {item.focusArea}
                                        </span>
                                    )}
                                </div>
                                <ul className="space-y-2">
                                    {item.materials?.map((material: string, j: number) => (
                                        <li key={j} className="text-slate-600 text-sm flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                                            {material}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-8 flex justify-center">
                <button onClick={() => setResult(null)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                    Create Another Strategy
                </button>
            </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glass p-8 sm:p-10 rounded-3xl border-white/60 shadow-xl space-y-8 relative overflow-hidden">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Student Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={user?.username || ''}
                                disabled
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                            />
                            <Brain className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Exam Frequency</label>
                        <div className="relative">
                            <select
                                value={formData.examFrequency}
                                onChange={(e) => setFormData({ ...formData, examFrequency: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-slate-50 focus:bg-white font-medium appearance-none"
                            >
                                <option value="Low">Low (Rarely)</option>
                                <option value="Monthly Exams">Monthly Exams</option>
                                <option value="Weekly Tests">Weekly Tests</option>
                            </select>
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Daily Study Hours</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                required
                                value={formData.studyHours}
                                onChange={(e) => setFormData({ ...formData, studyHours: parseFloat(e.target.value) })}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">📚</div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Recommended: 4–8 hrs/day</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Daily Sleep Hours</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                required
                                value={formData.sleepHours}
                                onChange={(e) => setFormData({ ...formData, sleepHours: parseFloat(e.target.value) })}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-slate-50 focus:bg-white font-medium"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🌙</div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Ideal: 7–9 hrs/day</p>
                    </div>
                </div>

                {/* New Inputs: Productivity & Stress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Productivity Peak</label>
                        <div className="relative">
                            <select
                                value={formData.productivityPattern}
                                onChange={(e) => setFormData({ ...formData, productivityPattern: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-slate-50 focus:bg-white font-medium appearance-none"
                            >
                                {PRODUCTIVITY_PATTERNS.map(p => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                            <Sun className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Stress Level</label>
                        <div className="relative">
                            <select
                                value={formData.stressLevel}
                                onChange={(e) => setFormData({ ...formData, stressLevel: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-slate-50 focus:bg-white font-medium appearance-none"
                            >
                                {STRESS_LEVELS.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Weak Subjects (Press Enter to add)</label>
                    <div className="p-2 rounded-2xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all min-h-[60px] flex flex-wrap items-center gap-2">
                        <div className="pl-2 text-xl">📝</div>
                        {formData.subjects.map((subject) => (
                            <span key={subject} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                {subject}
                                <button type="button" onClick={() => removeSubject(subject)} className="hover:text-indigo-900">
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={subjectInput}
                            onChange={(e) => setSubjectInput(e.target.value)}
                            onKeyDown={handleAddSubject}
                            className="bg-transparent outline-none p-2 text-sm flex-1 min-w-[150px]"
                            placeholder={formData.subjects.length === 0 ? "Math, Physics..." : ""}
                        />
                    </div>
                    {formData.subjects.length === 0 && (
                        <p className="text-xs text-slate-400 mt-2 italic">No subjects added yet.</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">What&apos;s your current priority?</label>
                    <div className="flex flex-wrap gap-3">
                        {GOALS.map((goal) => (
                            <button
                                key={goal}
                                type="button"
                                onClick={() => toggleGoal(goal)}
                                className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                                    formData.goals.includes(goal)
                                        ? 'bg-white border-indigo-500 text-indigo-700 ring-2 ring-indigo-100'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                }`}
                            >
                                {goal}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Strategy Mode</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {MODES.map((mode) => (
                            <button
                                key={mode.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, mode: mode.id })}
                                className={`py-3 rounded-xl border text-center text-sm font-bold transition-all ${
                                    formData.mode === mode.id
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                        : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            🚀 Generate My Wellness Strategy
                        </>
                    )}
                </button>
            </form>
        </div>

        {/* Right Side Panel - Live Preview */}
        <div className="space-y-6">
            <div className="glass p-8 rounded-3xl border border-white/60 shadow-xl sticky top-6 relative overflow-hidden">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Preview
                </h3>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-500 text-sm">Study Hours</span>
                        <span className="font-bold text-slate-900">{formData.studyHours} hrs</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-500 text-sm">Sleep Hours</span>
                        <span className="font-bold text-slate-900">{formData.sleepHours} hrs</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-slate-500 text-sm">Status</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${status.badge} ${status.color} flex items-center gap-1`}>
                            <CheckCircle2 size={12} /> {status.label === 'Excellent' || status.label === 'Good' ? 'Balanced' : status.label}
                        </span>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Wellness Score</span>
                            <span className="text-[10px] text-slate-400">Based on sleep, study & stress</span>
                        </div>
                        <span className={`text-2xl font-bold ${status.color}`}>{wellnessScore}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-2 relative">
                        <div 
                            className={`h-3 rounded-full transition-all duration-500 ${status.bg}`} 
                            style={{ width: `${wellnessScore}%` }} 
                        />
                        {/* Ideal Marker */}
                        <div className="absolute top-0 left-[80%] w-0.5 h-4 bg-slate-300 -translate-y-0.5" title="Ideal Score (80+)"></div>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className={`text-xs font-medium ${status.color}`}>{status.label}</p>
                        <p className="text-[10px] text-slate-400">Target: 80+</p>
                    </div>
                    
                    {/* Score Logic Explanation */}
                    <div className="mt-3 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] text-slate-500 space-y-1">
                        {formData.sleepHours < 7 && <div className="flex items-center gap-1 text-red-500"><TrendingDown size={10} /> Low sleep penalty (-15)</div>}
                        {formData.stressLevel === 'High' && <div className="flex items-center gap-1 text-red-500"><TrendingDown size={10} /> High stress penalty (-15)</div>}
                        {formData.studyHours > 6 && <div className="flex items-center gap-1 text-amber-500"><TrendingDown size={10} /> Heavy study load (-10)</div>}
                        {wellnessScore >= 80 && <div className="flex items-center gap-1 text-emerald-600"><TrendingUp size={10} /> Optimal balance achieved!</div>}
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-indigo-300">
                            <Lightbulb size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Daily Insight</span>
                        </div>
                        <p className="font-medium text-lg leading-relaxed text-slate-200">
                            "Small progress daily beats last-minute stress."
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
