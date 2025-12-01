import { cookies } from "next/headers";
import { supabase } from "./supabase";

export interface AuthUser {
  id: string;
  username: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");

    if (!authToken) {
      return null;
    }

    // auth-token에서 username 추출
    const username = Buffer.from(authToken.value, "base64").toString("utf-8");

    // Supabase에서 사용자 정보 조회
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", username)
      .single();

    if (error || !user) {
      // 로컬 테스트 계정인 경우 임시 ID 반환
      if (username === "admin" || username === "test") {
        return {
          id: `local-${username}`,
          username,
        };
      }
      return null;
    }

    return {
      id: user.id,
      username: user.username,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}
