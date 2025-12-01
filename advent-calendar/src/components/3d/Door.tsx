import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useCalendarStore } from '@/store';

interface DoorProps {
  day: number;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  frontTexture: THREE.Texture | null;
  shape: 'square' | 'circle';
}

const FALLBACK_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export function Door({ day, position, size, frontTexture, shape }: DoorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { openedDays, toggleDay, setViewingDay, isPreviewMode } = useCalendarStore();
  const isOpen = openedDays.includes(day);

  // Track mouse position to detect drag vs click
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const textureClone = useMemo(() => {
    if (!frontTexture) return null;

    // Clone the texture to apply different offset/repeat for each door
    const t = frontTexture.clone();
    t.needsUpdate = true;

    // Grid is 5x5.
    // 0-indexed row/col
    const idx = day - 1;
    const col = idx % 5;
    const row = Math.floor(idx / 5);

    // Texture filtering is already applied in parent, but we need to ensure it persists on clone
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;

    const cellSize = 0.2; // 1/5 = 0.2 per cell

    t.repeat.set(cellSize, cellSize);
    t.offset.set(col * cellSize, 1 - (row + 1) * cellSize);

    // If circle, rotate texture to correct orientation
    // Reverted texture rotation as it caused issues
    if (shape === 'circle') {
      // Calculate the center of THIS specific door's texture portion
      // UV coordinates go from 0 to 1
      // const cx = col * cellSize + cellSize / 2;
      // const cy = 1 - (row + 1) * cellSize + cellSize / 2;

      // t.center.set(cx, cy);
      // t.rotation = -Math.PI / 2; // Rotate -90 degrees around the door's center
    } else {
      t.rotation = 0;
    }

    return t;
  }, [frontTexture, day, shape]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Animate rotation
      const targetRotation = isOpen ? -Math.PI * 0.6 : 0;
      // Smooth interpolation
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        delta * 5
      );
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: any) => {
    e.stopPropagation();

    // Check if this was a drag or a click
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      const dragThreshold = 5; // pixels

      // If mouse moved more than threshold, it was a drag, not a click
      if (dx > dragThreshold || dy > dragThreshold) {
        mouseDownPos.current = null;
        return;
      }
    }

    mouseDownPos.current = null;

    if (!isOpen) {
      toggleDay(day);
      // Delay modal to show opening animation
      setTimeout(() => {
        setViewingDay(day);
      }, 600);
    } else {
      // If already open, close the door
      toggleDay(day);
    }
  };

  const [width, height, depth] = size;

  return (
    <group position={position}>
      {/* Hinge wrapper - pivot point is on the left */}
      <group position={[-width / 2, 0, depth / 2]} ref={groupRef}>
        {shape === 'square' ? (
          <mesh
            position={[width / 2, 0, 0]}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width * 0.9, height * 0.9, depth]} />
            <meshStandardMaterial attach="material-0" color="#8B4513" />
            <meshStandardMaterial attach="material-1" color="#8B4513" />
            <meshStandardMaterial attach="material-2" color="#8B4513" />
            <meshStandardMaterial attach="material-3" color="#8B4513" />
            <meshStandardMaterial
              attach="material-4"
              map={textureClone}
              color={!frontTexture ? '#ccaa88' : 'white'}
            />
            <meshStandardMaterial attach="material-5" color="#5c3a21" />
          </mesh>
        ) : (
          // Circle Shape: Composite mesh (Front Circle + Back Circle + Side Cylinder)
          <group
            position={[width / 2, 0, 0]}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
          >
            {/* Front Face */}
            <mesh position={[0, 0, depth / 2]} castShadow receiveShadow>
              <circleGeometry args={[width * 0.45, 32]} />
              <meshStandardMaterial
                map={textureClone}
                color={!frontTexture ? '#ccaa88' : 'white'}
              />
            </mesh>

            {/* Back Face */}
            <mesh position={[0, 0, -depth / 2]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
              <circleGeometry args={[width * 0.45, 32]} />
              <meshStandardMaterial color="#5c3a21" />
            </mesh>

            {/* Side (Thickness) */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[width * 0.45, width * 0.45, depth, 32, 1, true]} />
              <meshStandardMaterial color="#8B4513" side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}

        {/* Door Number Text */}
        {!isOpen && (
           <mesh position={[width/2, 0, depth/2 + 0.01]} rotation={[0, 0, 0]}>
             {/* Simple text using a plane with canvas texture could be better,
                 but for now let's skip text or use Drei Text if installed.
                 Since npm failed, I'll skip Text component to avoid more errors.
             */}
           </mesh>
        )}
      </group>

      {/* The Hole behind the door */}
      <mesh position={[0, 0, -0.005]}>
         {shape === 'square' ? (
           <planeGeometry args={[width * 0.9, height * 0.9]} />
         ) : (
           <circleGeometry args={[width * 0.45, 32]} />
         )}
         <meshBasicMaterial color="black" />
      </mesh>
    </group>
  );
}
