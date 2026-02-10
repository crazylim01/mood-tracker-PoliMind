
import React, { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMoodStore } from '../store';
import { Trash2, Calendar, Clock, Tag, RefreshCw, Loader2 } from 'lucide-react';

export const History: React.FC = () => {
  const { t } = useTranslation();
  const { entries, deleteEntry, currentUser, fetchUserData, isSyncing } = useMoodStore();

  const userEntries = useMemo(() => 
    (entries || []).filter(e => e.userId === currentUser?.id), 
    [entries, currentUser?.id]
  );

  const handleManualSync = async () => {
    await fetchUserData();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('history')}</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{userEntries.length} Total Logs</p>
        </div>
        <button 
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`p-4 rounded-2xl transition-all ${isSyncing ? 'bg-indigo-50 text-indigo-400' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 active:scale-95'}`}
        >
          {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
        </button>
      </div>

      <div className="grid gap-4">
        {userEntries.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-center">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p className="font-bold text-sm">No mood logs found.</p>
            <p className="text-xs mt-2 opacity-60">Try logging your mood on the dashboard.</p>
          </div>
        ) : (
          userEntries.map((entry) => (
            <div key={entry.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-start gap-5 hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-indigo-500 transition-colors"></div>
              <div className="p-4 bg-slate-50 rounded-[1.5rem] text-3xl group-hover:scale-110 transition-transform">
                {entry.mood === 'happy' ? '😊' : entry.mood === 'excited' ? '🤩' : entry.mood === 'neutral' ? '😐' : entry.mood === 'tired' ? '😴' : entry.mood === 'sad' ? '😢' : '😫'}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-slate-900 capitalize tracking-tight">
                      {t(`moods.${entry.mood}`)} 
                      <span className="text-[10px] font-bold text-slate-400 ml-2 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">Level {entry.intensity}/5</span>
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(entry.timestamp).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { if(window.confirm('Delete this log?')) deleteEntry(entry.id); }}
                    className="p-2 text-slate-200 hover:text-red-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {entry.note && ( <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl italic leading-relaxed"> "{entry.note}" </p> )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {entry.activities.map(act => (
                    <span key={act} className="flex items-center gap-1 text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100/50">
                      <Tag size={10} /> {t(`activities.${act}`)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
