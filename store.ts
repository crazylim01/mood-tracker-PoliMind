
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MoodEntry, JournalEntry, UserSettings, User, ChatMessage, UserRole } from './types';
import { supabase } from './supabase';

export const STUDENTS_DATABASE: Record<string, string> = {
  "08DPI23F2002": "NURUL WADIHAH SAFINA",
  "08DPI23F2005": "MOHAMAD DANISH AIMAN",
  "08DPI23F2006": "MOHAMAD SYAWAL",
  "08DPI23F2008": "THARSHINI",
  "08DPI23F2010": "FARIDATUL NAJJAH",
  "08DPI23F2012": "MUHAMMAD ASHRAF",
  "08DPI23F2015": "UGASHINI",
  "08DPI23F2018": "AKIF RIFHAN",
  "08DPI23F2019": "AIMIE BATRISYIA",
  "08DPI23F2022": "JACINTA",
  "08DPI23F2023": "MUHAMMAD AIMAN MUHAIMIN",
  "08DPI23F2025": "MUHAMMAD ALFIAN",
  "08DPI23F2027": "MUHAMMAD ABRAR",
  "08DPI23F2029": "NURDINI QISTINA",
  "08DPI23F2031": "NUR SYAHIRA ALIA",
  "08DPI23F2033": "PUTERI FARRA QISTINA",
  "08DPI23F2035": "MUHAMMAD ZAHIRULHAQ",
  "08DPI23F2037": "AUNI AZYAN",
  "08DPI23F2039": "RESHME",
  "08DPI23F2041": "NURUL HUMAIRA",
  "08DPI23F2043": "MUHAMMAD AMIR",
  "08DPI23F2045": "NUR NATASYA ATIRA",
  "08DPI23F2047": "NURUL SYAFIQAH ALYA",
  "08DPI23F2049": "PIRIYAKAURY SHRI",
  "08DPI23F2051": "NAVITHA",
  "08DPI23F2053": "HARCHUTHAN",
  "08DPI23F2055": "PAVENRAJ",
  "08DPI23F2057": "NOORSYAFEEQAH",
  "08DPI23F2059": "MUHAMMAD AQRAM SYAZWAN",
  "08DPI23F2061": "NURUL HIDAYAH",
  "08DPI23F2063": "THEJAASVINY",
  "08DPI23F2065": "NUR AMNA SAFIYYAH",
  "08DPI23F2067": "SWEE WEI SI",
  "08DPI23F2069": "ARUNA",
  "08DPI23F2071": "NURUL ALEEYA MAISARA",
  "08DPI23F2073": "RITHIEKAA",
  "08DPI23F2075": "WAN NUR AZERA",
  "08DPI23F2077": "NAVHIN",
  "08DPI23F2079": "KHAIRUL AIDID",
  "08DPI23F2081": "VELNESH",
  "08DPI23F2083": "MUHAMMAD HAIKAL IMAN",
  "08DPI23F2084": "RAJEESHVARY",
  "08DPI23F2085": "NUR ADRIANA BALQIS",
  "08DPI23F2087": "NURIN YASMIN",
};

export const STAFF_DATABASE: Record<string, { name: string; role: UserRole }> = {
  "PSA-LEC-01": { name: "Dr Nurdadhillah", role: "lecturer" },
  "PSA-LEC-02": { name: "Pn Azma Husnaiza", role: "lecturer" },
  "PSA-LEC-03": { name: "Pn Siti Rawaidan", role: "lecturer" },
  "PSA-LEC-04": { name: "Dr MURUGADAS", role: "lecturer" },
  "PSA-CSL-01": { name: "Pn Nurul Khaizan", role: "counselor" },
  "PSA-CSL-02": { name: "Pn. Zaiwana", role: "counselor" },
  "PSA-CSL-03": { name: "Pn Sanawiah", role: "counselor" },
};

const DEFAULT_CAMPUS = 'Politeknik Sultan Salahuddin Abdul Aziz Shah';

