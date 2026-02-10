
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMoodStore, STUDENTS_DATABASE } from '../store';
import { 
  HeartPulse, 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Info, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, registerNewStudent, registeredStudents } = useMoodStore();
  
  const [loginMode, setLoginMode] = useState<'student' | 'staff'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const normalized = username.toUpperCase().trim();
    if (loginMode === 'student' && normalized.startsWith('08') && normalized.length === 12) {
      if (!STUDENTS_DATABASE[normalized] && !registeredStudents[normalized]) {
        setNeedsRegistration(true);
      } else {
        setNeedsRegistration(false);
      }
    } else {
      setNeedsRegistration(false);
    }
  }, [username, loginMode, registeredStudents]);

  const handleLogin = async () => {
    const normalizedId = username.toUpperCase().trim();
    
    if (!username.trim()) {
      (window as any).alert("ID is required");
      return;
    }
    if (!password.trim()) {
      (window as any).alert("Password is required");
      return;
    }
    if (!agreed) {
      (window as any).alert("Sila bersetuju dengan syarat privasi untuk meneruskan.");
      return;
    }

    if (needsRegistration) {
      if (!newName.trim()) {
        (window as any).alert("Sila masukkan nama penuh anda untuk pendaftaran kali pertama.");
        return;
      }
      registerNewStudent(normalizedId, newName.trim());
    }
    
    setIsLoggingIn(true);
    const result = await login(normalizedId, password, loginMode);
    setIsLoggingIn(false);

    if (result.success) {
      navigate('/');
    } else if (result.message === 'NEW_STUDENT_DETECTED') {
      setNeedsRegistration(true);
    } else {
      (window as any).alert(result.message);
    }
  };

  const usernameLength = username.trim().length;

  return (
    <div className="min-h-screen bg-[#f8faff] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-100/40 rounded-full blur-[60px]"></div>
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-rose-100/30 rounded-full blur-[60px]"></div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl max-w-sm w-full space-y-5 border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">{t('privacyPolicy.title')}</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{t('privacyPolicy.intro')}</p>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl">
                  <CheckCircle2 size={14} className="text-indigo-500 mt-0.5" />
                  <p className="text-[11px] text-slate-700 font-bold leading-relaxed">{t(`privacyPolicy.point${i}`)}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowPrivacyModal(false)} className="w-full bg-indigo-600 text-white font-black py-3.5 rounded-xl shadow-lg transition-all active:scale-95 text-xs">
              {t('privacyPolicy.close')}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[400px] w-full bg-white p-8 rounded-[3rem] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.06)] border border-white relative z-10 flex flex-col items-center">
        {/* Centered Logo */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-[1.8rem] text-white shadow-[0_12px_25px_-5px_rgba(79,70,229,0.3)] mb-6">
          <HeartPulse size={36} strokeWidth={2.5} />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Welcome Back</h1>
          <p className="text-slate-400 font-bold text-xs tracking-wide">PoliMind: Politeknik Mental Wellness</p>
        </div>

        {/* Segmented Control */}
        <div className="w-full grid grid-cols-2 gap-1 bg-slate-50/80 p-1 rounded-[1.5rem] mb-8 border border-slate-100">
          <button 
            onClick={() => { setLoginMode('student'); setNeedsRegistration(false); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-[1.2rem] text-[10px] font-black tracking-widest transition-all ${loginMode === 'student' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
          >
            <GraduationCap size={14} />
            {t('loginAsStudent').toUpperCase()}
          </button>
          <button 
            onClick={() => { setLoginMode('staff'); setNeedsRegistration(false); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-[1.2rem] text-[10px] font-black tracking-widest transition-all ${loginMode === 'staff' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
          >
            <ShieldCheck size={14} />
            {t('loginAsAdmin').toUpperCase()}
          </button>
        </div>

        <div className="w-full space-y-6">
          {/* Identity Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-end px-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                 {loginMode === 'student' ? 'MATRIX NUMBER' : 'STAFF ID / ADMIN'}
               </label>
               {loginMode === 'student' && usernameLength > 0 && (
                  <span className="text-[9px] font-black uppercase tracking-widest transition-all text-slate-400">
                    {usernameLength} / 12 Digits
                  </span>
               )}
            </div>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={loginMode === 'student' ? '08DPI...' : 'PSA-LEC-01'}
                className="w-full pl-11 pr-5 py-4 bg-[#fbfcfd] border border-slate-200/50 rounded-[1.2rem] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400/30 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
              />
              
              {/* Subtle visual progress line for the matrix number length */}
              {loginMode === 'student' && usernameLength > 0 && (
                <div className="absolute bottom-0 left-[1.2rem] right-[1.2rem] h-[2px] bg-slate-50 overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-indigo-500/20 transition-all duration-500"
                    style={{ width: `${Math.min((usernameLength / 12) * 100, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {needsRegistration && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5">
                <Sparkles size={10} /> NEW STUDENT: FULL NAME
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="NAME AS PER IC"
                className="w-full px-5 py-4 bg-indigo-50/50 border border-indigo-100 rounded-[1.2rem] focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-bold text-indigo-900 uppercase placeholder:text-indigo-200 text-sm"
              />
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">PASSWORD</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password..."
                className="w-full pl-11 pr-11 py-4 bg-[#fbfcfd] border border-slate-200/50 rounded-[1.2rem] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400/30 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[10px] font-bold text-indigo-500/80 leading-relaxed italic ml-2 max-w-[90%]">
              {loginMode === 'student' ? t('loginHintStudent') : t('loginHintStaff')}
            </p>
          </div>

          {/* Privacy Checkbox */}
          <div className="pt-1 flex items-start gap-2.5 px-1">
            <div 
              onClick={() => setAgreed(!agreed)}
              className={`mt-1 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${agreed ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-[#fcfdfe] border-slate-200 text-transparent'}`}
            >
              <CheckCircle2 size={14} strokeWidth={3} />
            </div>
            <div className="flex-1">
               <p className="text-[11px] text-slate-500 font-bold leading-snug">
                 I agree to the Privacy Policy and Data Handling.
               </p>
               <button 
                 onClick={() => setShowPrivacyModal(true)}
                 className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1 hover:underline"
               >
                 <Info size={10} strokeWidth={3} /> READ POLICY
               </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={!agreed || isLoggingIn}
            className={`group/btn flex items-center justify-center gap-2 w-full py-4 px-6 rounded-[1.5rem] font-black transition-all shadow-lg active:scale-[0.98] tracking-widest text-[12px] ${
              !agreed || isLoggingIn
                ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed border border-slate-50' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/40'
            }`}
          >
            {isLoggingIn ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>
                <span>{needsRegistration ? 'Enroll & Log In' : `Login as ${loginMode === 'student' ? 'Student' : 'Staff'}`}</span>
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 w-full text-center border-t border-slate-50">
           <p className="text-[10px] text-slate-300 uppercase tracking-[0.3em] font-black">POLITEKNIK MALAYSIA DIGITAL HEALTH</p>
        </div>
      </div>
    </div>
  );
};
