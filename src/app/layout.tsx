'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, Settings } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // 判斷是否在登入頁面，如果是，隱藏導覽列
  const isLoginPage = pathname === '/login';

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
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {!isLoginPage && (
          <nav className="bg-white border-b sticky top-0 z-50">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
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
        <main>{children}</main>
      </body>
    </html>
  );
}