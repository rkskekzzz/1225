import { useCalendarStore } from '@/store';
import { Door } from './Door';
import { useTexture } from '@react-three/drei';
import { useState, useEffect, useMemo } from 'react';
import { processImageForBox, ProcessedBoxTextures } from '@/utils/imageProcessing';
import * as THREE from 'three';

const FALLBACK_TEXTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export function CalendarBox() {
  const { mainImage, doorShape } = useCalendarStore();
  const [processedTextures, setProcessedTextures] = useState<ProcessedBoxTextures | null>(null);

  // Box dimensions
  const width = 30;
  const height = 30;
  const depth = 5;

  // Grid config
  const cols = 5;
  const rows = 5;
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  // Process the main image into box textures
  useEffect(() => {
    if (!mainImage) {
      setProcessedTextures(null);
      return;
    }

    console.log('Processing main image:', mainImage);
    processImageForBox(mainImage)
      .then((textures: ProcessedBoxTextures) => {
        console.log('Processed textures:', textures);
        setProcessedTextures(textures);
      })
      .catch((error: Error) => {
        console.error('Failed to process image:', error);
        setProcessedTextures(null);
      });
  }, [mainImage]);

  // Load textures from processed data URLs
  const rawFrontTexture = useTexture(processedTextures?.front || FALLBACK_TEXTURE);
  const rawTopTexture = useTexture(processedTextures?.top || FALLBACK_TEXTURE);
  const rawBottomTexture = useTexture(processedTextures?.bottom || FALLBACK_TEXTURE);
  const rawLeftTexture = useTexture(processedTextures?.left || FALLBACK_TEXTURE);
  const rawRightTexture = useTexture(processedTextures?.right || FALLBACK_TEXTURE);

  // Apply texture filtering
  const frontTexture = useMemo(() => {
    const t = rawFrontTexture.clone();
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [rawFrontTexture]);

  const topTexture = useMemo(() => {
    const t = rawTopTexture.clone();
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [rawTopTexture]);

  const bottomTexture = useMemo(() => {
    const t = rawBottomTexture.clone();
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [rawBottomTexture]);

  const leftTexture = useMemo(() => {
    const t = rawLeftTexture.clone();
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [rawLeftTexture]);

  const rightTexture = useMemo(() => {
    const t = rawRightTexture.clone();
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [rawRightTexture]);

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
    const z = depth / 2 + 0.01; // Slightly in front of the box face to prevent Z-fighting

    return (
      <Door
        key={day}
        day={day}
        position={[x, y, z]}
        size={[cellWidth, cellHeight, 0.02]} // Door thickness 0.02 (very thin)
        frontTexture={frontTexture}
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
        {processedTextures ? (
          <>
            <meshStandardMaterial attach="material-0" map={rightTexture} />
            <meshStandardMaterial attach="material-1" map={leftTexture} />
            <meshStandardMaterial attach="material-2" map={topTexture} />
            <meshStandardMaterial attach="material-3" map={bottomTexture} />
            <meshStandardMaterial attach="material-4" map={frontTexture} /> {/* Front - shows image in gaps */}
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
