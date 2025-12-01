import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth-token");
  const { pathname } = request.nextUrl;

  // 공개 페이지: 로그인, 회원가입, 공유된 캘린더 뷰어
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.includes(pathname);
  const isSharedCalendarPath = pathname.startsWith("/users/");

  // 공유된 캘린더는 인증 없이 접근 가능
  if (isSharedCalendarPath) {
    return NextResponse.next();
  }

  // 로그인 및 회원가입 페이지
  if (isPublicPath) {
    // 이미 로그인한 사용자는 메인 페이지로 리다이렉트
    if (authToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 인증이 필요한 페이지
  if (!authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
