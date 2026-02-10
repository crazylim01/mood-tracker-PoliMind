
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, X, Send, Sparkles, User, Bot, Trash2, Zap, Minus, Rocket } from 'lucide-react';
import { useMoodStore } from '../store';
import { getChatResponse } from '../services/gemini';
import { Draggable } from './Draggable';

export const ChatWidget: React.FC = () => {
  const { t } = useTranslation();
  const { chatMessages, addChatMessage, clearChat, settings, currentUser } = useMoodStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for the current user only
  const userMessages = useMemo(() => 
    chatMessages.filter(m => m.userId === currentUser?.id), 
    [chatMessages, currentUser?.id]
  );

  const scrollToBottom = () => {
    (messagesEndRef.current as any)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [userMessages, isOpen, isTyping, isMinimized]);

  const handleSend = async (text: string = input) => {
    const messageText = text.trim();
    if (!messageText) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, text: messageText, timestamp: Date.now() };
    addChatMessage(userMsg);
    setInput('');
    setIsTyping(true);

    const botResponse = await getChatResponse(messageText, userMessages, settings);
    const botMsg = { id: crypto.randomUUID(), role: 'model' as const, text: botResponse, timestamp: Date.now() };
    
    setIsTyping(false);
    addChatMessage(botMsg);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[90] transition-opacity duration-1000 ${isOpen && !isMinimized ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <Draggable id="chat-trigger" initialX={window.innerWidth - 100} initialY={window.innerHeight - 100}>
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'scale-0 rotate-90 opacity-0 pointer-events-none' : 'scale-100 rotate-0 opacity-100'}`}>
          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-indigo-600 text-white p-6 rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(79,70,229,0.6)] hover:scale-110 active:scale-90 transition-all group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="absolute inset-0 rounded-[2rem] border-2 border-indigo-400 animate-[ping_3s_infinite] opacity-30"></div>
            <div className="flex items-center gap-3 relative z-10">
              <MessageCircle size={32} />
              <span className="font-bold text-sm hidden md:block">PoliBot</span>
            </div>
          </button>
        </div>
      </Draggable>

      <div 
        className={`fixed bottom-8 right-8 z-[110] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100 translate-y-0 rotate-0' : 'scale-0 opacity-0 translate-y-40 rotate-12 pointer-events-none'}
          ${isMinimized ? 'h-[86px] w-[320px]' : 'h-[85vh] max-h-[850px] w-[95vw] md:w-[520px]'}
        `}
      >
        <div className="h-full w-full bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] border border-indigo-50/50 flex flex-col overflow-hidden relative">
          {!isMinimized && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
              <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-indigo-200/40 rounded-full blur-[80px] animate-[pulse_8s_infinite]"></div>
              <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-violet-200/40 rounded-full blur-[100px] animate-[pulse_10s_infinite_2s]"></div>
            </div>
          )}

          <div className="p-7 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white flex justify-between items-center relative z-10 overflow-hidden group/header cursor-move">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/header:animate-[shimmer_3s_infinite] pointer-events-none"></div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="bg-white/20 p-3 rounded-[1.5rem] backdrop-blur-2xl border border-white/30 shadow-2xl group-hover/header:scale-110 transition-transform duration-500">
                  <Bot size={28} className="animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-4 border-indigo-600 shadow-lg animate-bounce"></div>
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight drop-shadow-md">PoliBot Assistant</h3>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-[11px] text-indigo-100 font-black uppercase tracking-[0.2em]">Online</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-20">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors bg-white/5"><Minus size={22} /></button>
              <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-rose-500/30 rounded-2xl transition-all hover:rotate-90 bg-white/5"><X size={22} /></button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-transparent custom-scrollbar relative">
                {userMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-8">
                    <div className="relative group/bot">
                      <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-20 group-hover/bot:opacity-50 transition-opacity"></div>
                      <div className="w-32 h-32 bg-white shadow-[0_20px_60px_-10px_rgba(79,70,229,0.2)] text-indigo-600 rounded-[2.5rem] flex items-center justify-center animate-[float_5s_ease-in-out_infinite] border border-indigo-50 relative z-10">
                        <Sparkles size={64} className="group-hover/bot:scale-110 group-hover/bot:rotate-12 transition-all duration-500" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                        {settings.language === 'ms' ? `Hai, ${settings.name}!` : `Hi, ${settings.name}!`}
                      </h4>
                      <div className="max-w-[360px] mx-auto space-y-4">
                        <p className="text-base text-indigo-600 font-bold leading-relaxed">
                          {settings.language === 'ms' 
                            ? "Saya PoliBot, rakan digital anda untuk kesihatan mental di Politeknik." 
                            : "I'm PoliBot, your digital companion for mental wellness at Politeknik."}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 w-full max-w-[400px] pt-4">
                      {[{ key: 'stress', icon: <Zap size={16} /> }, { key: 'li', icon: <Rocket size={16} /> }, { key: 'finance', icon: <Sparkles size={16} /> }].map((item, idx) => (
                        <button
                          key={item.key}
                          onClick={() => handleSend(t(`quickPrompts.${item.key}`))}
                          style={{ animationDelay: `${idx * 200}ms` }}
                          className="animate-in slide-in-from-bottom-8 fade-in fill-mode-both bg-white border border-slate-100 p-5 rounded-3xl text-sm font-black text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-left flex items-center gap-4 group"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all">{item.icon}</div>
                          {t(`quickPrompts.${item.key}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  userMessages.map((msg, idx) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-6 zoom-in-95 duration-700 fill-mode-both`}
                      style={{ animationDelay: `${Math.min(idx * 80, 400)}ms` }}
                    >
                      <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-10 h-10 rounded-[1.2rem] flex-shrink-0 flex items-center justify-center text-white shadow-xl ${msg.role === 'user' ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-800 shadow-slate-200'}`}>
                          {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        <div className={`p-5 rounded-[2rem] text-sm leading-[1.6] shadow-sm transition-all hover:shadow-xl ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-indigo-50/50 rounded-tl-none'}`}>
                          <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                          <p className={`text-[10px] mt-3 opacity-40 font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start animate-in slide-in-from-left-8 fade-in">
                     <div className="flex gap-4 items-center bg-white p-5 rounded-[2rem] rounded-tl-none border border-indigo-50 shadow-xl">
                        <div className="flex gap-2">
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                        </div>
                        <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] animate-pulse">Thinking...</span>
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-8" />
              </div>

              <div className="p-8 bg-white border-t border-indigo-50 relative z-20">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-center gap-4 bg-slate-50 p-3 rounded-[2.5rem] border-2 border-transparent focus-within:border-indigo-100 focus-within:bg-white transition-all duration-500"
                >
                  <button type="button" onClick={clearChat} className="p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all" title="Reset"><Trash2 size={24} /></button>
                  <input type="text" value={input} onChange={(e) => setInput((e.target as any).value)} placeholder={t('chatPlaceholder')} className="flex-1 bg-transparent border-none outline-none text-base px-1 py-3 font-bold text-slate-700 placeholder:text-slate-400" />
                  <button type="submit" disabled={!input.trim() || isTyping} className="bg-indigo-600 text-white p-4 rounded-full shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:scale-105 active:scale-90 disabled:opacity-50 disabled:shadow-none transition-all group/send">
                    <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.1); opacity: 0.5; } }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 20px; border: 2px solid white; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
      `}</style>
    </>
  );
};
