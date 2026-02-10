
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMoodStore } from '../store';
import { 
  LayoutDashboard, 
  BookText, 
  Sparkles, 
  GraduationCap, 
  HeartPulse, 
  History, 
  Settings as SettingsIcon,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { ChatWidget } from './ChatWidget';
import { Draggable } from './Draggable';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, isAuthenticated } = useMoodStore();

  const isStaff = currentUser?.role && currentUser.role !== 'student';

  const bottomNavItems = [
    { path: '/', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/journal', label: t('journal'), icon: BookText },
    { path: '/wellness', label: t('wellness'), icon: Sparkles },
    { path: '/study', label: t('study'), icon: GraduationCap },
    { path: '/history', label: t('history'), icon: History },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const helpUrl = "https://sites.google.com/view/epsychologypsa/";

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faff] text-slate-700 font-['Plus_Jakarta_Sans']">
      {/* Draggable SOS Button */}
      {isAuthenticated && (
        <Draggable id="sos-btn" initialX={window.innerWidth - 80} initialY={window.innerHeight - 180}>
          <a 
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-14 h-14 bg-red-600 text-white rounded-full font-black shadow-[0_15px_30px_-5px_rgba(220,38,38,0.4)] hover:bg-red-700 hover:scale-110 transition-all active:scale-90 border-4 border-white z-[200]"
          >
            <span className="text-[10px] tracking-tighter">SOS</span>
          </a>
        </Draggable>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pb-32">
        <header className="py-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-[1.2rem] text-white shadow-lg shadow-indigo-100">
              <HeartPulse size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                POLI<span className="text-indigo-600">MIND</span>
              </h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Politeknik Wellness</p>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              {isStaff && (
                <Link to="/admin" className={`p-3 rounded-2xl transition-all ${location.pathname === '/admin' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>
                  <ShieldCheck size={20} />
                </Link>
              )}
              <Link to="/settings" className={`p-3 rounded-2xl transition-all ${location.pathname === '/settings' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>
                <SettingsIcon size={20} />
              </Link>
              <button 
                onClick={handleLogout}
                className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                title={t('logout')}
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </header>

        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Persistent Bottom Navigation - Vibrant Indigo Theme */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/50 p-2 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)]">
        <div className="flex justify-around items-center">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 flex-1 ${
                  isActive ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-300'
                }`}
              >
                <div className={`p-3.5 rounded-[1.8rem] transition-all duration-500 ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110 -translate-y-1' : 'hover:bg-indigo-50'}`}>
                  <Icon size={22} strokeWidth={isActive ? 3 : 2} />
                </div>
                {isActive && (
                  <span className="text-[8px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {isAuthenticated && <ChatWidget />}
    </div>
  );
};
