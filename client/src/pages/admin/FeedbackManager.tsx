import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, MessageSquare, AlertCircle, CheckCircle, Clock, X, Send, Trash2 } from 'lucide-react';

interface FeedbackItem {
  _id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  rating: number | null;
  status: 'Pending' | 'In Progress' | 'Resolved';
  reply: string;
  createdAt: string;
}

export default function FeedbackManager() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filtered, setFiltered] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Handlers
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  // Selection
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState<'Pending' | 'In Progress' | 'Resolved'>('Pending');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/feedback', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
        setFiltered(data);
      }
    } catch (error) {
      console.error('Failed to fetch feedback', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  useEffect(() => {
    let result = feedbacks;
    if (filterType !== 'All') {
      result = result.filter(f => f.type === filterType || f.status === filterType);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(lower) || 
        f.email.toLowerCase().includes(lower) || 
        f.message.toLowerCase().includes(lower)
      );
    }
    setFiltered(result);
  }, [searchTerm, filterType, feedbacks]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/feedback/${selectedItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusUpdate, reply: replyText })
      });
      if (res.ok) {
        const updated = await res.json();
        setFeedbacks(prev => prev.map(f => f._id === updated._id ? updated : f));
        setSelectedItem(null);
        showToast('Feedback updated successfully');
      }
    } catch (error) {
      showToast('Error updating feedback', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFeedbacks(prev => prev.filter(f => f._id !== id));
        if (selectedItem?._id === id) setSelectedItem(null);
        showToast('Feedback deleted', 'success');
      }
    } catch (error) {
      showToast('Error deleting feedback', 'error');
    }
  };

  const openDetails = (item: FeedbackItem) => {
    setSelectedItem(item);
    setReplyText(item.reply || '');
    setStatusUpdate(item.status);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Resolved': return <CheckCircle size={14} className="mr-1" />;
      case 'In Progress': return <Clock size={14} className="mr-1" />;
      default: return <AlertCircle size={14} className="mr-1" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 text-white transition-all transform animate-in ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Feedback Manager</h1>
          <p className="text-slate-500 mt-1">Review, respond, and resolve user feedback.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search feedback..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-64"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Bug">Bug</option>
              <option value="Suggestion">Suggestion</option>
              <option value="Complaint">Complaint</option>
              <option value="Pending">Pending Status</option>
              <option value="Resolved">Resolved Status</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-white border border-slate-200 rounded-4xl overflow-hidden shadow-sm flex flex-col min-h-0">
        {loading ? (
           <div className="p-12 flex justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <MessageSquare size={48} className="text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-600">No feedback found</p>
            <p className="text-sm">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-slate-50 z-10 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-4 rounded-tl-xl w-[20%]">User</th>
                  <th className="p-4 w-[15%]">Type / Rating</th>
                  <th className="p-4 w-[35%]">Message Preview</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <motion.tr 
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    onClick={() => openDetails(item)}
                    className="border-b border-slate-100 hover:bg-indigo-50/50 cursor-pointer group transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium font-mono border border-slate-200">
                          {item.type}
                        </span>
                        {item.rating && <span className="text-amber-500 text-xs font-bold flex items-center">★ {item.rating}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-600 line-clamp-2 max-w-sm">
                        {item.message}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Side Panel/Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-800">Feedback Details</h2>
                <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">From</h3>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-semibold text-slate-800">{selectedItem.name}</p>
                    <p className="text-sm text-slate-600">{selectedItem.email}</p>
                    <p className="text-xs text-slate-400 mt-2">Submitted on {new Date(selectedItem.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Category</h3>
                  <div className="flex gap-2 items-center">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-lg font-medium border border-indigo-100">
                      {selectedItem.type}
                    </span>
                    {selectedItem.rating && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 text-sm rounded-lg font-medium border border-amber-100 flex items-center gap-1">
                        ★ {selectedItem.rating} / 5
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Message</h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedItem.message}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-medium text-slate-500 mb-3">Resolution Status</h3>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value as any)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="Pending">Pending Preview</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">Admin Reply / Notes</h3>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a response or internal note..."
                    rows={4}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Responses are saved to the database. External email replies can be integrated here.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setSelectedItem(null)} 
                  className="px-4 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 flex-1 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdate}
                  className="px-4 py-2.5 rounded-xl font-medium text-white bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 flex-2 flex justify-center items-center gap-2 transition-colors"
                >
                  <Send size={18} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
