import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useCalendarStore } from '@/store';

interface DoorProps {
  day: number;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  mainImageUrl: string | null;
  shape: 'square' | 'circle';
}

const FALLBACK_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export function Door({ day, position, size, mainImageUrl, shape }: DoorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { openedDays, toggleDay, setViewingDay, isPreviewMode } = useCalendarStore();
  const isOpen = openedDays.includes(day);

  // Load texture if available, otherwise use fallback
  const textureUrl = mainImageUrl || FALLBACK_TEXTURE;
  const texture = useTexture(textureUrl);

  const textureClone = useMemo(() => {
    if (!mainImageUrl) return null;
    const t = texture.clone();
    t.needsUpdate = true;

    // Grid is 5x5.
    // 0-indexed row/col
    const idx = day - 1;
    const col = idx % 5;
    const row = Math.floor(idx / 5);

    // Use the FULL image (0 to 1) for the front face
    // This allows the edges to match seamlessly with the side textures
    // The sides will also use the edge portions of the same image
    // So at the boundaries, front and sides will share the same pixels

    const cellSize = 0.2; // 1/5 = 0.2 per cell

    t.repeat.set(cellSize, cellSize);
    t.offset.set(col * cellSize, 1 - (row + 1) * cellSize);

    return t;
  }, [mainImageUrl, day, texture]);

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

  const handleClick = (e: any) => {
    e.stopPropagation();

    if (!isOpen) {
      toggleDay(day);
      // Delay modal to show opening animation
      setTimeout(() => {
        setViewingDay(day);
      }, 600);
    } else {
      setViewingDay(day);
    }
  };

  const [width, height, depth] = size;

  return (
    <group position={position}>
      {/* Hinge wrapper - pivot point is on the left */}
      <group position={[-width / 2, 0, depth / 2]} ref={groupRef}>
        {/* The Door Mesh - shifted right by half width to rotate around left edge */}
        <mesh
          position={[width / 2, 0, 0]}
          onClick={handleClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width * 0.95, height * 0.95, depth]} />
           {/*
             Materials:
             0: Right, 1: Left, 2: Top, 3: Bottom, 4: Front, 5: Back
           */}
          <meshStandardMaterial attach="material-0" color="#8B4513" />
          <meshStandardMaterial attach="material-1" color="#8B4513" />
          <meshStandardMaterial attach="material-2" color="#8B4513" />
          <meshStandardMaterial attach="material-3" color="#8B4513" />
          {/* Front Face - The Image Part */}
          <meshStandardMaterial
            attach="material-4"
            map={textureClone}
            color={!mainImageUrl ? '#ccaa88' : 'white'}
          />
          <meshStandardMaterial attach="material-5" color="#5c3a21" />
        </mesh>

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
      <mesh position={[0, 0, depth/2 - 0.1]}>
         <planeGeometry args={[width * 0.9, height * 0.9]} />
         <meshBasicMaterial color="black" />
         {/* Inner shadow or depth effect could be added here */}
      </mesh>
    </group>
  );
}
