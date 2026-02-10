
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useSphere, usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import { useMoodStore } from '../store';
import { MoodType } from '../types';

const Mesh = 'mesh' as any;
const SphereGeometry = 'sphereGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const MeshPhysicalMaterial = 'meshPhysicalMaterial' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const Group = 'group' as any;

const moodColors: Record<MoodType, string> = {
  happy: '#fbbf24',    // Vibrant Yellow
  neutral: '#94a3b8',  // Cool Gray
  sad: '#60a5fa',     // Sky Blue
  stressed: '#ef4444', // Alert Red
  tired: '#8b5cf6',    // Deep Purple
  excited: '#f472b6',  // Bright Pink
};

const Ball: React.FC<{ position: [number, number, number]; color: string; intensity: number }> = ({ position, color, intensity }) => {
  const size = 0.5 + (intensity * 0.15);
  const [ref, api] = useSphere(() => ({
    mass: 1, position, args: [size], restitution: 0.8, linearDamping: 0.5, angularDamping: 0.5,
  }));

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    api.applyForce([
      -position[0] * 1.5 + Math.sin(time * 0.5 + position[1]) * 0.1,
      -position[1] * 1.5 + Math.cos(time * 0.5 + position[0]) * 0.1,
      -position[2] * 1.5
    ], [0, 0, 0]);
  });

  return (
    <Mesh ref={ref as any} castShadow>
      <SphereGeometry args={[size, 24, 24]} />
      <MeshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.2} 
        roughness={0.2} 
        metalness={0.3}
      />
    </Mesh>
  );
}

const GlassOrb: React.FC = () => (
  <Mesh>
    <SphereGeometry args={[4.5, 32, 32]} />
    <MeshPhysicalMaterial 
      color="#ffffff" 
      transparent 
      opacity={0.02} 
      transmission={0.9} 
      thickness={1} 
      roughness={0.1} 
      side={THREE.BackSide} 
    />
  </Mesh>
);

function InvisibleContainment() {
  const dist = 5;
  usePlane(() => ({ position: [0, -dist, 0], rotation: [-Math.PI / 2, 0, 0] })); 
  usePlane(() => ({ position: [0, dist, 0], rotation: [Math.PI / 2, 0, 0] }));  
  return null;
}

const CloudScene: React.FC = () => {
  const { entries, currentUser } = useMoodStore();
  const userEntries = useMemo(() => 
    (entries || []).filter(e => e.userId === currentUser?.id).slice(0, 15), 
    [entries.length, currentUser?.id]
  );
  
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <Group ref={groupRef as any}>
      <AmbientLight intensity={1.5} />
      <PointLight position={[10, 10, 10]} intensity={2} castShadow />
      <Physics gravity={[0, 0, 0]} iterations={6}>
        <InvisibleContainment />
        <GlassOrb />
        {userEntries.map((entry) => (
          <Ball 
            key={entry.id} 
            position={[(Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4]} 
            color={moodColors[entry.mood]} intensity={entry.intensity}
          />
        ))}
      </Physics>
    </Group>
  );
};

export const MoodSphere: React.FC = () => {
  const { entries, currentUser } = useMoodStore();
  const userEntriesCount = useMemo(() => (entries || []).filter(e => e.userId === currentUser?.id).length, [entries.length, currentUser?.id]);

  return (
    <div className="w-full h-[400px] bg-[#0d0d1a] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 relative">
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">EMOTIONAL CLOUD</h3>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">PERSONAL RESONANCE V2.0</p>
      </div>
      <div className="absolute top-8 right-8 z-10 flex gap-1">
        {['#fbbf24', '#94a3b8', '#60a5fa', '#ef4444', '#8b5cf6', '#f472b6'].map(c => (
          <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }}></div>
        ))}
      </div>
      <Canvas shadows camera={{ position: [0, 0, 12], fov: 40 }} gl={{ antialias: true }}>
        <CloudScene />
      </Canvas>
      {userEntriesCount === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Awaiting Initial Resonance...
        </div>
      )}
    </div>
  );
};
