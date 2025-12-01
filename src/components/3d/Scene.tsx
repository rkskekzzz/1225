"use client";

import { Canvas } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  Sparkles,
  Stars,
  useTexture,
} from "@react-three/drei";
import { CalendarBox } from "./CalendarBox";
import { Suspense } from "react";
import { useCalendarStore } from "@/store";

const DEFAULT_BACKGROUND = "/image.jpeg";

// 3D 배경 평면 컴포넌트
function BackgroundPlane({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl);

  // 카메라 설정: FOV=50, maxZoom=80 (가장 멀리)
  // 카메라가 z=80일 때 화면을 꽉 채우려면:
  // visible height = 2 * Math.tan((FOV * Math.PI / 180) / 2) * distance
  // distance = 80 - (-30) = 110
  // visible height = 2 * Math.tan(25° * π/180) * 110 ≈ 102
  // 와이드 스크린(16:9)을 고려하여 width는 더 크게
  // visible width ≈ 102 * (16/9) ≈ 181
  // 여유를 두고 250x250으로 설정하여 모든 비율에서 커버
  const backgroundSize = 250;

  return (
    <mesh position={[0, 0, -30]}>
      <planeGeometry args={[backgroundSize, backgroundSize]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export default function Scene() {
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

          <CalendarBox />

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
