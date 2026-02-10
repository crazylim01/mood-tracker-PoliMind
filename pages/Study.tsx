
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Play, Pause, Waves, Brain, VolumeX, CheckCircle2, Circle, Plus, Trash2, Timer, Volume2, Music } from 'lucide-react';

export const Study: React.FC = () => {
  const { t } = useTranslation();
  const [goalMode, setGoalMode] = useState<'active' | 'history'>('active');
  const [goalInput, setGoalInput] = useState('');
  const [goals, setGoals] = useState<{id: string, text: string, done: boolean}[]>(() => {
    const saved = localStorage.getItem('study-goals');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');

  // Ambient Audio State
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<AudioNode[]>([]);
  const lfoNodesRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    localStorage.setItem('study-goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      if (timerType === 'focus') {
        setSessions(s => s + 1);
        setTimeLeft(5 * 60); 
        setTimerType('break');
      } else {
        setTimeLeft(25 * 60);
        setTimerType('focus');
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerType]);

  const stopAmbient = useCallback(() => {
    activeNodesRef.current.forEach(node => {
      try {
        if ('stop' in node) (node as any).stop();
        node.disconnect();
      } catch (e) {}
    });
    lfoNodesRef.current.forEach(lfo => {
      try { lfo.stop(); lfo.disconnect(); } catch (e) {}
    });
    activeNodesRef.current = [];
    lfoNodesRef.current = [];
    setActiveTrack(null);
  }, []);

  const startAmbient = async (type: string) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1.5); 
    gain.connect(ctx.destination);
    activeNodesRef.current.push(gain);

    if (type === 'lofi') {
      // LO-FI SYNTHESIZER: Multi-oscillator rhythmic beat
      const bpm = 80;
      const stepTime = 60 / bpm / 2; // 1/8th notes

      const playDrum = (freq: number, decay: number, volume: number, startTime: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, startTime + decay);
        g.gain.setValueAtTime(volume, startTime);
        g.gain.exponentialRampToValueAtTime(0.01, startTime + decay);
        osc.connect(g).connect(gain);
        osc.start(startTime);
        osc.stop(startTime + decay);
        activeNodesRef.current.push(osc);
      };

      const playPad = (freq: number, startTime: number, dur: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(0.05, startTime + 0.5);
        g.gain.linearRampToValueAtTime(0, startTime + dur);
        osc.connect(g).connect(gain);
        osc.start(startTime);
        osc.stop(startTime + dur);
        activeNodesRef.current.push(osc);
      };

      // Loop generating the next sequence of patterns
      const schedulePattern = (start: number) => {
        for (let i = 0; i < 8; i++) {
          const t = start + (i * stepTime);
          // Kick on 1 and 5
          if (i === 0 || i === 4) playDrum(150, 0.4, 0.5, t);
          // Snare on 3 and 7
          if (i === 2 || i === 6) playDrum(400, 0.1, 0.2, t);
          // Hi-hat on every 8th
          playDrum(8000, 0.02, 0.05, t);
          // Melodic Pad
          if (i === 0) playPad(220, t, stepTime * 4); // A3
          if (i === 4) playPad(261.63, t, stepTime * 4); // C4
        }
      };

      // Simple recursive scheduler for the synth
      let nextStart = ctx.currentTime;
      const interval = setInterval(() => {
        if (activeTrack !== 'lofi') {
          clearInterval(interval);
          return;
        }
        if (nextStart < ctx.currentTime + 1) {
          schedulePattern(nextStart);
          nextStart += stepTime * 8;
        }
      }, 500);
      
      activeNodesRef.current.push({ disconnect: () => clearInterval(interval) } as any);
    } else {
      // Noise-based tracks (Rain, Nature, Focus)
      const bufferSize = 4 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          if (Math.random() > 0.999) output[i] += (Math.random() * 0.3);
          output[i] *= 3.5;
        } else if (type === 'focus') {
          const freq = 110;
          const t = i / ctx.sampleRate;
          output[i] = (Math.sin(2 * Math.PI * freq * t) * 0.4 + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.2 + (white * 0.02));
        } else {
          output[i] = (lastOut + (0.01 * white)) / 1.01;
          lastOut = output[i];
          output[i] *= 2.0;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = type === 'rain' ? 1500 : type === 'focus' ? 600 : 400;

      if (type === 'nature') {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.1;
        lfoGain.gain.value = 0.05;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        lfoNodesRef.current.push(lfo);
      }

      source.connect(filter).connect(gain);
      source.start();
      activeNodesRef.current.push(source);
    }

    setActiveTrack(type);
  };

  const toggleAmbient = async (trackId: string) => {
    if (activeTrack === trackId) {
      stopAmbient();
    } else {
      stopAmbient();
      await startAmbient(trackId);
    }
  };

  useEffect(() => { return () => stopAmbient(); }, [stopAmbient]);

  const ambientTracks = [
    { id: 'lofi', title: 'POLIMIND LO-FI', icon: <Music size={14} /> },
    { id: 'nature', title: 'NATURAL BROWN', icon: <Waves size={14} /> },
    { id: 'rain', title: 'SYNTH RAIN', icon: <Waves size={14} /> },
    { id: 'focus', title: 'DEEP CONCENTRATION', icon: <Brain size={14} /> },
  ];

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="text-center space-y-1 pt-4">
        <h2 className="text-3xl font-black text-[#1e1b4b] tracking-tight uppercase">Study Hub</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">PSA Academic Performance Portal</p>
      </div>

      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-8 text-center relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-full h-2 transition-all duration-1000 ${timerType === 'focus' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>
        <div className="flex justify-between items-center">
           <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Timer size={14} /> {timerType === 'focus' ? t('studyFeatures.studyTomato') : 'Short Break'}</h4>
           <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Sessions: {sessions}</div>
        </div>
        <div className={`text-7xl font-black tracking-tighter transition-colors duration-500 ${timerType === 'focus' ? 'text-[#1e1b4b]' : 'text-emerald-600'}`}>{Math.floor(timeLeft / 60)}:{ (timeLeft % 60).toString().padStart(2, '0') }</div>
        <div className="flex gap-3">
          <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${isTimerRunning ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'}`}>
            {isTimerRunning ? <Pause size={18} /> : <Play size={18} />} {isTimerRunning ? t('studyFeatures.pauseTimer') : t('studyFeatures.startTimer')}
          </button>
          <button onClick={() => { setIsTimerRunning(false); setTimeLeft(timerType === 'focus' ? 25 * 60 : 5 * 60); }} className="px-6 py-5 bg-white text-slate-300 rounded-2xl border border-slate-100 hover:text-slate-500 transition-all"><RotateCcw size={20} /></button>
        </div>
      </section>

      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('studyFeatures.academicGoal')}</h4>
          <div className="bg-[#f1f5f9] p-1 rounded-xl flex gap-1">
            <button onClick={() => setGoalMode('active')} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${goalMode === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Active</button>
            <button onClick={() => setGoalMode('history')} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${goalMode === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Done</button>
          </div>
        </div>
        <div className="relative group">
          <input type="text" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setGoals([{ id: crypto.randomUUID(), text: goalInput, done: false }, ...goals]), setGoalInput(''))} placeholder={t('studyFeatures.goalPlaceholder')} className="w-full bg-[#f8fafc] border border-slate-100 p-4 pr-16 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all" />
          <button onClick={() => { if(goalInput.trim()) { setGoals([{ id: crypto.randomUUID(), text: goalInput, done: false }, ...goals]); setGoalInput(''); } }} className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white font-black text-[9px] uppercase rounded-xl">ADD</button>
        </div>
        <div className="space-y-3">
          {goals.filter(g => goalMode === 'active' ? !g.done : g.done).map(goal => (
            <div key={goal.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
              <button onClick={() => setGoals(goals.map(g => g.id === goal.id ? { ...g, done: !g.done } : g))} className="text-indigo-400">{goal.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button>
              <span className={`flex-1 text-xs font-bold ${goal.done ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{goal.text}</span>
              <button onClick={() => setGoals(goals.filter(g => g.id !== goal.id))} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
           <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('studyFeatures.calmMusic')}</h4>
           {activeTrack && (
             <div className="flex items-center gap-1">
               <div className="w-1 h-3 bg-indigo-500 animate-[eq_0.5s_infinite_0s]"></div>
               <div className="w-1 h-5 bg-indigo-500 animate-[eq_0.5s_infinite_0.1s]"></div>
               <div className="w-1 h-2 bg-indigo-500 animate-[eq_0.5s_infinite_0.2s]"></div>
               <div className="w-1 h-4 bg-indigo-500 animate-[eq_0.5s_infinite_0.3s]"></div>
             </div>
           )}
        </div>
        <div className="grid grid-cols-1 gap-3">
           {ambientTracks.map((track) => (
             <button 
               key={track.id}
               onClick={() => toggleAmbient(track.id)}
               className={`p-5 rounded-2xl flex items-center justify-between transition-all group border-2 ${activeTrack === track.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'bg-slate-50 text-slate-400 border-transparent hover:border-indigo-100'}`}
             >
               <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-xl ${activeTrack === track.id ? 'bg-white/20' : 'bg-white'}`}>
                    {activeTrack === track.id ? <Volume2 className="animate-pulse" size={18} /> : track.icon}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest">{track.title}</span>
               </div>
               {activeTrack === track.id ? <Pause size={16} /> : <Play size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
             </button>
           ))}
           <button onClick={stopAmbient} className="p-4 rounded-2xl text-[9px] font-black uppercase text-slate-300 hover:text-rose-500 flex items-center justify-center gap-2 transition-colors"><VolumeX size={14} /> SILENCE ALL</button>
        </div>
      </section>

      <style>{`
        @keyframes eq { 0%, 100% { height: 4px; opacity: 0.5; } 50% { height: 16px; opacity: 1; } }
      `}</style>
    </div>
  );
};
