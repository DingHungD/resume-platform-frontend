import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 從 Cookie 中獲取 token
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. 如果要去保護頁面 (dashboard, chat) 但沒有 token -> 強制跳轉登入
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/chat'))) {
    const url = new URL('/login', request.url);
    // 紀錄原本想去的頁面，登入後可以跳回來
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // 2. 如果已經有 token 但要去登入頁 -> 直接跳轉儀表板
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// 設定 Middleware 作用的路徑範圍
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/login',
  ],
};