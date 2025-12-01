"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { CalendarBox } from "./CalendarBox";
import { Suspense, useEffect } from "react";
import { useCalendarStore } from "@/store";

interface PreviewSceneProps {
  mainImage: string | null;
  doorShape?: "square" | "circle";
}

function PreviewContent() {
  return (
    <>
      {/* Warm Christmas Lighting */}
      <ambientLight intensity={0.5} color="#ffdcd6" />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffaa00" />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4444ff" />

      <CalendarBox />

      {/* Environment Reflection */}
      <Environment preset="forest" />

      {/* Subtle Shadows */}
      <ContactShadows
        position={[0, -16, 0]}
        opacity={0.4}
        scale={50}
        blur={2.5}
        far={10}
        resolution={256}
        color="#000000"
      />
    </>
  );
}

export default function PreviewScene({
  mainImage,
  doorShape = "square",
}: PreviewSceneProps) {
  const { setMainImage, setDoorShape, setBackgroundImage } = useCalendarStore();

  useEffect(() => {
    if (mainImage) {
      setMainImage(mainImage);
    }
    setDoorShape(doorShape);
    setBackgroundImage(null);
  }, [mainImage, doorShape, setMainImage, setDoorShape, setBackgroundImage]);

  return (
    <div className="w-full h-full" style={{ touchAction: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 55], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <PreviewContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
