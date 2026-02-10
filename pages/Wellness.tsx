
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wind, Timer, Sparkles, X, Loader2, Volume2, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useMoodStore } from '../store';
import { generateMeditation, generateMeditationAudio } from '../services/gemini';

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const Wellness: React.FC = () => {
  const { t } = useTranslation();
  const { settings, entries, currentUser } = useMoodStore();
  const [activeTab, setActiveTab] = useState<'breathing' | 'meditation'>('breathing');
  
  // Breathing State
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathTimer, setBreathTimer] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(true);

  // Meditation State
  const [meditationScript, setMeditationScript] = useState<string | null>(null);
  const [isLoadingMeditation, setIsLoadingMeditation] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const userEntries = (entries || []).filter(e => e.userId === currentUser?.id);
  const currentMood = userEntries.length > 0 ? userEntries[0].mood : 'neutral';

  // Breathing Loop
  useEffect(() => {
    let interval: any;
    if (isBreathingActive && activeTab === 'breathing') {
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev <= 1) {
            if (breathPhase === 'inhale') { setBreathPhase('hold'); return 4; }
            if (breathPhase === 'hold') { setBreathPhase('exhale'); return 4; }
            if (breathPhase === 'exhale') { setBreathPhase('inhale'); return 4; }
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase, activeTab]);

  const updateProgress = useCallback(() => {
    if (!audioContextRef.current || isPaused || !isPlayingAudio) return;
    const elapsed = audioContextRef.current.currentTime - startTimeRef.current + offsetRef.current;
    if (elapsed >= duration) {
      stopAudio();
      return;
    }
    setCurrentTime(elapsed);
    setProgress((elapsed / duration) * 100);
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  }, [isPlayingAudio, isPaused, duration]);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlayingAudio(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentTime(0);
    offsetRef.current = 0;
  }, [duration]);

  const startBufferPlayback = (offset: number) => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    const ctx = audioContextRef.current;
    
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(ctx.destination);
    
    source.onended = () => {
      if (!isPaused && isPlayingAudio && Math.abs((ctx.currentTime - startTimeRef.current + offsetRef.current) - duration) < 0.1) {
        stopAudio();
      }
    };

    sourceNodeRef.current = source;
    startTimeRef.current = ctx.currentTime;
    offsetRef.current = offset;
    source.start(0, offset);
    
    setIsPlayingAudio(true);
    setIsPaused(false);
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const playMeditationAudio = async () => {
    if (!meditationScript) return;

    // Initialize/Resume AudioContext on user gesture
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    // If we already have a buffer and are just resuming
    if (audioBufferRef.current && isPaused) {
      startBufferPlayback(offsetRef.current);
      return;
    }

    if (isPlayingAudio) stopAudio();

    setIsGeneratingAudio(true);
    try {
      const base64 = await generateMeditationAudio(meditationScript, settings);
      if (!base64) throw new Error("Audio generation failed");
      
      const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
      audioBufferRef.current = audioBuffer;
      setDuration(audioBuffer.duration);
      startBufferPlayback(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const pauseAudio = () => {
    if (!isPlayingAudio || isPaused) return;
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    const ctx = audioContextRef.current;
    if (ctx) {
      offsetRef.current += ctx.currentTime - startTimeRef.current;
    }
    setIsPaused(true);
  };

  const handleRegenerate = async () => {
    stopAudio();
    audioBufferRef.current = null;
    setIsLoadingMeditation(true);
    const newScript = await generateMeditation(settings, currentMood);
    setMeditationScript(newScript);
    setIsLoadingMeditation(false);
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stopAudio]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="text-center space-y-1 pt-4">
        <h2 className="text-3xl font-black text-[#1e1b4b] tracking-tight uppercase">Wellness Hub</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">PoliMind Regulation Protocols.</p>
      </div>

      <div className="bg-[#f8fafc] p-1.5 rounded-[2.5rem] flex shadow-sm border border-slate-100 overflow-x-auto gap-1">
        <button onClick={() => setActiveTab('breathing')} className={`flex-1 py-4 px-2 rounded-[2rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'breathing' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}><Wind size={14} /> BREATH</button>
        <button onClick={() => setActiveTab('meditation')} className={`flex-1 py-4 px-2 rounded-[2rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'meditation' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}><Timer size={14} /> FOCUS</button>
      </div>

      {activeTab === 'breathing' && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative w-72 h-72 flex items-center justify-center">
            <div className={`absolute inset-0 border-4 border-indigo-100 rounded-full transition-all duration-[4000ms] ${breathPhase === 'inhale' ? 'scale-125 opacity-100' : 'scale-75 opacity-20'}`}></div>
            <div className={`w-60 h-60 rounded-full bg-white flex flex-col items-center justify-center shadow-2xl transition-all duration-[4000ms] ${breathPhase === 'inhale' ? 'scale-100' : 'scale-90'}`}>
               <h3 className="text-3xl font-black text-indigo-600 uppercase tracking-widest">{t(`wellnessFeatures.${breathPhase}`)}</h3>
               <p className="text-4xl font-black text-slate-300 mt-4">{breathTimer}</p>
            </div>
          </div>
          <button onClick={() => setIsBreathingActive(!isBreathingActive)} className="mt-12 px-8 py-3 bg-indigo-50 text-indigo-600 rounded-full font-black text-xs uppercase tracking-widest">{isBreathingActive ? 'Pause Session' : 'Resume Session'}</button>
        </div>
      )}

      {activeTab === 'meditation' && (
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Sparkles size={24} /></div>
              <div>
                <h4 className="font-black text-slate-800 tracking-tight">{t('wellnessFeatures.meditation')}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('wellnessFeatures.meditationDesc')}</p>
              </div>
            </div>
            {meditationScript && !isLoadingMeditation && (
              <button 
                onClick={handleRegenerate}
                className="p-3 text-slate-300 hover:text-indigo-600 transition-colors"
                title="Regenerate Script"
              >
                <RotateCcw size={20} />
              </button>
            )}
          </div>

          {meditationScript ? (
            <div className="space-y-6">
              <div className="relative group">
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-indigo-50 italic text-sm text-slate-600 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                  "{meditationScript}"
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-center items-center gap-4">
                  <button 
                    onClick={stopAudio}
                    className="p-4 bg-white text-slate-400 rounded-full border border-slate-100 hover:text-rose-500 transition-all active:scale-95"
                  >
                    <Square size={20} fill="currentColor" />
                  </button>
                  
                  <button 
                    onClick={isPaused ? playMeditationAudio : (isPlayingAudio ? pauseAudio : playMeditationAudio)}
                    disabled={isGeneratingAudio}
                    className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-100 flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-50"
                  >
                    {isGeneratingAudio ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (isPaused || !isPlayingAudio) ? (
                      <Play size={24} fill="white" className="ml-1" />
                    ) : (
                      <Pause size={24} fill="white" />
                    )}
                  </button>
                  
                  <button 
                    onClick={handleRegenerate}
                    className="p-4 bg-white text-slate-400 rounded-full border border-slate-100 hover:text-indigo-600 transition-all active:scale-95"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              </div>

              <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-widest px-4">
                Voice powered by Gemini 2.5 Flash Native Audio
              </p>
            </div>
          ) : (
            <button 
              onClick={handleRegenerate}
              disabled={isLoadingMeditation}
              className="w-full py-8 bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              {isLoadingMeditation ? <Loader2 className="animate-spin" size={28} /> : <Sparkles size={28} />}
              <span className="text-xs uppercase tracking-[0.25em]">{t('wellnessFeatures.startMeditation')}</span>
            </button>
          )}
        </section>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};
