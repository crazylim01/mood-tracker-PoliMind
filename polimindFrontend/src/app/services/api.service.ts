// src/app/services/api.service.ts
// Central HTTP client for all calls to the C# backend

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  LoginResponse, MeResponse,
  MoodEntryResponse, JournalEntryResponse,
  ChatMessageResponse, StudentStatResponse, MoodInsight
} from '../models';

// ── Token helpers ─────────────────────────────────────────
export const getToken  = (): string | null  => localStorage.getItem('polimind_token');
export const setToken  = (t: string): void  => localStorage.setItem('polimind_token', t);
export const clearToken = (): void          => localStorage.removeItem('polimind_token');

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = getToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.error || `HTTP ${err.status}`;
    return throwError(() => new Error(message));
  }

  // ── Auth ──────────────────────────────────────────────────

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, { username, password }, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  register(username: string, password: string, fullName: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/auth/register`, { username, password, fullName }, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  me(): Observable<MeResponse> {
    return this.http
      .get<MeResponse>(`${this.baseUrl}/auth/me`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(`${this.baseUrl}/auth/password`, { currentPassword, newPassword }, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  updateSettings(data: { displayName?: string; language?: string; status?: string }): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(`${this.baseUrl}/auth/settings`, data, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  // ── Mood ──────────────────────────────────────────────────

  getMoods(): Observable<MoodEntryResponse[]> {
    return this.http
      .get<MoodEntryResponse[]>(`${this.baseUrl}/mood`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  createMood(data: { mood: string; intensity: number; note?: string; activities: string[] }): Observable<MoodEntryResponse> {
    return this.http
      .post<MoodEntryResponse>(`${this.baseUrl}/mood`, data, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  deleteMood(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/mood/${id}`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  getAllMoodsAdmin(): Observable<MoodEntryResponse[]> {
    return this.http
      .get<MoodEntryResponse[]>(`${this.baseUrl}/mood/all`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  // ── Journal ───────────────────────────────────────────────

  getJournals(): Observable<JournalEntryResponse[]> {
    return this.http
      .get<JournalEntryResponse[]>(`${this.baseUrl}/journal`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  createJournal(data: { content: string; status: string; images: string[] }): Observable<JournalEntryResponse> {
    return this.http
      .post<JournalEntryResponse>(`${this.baseUrl}/journal`, data, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  updateJournal(id: number, data: { content?: string; status?: string; images?: string[] }): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(`${this.baseUrl}/journal/${id}`, data, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  deleteJournal(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/journal/${id}`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  // ── Chat ──────────────────────────────────────────────────

  getChatHistory(): Observable<ChatMessageResponse[]> {
    return this.http
      .get<ChatMessageResponse[]>(`${this.baseUrl}/chat`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  sendChat(message: string, language: string): Observable<ChatMessageResponse> {
    return this.http
      .post<ChatMessageResponse>(`${this.baseUrl}/chat`, { message, language }, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  clearChat(): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/chat`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  // ── Insights ──────────────────────────────────────────────

  getInsights(): Observable<MoodInsight | null> {
    return this.http
      .get<MoodInsight | null>(`${this.baseUrl}/insights`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  clearInsightsCache(): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/insights/cache`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  // ── Admin ─────────────────────────────────────────────────

  adminOverview(): Observable<{
    moodCounts: { mood: string; count: number }[];
    activeStudents: number;
    totalLogs: number;
    avgIntensity: string;
  }> {
    return this.http
      .get<any>(`${this.baseUrl}/admin/overview`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  adminStudents(): Observable<StudentStatResponse[]> {
    return this.http
      .get<StudentStatResponse[]>(`${this.baseUrl}/admin/students`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  adminStudentLogs(id: number): Observable<MoodEntryResponse[]> {
    return this.http
      .get<MoodEntryResponse[]>(`${this.baseUrl}/admin/students/${id}/logs`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }

  adminStaff(): Observable<{ id: number; username: string; fullName: string; role: string }[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/admin/staff`, { headers: this.headers() })
      .pipe(catchError(e => this.handleError(e)));
  }
}