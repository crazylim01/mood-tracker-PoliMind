
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMoodStore } from '../store';
import { MoodSphere } from '../components/MoodSphere';
import { getMoodInsights } from '../services/gemini';
import { MoodInsight, MoodType } from '../types';
import { 
  Sparkles, 
  BrainCircuit, 
  Plus, 
  TrendingUp, 
  Loader2, 
  CheckCircle2, 
  Calendar,
  Zap,
  Moon,
  Sun,
  CloudRain,
  Smile,
  Info,
  ChevronRight,
  Save,
  RefreshCw,
  Layout
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { entries, settings, currentUser, addEntry, fetchUserData, isSyncing } = useMoodStore();
  
  // Insights State
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insight, setInsight] = useState<MoodInsight | null>(null);
  const [activeAiTab, setActiveAiTab] = useState<'wellness' | 'plan'>('wellness');

  // Form State
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentUser && entries.length === 0) fetchUserData();
  }, [currentUser]);

  const userEntries = useMemo(() => 
    (entries || []).filter(e => e.userId === currentUser?.id), 
    [entries, currentUser?.id]
  );

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString([], { weekday: 'short' });
    });
    return last7Days.map(day => {
      const dayEntries = userEntries.filter(e => 
        new Date(e.timestamp).toLocaleDateString([], { weekday: 'short' }) === day
      );
      const avgIntensity = dayEntries.length > 0 
        ? dayEntries.reduce((acc, curr) => acc + curr.intensity, 0) / dayEntries.length 
        : 0;
      return { name: day, intensity: avgIntensity };
    });
  }, [userEntries]);

  const activitiesList = [
    'studying', 'assignment', 'exam', 'fyp', 
    'internship', 'social', 'sports', 'rest', 
    'family', 'personal', 'breakup', 'financial'
  ];

  const moodOptions: { type: MoodType; icon: string; label: string }[] = [
    { type: 'happy', icon: '😊', label: t('moods.happy') },
    { type: 'excited', icon: '🤩', label: t('moods.excited') },
    { type: 'neutral', icon: '😐', label: t('moods.neutral') },
    { type: 'tired', icon: '😴', label: t('moods.tired') },
    { type: 'sad', icon: '😢', label: t('moods.sad') },
    { type: 'stressed', icon: '😫', label: t('moods.stressed') },
  ];

  const fetchInsights = useCallback(async () => {
    if (loadingInsights || userEntries.length === 0) return;
    setLoadingInsights(true);
    try {
      const result = await getMoodInsights(userEntries, settings);
      if (result) setInsight(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  }, [userEntries.length, settings]);

  useEffect(() => {
    if (userEntries.length > 0 && !insight && !loadingInsights) {
      const timer = setTimeout(() => fetchInsights(), 1500);
      return () => clearTimeout(timer);
    }
  }, [userEntries.length, insight]);

  const handleSave = async () => {
    if (!selectedMood) return;
    setIsSaving(true);
    await addEntry({ mood: selectedMood, intensity, note, activities: selectedActivities });
    setSaveSuccess(true);
    setTimeout(() => {
      setSelectedMood(null);
      setIntensity(3);
      setNote('');
      setSelectedActivities([]);
      setIsSaving(false);
      setSaveSuccess(false);
    }, 1200);
  };

  const displayName = useMemo(() => {
    if (!settings?.name) return 'STUDENT';
    return settings.name.toUpperCase();
  }, [settings?.name]);

  const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex justify-between items-start pt-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hello, {displayName}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">HOW ARE YOU FEELING TODAY?</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2.5 rounded-2xl text-indigo-600 font-black text-[10px] tracking-widest shadow-sm">
           <Calendar size={14} strokeWidth={3} />
           {todayDate}
        </div>
      </div>

      {/* Mood Logging Card */}
      <section className="bg-white p-8 rounded-[3rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.04)] space-y-8 relative overflow-hidden">
        {saveSuccess && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xl z-20 flex flex-col items-center justify-center text-indigo-600 animate-in zoom-in-95 duration-300">
            <CheckCircle2 size={64} className="mb-4 animate-bounce" />
            <h3 className="text-2xl font-black tracking-tight uppercase">Moment Saved</h3>
          </div>
        )}

        <div className="flex items-center gap-3">
           <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <Zap size={22} fill="currentColor" />
           </div>
           <h3 className="text-xl font-black text-slate-800 tracking-tight">Log Your Mood</h3>
        </div>

        <div className="space-y-2 text-center">
           <p className="text-xs font-bold text-slate-400 text-left ml-2">How are you feeling today?</p>
           <div className="grid grid-cols-3 md:grid-cols-6 gap-3 pt-2">
             {moodOptions.map((opt) => (
               <button
                 key={opt.type}
                 onClick={() => setSelectedMood(opt.type)}
                 className={`flex flex-col items-center justify-center p-4 rounded-[1.8rem] transition-all duration-300 border-2 ${
                   selectedMood === opt.type 
                   ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-110 -translate-y-1' 
                   : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                 }`}
               >
                 <span className="text-2xl mb-1">{opt.icon}</span>
                 <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
               </button>
             ))}
           </div>
        </div>

        {/* Intensity */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intensity</label>
            <span className="text-xs font-black text-indigo-600 uppercase">Level {intensity}/5</span>
          </div>
          <div className="px-2">
            <input 
              type="range" min="1" max="5" step="1" 
              value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        {/* Activities */}
        <div className="space-y-4 pt-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">What have you been thinking?</label>
          <div className="flex flex-wrap gap-2">
            {activitiesList.map(act => (
              <button
                key={act}
                onClick={() => setSelectedActivities(prev => prev.includes(act) ? prev.filter(a => a !== act) : [...prev, act])}
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${
                  selectedActivities.includes(act) 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                  : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'
                }`}
              >
                <Plus size={12} strokeWidth={4} /> {t(`activities.${act}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="pt-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Share more about your day..."
            className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-[2.5rem] text-sm font-bold text-slate-700 outline-none transition-all h-32 resize-none shadow-inner"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!selectedMood || isSaving}
          className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-[14px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} strokeWidth={3} />}
          Save Log
        </button>
      </section>

      {/* Stats Section - MOVED UP AS REQUESTED */}
      {userEntries.length > 0 && (
        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Weekly Mood Trend</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">PERSONAL ANALYTICS</p>
              </div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} dy={15} />
                <YAxis hide domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="intensity" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorInt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* 3D Visualization Section */}
      <section className="animate-in slide-in-from-bottom-8 duration-1000">
        <MoodSphere />
      </section>

      {/* AI Wellness & Weekly Plan Section - MOVED DOWN AND SWITCH ADDED */}
      <section className="animate-in slide-in-from-bottom-8 duration-700">
        <div className="bg-[#4f46e5] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-[3s]">
            <Sparkles size={120} />
          </div>

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <BrainCircuit size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">AI Insights & Plan</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">BASED ON YOUR RECENT ACTIVITY AT POLITEKNIK.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchInsights} 
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                disabled={loadingInsights}
              >
                <RefreshCw size={20} className={loadingInsights ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Switch Toggle */}
          <div className="flex bg-white/10 p-1.5 rounded-2xl mb-8 relative z-10 w-full max-w-sm">
            <button 
              onClick={() => setActiveAiTab('wellness')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAiTab === 'wellness' ? 'bg-white text-indigo-600 shadow-xl' : 'text-white/60 hover:text-white'}`}
            >
              <Smile size={14} /> Wellness
            </button>
            <button 
              onClick={() => setActiveAiTab('plan')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAiTab === 'plan' ? 'bg-white text-indigo-600 shadow-xl' : 'text-white/60 hover:text-white'}`}
            >
              <Layout size={14} /> Weekly Plan
            </button>
          </div>

          {loadingInsights ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin" size={48} />
              <p className="text-sm font-black uppercase tracking-widest opacity-60">Synthesizing Recommendations...</p>
            </div>
          ) : insight ? (
            <div className="space-y-8 relative z-10">
              <div className="relative">
                 <p className="text-lg font-bold leading-relaxed italic opacity-95">
                   {activeAiTab === 'wellness' ? `"${insight.summary}"` : `"Your adaptive ${settings.campus} study strategy for the coming week."`}
                 </p>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60 mb-4">
                  {activeAiTab === 'wellness' ? "Suitable Suggestions" : "Weekly Schedule Milestones"}
                </p>
                {insight.recommendations.map((rec, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-start gap-4 group/item hover:bg-white/20 transition-all">
                     <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-900/20 group-hover/item:scale-110 transition-transform">
                        {activeAiTab === 'wellness' ? <Sparkles size={16} fill="currentColor" /> : <Calendar size={16} />}
                     </div>
                     <p className="text-sm font-bold leading-relaxed pt-1.5">{rec}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-[2.5rem] border-2 border-white/20 space-y-3 group/action cursor-pointer hover:bg-white/20 transition-all">
                 <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-xl group-hover/action:scale-110 transition-transform">
                      <Zap size={18} fill="currentColor" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">
                      {activeAiTab === 'wellness' ? 'Prime Suggestion' : 'Priority Goal'}
                    </h4>
                 </div>
                 <p className="text-xl font-black leading-tight group-hover/action:translate-x-1 transition-transform">{insight.suggestedAction}</p>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-6">
               <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
                  <Sparkles size={40} className="opacity-40" />
               </div>
               <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Awaiting resonance data to provide suggestions.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer Branding */}
      <div className="text-center pt-8 opacity-20 pb-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Politeknik Mental Health Companion</p>
      </div>
    </div>
  );
};

// Internal utility component for the refresh button
const RefreshCw = ({ className, size }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} height={size || 24} 
    viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" strokeWidth="3" 
    strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
