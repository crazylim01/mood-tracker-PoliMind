// src/app/components/chat-widget/chat-widget.component.ts

import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked, HostListener, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { MoodStoreService } from '../../services/mood-store.service';
import { ApiService } from '../../services/api.service';
import { ChatMessage } from '../../models';

interface Pos { x: number; y: number; }

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css'],
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('triggerBtn')  triggerBtn!:  ElementRef;
  @ViewChild('chatPanel')   chatPanel!:   ElementRef;

  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  // ─── Widget state ────────────────────────────────────────────────────────────
  isOpen      = false;
  isMinimized = false;
  input       = '';
  isTyping    = false;

  userMessages: ChatMessage[] = [];
  userName  = '';
  language: 'en' | 'ms' = 'en';

  readonly quickPrompts = [
    { key: 'stress',  icon: '⚡', label: "I'm feeling stressed about my studies" },
    { key: 'li',      icon: '🚀', label: 'Help me improve my lifestyle' },
    { key: 'finance', icon: '✨', label: 'I have financial concerns' },
  ];

  // ─── Fixed viewport positions ─────────────────────────────────────────────────
  // Both elements use CSS `position: fixed`, so these are purely VIEWPORT coords.
  // Scrolling the page has zero effect — no scroll tracking needed.
  triggerPos: Pos = { x: 0, y: 0 };
  panelPos:   Pos = { x: 0, y: 0 };

  // ─── Drag state ───────────────────────────────────────────────────────────────
  private draggingTarget: 'trigger' | 'panel' | null = null;
  private dragStartMouse: Pos = { x: 0, y: 0 };
  private dragStartElemPos: Pos = { x: 0, y: 0 };
  private hasDragged = false;
  private readonly DRAG_THRESHOLD = 5; // px

  /** True while the trigger is animating to the snapped edge */
  isSnapping = false;
  /** Which edge the trigger is snapped to — controls label/icon side */
  snappedEdge: 'left' | 'right' = 'right';

  private readonly TRIGGER_W   = 72;  // approximate button width px
  private readonly TRIGGER_H   = 72;  // approximate button height px
  private readonly EDGE_MARGIN = 8;   // px gap from screen edge

  // ─── Bound listeners (for cleanup) ───────────────────────────────────────────
  private boundMouseMove!: (e: MouseEvent) => void;
  private boundMouseUp!:   (e: MouseEvent) => void;
  private boundTouchMove!: (e: TouchEvent) => void;
  private boundTouchEnd!:  (e: TouchEvent) => void;

  constructor(
    private store: MoodStoreService,
    private api:   ApiService,
    private zone:  NgZone
  ) {}

  ngOnInit(): void {
    this.initPositions();

    combineLatest([this.store.chatMessages$, this.store.currentUser$, this.store.settings$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([messages, user, settings]) => {
        this.userName     = settings?.name     || '';
        this.language     = settings?.language || 'en';
        this.userMessages = messages.filter(m => m.userId === user?.id);
        this.shouldScrollToBottom = true;
      });

    // Register drag listeners outside Angular zone for performance
    this.zone.runOutsideAngular(() => {
      this.boundMouseMove = this.onMouseMove.bind(this);
      this.boundMouseUp   = this.onMouseUp.bind(this);
      this.boundTouchMove = this.onTouchMove.bind(this);
      this.boundTouchEnd  = this.onTouchEnd.bind(this);
      document.addEventListener('mousemove', this.boundMouseMove);
      document.addEventListener('mouseup',   this.boundMouseUp);
      document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      document.addEventListener('touchend',  this.boundTouchEnd);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup',   this.boundMouseUp);
    document.removeEventListener('touchmove', this.boundTouchMove);
    document.removeEventListener('touchend',  this.boundTouchEnd);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.isOpen && !this.isMinimized) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // ─── Position init ────────────────────────────────────────────────────────────
  private initPositions(): void {
    const vw     = window.innerWidth;
    const vh     = window.innerHeight;
    const margin = 16;

    // Trigger: bottom-right edge by default
    this.snappedEdge = 'right';
    this.triggerPos  = {
      x: vw - this.TRIGGER_W - this.EDGE_MARGIN,
      y: vh - this.TRIGGER_H - margin,
    };

    // Panel: sized responsively, positioned above trigger
    const panelW    = Math.min(480, vw - margin * 2);
    const panelH    = Math.min(750, vh * 0.85);
    this.panelPos   = {
      x: vw - panelW - margin,
      y: vh - panelH - margin,
    };
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Re-snap trigger to its current edge at the new viewport size
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    this.triggerPos = {
      x: this.snappedEdge === 'right'
        ? vw - this.TRIGGER_W - this.EDGE_MARGIN
        : this.EDGE_MARGIN,
      y: Math.min(Math.max(this.triggerPos.y, this.EDGE_MARGIN), vh - this.TRIGGER_H - this.EDGE_MARGIN),
    };

    // Clamp panel too
    const margin = 16;
    const panelW = Math.min(480, vw - margin * 2);
    const panelH = Math.min(750, vh * 0.85);
    this.panelPos = {
      x: Math.min(Math.max(this.panelPos.x, margin), vw - panelW - margin),
      y: Math.min(Math.max(this.panelPos.y, margin), vh - panelH - margin),
    };
  }

  // ─── Open widget ──────────────────────────────────────────────────────────────
  openWidget(): void {
    const vw     = window.innerWidth;
    const vh     = window.innerHeight;
    const margin = 16;
    const panelW = Math.min(480, vw - margin * 2);
    const panelH = Math.min(750, vh * 0.85);

    // Open panel adjacent to the snapped edge
    let px = this.snappedEdge === 'right'
      ? this.triggerPos.x + this.TRIGGER_W - panelW   // align right edges
      : this.triggerPos.x;                             // align left edges

    let py = this.triggerPos.y - panelH - 12;          // above trigger

    // Clamp to viewport
    px = Math.max(margin, Math.min(px, vw - panelW - margin));
    py = Math.max(margin, Math.min(py, vh - panelH - margin));

    this.panelPos = { x: px, y: py };
    this.isOpen   = true;
    this.shouldScrollToBottom = true;
  }

  // ─── Drag: Trigger ────────────────────────────────────────────────────────────
  onTriggerDragStart(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.startDrag('trigger', { x: e.clientX, y: e.clientY });
  }

  onTriggerTouchStart(e: TouchEvent): void {
    const t = e.touches[0];
    this.startDrag('trigger', { x: t.clientX, y: t.clientY });
  }

  onTriggerClick(e: MouseEvent): void {
    if (this.hasDragged) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    this.openWidget();
  }

  // ─── Drag: Panel ──────────────────────────────────────────────────────────────
  onPanelDragStart(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.startDrag('panel', { x: e.clientX, y: e.clientY });
  }

  onPanelTouchStart(e: TouchEvent): void {
    const t = e.touches[0];
    this.startDrag('panel', { x: t.clientX, y: t.clientY });
  }

  // ─── Shared drag logic ────────────────────────────────────────────────────────
  private startDrag(target: 'trigger' | 'panel', mouse: Pos): void {
    this.draggingTarget   = target;
    this.dragStartMouse   = mouse;
    this.dragStartElemPos = target === 'trigger' ? { ...this.triggerPos } : { ...this.panelPos };
    this.hasDragged       = false;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.draggingTarget) return;
    this.performDrag({ x: e.clientX, y: e.clientY });
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.draggingTarget) return;
    e.preventDefault();
    const t = e.touches[0];
    this.performDrag({ x: t.clientX, y: t.clientY });
  }

  private performDrag(mouse: Pos): void {
    const dx = mouse.x - this.dragStartMouse.x;
    const dy = mouse.y - this.dragStartMouse.y;

    if (!this.hasDragged && Math.hypot(dx, dy) < this.DRAG_THRESHOLD) return;
    this.hasDragged = true;

    const vw    = window.innerWidth;
    const vh    = window.innerHeight;
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

    this.zone.run(() => {
      if (this.draggingTarget === 'trigger') {
        this.triggerPos = {
          x: clamp(this.dragStartElemPos.x + dx, this.EDGE_MARGIN, vw - this.TRIGGER_W - this.EDGE_MARGIN),
          y: clamp(this.dragStartElemPos.y + dy, this.EDGE_MARGIN, vh - this.TRIGGER_H - this.EDGE_MARGIN),
        };
      } else {
        const panelW = Math.min(480, vw - 16);
        const panelH = Math.min(750, vh * 0.85);
        this.panelPos = {
          x: clamp(this.dragStartElemPos.x + dx, 8, vw - panelW - 8),
          y: clamp(this.dragStartElemPos.y + dy, 8, vh - panelH - 8),
        };
      }
    });
  }

  private onMouseUp(_e: MouseEvent): void {
    this.snapTriggerToEdgeIfNeeded();
    this.draggingTarget = null;
  }

  private onTouchEnd(_e: TouchEvent): void {
    this.snapTriggerToEdgeIfNeeded();
    this.draggingTarget = null;
  }

  /** After releasing the trigger, animate it to the nearest left/right edge. */
  private snapTriggerToEdgeIfNeeded(): void {
    if (this.draggingTarget !== 'trigger' || !this.hasDragged) return;

    const vw     = window.innerWidth;
    const vh     = window.innerHeight;
    const center = this.triggerPos.x + this.TRIGGER_W / 2;

    this.snappedEdge = center < vw / 2 ? 'left' : 'right';

    const targetX = this.snappedEdge === 'left'
      ? this.EDGE_MARGIN
      : vw - this.TRIGGER_W - this.EDGE_MARGIN;

    const targetY = Math.min(
      Math.max(this.triggerPos.y, this.EDGE_MARGIN),
      vh - this.TRIGGER_H - this.EDGE_MARGIN
    );

    this.isSnapping = true;
    this.zone.run(() => {
      this.triggerPos = { x: targetX, y: targetY };
    });

    setTimeout(() => {
      this.zone.run(() => { this.isSnapping = false; });
    }, 420);
  }

  // ─── Messages ─────────────────────────────────────────────────────────────────
  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  async sendMessage(text: string = this.input): Promise<void> {
    const messageText = text.trim();
    if (!messageText) return;

    const userId = this.store.currentUser?.id || '';
    const userMsg: ChatMessage = {
      id:        crypto.randomUUID(),
      role:      'user',
      text:      messageText,
      timestamp: Date.now(),
      userId,
    };

    this.store.addChatMessage(userMsg);
    this.input    = '';
    this.isTyping = true;
    this.shouldScrollToBottom = true;

    try {
      const botResponse = await firstValueFrom(this.api.sendChat(messageText, this.language));
      this.store.addChatMessage({
        id:        botResponse.id,
        role:      'model',
        text:      botResponse.text,
        timestamp: botResponse.timestamp,
        userId,
      });
    } catch {
      this.store.addChatMessage({
        id:        crypto.randomUUID(),
        role:      'model',
        text:      'System busy, please try again.',
        timestamp: Date.now(),
        userId,
      });
    } finally {
      this.isTyping = false;
      this.shouldScrollToBottom = true;
    }
  }

  async clearChat(): Promise<void> {
    await this.store.clearChat();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  trackById(_: number, msg: ChatMessage): string {
    return msg.id;
  }
}