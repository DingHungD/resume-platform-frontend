'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import apiClient from '@/services/apiClient';
import { 
  MessageSquare, 
  LayoutDashboard, 
  PlusCircle, 
  Loader2, 
  Clock,
  ChevronRight
} from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export default function Sidebar() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // 獲取所有會話列表
  const fetchSessions = async () => {
    try {
      const response = await apiClient.get('/resume/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    
    // 監聽自定義事件：當 Dashboard 上傳成功時重新整理列表
    window.addEventListener('refresh-sessions', fetchSessions);
    return () => window.removeEventListener('refresh-sessions', fetchSessions);
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo 區域 */}
      <div className="p-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Resume RAG AI
        </h1>
      </div>

      {/* 固定選單：儀表板 */}
      <nav className="px-4 mb-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            pathname === '/dashboard'
              ? 'bg-blue-50 text-blue-600 shadow-sm'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard size={18} />
          儀表板首頁
        </Link>
      </nav>

      {/* 會話列表標題 */}
      <div className="px-8 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between items-center">
        <span>最近的對話</span>
        <Clock size={12} />
      </div>

      {/* 動態會話列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gray-300" size={20} />
          </div>
        ) : sessions.length > 0 ? (
          sessions.map((session) => {
            const isActive = pathname === `/chat/${session.id}`;
            return (
              <Link
                key={session.id}
                href={`/chat/${session.id}`}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <MessageSquare size={16} className={isActive ? 'text-blue-400' : 'text-gray-400'} />
                  <span className="truncate">{session.title || '未命名對話'}</span>
                </div>
                <ChevronRight 
                  size={14} 
                  className={`transition-transform ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} 
                />
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-gray-400">尚無歷史對話</p>
          </div>
        )}
      </div>

      {/* 底部輔助區 */}
      <div className="p-4 border-t border-gray-50">
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">儲存空間</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <p className="text-[10px] text-gray-500 text-right">已使用 4.5 / 10 GB</p>
        </div>
      </div>
    </aside>
  );
}