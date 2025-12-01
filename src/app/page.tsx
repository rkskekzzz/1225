"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Scene from "@/components/3d/Scene";
import CreationForm from "@/components/ui/CreationForm";
import DayModal from "@/components/ui/DayModal";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check");
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        setUsername(data.username || "");
      } else {
        router.push("/login");
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  if (isLoading) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* Logout Button */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <span className="text-white/80 text-sm font-medium">
          {username}님 환영합니다
        </span>
        <button
          onClick={handleLogout}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 transition-all text-sm font-medium"
        >
          로그아웃
        </button>
      </div>

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>

      {/* UI Layer */}
      <CreationForm />

      {/* Modal Layer */}
      <DayModal />
    </main>
  );
}
