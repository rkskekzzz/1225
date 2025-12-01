import { useCalendarStore } from "@/store";
import { Door } from "./Door";
import { useTexture } from "@react-three/drei";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  processImageForBox,
  ProcessedBoxTextures,
} from "@/utils/imageProcessing";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

const FALLBACK_TEXTURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export function CalendarBox() {
  const { mainImage, doorShape } = useCalendarStore();
  const [processedTextures, setProcessedTextures] =
    useState<ProcessedBoxTextures | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { gl, camera } = useThree();

  // Rotation state - 대각선으로 기울어진 초기값 (윗면 보이도록)
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0.3, y: 0.5 });
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Idle animation state
  const [isIdle, setIsIdle] = useState(false);
  const lastInteractionTime = useRef(Date.now());
  const idleRotationOffset = useRef({ x: 0, y: 0 });
  const idleStartTime = useRef<number | null>(null);
  const idleAmplitude = useRef(0); // fade-in을 위한 amplitude

  // Zoom state - responsive initial zoom based on aspect ratio
  const getInitialZoom = () => {
    if (typeof window !== "undefined") {
      const aspectRatio = window.innerWidth / window.innerHeight;

      // 화면이 세로로 긴 경우 (모바일 세로)
      if (aspectRatio < 0.75) {
        return 65;
      }
      // 화면이 가로로 긴 경우 (데스크톱)
      else if (aspectRatio > 1.5) {
        return 50;
      }
      // 중간 비율 (모바일 가로, 태블릿)
      else {
        return 55;
      }
    }
    return 45;
  };

  const getMinZoom = () => {
    if (typeof window !== "undefined") {
      const aspectRatio = window.innerWidth / window.innerHeight;
      // 박스가 화면을 꽉 채우도록 최소 줌 레벨 계산
      // 세로로 긴 화면일수록 더 가까이
      return aspectRatio < 0.75 ? 28 : aspectRatio > 1.5 ? 22 : 25;
    }
    return 20;
  };

  const [zoom, setZoom] = useState(getInitialZoom);
  const [minZoom, setMinZoom] = useState(getMinZoom);
  const maxZoom = 80;

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

    console.log("Processing main image:", mainImage);
    processImageForBox(mainImage)
      .then((textures: ProcessedBoxTextures) => {
        console.log("Processed textures:", textures);
        setProcessedTextures(textures);
      })
      .catch((error: Error) => {
        console.error("Failed to process image:", error);
        setProcessedTextures(null);
      });
  }, [mainImage]);

  // Handle resize to adjust zoom for mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;

      let newZoom;
      let newMinZoom;

      if (aspectRatio < 0.75) {
        // 세로로 긴 화면
        newZoom = 65;
        newMinZoom = 28;
      } else if (aspectRatio > 1.5) {
        // 가로로 긴 화면
        newZoom = 50;
        newMinZoom = 22;
      } else {
        // 중간 비율
        newZoom = 55;
        newMinZoom = 25;
      }

      setZoom((prevZoom) => {
        // 현재 줌이 새로운 최소값보다 작으면 새로운 초기값으로
        return prevZoom < newMinZoom ? newZoom : prevZoom;
      });
      setMinZoom(newMinZoom);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load textures from processed data URLs
  const rawFrontTexture = useTexture(
    processedTextures?.front || FALLBACK_TEXTURE
  );
  const rawTopTexture = useTexture(processedTextures?.top || FALLBACK_TEXTURE);
  const rawBottomTexture = useTexture(
    processedTextures?.bottom || FALLBACK_TEXTURE
  );
  const rawLeftTexture = useTexture(
    processedTextures?.left || FALLBACK_TEXTURE
  );
  const rawRightTexture = useTexture(
    processedTextures?.right || FALLBACK_TEXTURE
  );

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

  // Mouse event handlers
  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault(); // 기본 동작 방지
      setIsDragging(true);
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      lastInteractionTime.current = Date.now();
      setIsIdle(false);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault(); // 기본 스크롤 방지

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      setRotation((prev) => ({
        x: prev.x + deltaY * 0.01,
        y: prev.y + deltaX * 0.01,
      }));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastInteractionTime.current = Date.now();
      setIsIdle(false);
      setZoom((prev) => {
        const newZoom = prev + e.deltaY * 0.05;
        return Math.max(minZoom, Math.min(maxZoom, newZoom));
      });
    };

    // 터치 이벤트 추가로 모바일 스크롤 방지
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerUp);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDragging, gl.domElement, minZoom, maxZoom]);

  // Apply rotation to the group with idle animation
  useFrame((state) => {
    if (groupRef.current) {
      // Check if user has been idle for 2 seconds (더 빨리 시작)
      const timeSinceInteraction = Date.now() - lastInteractionTime.current;
      if (timeSinceInteraction > 2000 && !isDragging) {
        if (!isIdle) {
          setIsIdle(true);
          idleStartTime.current = state.clock.getElapsedTime();
        }

        // Fade-in effect: amplitude가 0에서 1로 부드럽게 증가
        const idleElapsedTime =
          state.clock.getElapsedTime() - (idleStartTime.current || 0);
        const fadeInDuration = 1.5; // 1.5초에 걸쳐 fade in
        idleAmplitude.current = Math.min(idleElapsedTime / fadeInDuration, 1);

        // More dramatic idle animation - noticeable oscillation
        // idle 시작 시점부터의 시간을 사용하여 0부터 시작
        const time = idleElapsedTime;
        idleRotationOffset.current.x =
          Math.sin(time * 0.5) * 0.15 * idleAmplitude.current;
        idleRotationOffset.current.y =
          Math.sin(time * 0.4) * 0.2 * idleAmplitude.current;
      } else {
        if (isIdle) {
          setIsIdle(false);
          idleStartTime.current = null;
          idleAmplitude.current = 0;
        }
        idleRotationOffset.current.x = 0;
        idleRotationOffset.current.y = 0;
      }

      groupRef.current.rotation.x = rotation.x + idleRotationOffset.current.x;
      groupRef.current.rotation.y = rotation.y + idleRotationOffset.current.y;
    }

    // Apply zoom to camera
    camera.position.z = zoom;
  });

  // Generate 25 doors
  const doors = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1;
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Position: Center is (0,0,0)
    // Top-Left is (-width/2, height/2)
    // Cell center offset
    const x = -width / 2 + col * cellWidth + cellWidth / 2;
    const y = height / 2 - row * cellHeight - cellHeight / 2;
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
    <group ref={groupRef}>
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
            <meshStandardMaterial attach="material-4" map={frontTexture} />{" "}
            {/* Front - shows image in gaps */}
            <meshStandardMaterial attach="material-5" color="#5c3a21" />{" "}
            {/* Back */}
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
