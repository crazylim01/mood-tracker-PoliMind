// src/app/services/mood-store.service.ts
// Angular reactive store using BehaviorSubjects — drop-in replacement for Zustand store

import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  ApiService, getToken, setToken, clearToken
} from './api.service';
import {
  MoodEntry, JournalEntry, ChatMessage,
  UserSettings, CurrentUser, MoodType,
  MoodEntryResponse, JournalEntryResponse, ChatMessageResponse,
} from '../models';

// ── Map API responses to store format ────────────────────
const toMoodEntry = (r: MoodEntryResponse): MoodEntry => ({
  id:         String(r.id),
  userId:     String(r.userId),
  mood:       r.mood as MoodType,
  intensity:  r.intensity,
  note:       r.note || '',
  activities: r.activities,
  timestamp:  r.timestamp,
});

const toJournalEntry = (r: JournalEntryResponse): JournalEntry => ({
  id:        String(r.id),
  userId:    String(r.userId),
  content:   r.content,
  status:    r.status,
  images:    r.images,
  timestamp: r.timestamp,
});

const toChatMessage = (r: ChatMessageResponse): ChatMessage => ({
  id:        String(r.id),
  userId:    String(r.userId),
  role:      r.role as 'user' | 'model',
  text:      r.text,
  timestamp: r.timestamp,
});

@Injectable({ providedIn: 'root' })
export class MoodStoreService {

  // ── State streams ─────────────────────────────────────
  readonly entries$         = new BehaviorSubject<MoodEntry[]>([]);
  readonly journalEntries$  = new BehaviorSubject<JournalEntry[]>([]);
  readonly chatMessages$    = new BehaviorSubject<ChatMessage[]>([]);
  readonly settings$        = new BehaviorSubject<UserSettings>({ name: '', language: 'en', status: 'available', campus: '' });
  readonly currentUser$     = new BehaviorSubject<CurrentUser | null>(null);
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);
  readonly isSyncing$       = new BehaviorSubject<boolean>(false);
  readonly error$           = new BehaviorSubject<string | null>(null);

  // ── Convenience getters (snapshot values) ────────────
  get entries()         { return this.entries$.value; }
  get journalEntries()  { return this.journalEntries$.value; }
  get chatMessages()    { return this.chatMessages$.value; }
  get settings()        { return this.settings$.value; }
  get currentUser()     { return this.currentUser$.value; }
  get isAuthenticated() { return this.isAuthenticated$.value; }

  constructor(private api: ApiService) {}

  // ── Auth ─────────────────────────────────────────────

  async login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await firstValueFrom(this.api.login(username, password));
      setToken(res.token);

      this.currentUser$.next({
        id:       String(res.user.id),
        username: res.user.username,
        name:     res.user.fullName,
        role:     res.user.role,
        campus:   res.user.campus,
      });

      this.settings$.next({
        name:     res.settings.name,
        language: (res.settings.language as 'en' | 'ms') || 'en',
        status:   res.settings.status,
        campus:   res.settings.campus,
      });

      this.isAuthenticated$.next(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login failed' };
    }
  }

  async register(username: string, password: string, fullName: string): Promise<void> {
    await firstValueFrom(this.api.register(username, password, fullName));
  }

  logout(): void {
    clearToken();
    this.currentUser$.next(null);
    this.isAuthenticated$.next(false);
    this.entries$.next([]);
    this.journalEntries$.next([]);
    this.chatMessages$.next([]);
  }

  async restoreSession(): Promise<void> {
    const token = getToken();
    if (!token) return;

    try {
      const res = await firstValueFrom(this.api.me());

      this.currentUser$.next({
        id:       String(res.user.id),
        username: res.user.username,
        name:     res.user.fullName,
        role:     res.user.role,
        campus:   res.user.campus,
      });

      this.settings$.next({
        name:     res.settings.name,
        language: (res.settings.language as 'en' | 'ms') || 'en',
        status:   res.settings.status,
        campus:   res.settings.campus,
      });

      this.isAuthenticated$.next(true);
      await this.fetchUserData();
    } catch {
      clearToken();
    }
  }

  // ── Data fetching ─────────────────────────────────────

  async fetchUserData(): Promise<void> {
    if (!getToken()) return;
    this.isSyncing$.next(true);
    try {
      const [moodData, journalData, chatData] = await Promise.all([
        firstValueFrom(this.api.getMoods()),
        firstValueFrom(this.api.getJournals()),
        firstValueFrom(this.api.getChatHistory()),
      ]);

      this.entries$.next(moodData.map(toMoodEntry));
      this.journalEntries$.next(journalData.map(toJournalEntry));
      this.chatMessages$.next(chatData.map(toChatMessage));
    } catch (err) {
      console.error('fetchUserData error:', err);
    } finally {
      this.isSyncing$.next(false);
    }
  }

  // ── Mood ──────────────────────────────────────────────

  async addEntry(data: { mood: MoodType; intensity: number; note: string; activities: string[] }): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.createMood(data));
      this.entries$.next([toMoodEntry(res), ...this.entries]);
    } catch (err) {
      console.error('addEntry error:', err);
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteMood(Number(id)));
      this.entries$.next(this.entries.filter(e => e.id !== id));
    } catch (err) {
      console.error('deleteEntry error:', err);
    }
  }

  // ── Journal ───────────────────────────────────────────

  async addJournalEntry(data: { content: string; status: string; images: string[] }): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.createJournal(data));
      this.journalEntries$.next([toJournalEntry(res), ...this.journalEntries]);
    } catch (err) {
      console.error('addJournalEntry error:', err);
    }
  }

  async updateJournalEntry(id: string, data: { content: string; status: string; images: string[] }): Promise<void> {
    try {
      await firstValueFrom(this.api.updateJournal(Number(id), data));
      this.journalEntries$.next(
        this.journalEntries.map(e => e.id === id ? { ...e, ...data } : e)
      );
    } catch (err) {
      console.error('updateJournalEntry error:', err);
    }
  }

  async deleteJournalEntry(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.deleteJournal(Number(id)));
      this.journalEntries$.next(this.journalEntries.filter(e => e.id !== id));
    } catch (err) {
      console.error('deleteJournalEntry error:', err);
    }
  }

  // ── Chat ─────────────────────────────────────────────

  addChatMessage(msg: ChatMessage): void {
    this.chatMessages$.next([...this.chatMessages, msg]);
  }

  async clearChat(): Promise<void> {
    try {
      await firstValueFrom(this.api.clearChat());
      this.chatMessages$.next([]);
    } catch (err) {
      console.error('clearChat error:', err);
    }
  }

  // ── Settings ──────────────────────────────────────────

  async updateSettings(data: Partial<UserSettings>): Promise<void> {
    this.settings$.next({ ...this.settings, ...data });
    try {
      await firstValueFrom(this.api.updateSettings({
        displayName: data.name,
        language:    data.language,
        status:      data.status,
      }));
    } catch (err) {
      console.error('updateSettings error:', err);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      await firstValueFrom(this.api.changePassword(currentPassword, newPassword));
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to change password' };
    }
  }

  clearAllData(): void {
    clearToken();
    this.entries$.next([]);
    this.journalEntries$.next([]);
    this.chatMessages$.next([]);
    this.currentUser$.next(null);
    this.isAuthenticated$.next(false);
    this.settings$.next({ name: '', language: 'en', status: 'available', campus: '' });
  }
}