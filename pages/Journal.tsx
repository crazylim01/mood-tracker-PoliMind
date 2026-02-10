
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMoodStore } from '../store';
import { Image as ImageIcon, Plus, Trash2, Edit3, Camera, Calendar, Clock, Smile, X, RefreshCw, BookText, CheckCircle2, Loader2 } from 'lucide-react';
import { JournalEntry } from '../types';

export const Journal: React.FC = () => {
  const { t } = useTranslation();
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry, settings, updateSettings, currentUser, fetchUserData, isSyncing } = useMoodStore();
  
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (currentUser) fetchUserData();
  }, [fetchUserData, currentUser]);

  const userJournalEntries = useMemo(() => 
    (journalEntries || []).filter(e => e.userId === currentUser?.id), 
    [journalEntries, currentUser?.id]
  );

  const statuses = ['available', 'studying', 'busy', 'in_class', 'relaxing', 'sick'];

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert("Camera error.");
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      if (context) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setImages(prev => [...prev, canvas.toDataURL('image/jpeg', 0.7)]);
        stopCamera();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Fix: Explicitly type 'file' as File to avoid 'unknown' assignment error to readAsDataURL which expects Blob
      Array.from(e.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setContent(entry.content);
    setImages(entry.images || []);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    if (editingEntryId) {
      await updateJournalEntry(editingEntryId, { content, status: settings.status, images });
    } else {
      await addJournalEntry({ content, status: settings.status, images });
    }
    cancelForm();
    setIsSaving(false);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingEntryId(null);
    setContent('');
    setImages([]);
    setShowSaveConfirm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full space-y-6 text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={40} />}
            </div>
            <h3 className="text-xl font-black">{editingEntryId ? 'Update Entry?' : 'Save Entry?'}</h3>
            <p className="text-sm text-slate-500">Commit these changes to your timeline?</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleFinalSave} disabled={isSaving} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 disabled:opacity-50">
                {isSaving ? 'Processing...' : editingEntryId ? 'Update Now' : 'Save Now'}
              </button>
              <button onClick={() => setShowSaveConfirm(false)} className="w-full bg-white text-slate-400 font-bold py-4 rounded-2xl border border-slate-100">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('journalTitle')}</h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-400 font-medium">Your private space for reflection.</p>
            {isSyncing && <Loader2 size={12} className="animate-spin text-indigo-400" />}
          </div>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
            <Plus size={20} /> {t('journal')}
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
              <Edit3 size={14} /> {editingEntryId ? 'Editing Record' : 'New Thought'}
            </p>
            {editingEntryId && (
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Modified Mode</span>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => (
                <button key={s} onClick={() => updateSettings({ status: s })} className={`px-5 py-2.5 rounded-full text-xs font-bold border-2 transition-all ${settings.status === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent'}`}>
                  {t(`statuses.${s}`)}
                </button>
              ))}
            </div>
          </div>

          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('journalPlaceholder')} className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-[2rem] text-base font-medium outline-none transition-all h-48 resize-none" />
          
          {images.length > 0 && (
            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
              {images.map((img, idx) => (
                <div key={idx} className="relative group w-28 h-28">
                  <img src={img} alt="preview" className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-md" />
                  <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-full shadow-lg"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {isCameraOpen && (
            <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in">
              <div className="relative w-full max-w-2xl aspect-video bg-black rounded-[3rem] overflow-hidden border border-white/10">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                <button onClick={stopCamera} className="absolute top-8 right-8 bg-white/10 p-4 rounded-full text-white"><X size={24} /></button>
                <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                   <button onClick={takeSnapshot} className="w-20 h-20 bg-white rounded-full border-[8px] border-white/20 flex items-center justify-center"><div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Camera size={24} /></div></button>
                </div>
              </div>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <div className="flex gap-3 flex-1">
              <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-600"><ImageIcon size={20} className="text-indigo-500" /> Upload</button>
              <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-600">{cameraLoading ? <RefreshCw className="animate-spin text-indigo-500" /> : <Camera size={20} className="text-indigo-500" />} Snap</button>
            </div>
            <button onClick={() => setShowSaveConfirm(true)} disabled={!content.trim()} className="flex-[1.5] bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all">
              {editingEntryId ? 'Update Record' : 'Save Record'}
            </button>
            <button onClick={cancelForm} className="px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-8">
        {userJournalEntries.length === 0 ? (
          <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-center space-y-6">
            <BookText size={64} className="opacity-20" />
            <h3 className="text-xl font-bold text-slate-600">No entries yet</h3>
          </div>
        ) : (
          userJournalEntries.map((entry) => (
            <div key={entry.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 px-4 py-1.5 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t(`statuses.${entry.status}`)}</div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <Calendar size={14} /> {new Date(entry.timestamp).toLocaleDateString()}
                    <Clock size={14} /> {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(entry)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"><Edit3 size={20} /></button>
                  <button onClick={() => { if(window.confirm('Delete this entry?')) deleteJournalEntry(entry.id); }} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                </div>
              </div>
              <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">{entry.content}</p>
              {entry.images && entry.images.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-4">
                  {entry.images.map((img, i) => (
                    <img key={i} src={img} alt="journal" className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-[1.5rem] border-4 border-slate-50 cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(img)} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
