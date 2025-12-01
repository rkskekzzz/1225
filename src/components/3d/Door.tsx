import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { useCalendarStore } from "@/store";

interface DoorProps {
  day: number;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  frontTexture: THREE.Texture | null;
  shape: "square" | "circle";
  isTutorial?: boolean;
  onInteract?: () => void;
}

const FALLBACK_TEXTURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export function Door({
  day,
  position,
  size,
  frontTexture,
  shape,
  isTutorial,
  onInteract,
}: DoorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { openedDays, toggleDay, setViewingDay, isPreviewMode } =
    useCalendarStore();
  const isOpen = openedDays.includes(day);
  const [isHovered, setIsHovered] = useState(false);

  // Track mouse position to detect drag vs click
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  // 현재 날짜 확인 (12월 기준)
  const getCurrentDecemberDay = () => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const date = now.getDate();

    // 12월인 경우에만 실제 날짜 반환, 아니면 테스트를 위해 25일로 설정
    if (month === 11) {
      // 11 = 12월
      return date;
    }
    // 12월이 아닌 경우 모든 날짜 허용 (테스트 목적)
    return 25;
  };

  const isUnlocked = isPreviewMode || day <= getCurrentDecemberDay();

  // 잠긴 날짜 hover 메시지 (날짜 차이에 따라)
  const getLockedMessage = () => {
    const currentDay = getCurrentDecemberDay();
    const daysUntil = day - currentDay;

    // 크리스마스 이브 (24일)
    if (day === 24) {
      const messages = ["이브 대기중🎅", "특별한 밤💫", "이브까지 기다려✨"];
      return messages[day % messages.length];
    }

    // 크리스마스 당일 (25일)
    if (day === 25) {
      const messages = ["메리크리스마스🎄", "크리스마스🎁", "특별한 날🌟"];
      return messages[day % messages.length];
    }

    // 내일 (1일 차이)
    if (daysUntil === 1) {
      const messages = [
        "내일 봐!🎁",
        "하루만 더!💝",
        "내일 만나✨",
        "곧이야!🎉",
      ];
      return messages[day % messages.length];
    }

    // 가까운 미래 (2-6일)
    if (daysUntil >= 2 && daysUntil <= 6) {
      const messages = [
        "조금만 기다려!✨",
        "곧 만나!🎀",
        "아직 안돼!🙈",
        "금방이야!💫",
        "기다려줘!🎁",
      ];
      return messages[day % messages.length];
    }

    // 먼 미래 (7일 이상)
    const messages = [
      "천천히 와!🐢",
      "서두르지 마!⏰",
      "여유 가져!☕",
      "기다림도 좋아🌙",
      "참을성!💪",
    ];
    return messages[day % messages.length];
  };

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
    if (shape === "circle") {
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

      // Animate hover scale (잠긴 날짜는 scale 효과 없음)
      // 튜토리얼 상태일 때도 살짝 커져있게 함 (주목도 향상)
      const targetScale =
        (isHovered || isTutorial) && !isOpen && isUnlocked ? 1.08 : 1.0;
      const currentScale = groupRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(
        currentScale,
        targetScale,
        delta * 10
      );
      groupRef.current.scale.set(newScale, newScale, 1);
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    // Three.js pointer events work for both mouse and touch
    // Store the pointer position using the event's point or screen position
    const x = e.clientX ?? e.point?.x ?? 0;
    const y = e.clientY ?? e.point?.y ?? 0;
    mouseDownPos.current = { x, y };
  };

  const handleClick = (e: any) => {
    e.stopPropagation();

    // Check if this was a drag or a click
    if (mouseDownPos.current) {
      const x = e.clientX ?? e.point?.x ?? 0;
      const y = e.clientY ?? e.point?.y ?? 0;
      const dx = Math.abs(x - mouseDownPos.current.x);
      const dy = Math.abs(y - mouseDownPos.current.y);
      const dragThreshold = 5; // pixels

      // If mouse moved more than threshold, it was a drag, not a click
      if (dx > dragThreshold || dy > dragThreshold) {
        mouseDownPos.current = null;
        return;
      }
    }

    mouseDownPos.current = null;

    // 잠긴 날짜는 열 수 없음
    if (!isUnlocked) {
      return;
    }

    if (!isOpen) {
      toggleDay(day);
      if (onInteract) onInteract();
      // Delay modal to show opening animation
      setTimeout(() => {
        setViewingDay(day);
      }, 600);
    } else {
      // If already open, close the door
      toggleDay(day);
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setIsHovered(true);

    // 잠긴 날짜는 기본 커서 유지
    if (isUnlocked) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "not-allowed";
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = "default";
  };

  const [width, height, depth] = size;

  return (
    <group position={position}>
      {/* Hinge wrapper - pivot point is on the left */}
      <group position={[-width / 2, 0, depth / 2]} ref={groupRef}>
        {shape === "square" ? (
          <mesh
            position={[width / 2, 0, 0]}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width * 0.9, height * 0.9, depth]} />
            <meshStandardMaterial
              attach="material-0"
              color="#8B4513"
              emissive={
                (isHovered || isTutorial) && !isOpen ? "#ff8844" : "#000000"
              }
              emissiveIntensity={
                (isHovered || isTutorial) && !isOpen ? 0.3 : 0
              }
            />
            <meshStandardMaterial
              attach="material-1"
              color="#8B4513"
              emissive={
                (isHovered || isTutorial) && !isOpen ? "#ff8844" : "#000000"
              }
              emissiveIntensity={
                (isHovered || isTutorial) && !isOpen ? 0.3 : 0
              }
            />
            <meshStandardMaterial
              attach="material-2"
              color="#8B4513"
              emissive={
                (isHovered || isTutorial) && !isOpen ? "#ff8844" : "#000000"
              }
              emissiveIntensity={
                (isHovered || isTutorial) && !isOpen ? 0.3 : 0
              }
            />
            <meshStandardMaterial
              attach="material-3"
              color="#8B4513"
              emissive={
                (isHovered || isTutorial) && !isOpen ? "#ff8844" : "#000000"
              }
              emissiveIntensity={
                (isHovered || isTutorial) && !isOpen ? 0.3 : 0
              }
            />
            <meshStandardMaterial
              attach="material-4"
              map={textureClone}
              color={
                !frontTexture
                  ? "#ccaa88"
                  : isUnlocked
                  ? "white"
                  : isHovered
                  ? "#666666"
                  : "white"
              }
              emissive={
                (isHovered || isTutorial) && !isOpen
                  ? isUnlocked
                    ? "#ffaa66"
                    : "#000000"
                  : "#000000"
              }
              emissiveIntensity={
                ((isHovered || isTutorial) && !isOpen && isUnlocked) ? 0.4 : 0
              }
              opacity={isUnlocked ? 1 : isHovered ? 0.5 : 1}
              transparent={!isUnlocked && isHovered}
            />
            <meshStandardMaterial
              attach="material-5"
              color="#5c3a21"
              emissive={
                (isHovered || isTutorial) && !isOpen ? "#ff8844" : "#000000"
              }
              emissiveIntensity={
                (isHovered || isTutorial) && !isOpen ? 0.3 : 0
              }
            />
          </mesh>
        ) : (
          // Circle Shape: Composite mesh (Front Circle + Back Circle + Side Cylinder)
          <group
            position={[width / 2, 0, 0]}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            {/* Front Face */}
            <mesh position={[0, 0, depth / 2]} castShadow receiveShadow>
              <circleGeometry args={[width * 0.45, 32]} />
              <meshStandardMaterial
                map={textureClone}
                color={
                  !frontTexture
                    ? "#ccaa88"
                    : isUnlocked
                    ? "white"
                    : isHovered
                    ? "#666666"
                    : "white"
                }
                emissive={
                  (isHovered || isTutorial) && !isOpen
                    ? isUnlocked
                      ? "#ffaa66"
                      : "#000000"
                    : "#000000"
                }
                emissiveIntensity={
                  ((isHovered || isTutorial) && !isOpen && isUnlocked) ? 0.4 : 0
                }
                opacity={isUnlocked ? 1 : isHovered ? 0.5 : 1}
                transparent={!isUnlocked && isHovered}
              />
            </mesh>

            {/* Back Face */}
            <mesh
              position={[0, 0, -depth / 2]}
              rotation={[0, Math.PI, 0]}
              castShadow
              receiveShadow
            >
              <circleGeometry args={[width * 0.45, 32]} />
              <meshStandardMaterial
                color="#5c3a21"
                emissive={
                  (isHovered || isTutorial) && !isOpen ? "#ff8844" : "#000000"
                }
                emissiveIntensity={
                  (isHovered || isTutorial) && !isOpen ? 0.3 : 0
                }
              />
            </mesh>

            {/* Side (Thickness) */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry
                args={[width * 0.45, width * 0.45, depth, 32, 1, true]}
              />
              <meshStandardMaterial
                color="#8B4513"
                side={THREE.DoubleSide}
                emissive={
                  (isHovered || isTutorial) && !isOpen ? "#ff8844" : "#000000"
                }
                emissiveIntensity={
                  (isHovered || isTutorial) && !isOpen ? 0.3 : 0
                }
              />
            </mesh>
          </group>
        )}

        {/* Door Number Text */}
        {!isOpen && (
          <mesh
            position={[width / 2, 0, depth / 2 + 0.01]}
            rotation={[0, 0, 0]}
          >
            {/* Simple text using a plane with canvas texture could be better,
                  but for now let's skip text or use Drei Text if installed.
                  Since npm failed, I'll skip Text component to avoid more errors.
              */}
          </mesh>
        )}

        {/* Hover Text */}
        {isHovered && !isOpen && !isTutorial && (
          <Text
            position={[width / 2, 0, depth / 2 + 0.02]}
            fontSize={width * 0.12}
            color={isUnlocked ? "#ffffff" : "#ff6b6b"}
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {isUnlocked ? "클릭해서 열기" : getLockedMessage()}
          </Text>
        )}

        {/* Tutorial Tooltip */}
        {isTutorial && !isOpen && (
          <Html
            position={[width / 2, height / 2, depth / 2]}
            center
            style={{ pointerEvents: "none" }}
            zIndexRange={[100, 0]}
          >
            <div className="relative flex flex-col items-center animate-bounce">
              <div className="bg-white text-slate-900 px-3 py-2 rounded-xl shadow-xl border border-emerald-500/30 whitespace-nowrap text-sm font-bold flex items-center gap-2">
                <span>날짜에 맞는 칸을 클릭해서 열어보세요</span>
                <span className="text-lg">🎁</span>
              </div>
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white mt-[-1px]"></div>
            </div>
          </Html>
        )}
      </group>

      {/* The Hole behind the door */}
      <mesh position={[0, 0, -0.005]}>
        {shape === "square" ? (
          <planeGeometry args={[width * 0.9, height * 0.9]} />
        ) : (
          <circleGeometry args={[width * 0.45, 32]} />
        )}
        <meshBasicMaterial color="black" />
      </mesh>
    </group>
  );
}
