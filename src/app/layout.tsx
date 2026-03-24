'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, Settings } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * 🛠️ 邏輯修正：定義哪些頁面不應該出現管理後台 UI (Nav & Sidebar)
   * 1. 登入頁 (/login)
   * 2. 分享頁面 (/share/[token])
   */
  const isLoginPage = pathname === '/login';
  const isSharePage = pathname.startsWith('/share/');
  
  // 綜合判斷：是否為隱藏後台 UI 的「公開頁面」
  const hideAdminUI = isLoginPage || isSharePage;

  const handleLogout = () => {
    // 1. 清除 localStorage
    localStorage.removeItem('token');
    
    // 2. 清除 Cookie (設定過期日期為過去)
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // 3. 跳轉並刷新
    router.push('/login');
    router.refresh();
  };

  return (
    <html lang="zh-TW">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        {/* 頂部導覽列：僅在非公開頁面顯示 */}
        {!hideAdminUI && (
          <nav className="bg-white border-b sticky top-0 z-50 h-16 flex-shrink-0">
            <div className="container mx-auto px-6 h-full flex items-center justify-between">
              <Link href="/dashboard" className="font-bold text-xl text-blue-600">
                Resume RAG
              </Link>
              
              <div className="flex items-center gap-8">
                <div className="flex gap-6 text-sm font-medium text-gray-600">
                  <Link 
                    href="/dashboard" 
                    className={`flex items-center gap-1 hover:text-blue-600 transition ${pathname === '/dashboard' ? 'text-blue-600' : ''}`}
                  >
                    <LayoutDashboard size={16} /> 儀表板
                  </Link>
                  <Link 
                    href="/settings" 
                    className={`flex items-center gap-1 hover:text-blue-600 transition ${pathname === '/settings' ? 'text-blue-600' : ''}`}
                  >
                    <Settings size={16} /> 系統設定
                  </Link>
                </div>

                <div className="h-6 w-[1px] bg-gray-200"></div>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-semibold transition-colors"
                >
                  <LogOut size={18} />
                  登出
                </button>
              </div>
            </div>
          </nav>
        )}

        {/* 主要內容區域：左側選單 + 右側內容 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 側邊欄：僅在非公開頁面顯示 */}
          {!hideAdminUI && <Sidebar />} 
          
          <main className="flex-1 overflow-y-auto relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}