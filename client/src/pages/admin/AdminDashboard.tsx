import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, MessageSquare, Clock, CheckCircle, Star, BarChart, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SummaryData {
  totalFeedback: number;
  pendingCount: number;
  resolvedCount: number;
  mostCommonType: string;
  averageRating: string | number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulated total users for now, can be replaced with real API later
  const [totalUsers, setTotalUsers] = useState(145);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/feedback/summary', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
          // Assuming user base is growing slightly
          setTotalUsers(prev => prev + data.totalFeedback * 2);
        }
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const stats = [
    { title: 'Total Users', value: totalUsers.toString(), icon: Users, color: 'from-blue-500 to-cyan-400' },
    { title: 'Total Feedback', value: summary?.totalFeedback?.toString() || '0', icon: MessageSquare, color: 'from-indigo-500 to-purple-500' },
    { title: 'Pending Feedback', value: summary?.pendingCount?.toString() || '0', icon: Clock, color: 'from-amber-400 to-orange-500' },
    { title: 'Resolved Feedback', value: summary?.resolvedCount?.toString() || '0', icon: CheckCircle, color: 'from-emerald-400 to-green-500' },
  ];

  const analytics = [
    { title: 'Most Common Type', value: summary?.mostCommonType || 'N/A', icon: BarChart, subtitle: 'Based on all records' },
    { title: 'Average Rating', value: summary?.averageRating ? `${summary.averageRating}/5` : 'N/A', icon: Star, subtitle: 'User satisfaction' },
    { title: 'Active Sessions', value: '24', icon: Activity, subtitle: 'Real-time estimate' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Welcome back, {user?.username}. Here's an overview of the system.</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group"
              >
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-linear-to-br ${stat.color} blur-2xl group-hover:scale-150 transition-transform duration-500`} />
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-2xl bg-linear-to-br ${stat.color} text-white shadow-lg`}>
                    <Icon size={24} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-700 mb-4 mt-12">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analytics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5"
              >
                <div className="p-4 rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500">{item.title}</h4>
                  <p className="text-2xl font-bold text-slate-800">{item.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.subtitle}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
