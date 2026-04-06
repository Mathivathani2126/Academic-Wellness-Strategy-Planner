import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-800 text-yellow-400 border border-slate-700 hover:bg-slate-700' 
          : 'bg-white text-indigo-600 border border-slate-200 hover:bg-slate-50 shadow-sm'
      }`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </motion.button>
  );
}
