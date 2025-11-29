'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { CalendarBox } from './CalendarBox';
import { Suspense } from 'react';

export default function Scene() {
  return (
    <div className="w-full h-full bg-gray-900">
      <Canvas camera={{ position: [0, 0, 45], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <CalendarBox />
          <Environment preset="city" />
          <ContactShadows position={[0, -16, 0]} opacity={0.5} scale={50} blur={1} far={10} resolution={256} color="#000000" />
          <OrbitControls
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            enablePan={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
