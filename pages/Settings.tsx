
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMoodStore } from '../store';
import { User, Globe, GraduationCap, ChevronRight, LifeBuoy, ShieldCheck, Lock, Trash2, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { settings, updateSettings, logout, changePassword, currentUser, clearAllData } = useMoodStore();

  const [newName, setNewName] = useState(settings.name);
  const [nameUpdateSuccess, setNameUpdateSuccess] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const changeLanguage = (lng: 'en' | 'ms') => {
    i18n.changeLanguage(lng);
    updateSettings({ language: lng });
  };

  const handleUpdateName = () => {
    updateSettings({ name: newName });
    setNameUpdateSuccess(true);
    setTimeout(() => setNameUpdateSuccess(false), 2000);
  };

  const handleWipeData = () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete ALL local logs, journals, and chat history. This action CANNOT be undone.")) {
      clearAllData();
      navigate('/login');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassStatus({ type: 'error', msg: 'Kata laluan baru tidak sepadan / Passwords do not match' });
      return;
    }

    const result = changePassword(currentPass, newPass);
    if (result.success) {
      setPassStatus({ type: 'success', msg: 'Berjaya dikemaskini / Password updated!' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setPassStatus({ type: 'error', msg: result.message || 'Error' });
    }
  };

  const campusName = 'Politeknik Sultan Salahuddin Abdul Aziz Shah';
  const helpUrl = "https://sites.google.com/view/epsychologypsa/";

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings')}</h2>

      {/* Profile Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-50">
          <h3 className="flex items-center gap-3 font-black text-slate-800 tracking-tight">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500">
              <User size={18} />
            </div>
            Profile Info
          </h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400/30 outline-none transition-all font-bold text-slate-700"
              />
              <button 
                onClick={handleUpdateName}
                className={`px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                  nameUpdateSuccess ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
                }`}
              >
                {nameUpdateSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {nameUpdateSuccess ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role / Peranan</label>
            <div className="p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 border border-indigo-100/50">
              <ShieldCheck size={14} />
              {currentUser?.role || 'User'}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Politeknik Campus</label>
            <div className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 font-bold flex items-center gap-2">
              <GraduationCap size={16} className="text-indigo-500" />
              {campusName}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-50">
          <h3 className="flex items-center gap-3 font-black text-slate-800 tracking-tight">
            <div className="bg-rose-50 p-2 rounded-xl text-rose-500">
              <Lock size={18} />
            </div>
            Security / Keamanan
          </h3>
        </div>
        <form onSubmit={handleChangePassword} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
            <input 
              type="password" 
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 outline-none font-bold"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
              <input 
                type="password" 
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 outline-none font-bold"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New</label>
              <input 
                type="password" 
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 outline-none font-bold"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          {passStatus && (
            <p className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg ${passStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {passStatus.msg}
            </p>
          )}

          <button 
            type="submit"
            className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-95 text-xs uppercase tracking-widest"
          >
            Update Password
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-50">
          <h3 className="flex items-center gap-3 font-black text-slate-800 tracking-tight">
            <div className="bg-amber-50 p-2 rounded-xl text-amber-500">
              <Globe size={18} />
            </div>
            Preferences
          </h3>
        </div>
        <div className="p-8 space-y-4">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-slate-50 rounded-[2rem] gap-4">
              <div>
                <p className="font-black text-sm tracking-tight">Language / Bahasa</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">App display language</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    settings.language === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  English
                </button>
                <button 
                  onClick={() => changeLanguage('ms')}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    settings.language === 'ms' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  Malay
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50 rounded-[2.5rem] border border-rose-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-rose-100 flex items-center justify-between">
          <h3 className="flex items-center gap-3 font-black text-rose-900 tracking-tight">
            <div className="bg-white p-2 rounded-xl text-rose-500 shadow-sm">
              <AlertTriangle size={18} />
            </div>
            Danger Zone
          </h3>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-[11px] font-bold text-rose-700/70 uppercase tracking-widest leading-relaxed">
            Want to clear everything? This will wipe all your mood logs, journals, and local accounts.
          </p>
          <button 
            onClick={handleWipeData}
            className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 active:scale-95 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Factory Reset (Wipe All Data)
          </button>
        </div>
      </div>

      <a 
        href={helpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 hover:border-indigo-300 transition-all group shadow-sm hover:shadow-xl"
      >
        <div className="flex items-center gap-5">
          <div className="bg-white p-4 rounded-[1.5rem] shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
            <LifeBuoy size={28} />
          </div>
          <div>
            <h4 className="font-black text-indigo-900 text-sm tracking-tight">{t('help')}</h4>
            <p className="text-indigo-700/70 text-[11px] font-bold uppercase tracking-widest">{t('helpSubtitle')}</p>
          </div>
          <ChevronRight className="ml-auto text-indigo-300 group-hover:translate-x-2 transition-transform" />
        </div>
      </a>
    </div>
  );
};
