// src/app/pages/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { MoodStoreService } from '../../services/mood-store.service';
import { ApiService } from '../../services/api.service';
import { MoodType, MoodEntry, MoodInsight } from '../../models';
import { MoodSphereComponent } from '../../components/mood-sphere/mood-sphere.component';
import { firstValueFrom } from 'rxjs';

export interface MoodOption {
  type: MoodType;
  icon: string;
  label: string;
}

export interface ChartDataPoint {
  name: string;
  intensity: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MoodSphereComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State
  loadingInsights = false;
  insight: MoodInsight | null = null;
  activeAiTab: 'wellness' | 'plan' = 'wellness';
  selectedMood: MoodType | null = null;
  intensity = 3;
  note = '';
  selectedActivities: string[] = [];
  isSaving = false;
  saveSuccess = false;
  isSyncing = false;

  // Data from store
  userEntries: MoodEntry[] = [];
  displayName = 'STUDENT';
  todayDate = '';
  chartData: ChartDataPoint[] = [];

  readonly activitiesList = [
    'studying', 'assignment', 'exam', 'fyp',
    'internship', 'social', 'sports', 'rest',
    'family', 'personal', 'breakup', 'financial'
  ];

  readonly moodOptions: MoodOption[] = [
    { type: 'happy',    icon: '😊', label: 'Happy' },
    { type: 'excited',  icon: '🤩', label: 'Excited' },
    { type: 'neutral',  icon: '😐', label: 'Neutral' },
    { type: 'tired',    icon: '😴', label: 'Tired' },
    { type: 'sad',      icon: '😢', label: 'Sad' },
    { type: 'stressed', icon: '😫', label: 'Stressed' },
  ];

  constructor(
    public store: MoodStoreService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();

    combineLatest([this.store.entries$, this.store.currentUser$, this.store.settings$, this.store.isSyncing$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([entries, user, settings, syncing]) => {
        this.isSyncing = syncing;
        this.displayName = settings?.name ? settings.name.toUpperCase() : 'STUDENT';
        this.userEntries = (entries || []).filter(e => e.userId === user?.id);
        this.chartData = this.buildChartData(this.userEntries);
      });

    // Fetch data if needed
    const user = this.store.currentUser;
    if (user && this.store.entries.length === 0) {
      this.store.fetchUserData();
    }

    // Auto-load insights after a delay
    setTimeout(async () => {
      if (this.userEntries.length > 0 && !this.insight && !this.loadingInsights) {
        await this.loadInsights(false);
      }
    }, 1500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildChartData(entries: MoodEntry[]): ChartDataPoint[] {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString([], { weekday: 'short' });
    });

    return last7Days.map(day => {
      const dayEntries = entries.filter(e =>
        new Date(e.timestamp).toLocaleDateString([], { weekday: 'short' }) === day
      );
      const avgIntensity = dayEntries.length > 0
        ? dayEntries.reduce((acc, curr) => acc + curr.intensity, 0) / dayEntries.length
        : 0;
      return { name: day, intensity: parseFloat(avgIntensity.toFixed(2)) };
    });
  }

  async fetchInsights(): Promise<void> {
    if (this.loadingInsights) return;
    await this.loadInsights(true);
  }

  private async loadInsights(clearFirst: boolean): Promise<void> {
    this.loadingInsights = true;
    try {
      if (clearFirst) {
        await firstValueFrom(this.api.clearInsightsCache());
      }
      const result = await firstValueFrom(this.api.getInsights());
      if (result) this.insight = result;
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingInsights = false;
    }
  }

  toggleActivity(act: string): void {
    if (this.selectedActivities.includes(act)) {
      this.selectedActivities = this.selectedActivities.filter(a => a !== act);
    } else {
      this.selectedActivities = [...this.selectedActivities, act];
    }
  }

  isActivitySelected(act: string): boolean {
    return this.selectedActivities.includes(act);
  }

  async handleSave(): Promise<void> {
    if (!this.selectedMood) return;
    this.isSaving = true;
    await this.store.addEntry({
      mood: this.selectedMood,
      intensity: this.intensity,
      note: this.note,
      activities: this.selectedActivities,
    });
    this.saveSuccess = true;
    setTimeout(() => {
      this.selectedMood = null;
      this.intensity = 3;
      this.note = '';
      this.selectedActivities = [];
      this.isSaving = false;
      this.saveSuccess = false;
    }, 1200);
  }

  // Chart bar height helper (for simple CSS bar chart)
  barHeight(value: number): string {
    return `${(value / 5) * 100}%`;
  }

  trackByIndex(index: number): number {
    return index;
  }

  get currentUserId(): string {
  return this.store.currentUser?.id || '';
  }
}