interface MoodState {
  entries: MoodEntry[];
  journalEntries: JournalEntry[];
  chatMessages: ChatMessage[];
  settings: UserSettings;
  isAuthenticated: boolean;
  currentUser: User | null;
  customPasswords: Record<string, string>;
  registeredStudents: Record<string, string>;
  isSyncing: boolean;
  
  addEntry: (entry: Omit<MoodEntry, 'userId' | 'id' | 'timestamp'>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addJournalEntry: (entry: Omit<JournalEntry, 'userId' | 'id' | 'timestamp'>) => Promise<void>;
  updateJournalEntry: (id: string, entry: Partial<Omit<JournalEntry, 'userId' | 'id' | 'timestamp'>>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  fetchUserData: (forcedUserId?: string) => Promise<void>;
  addChatMessage: (msg: Omit<ChatMessage, 'userId'>) => void;
  clearChat: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  login: (id: string, password: string, mode: 'student' | 'staff') => Promise<{ success: boolean, message?: string }>;
  logout: () => void;
  registerNewStudent: (id: string, name: string) => void;
  changePassword: (currentPass: string, newPass: string) => { success: boolean, message?: string };
  clearAllData: () => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      entries: [],
      journalEntries: [],
      chatMessages: [],
      isAuthenticated: false,
      currentUser: null,
      customPasswords: {},
      registeredStudents: {},
      isSyncing: false,
      settings: {
        name: 'Pelajar Politeknik',
        campus: DEFAULT_CAMPUS,
        language: 'en',
        status: 'available',
      },

      clearAllData: () => {
        set({
          entries: [],
          journalEntries: [],
          chatMessages: [],
          isAuthenticated: false,
          currentUser: null,
          customPasswords: {},
          registeredStudents: {},
        });
        localStorage.clear();
      },

      fetchUserData: async (forcedUserId) => {
        const userId = forcedUserId || get().currentUser?.id;
        if (!userId) return;
        
        const hasLocalData = get().entries.length > 0;
        if (!hasLocalData) set({ isSyncing: true });

        try {
          const { data: moodData } = await supabase.from('mood_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(40);
          const { data: journalData } = await supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);

          if (moodData || journalData) {
             set(state => ({ 
               entries: moodData ? moodData.map(m => ({
                 id: m.id, userId: m.user_id, timestamp: new Date(m.created_at).getTime(),
                 mood: m.mood, intensity: m.intensity, activities: m.activities || [], note: m.note
               })) : state.entries,
               journalEntries: journalData ? journalData.map(j => ({
                 id: j.id, userId: j.user_id, timestamp: new Date(j.created_at).getTime(),
                 content: j.content, status: j.status, images: j.images || []
               })) : state.journalEntries,
               isSyncing: false
             }));
          } else {
            set({ isSyncing: false });
          }
        } catch (e) {
          set({ isSyncing: false });
        }
      },

      addEntry: async (entry) => {
        const user = get().currentUser;
        if (!user) return;
        const newEntry: MoodEntry = { id: crypto.randomUUID(), userId: user.id, timestamp: Date.now(), ...entry };
        
        // Optimistic UI Update
        set(state => ({ entries: [newEntry, ...state.entries] }));
        
        try {
          const { error } = await supabase.from('mood_entries').insert([{ 
            user_id: user.id, mood: entry.mood, intensity: entry.intensity, activities: entry.activities, note: entry.note 
          }]);
          if (error) console.error("Sync error:", error);
        } catch (err) {
          console.error("Critical Sync Error:", err);
        }
      },

      deleteEntry: async (id) => {
        set(state => ({ entries: state.entries.filter(e => e.id !== id) }));
        try {
          await supabase.from('mood_entries').delete().eq('id', id);
        } catch (err) {
          console.error("Delete sync error:", err);
        }
      },

      addJournalEntry: async (entry) => {
        const user = get().currentUser;
        if (!user) return;
        const newJournal: JournalEntry = { id: crypto.randomUUID(), userId: user.id, timestamp: Date.now(), ...entry };
        set(state => ({ journalEntries: [newJournal, ...state.journalEntries] }));
        try {
          const { error } = await supabase.from('journal_entries').insert([{ 
            user_id: user.id, content: entry.content, status: entry.status, images: entry.images 
          }]);
          if (error) console.error("Journal sync error:", error);
        } catch (err) {
          console.error("Critical journal sync error:", err);
        }
      },

      updateJournalEntry: async (id, entry) => {
        set(state => ({
          journalEntries: state.journalEntries.map(j => j.id === id ? { ...j, ...entry } : j)
        }));
        try {
          const { error } = await supabase.from('journal_entries').update({ 
            content: entry.content, status: entry.status, images: entry.images 
          }).eq('id', id);
          if (error) console.error("Journal update error:", error);
        } catch (err) {
          console.error("Critical journal update error:", err);
        }
      },

      deleteJournalEntry: async (id) => {
        set(state => ({ journalEntries: state.journalEntries.filter(j => j.id !== id) }));
        try {
          await supabase.from('journal_entries').delete().eq('id', id);
        } catch (err) {
          console.error("Journal delete error:", err);
        }
      },

      addChatMessage: (msg) => set((state) => ({
        chatMessages: [...(state.chatMessages || []), { ...msg, userId: state.currentUser?.id || 'anon' }]
      })),

      clearChat: () => set((state) => ({ 
        chatMessages: (state.chatMessages || []).filter(m => m.userId !== state.currentUser?.id) 
      })),

      updateSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings },
        currentUser: state.currentUser ? { ...state.currentUser, name: newSettings.name || state.currentUser.name } : null
      })),

      registerNewStudent: (id, name) => {
        const cleanedName = name.split(/\s(BIN|BINTI|BINDI|A\/L|A\/P)\s/i)[0];
        set((state) => ({
          registeredStudents: { ...state.registeredStudents, [id.toUpperCase().trim()]: cleanedName }
        }));
      },

      login: async (id, password, mode) => {
        const normalizedId = id.toUpperCase().trim();
        const customPasswords = get().customPasswords;
        
        const finishLogin = (user: User) => {
          set(state => ({ 
            isAuthenticated: true, 
            currentUser: user,
            settings: { ...state.settings, name: user.name } 
          }));
          get().fetchUserData(user.id);
          return { success: true };
        };

        if (mode === 'staff') {
          const staff = STAFF_DATABASE[normalizedId];
          if (!staff) return { success: false, message: "ID Kakitangan tidak menemui." };
          const expectedPass = customPasswords[normalizedId] || "1234";
          if (password !== expectedPass) return { success: false, message: "Kata laluan salah." };
          return finishLogin({ id: normalizedId, name: staff.name, role: staff.role, campus: DEFAULT_CAMPUS });
        }

        const studentName = STUDENTS_DATABASE[normalizedId] || get().registeredStudents[normalizedId];
        if (studentName) {
          const expectedPass = customPasswords[normalizedId] || normalizedId.slice(-4);
          if (password !== expectedPass) return { success: false, message: "Kata laluan salah." };
          return finishLogin({ id: normalizedId, name: studentName, role: 'student', campus: DEFAULT_CAMPUS });
        }

        if (normalizedId.startsWith('08') && normalizedId.length === 12) return { success: false, message: "NEW_STUDENT_DETECTED" };
        return { success: false, message: "ID tidak sah." };
      },

      logout: () => set({ isAuthenticated: false, currentUser: null, entries: [], journalEntries: [], chatMessages: [] }),

      changePassword: (currentPass, newPass) => {
        const user = get().currentUser;
        if (!user) return { success: false, message: "Not logged in" };
        const currentSavedPass = get().customPasswords[user.id] || (user.id.startsWith('PSA-') ? "1234" : user.id.slice(-4));
        if (currentPass !== currentSavedPass) return { success: false, message: "Current password wrong." };
        set(state => ({ customPasswords: { ...state.customPasswords, [user.id]: newPass } }));
        return { success: true };
      }
    }),
    {
      name: 'polimind-storage-vfinal-super-opt',
      partialize: (state) => ({ 
        customPasswords: state.customPasswords, 
        registeredStudents: state.registeredStudents,
        settings: state.settings,
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        entries: state.entries,
        journalEntries: state.journalEntries,
        chatMessages: state.chatMessages
      }),
    }
  )
);
