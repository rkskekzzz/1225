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

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited) {
      // Delay slightly to let the scene load
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTutorialInteract = () => {
    if (showTutorial) {
      setShowTutorial(false);
      localStorage.setItem("hasVisited", "true");
    }
  };

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

  // Keep zoom in a ref for event handlers to avoid re-binding listeners
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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

    processImageForBox(mainImage)
      .then((textures: ProcessedBoxTextures) => {
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

  // Pinch zoom state
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number | null>(null);
  const isPinching = useRef(false);

  // Mouse event handlers
  useEffect(() => {
    const canvas = gl.domElement;

    // Drag state
    let dragStartPos = { x: 0, y: 0 };
    let hasMoved = false;

    const handlePointerDown = (e: PointerEvent) => {
      // 핀치 줌 중이면 회전 시작하지 않음
      if (isPinching.current) return;

      dragStartPos = { x: e.clientX, y: e.clientY };
      hasMoved = false;
      setIsDragging(true);
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      lastInteractionTime.current = Date.now();
      setIsIdle(false);
    };

    const handlePointerMove = (e: PointerEvent) => {
      // 핀치 줌 중이면 회전하지 않음
      if (isPinching.current) {
        setIsDragging(false);
        return;
      }
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      // 드래그가 실제로 발생했는지 확인 (5px 이상 이동)
      if (!hasMoved && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
        hasMoved = true;
      }

      if (hasMoved) {
        e.preventDefault(); // 드래그 중일 때만 기본 동작 방지
      }

      setRotation((prev) => ({
        x: prev.x + deltaY * 0.01,
        y: prev.y + deltaX * 0.01,
      }));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      hasMoved = false;
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

    // 터치 이벤트 - 핀치 줌 처리
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching.current = true;
        setIsDragging(false); // 핀치 시작하면 드래그(회전) 중지

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );

        pinchStartDist.current = dist;
        pinchStartZoom.current = zoomRef.current; // Use ref instead of state
        lastInteractionTime.current = Date.now();
        setIsIdle(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinching.current && e.touches.length === 2) {
        e.preventDefault();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );

        if (pinchStartDist.current && pinchStartZoom.current) {
          // 거리가 멀어지면(dist 증가) 줌인(zoom 값 감소)
          // 거리가 가까워지면(dist 감소) 줌아웃(zoom 값 증가)
          const scale = pinchStartDist.current / dist;
          const newZoom = pinchStartZoom.current * scale;

          setZoom(Math.max(minZoom, Math.min(maxZoom, newZoom)));
          lastInteractionTime.current = Date.now();
        }
      } else if (isDragging) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching.current = false;
        pinchStartDist.current = null;
        pinchStartZoom.current = null;
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerUp);
      canvas.removeEventListener("wheel", handleWheel);

      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, gl.domElement, minZoom, maxZoom]); // Removed zoom from dependencies

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
        isTutorial={showTutorial && day === 1}
        onInteract={handleTutorialInteract}
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
