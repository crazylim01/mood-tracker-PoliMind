// src/app/models/index.ts

export type MoodType = 'happy' | 'excited' | 'neutral' | 'tired' | 'sad' | 'stressed';

export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodType;
  intensity: number;
  note: string;
  activities: string[];
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  status: string;
  images: string[];
  timestamp: number;
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
  language: 'en' | 'ms';
  status: string;
  campus: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: string;
  campus: string;
}

export interface MoodInsight {
  summary: string;
  recommendations: string[];
  suggestedAction: string;
}

// ── API Response types ────────────────────────────────────

export interface MoodEntryResponse {
  id: number;
  userId: string;
  mood: string;
  intensity: number;
  note?: string;
  activities: string[];
  timestamp: number;
}

export interface JournalEntryResponse {
  id: number;
  userId: string;
  content: string;
  status: string;
  images: string[];
  timestamp: number;
}

export interface ChatMessageResponse {
  id: string;
  userId: string;
  role: string;
  text: string;
  timestamp: number;
}

export interface StudentStatResponse {
  id: number;
  username: string;
  fullName: string;
  totalLogs: number;
  avgIntensity: number;
  lastActive: string | null;
}

export interface LoginResponse {
  token: string;
  user: { id: number; username: string; fullName: string; role: string; campus: string };
  settings: { name: string; language: string; status: string; campus: string };
}

export interface MeResponse {
  user: { id: number; username: string; fullName: string; role: string; campus: string };
  settings: { name: string; language: string; status: string; campus: string };
}
