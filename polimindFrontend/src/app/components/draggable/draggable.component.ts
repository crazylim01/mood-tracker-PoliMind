import {
  Component, Input, OnInit, OnDestroy,
  ElementRef, HostListener, Renderer2
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-draggable',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  styles: [`
    :host {
      position: fixed;
      z-index: 1000;
      touch-action: none;
      display: block;
    }
  `]
})
export class DraggableComponent implements OnInit, OnDestroy {
  @Input() id: string = '';
  @Input() initialX: number = 100;
  @Input() initialY: number = 100;

  private isDragging = false;
  private offsetX = 0;
  private offsetY = 0;
  private position = { x: 0, y: 0 };

  private mouseMoveListener!: () => void;
  private mouseUpListener!: () => void;
  private touchMoveListener!: () => void;
  private touchEndListener!: () => void;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    const saved = localStorage.getItem(`pos-${this.id}`);
    this.position = saved ? JSON.parse(saved) : { x: this.initialX, y: this.initialY };
    this.applyPosition();

    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grab');
  }

  ngOnDestroy() {
    this.removeListeners();
  }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onDragStart(event: MouseEvent | TouchEvent) {
    const clientX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
    const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;

    this.isDragging = true;
    this.offsetX = clientX - this.position.x;
    this.offsetY = clientY - this.position.y;
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grabbing');

    this.mouseMoveListener = this.renderer.listen('window', 'mousemove', (e: MouseEvent) => this.onMove(e));
    this.mouseUpListener = this.renderer.listen('window', 'mouseup', () => this.onEnd());
    this.touchMoveListener = this.renderer.listen('window', 'touchmove', (e: TouchEvent) => this.onMove(e));
    this.touchEndListener = this.renderer.listen('window', 'touchend', () => this.onEnd());
  }

  private onMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    const clientX = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
    const clientY = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;

    this.position = {
      x: clientX - this.offsetX,
      y: clientY - this.offsetY
    };
    this.applyPosition();
  }

  private onEnd() {
    this.isDragging = false;
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grab');
    localStorage.setItem(`pos-${this.id}`, JSON.stringify(this.position));
    this.removeListeners();
  }

  private applyPosition() {
    this.renderer.setStyle(this.el.nativeElement, 'left', `${this.position.x}px`);
    this.renderer.setStyle(this.el.nativeElement, 'top', `${this.position.y}px`);
  }

  private removeListeners() {
    if (this.mouseMoveListener) this.mouseMoveListener();
    if (this.mouseUpListener) this.mouseUpListener();
    if (this.touchMoveListener) this.touchMoveListener();
    if (this.touchEndListener) this.touchEndListener();
  }
}