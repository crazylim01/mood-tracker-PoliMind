// src/app/app.component.ts

import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MoodStoreService } from './services/mood-store.service';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ChatWidgetComponent],
  template: `
    <div class="min-h-screen bg-slate-300 flex items-start justify-center">
      <div class="w-[390px] min-h-screen bg-[#f8faff] shadow-2xl relative overflow-hidden">
        <router-outlet />
        @if (store.isAuthenticated$ | async) {
          <app-chat-widget />
        }
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit {
  constructor(public store: MoodStoreService) {}

  async ngOnInit(): Promise<void> {
    await this.store.restoreSession();
  }
}