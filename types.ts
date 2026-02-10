
export type MoodType = 'happy' | 'neutral' | 'sad' | 'stressed' | 'tired' | 'excited';
export type UserRole = 'student' | 'lecturer' | 'counselor' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  campus: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  timestamp: number;
  mood: MoodType;
  intensity: number; // 1 to 5
  activities: string[];
  note: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  timestamp: number;
  content: string;
  status: string;
  images: string[]; // Base64 strings
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserSettings {
  name: string;
  campus: string;
  language: 'en' | 'ms';
  status: string; // Current user status
}

export interface MoodInsight {
  summary: string;
  recommendations: string[];
  suggestedAction: string;
}
