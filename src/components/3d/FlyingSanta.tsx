import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';

export function FlyingSanta() {
  const groupRef = useRef<THREE.Group>(null);
  const sleighRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Orbit around the center
    // Radius 30, Height varies slightly
    if (groupRef.current) {
      const radius = 35;
      const speed = 0.3;
      groupRef.current.position.x = Math.sin(t * speed) * radius;
      groupRef.current.position.z = Math.cos(t * speed) * radius;
      groupRef.current.position.y = 15 + Math.sin(t * 0.5) * 5; // Bobbing up and down

      // Face direction of movement
      groupRef.current.rotation.y = t * speed + Math.PI; // + Math.PI to face forward
    }

    // Slight wobbling of the sleigh
    if (sleighRef.current) {
      sleighRef.current.rotation.z = Math.sin(t * 3) * 0.05;
      sleighRef.current.rotation.x = Math.sin(t * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={sleighRef}>
        {/* Sleigh Body */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2, 1, 3]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>

        {/* Sleigh Runners (Skis) */}
        <mesh position={[0.8, -0.8, 0]}>
          <boxGeometry args={[0.2, 0.2, 4]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.8, -0.8, 0]}>
          <boxGeometry args={[0.2, 0.2, 4]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Santa */}
        <group position={[0, 0.8, -0.5]}>
          {/* Body */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
          {/* Head */}
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#ffccaa" />
          </mesh>
          {/* Hat */}
          <mesh position={[0, 1.4, 0]}>
            <coneGeometry args={[0.4, 0.8, 16]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
          {/* Beard */}
          <mesh position={[0, 0.9, 0.4]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>

        {/* Reindeer (Simplified) */}
        <group position={[0, 0, 4]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 2]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          {/* Red Nose */}
          <mesh position={[0, 0.2, 1.1]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
          </mesh>
        </group>

        {/* Magic Trail */}
        <Sparkles
          count={50}
          scale={[2, 2, 6]}
          position={[0, 0, -4]}
          size={6}
          speed={2}
          opacity={0.5}
          color="#ffff00"
        />
      </group>
    </group>
  );
}
