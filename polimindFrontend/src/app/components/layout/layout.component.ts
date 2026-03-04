import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DraggableComponent } from '../draggable/draggable.component';
import { ChatWidgetComponent } from '../chat-widget/chat-widget.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, DraggableComponent, ChatWidgetComponent],
  template: `
    <div class="app-shell">

      <!-- Draggable SOS Button -->
      <app-draggable id="sos-btn" [initialX]="sosX" [initialY]="sosY">
        <a href="https://sites.google.com/view/epsychologypsa/"
           target="_blank" rel="noopener noreferrer" class="sos-btn">
          <span>SOS</span>
        </a>
      </app-draggable>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Header -->
        <header class="app-header">
          <div class="brand">
            <div class="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div>
              <h1 class="brand-name">POLI<span class="accent">MIND</span></h1>
              <p class="brand-sub">Politeknik Wellness</p>
            </div>
          </div>

          <div class="header-actions">
            <a *ngIf="isStaff" routerLink="/admin" class="header-icon-btn" [class.active]="currentPath === '/admin'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </a>
            <a routerLink="/settings" class="header-icon-btn" [class.active]="currentPath === '/settings'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </a>
            <button class="header-icon-btn logout-btn" (click)="handleLogout()" title="Logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <div class="nav-items">
          <a *ngFor="let item of navItems" [routerLink]="item.path"
             class="nav-item" [class.active]="currentPath === item.path">
            <div class="nav-icon-wrapper" [class.active-icon]="currentPath === item.path">
              <span class="nav-emoji">{{ item.icon }}</span>
            </div>
            <span *ngIf="currentPath === item.path" class="nav-label">{{ item.label }}</span>
          </a>
        </div>
      </nav>

      <!-- Chat Widget -->
      <app-chat-widget></app-chat-widget>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8faff;
      color: #334155;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .sos-btn {
      display: flex; align-items: center; justify-content: center;
      width: 56px; height: 56px;
      background: #dc2626; color: white; border-radius: 50%;
      font-weight: 900; font-size: 10px; text-decoration: none;
      letter-spacing: -0.05em;
      box-shadow: 0 15px 30px -5px rgba(220,38,38,0.4);
      border: 4px solid white; z-index: 200;
      transition: all 0.2s;
    }
    .sos-btn:hover { background: #b91c1c; transform: scale(1.1); }

    .main-content {
      flex: 1; display: flex; flex-direction: column;
      max-width: 512px; margin: 0 auto;
      width: 100%; padding: 0 1rem 8rem;
    }

    .app-header {
      padding: 2rem 0;
      display: flex; justify-content: space-between; align-items: center;
    }

    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-icon {
      background: #4f46e5; padding: 0.6rem; border-radius: 1.2rem;
      color: white; box-shadow: 0 8px 16px -4px rgba(79,70,229,0.3);
    }
    .brand-name {
      font-size: 1.25rem; font-weight: 900; letter-spacing: -0.02em;
      color: #0f172a; margin: 0; line-height: 1;
    }
    .accent { color: #4f46e5; }
    .brand-sub {
      font-size: 9px; font-weight: 900; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.3em; margin: 4px 0 0;
    }

    .header-actions { display: flex; align-items: center; gap: 0.5rem; }
    .header-icon-btn {
      padding: 0.75rem; border-radius: 1rem;
      background: white; color: #94a3b8;
      border: 1px solid #f1f5f9;
      cursor: pointer; text-decoration: none; display: flex;
      transition: all 0.2s;
    }
    .header-icon-btn:hover { background: #f8fafc; }
    .header-icon-btn.active { background: #4f46e5; color: white; box-shadow: 0 8px 16px rgba(79,70,229,0.3); border-color: #4f46e5; }
    .logout-btn:hover { color: #ef4444; background: #fef2f2; }

    .page-content { flex: 1; }

    .bottom-nav {
      position: fixed; bottom: 2rem;
      left: 50%; transform: translateX(-50%);
      z-index: 100; width: 90%; max-width: 512px;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(203,213,225,0.5);
      padding: 0.5rem; border-radius: 2.5rem;
      box-shadow: 0 25px 60px -15px rgba(0,0,0,0.15);
    }
    .nav-items { display: flex; justify-content: space-around; align-items: center; }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      flex: 1; color: #cbd5e1; text-decoration: none;
      transition: all 0.3s;
    }
    .nav-item.active { color: #4f46e5; }
    .nav-icon-wrapper {
      padding: 0.875rem; border-radius: 1.8rem;
      transition: all 0.3s;
    }
    .nav-icon-wrapper.active-icon {
      background: #4f46e5; color: white;
      box-shadow: 0 8px 16px rgba(79,70,229,0.3);
      transform: scale(1.1) translateY(-4px);
    }
    .nav-emoji { font-size: 1.375rem; }
    .nav-label {
      font-size: 8px; font-weight: 900;
      text-transform: uppercase; letter-spacing: 0.15em;
    }
  `]
})
export class LayoutComponent implements OnInit {
  currentPath = '/';
  isStaff = false;

  sosX = window.innerWidth - 80;
  sosY = window.innerHeight - 180;

  navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/journal', label: 'Journal', icon: '📖' },
    { path: '/wellness', label: 'Wellness', icon: '✨' },
    { path: '/study', label: 'Study', icon: '🎓' },
    { path: '/history', label: 'History', icon: '📅' },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentPath = e.urlAfterRedirects;
      });
    this.currentPath = this.router.url;

    // Get role from your auth service
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.isStaff = user?.role && user.role !== 'student';
  }

  handleLogout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}