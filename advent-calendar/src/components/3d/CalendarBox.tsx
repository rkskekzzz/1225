import { useCalendarStore } from '@/store';
import { Door } from './Door';
import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

const FALLBACK_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export function CalendarBox() {
  const { mainImage, doorShape } = useCalendarStore();

  // Box dimensions
  const width = 30;
  const height = 30;
  const depth = 5;

  // Grid config
  const cols = 5;
  const rows = 5;
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  // Load main image texture
  const textureUrl = mainImage || FALLBACK_TEXTURE;
  const baseTexture = useTexture(textureUrl);

  // Create textures for each side of the box
  const sideTextures = useMemo(() => {
    if (!mainImage) return null;

    // For seamless continuity with the front face:
    // Front doors use the full image (0 to 1 in UV space)
    // Each side should use a thin strip from the corresponding edge
    // So the pixels match perfectly at the boundaries

    const top = baseTexture.clone();
    const bottom = baseTexture.clone();
    const left = baseTexture.clone();
    const right = baseTexture.clone();

    // Top side: Take a horizontal strip from the TOP of the image
    // This matches the top row of front doors
    // Use full width (0 to 1) but only a thin vertical slice from top
    top.wrapS = THREE.RepeatWrapping;
    top.wrapT = THREE.ClampToEdgeWrapping;
    top.repeat.set(1, 1); // Will stretch the thin strip across the depth
    top.offset.set(0, 0.99); // Take from very top
    top.rotation = 0;
    top.center.set(0.5, 0.5);
    top.needsUpdate = true;

    // Bottom side: Take from BOTTOM of the image
    bottom.wrapS = THREE.RepeatWrapping;
    bottom.wrapT = THREE.ClampToEdgeWrapping;
    bottom.repeat.set(1, 1);
    bottom.offset.set(0, 0); // Take from very bottom
    bottom.needsUpdate = true;

    // Left side: Take a vertical strip from the LEFT of the image
    left.wrapS = THREE.ClampToEdgeWrapping;
    left.wrapT = THREE.RepeatWrapping;
    left.repeat.set(1, 1);
    left.offset.set(0, 0); // Take from very left
    left.needsUpdate = true;

    // Right side: Take from RIGHT of the image
    right.wrapS = THREE.ClampToEdgeWrapping;
    right.wrapT = THREE.RepeatWrapping;
    right.repeat.set(1, 1);
    right.offset.set(0.99, 0); // Take from very right
    right.needsUpdate = true;

    return { top, bottom, left, right };
  }, [mainImage, baseTexture]);

  // Generate 25 doors
  const doors = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Position: Center is (0,0,0)
    // Top-Left is (-width/2, height/2)
    // Cell center offset
    const x = -width/2 + col * cellWidth + cellWidth/2;
    const y = height/2 - row * cellHeight - cellHeight/2;
    const z = depth / 2; // On the front face

    return (
      <Door
        key={day}
        day={day}
        position={[x, y, z]}
        size={[cellWidth, cellHeight, 0.5]} // Door thickness 0.5
        mainImageUrl={mainImage}
        shape={doorShape}
      />
    );
  });

  return (
    <group>
      {/* Main Box Body with side textures */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {/*
          Box material array order:
          0: +X (right), 1: -X (left), 2: +Y (top), 3: -Y (bottom), 4: +Z (front), 5: -Z (back)
        */}
        {sideTextures ? (
          <>
            <meshStandardMaterial attach="material-0" map={sideTextures.right} />
            <meshStandardMaterial attach="material-1" map={sideTextures.left} />
            <meshStandardMaterial attach="material-2" map={sideTextures.top} />
            <meshStandardMaterial attach="material-3" map={sideTextures.bottom} />
            <meshStandardMaterial attach="material-4" color="#5c3a21" /> {/* Front - covered by doors */}
            <meshStandardMaterial attach="material-5" color="#5c3a21" /> {/* Back */}
          </>
        ) : (
          <meshStandardMaterial color="#5c3a21" />
        )}
      </mesh>

      {/* Doors */}
      {doors}
    </group>
  );
}

