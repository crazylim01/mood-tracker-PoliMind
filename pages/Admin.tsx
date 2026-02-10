import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMoodStore, STUDENTS_DATABASE, STAFF_DATABASE } from '../store';
import { Users, BarChart3, AlertCircle, Search, Filter, ShieldCheck, UserCheck, ChevronRight, Activity, Calendar, X, Clock, Tag, Database } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export const Admin: React.FC = () => {
  const { t } = useTranslation();
  const { entries, currentUser, registeredStudents } = useMoodStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'overview' | 'students' | 'database'>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'lecturer' || currentUser?.role === 'counselor';

  if (!isStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <p>Unauthorized access. This area is for Politeknik staff only.</p>
      </div>
    );
  }

  // Aggregate Data
  const moodCounts = (entries || []).reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodChartData = Object.entries(moodCounts).map(([mood, count]) => ({
    name: t(`moods.${mood}`),
    count,
    moodKey: mood
  }));

  const moodColors: Record<string, string> = {
    happy: '#fbbf24',
    neutral: '#94a3b8',
    sad: '#60a5fa',
    stressed: '#ef4444',
    tired: '#8b5cf6',
    excited: '#f472b6',
  };

  const avgIntensity = entries.length > 0 
    ? (entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length).toFixed(1) 
    : 0;

  // Combined Roster for the Database tab
  // Fix: Explicitly type allKnownStudents to avoid index signature issues
  const allKnownStudents: Record<string, string> = { ...STUDENTS_DATABASE, ...registeredStudents };

  // Student Roster mapping for analytics
  const studentStats = useMemo(() => {
    const stats: Record<string, { name: string; logs: number; avgIntensity: number; lastActive: number }> = {};
    
    // Fix: Explicitly cast entries to [string, string][] to ensure 'name' is correctly typed as string instead of unknown
    (Object.entries(allKnownStudents) as [string, string][]).forEach(([id, name]) => {
      const studentLogs = entries.filter(e => e.userId === id);
      stats[id] = {
        name,
        logs: studentLogs.length,
        avgIntensity: studentLogs.length > 0 ? (studentLogs.reduce((sum, l) => sum + l.intensity, 0) / studentLogs.length) : 0,
        lastActive: studentLogs.length > 0 ? Math.max(...studentLogs.map(l => l.timestamp)) : 0
      };
    });

    return Object.entries(stats)
      .filter(([id, data]) => 
        data.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b[1].lastActive - a[1].lastActive);
  }, [entries, searchTerm, allKnownStudents]);

  const selectedStudentLogs = useMemo(() => {
    if (!selectedStudentId) return [];
    return entries
      .filter(e => e.userId === selectedStudentId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, selectedStudentId]);

  return (
    <div className="space-y-8 animate-in slide-in-from-top-4 duration-500 pb-20">
      {/* Student Detail Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">Student Clinical Review</p>
                <h3 className="text-2xl font-black tracking-tight">{allKnownStudents[selectedStudentId] || selectedStudentId}</h3>
                <p className="text-sm font-bold opacity-80">{selectedStudentId} • {selectedStudentLogs.length} Records Found</p>
              </div>
              <button onClick={() => setSelectedStudentId(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {selectedStudentLogs.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic">No logs recorded by this student yet.</div>
              ) : (
                selectedStudentLogs.map(log => (
                  <div key={log.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex gap-6 group hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform" style={{ backgroundColor: `${moodColors[log.mood]}10` }}>
                      {log.mood === 'happy' ? '😊' : log.mood === 'excited' ? '🤩' : log.mood === 'neutral' ? '😐' : log.mood === 'tired' ? '😴' : log.mood === 'sad' ? '😢' : '😫'}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-black text-slate-800 capitalize">{t(`moods.${log.mood}`)}</p>
                          <div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(log.timestamp).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${log.intensity > 3 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          Intensity {log.intensity}/5
                        </div>
                      </div>
                      
                      {log.note && (
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 italic text-sm text-slate-600 shadow-sm">
                          "{log.note}"
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {log.activities.map(act => (
                          <span key={act} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Tag size={10} className="text-indigo-400" /> {t(`activities.${act}`)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
               <button className="px-8 py-4 bg-white text-slate-400 font-bold rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all">Flag For Review</button>
               <button onClick={() => setSelectedStudentId(null)} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95">Close Profile</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Staff Oversight Panel</h2>
          </div>
          <p className="text-sm text-slate-400 font-medium italic">Welcome, {currentUser?.name}. Monitoring Campus Wellness.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full">
          <button 
            onClick={() => setView('overview')}
            className={`px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all whitespace-nowrap ${view === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setView('students')}
            className={`px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all whitespace-nowrap ${view === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setView('database')}
            className={`px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all whitespace-nowrap ${view === 'database' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Database
          </button>
        </div>
      </div>

      {view === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Users size={24} /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('totalLogs')}</p>
                <p className="text-2xl font-black text-slate-900">{entries.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
              <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><BarChart3 size={24} /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('avgMood')}</p>
                <p className="text-2xl font-black text-slate-900">{avgIntensity}/5</p>
              </div>
            </div>
            <div className="bg-rose-600 p-6 rounded-3xl border border-rose-500 flex items-center gap-4 shadow-lg shadow-rose-100">
              <div className="bg-white/20 p-4 rounded-2xl text-white"><UserCheck size={24} /></div>
              <div className="text-white">
                <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Active Students</p>
                <p className="text-2xl font-black">{studentStats.filter(([_, d]) => d.logs > 0).length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <h3 className="font-black mb-8 text-slate-800 tracking-tight">Campus Mood Distribution</h3>
               <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moodChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} dy={10} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '15px'}} 
                      />
                      <Bar dataKey="count" radius={[12, 12, 0, 0]} barSize={40}>
                        {moodChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={moodColors[entry.moodKey] || '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-slate-800 tracking-tight">Recent Wellness Logs</h3>
                  <button onClick={() => setView('students')} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">View All <ChevronRight size={14} /></button>
               </div>
               <div className="space-y-4">
                  {entries.slice(0, 6).map(entry => {
                    const studentName = allKnownStudents[entry.userId] || 'Unknown Student';
                    return (
                      <div 
                        key={entry.id} 
                        onClick={() => setSelectedStudentId(entry.userId)}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[1.5rem] transition-all border border-transparent hover:border-slate-100 group cursor-pointer"
                      >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm`} style={{ backgroundColor: `${moodColors[entry.mood]}20` }}>
                             {entry.mood === 'happy' ? '😊' : entry.mood === 'excited' ? '🤩' : entry.mood === 'neutral' ? '😐' : entry.mood === 'tired' ? '😴' : entry.mood === 'sad' ? '😢' : '😫'}
                          </div>
                          <div className="flex-1">
                             <p className="text-sm font-black text-slate-800 line-clamp-1">{studentName}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{entry.userId} • {new Date(entry.timestamp).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-slate-700 capitalize">{t(`moods.${entry.mood}`)}</p>
                             <div className={`text-[10px] font-bold ${entry.intensity > 3 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                Intensity {entry.intensity}/5
                             </div>
                          </div>
                      </div>
                    );
                  })}
                  {entries.length === 0 && (
                    <div className="text-center py-16 text-slate-300 text-sm italic font-medium">No activity yet.</div>
                  )}
               </div>
            </section>
          </div>
        </>
      )}

      {view === 'students' && (
        <div className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search Student Name or Matrix Number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-700"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Logs</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Avg Wellness</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Active</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {studentStats.map(([id, data]) => (
                    <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {data.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{data.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-slate-300" />
                          <span className="text-sm font-bold text-slate-600">{data.logs} Entries</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${data.avgIntensity > 3 ? 'bg-emerald-400' : 'bg-rose-400'}`} 
                                style={{ width: `${(data.avgIntensity / 5) * 100}%` }}
                              />
                           </div>
                           <span className="text-xs font-black text-slate-700">{data.avgIntensity.toFixed(1)}/5</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={14} className="opacity-40" />
                          <span className="text-xs font-medium">{data.lastActive ? new Date(data.lastActive).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button 
                          onClick={() => setSelectedStudentId(id)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                         >
                           View Logs
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'database' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Staff Database */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="text-indigo-600" />
                  <h3 className="font-black text-slate-800 tracking-tight">Staff & Lecturer Records</h3>
               </div>
               <div className="space-y-3">
                  {Object.entries(STAFF_DATABASE).map(([id, info]) => (
                    <div key={id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                       <div>
                          <p className="text-sm font-black text-slate-800">{info.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{id}</p>
                       </div>
                       <div className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                          {info.role}
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Student Database Overview */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
               <div className="flex items-center gap-3">
                  <Database className="text-indigo-600" />
                  <h3 className="font-black text-slate-800 tracking-tight">System Student Index</h3>
               </div>
               <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                  <div className="flex justify-between items-end mb-4">
                     <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Pre-Authorized Students</p>
                        <p className="text-3xl font-black text-indigo-900">{Object.keys(STUDENTS_DATABASE).length}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Self-Registered (In-Store)</p>
                        <p className="text-3xl font-black text-indigo-900">{Object.keys(registeredStudents).length}</p>
                     </div>
                  </div>
                  <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden flex">
                     <div className="h-full bg-indigo-600" style={{ width: '60%' }}></div>
                     <div className="h-full bg-indigo-300" style={{ width: '40%' }}></div>
                  </div>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed italic">
                 Note: To add more staff or students to the official roster, update the data structures in <code>store.ts</code>.
               </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};