import {
  Component, OnInit, OnDestroy, ElementRef,
  ViewChild, AfterViewInit, Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

interface MoodEntry {
  id: string;
  userId: string;
  mood: string;
  intensity: number;
}

const MOOD_COLORS: Record<string, string> = {
  happy: '#fbbf24',
  neutral: '#94a3b8',
  sad: '#60a5fa',
  stressed: '#ef4444',
  tired: '#8b5cf6',
  excited: '#f472b6',
};

@Component({
  selector: 'app-mood-sphere',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mood-sphere-wrapper">
      <div class="mood-sphere-labels">
        <div class="label-left">
          <p class="label-title">EMOTIONAL CLOUD</p>
          <p class="label-sub">PERSONAL RESONANCE V2.0</p>
        </div>
        <div class="label-dots">
          <div *ngFor="let color of dotColors" class="dot" [style.backgroundColor]="color"></div>
        </div>
      </div>
      <canvas #canvas></canvas>
      <div *ngIf="entries.length === 0" class="empty-state">
        Awaiting Initial Resonance...
      </div>
    </div>
  `,
  styles: [`
    .mood-sphere-wrapper {
      width: 100%;
      height: 400px;
      background: #0d0d1a;
      border-radius: 3rem;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.05);
      position: relative;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }
    .mood-sphere-labels {
      position: absolute;
      top: 2rem;
      left: 2rem;
      right: 2rem;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      pointer-events: none;
    }
    .label-title {
      font-size: 10px;
      font-weight: 900;
      color: #818cf8;
      text-transform: uppercase;
      letter-spacing: 0.4em;
      margin: 0;
    }
    .label-sub {
      font-size: 9px;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      margin: 4px 0 0 0;
    }
    .label-dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .empty-state {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #334155;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class MoodSphereComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() entries: MoodEntry[] = [];
  @Input() currentUserId: string = '';

  dotColors = Object.values(MOOD_COLORS);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private balls: { mesh: THREE.Mesh; velocity: THREE.Vector3 }[] = [];
  private animationId!: number;
  private groupRef!: THREE.Group;

  ngAfterViewInit() {
    this.initThree();
    this.createBalls();
    this.animate();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.parentElement!.clientWidth;
    const height = 400;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 12);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 2);
    point.position.set(10, 10, 10);
    this.scene.add(point);

    // Glass orb
    const orbGeo = new THREE.SphereGeometry(4.5, 32, 32);
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.03,
      roughness: 0.1,
      side: THREE.BackSide
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    this.scene.add(orb);

    // Group for rotation
    this.groupRef = new THREE.Group();
    this.scene.add(this.groupRef);
  }

  private createBalls() {
    const userEntries = this.entries
      .filter(e => e.userId === this.currentUserId)
      .slice(0, 15);

    userEntries.forEach(entry => {
      const size = 0.5 + (entry.intensity * 0.15);
      const geo = new THREE.SphereGeometry(size, 24, 24);
      const color = new THREE.Color(MOOD_COLORS[entry.mood] || '#94a3b8');
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.2,
        roughness: 0.2,
        metalness: 0.3
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );

      this.groupRef.add(mesh);
      this.balls.push({ mesh, velocity });
    });
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;
    this.groupRef.rotation.y = time * 0.1;

    this.balls.forEach(({ mesh, velocity }) => {
      mesh.position.add(velocity);

      // Bounce inside orb
      const dist = mesh.position.length();
      if (dist > 4) {
        mesh.position.normalize().multiplyScalar(4);
        velocity.reflect(mesh.position.clone().normalize()).multiplyScalar(0.8);
      }

      // Gentle centering force
      velocity.add(mesh.position.clone().multiplyScalar(-0.001));
    });

    this.renderer.render(this.scene, this.camera);
  }
}