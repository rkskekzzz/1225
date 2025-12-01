'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Sparkles, Stars } from '@react-three/drei';
import { CalendarBox } from './CalendarBox';
import { Suspense } from 'react';

export default function Scene() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Canvas camera={{ position: [0, 0, 45], fov: 50 }}>
        <Suspense fallback={null}>
          {/* Warm Christmas Lighting */}
          <ambientLight intensity={0.4} color="#ffdcd6" />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffaa00" />
          <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4444ff" />

          <CalendarBox />

          {/* Environment Reflection */}
          <Environment preset="forest" />

          {/* Shadows */}
          <ContactShadows position={[0, -16, 0]} opacity={0.7} scale={50} blur={2.5} far={10} resolution={256} color="#000000" />

          {/* Snow Effect - Full Screen */}
          <Sparkles
            count={2000}
            scale={[100, 100, 50]}
            size={4}
            speed={0.3}
            opacity={0.8}
            color="#ffffff"
          />

          {/* Starry Night */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          <OrbitControls
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            enablePan={false}
            maxDistance={80}
            minDistance={20}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
