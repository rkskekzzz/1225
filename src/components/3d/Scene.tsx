"use client";

import { Canvas, useThree } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  Sparkles,
  Stars,
  useTexture,
} from "@react-three/drei";
import { CalendarBox } from "./CalendarBox";
import { Suspense, useMemo } from "react";
import { useCalendarStore } from "@/store";

interface SceneProps {
  onLockedDayClick?: (day: number) => void;
}

const DEFAULT_BACKGROUND = "/image.jpeg";

// 3D 배경 평면 컴포넌트
function BackgroundPlane({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl);
  const { viewport } = useThree();

  // 이미지 원본 비율 계산
  const imageAspect = useMemo(() => {
    if (texture.image) {
      return texture.image.width / texture.image.height;
    }
    return 1;
  }, [texture]);

  // 최대 줌아웃(z=80)일 때 화면을 꽉 채우도록 크기 계산
  // FOV=50, 배경 평면 z=-30, 최대 줌아웃 시 카메라 z=80
  // 거리 = 80 - (-30) = 110
  const maxZoomDistance = 110;
  const fov = 50;

  // 최대 줌아웃 시 보이는 영역 크기
  const visibleHeight =
    2 * Math.tan((fov * Math.PI) / 180 / 2) * maxZoomDistance;
  const screenAspect = viewport.width / viewport.height;
  const visibleWidth = visibleHeight * screenAspect;

  // 이미지 비율을 유지하면서 화면을 꽉 채우는 크기 계산
  // cover 방식: 화면보다 이미지가 더 넓거나 높으면 잘리지만 빈 공간 없음
  const planeSize = useMemo(() => {
    let width: number;
    let height: number;

    if (imageAspect > screenAspect) {
      // 이미지가 화면보다 더 넓음 -> 높이 기준으로 맞춤
      height = visibleHeight;
      width = height * imageAspect;
    } else {
      // 이미지가 화면보다 더 좁음 -> 너비 기준으로 맞춤
      width = visibleWidth;
      height = width / imageAspect;
    }

    // 약간의 여유를 두어 확실히 커버되도록
    return { width: width * 1.05, height: height * 1.05 };
  }, [imageAspect, screenAspect, visibleWidth, visibleHeight]);

  return (
    <mesh position={[0, 0, -30]}>
      <planeGeometry args={[planeSize.width, planeSize.height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export default function Scene({ onLockedDayClick }: SceneProps) {
  const { backgroundImage } = useCalendarStore();
  const bgImage = backgroundImage || DEFAULT_BACKGROUND;

  return (
    <div
      className="w-full h-full bg-gradient-to-b from-[#0f172a] to-[#1e293b]"
      style={{ touchAction: "none" }}
    >
      <Canvas camera={{ position: [0, 0, 45], fov: 50 }}>
        <Suspense fallback={null}>
          {/* Background Plane - 맨 뒤에 배치 */}
          <BackgroundPlane imageUrl={bgImage} />

          {/* Warm Christmas Lighting */}
          <ambientLight intensity={0.4} color="#ffdcd6" />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffaa00" />
          <pointLight
            position={[-10, 10, -10]}
            intensity={0.5}
            color="#4444ff"
          />

          <CalendarBox onLockedDayClick={onLockedDayClick} />

          {/* Environment Reflection */}
          <Environment preset="forest" />

          {/* Shadows */}
          <ContactShadows
            position={[0, -16, 0]}
            opacity={0.7}
            scale={50}
            blur={2.5}
            far={10}
            resolution={256}
            color="#000000"
          />

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
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
