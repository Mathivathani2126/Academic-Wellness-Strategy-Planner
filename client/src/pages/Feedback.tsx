import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Star, Send, Sparkles, CheckCircle2, RotateCcw, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RATING_EMOJIS = ["😞", "😕", "😐", "🙂", "🤩"];
const RATING_TEXTS = ["Needs Work", "Could be better", "Okay", "Good", "Excellent!"];

export default function Feedback() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [type, setType] = useState('Suggestion');
  const [suggestion, setSuggestion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name: user?.username || 'Unknown', 
          email: user?.email || 'unknown@example.com', 
          type, 
          message: suggestion, 
          rating 
        }),
      });
      setTimeout(() => setSubmitted(true), 600); // Add a small delay for animation
    } catch (error) {
      console.error('Failed to submit feedback', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating !== null ? hoveredRating : rating;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -z-10" />
      
      <div className="text-center mb-10">
        <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-16 h-16 bg-white/40 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl border border-white/60 text-indigo-500"
        >
            <MessageSquare size={32} />
        </motion.div>
        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">We Value Your Voice</h1>
        <p className="text-slate-500 text-lg">Help us shape the future of your academic wellness journey.</p>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
            <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass min-h-[400px] flex flex-col items-center justify-center text-center p-12 rounded-3xl border-white/60 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-teal-500/5" />
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-inner border-[6px] border-white"
                >
                    <CheckCircle2 size={40} className="drop-shadow-sm" />
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 relative z-10">Thank You!</h2>
                <p className="text-slate-600 max-w-sm mb-8 relative z-10 text-lg">
                    Your insightful feedback has been received and will greatly help us improve the Planner.
                </p>
                <button 
                    onClick={() => { setSubmitted(false); setSuggestion(''); setRating(5); }}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-2 relative z-10"
                >
                    <RotateCcw size={18} /> Submit another response
                </button>
            </motion.div>
        ) : (
            <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="glass p-8 md:p-12 rounded-3xl border-white/60 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full blur-2xl" />

                <div className="mb-10 text-center relative z-10">
                    <label className="block text-lg font-bold text-slate-800 mb-6">How was your experience today?</label>
                    
                    <div className="flex justify-center items-center gap-1 md:gap-3 mb-6 flex-wrap">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <motion.button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(null)}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-4 rounded-2xl transition-all duration-300 relative group
                                    ${displayRating >= star 
                                        ? 'bg-linear-to-br from-amber-400 to-orange-400 text-white shadow-lg shadow-orange-500/30' 
                                        : 'bg-white/60 text-slate-300 border border-slate-200 hover:bg-slate-50'}`}
                            >
                                <Star 
                                    size={40} 
                                    fill={displayRating >= star ? "currentColor" : "none"} 
                                    className={`transition-all duration-300 ${displayRating >= star ? 'drop-shadow-md stroke-amber-200' : 'stroke-slate-300'}`} 
                                />
                                {displayRating === star && (
                                    <motion.div 
                                        layoutId="star-highlight"
                                        className="absolute -inset-2 bg-amber-400/20 rounded-3xl -z-10 blur-md"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>
                    
                    <motion.div 
                        key={displayRating}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-3 h-10"
                    >
                        <span className="text-4xl drop-shadow-sm">{RATING_EMOJIS[displayRating - 1]}</span>
                        <span className="text-lg font-bold text-slate-700">{RATING_TEXTS[displayRating - 1]}</span>
                    </motion.div>
                </div>

                <div className="mb-8 relative z-10">
                    <label className="flex text-sm font-bold text-slate-700 mb-3 items-center gap-2">
                        <Tag size={16} className="text-indigo-500" />
                        Feedback Type
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full p-4 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-inner text-slate-700 font-medium"
                    >
                        <option value="Suggestion">Suggestion</option>
                        <option value="Bug">Bug Report</option>
                        <option value="Complaint">Complaint</option>
                        <option value="General">General Inquiries</option>
                    </select>
                </div>

                <div className="mb-8 relative z-10">
                    <label className="flex text-sm font-bold text-slate-700 mb-3 items-center gap-2">
                        <Sparkles size={16} className="text-indigo-500" />
                        Suggestions for improvement
                    </label>
                    <div className="relative">
                        <textarea
                            required
                            value={suggestion}
                            onChange={(e) => setSuggestion(e.target.value)}
                            rows={5}
                            className="w-full p-5 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none shadow-inner text-slate-700 font-medium placeholder:text-slate-400"
                            placeholder="What new features would you like to see? How can we make your planning more effective?"
                        />
                        <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-400 bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none">
                            {suggestion.length} chars
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || suggestion.trim().length < 5}
                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 group relative overflow-hidden
                        ${isSubmitting || suggestion.trim().length < 5 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300' 
                            : 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-[0.98]'}`}
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    {isSubmitting ? (
                        <div className="w-6 h-6 border-4 border-slate-400 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Submit Feedback
                            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                    )}
                </button>
            </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
