import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Target, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'focus' | 'shortBreak' | 'longBreak';
}

const MODES = {
  focus: { label: 'Focus', time: 25 * 60, color: 'bg-indigo-600', text: 'text-indigo-600' },
  shortBreak: { label: 'Short Break', time: 5 * 60, color: 'bg-emerald-500', text: 'text-emerald-600' },
  longBreak: { label: 'Long Break', time: 15 * 60, color: 'bg-blue-500', text: 'text-blue-600' },
};

export default function PomodoroTimer({ isOpen, onClose, initialMode = 'focus' }: PomodoroTimerProps) {
  const [mode, setMode] = useState<keyof typeof MODES>(initialMode);
  const [timeLeft, setTimeLeft] = useState(MODES[initialMode].time);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        setSessions((prev) => prev + 1);
        // Play sound or notification here
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].time);
  };

  const handleModeChange = (newMode: keyof typeof MODES) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((MODES[mode].time - timeLeft) / MODES[mode].time) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Background Decoration */}
            <div className={`absolute top-0 left-0 w-full h-2 bg-linear-to-r from-transparent via-${MODES[mode].color.replace('bg-', '')} to-transparent opacity-50`} />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
                {mode === 'focus' ? <Target className="text-indigo-600" /> : <Coffee className="text-emerald-600" />}
                Focus Mode
              </h2>
              <p className="text-slate-500 text-sm">
                {mode === 'focus' ? 'Stay focused on your task.' : 'Take a break and recharge.'}
              </p>
            </div>

            {/* Timer Display */}
            <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-100"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                  className={`${MODES[mode].text} transition-all duration-1000 ease-linear`}
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="text-center z-10">
                <div className={`text-6xl font-black ${MODES[mode].text} tabular-nums tracking-tight`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-slate-400 font-medium mt-2 uppercase tracking-widest text-xs">
                  {isActive ? 'Running' : 'Paused'}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={toggleTimer}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${MODES[mode].color}`}
              >
                {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
              <button
                onClick={resetTimer}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <RotateCcw size={24} />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex justify-center gap-2 bg-slate-50 p-1.5 rounded-xl">
              {(Object.keys(MODES) as Array<keyof typeof MODES>).map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === m
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {MODES[m].label}
                </button>
              ))}
            </div>

            {/* Session Counter */}
            <div className="mt-6 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sessions Completed: <span className="text-slate-900 text-sm ml-1">{sessions}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
