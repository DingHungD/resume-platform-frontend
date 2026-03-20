// src/components/dashboard/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { resumeService } from '@/services/resumeService';

export default function Sidebar() {
  const [sessions, setSessions] = useState<any[]>([]);
  const router = useRouter();
  const params = useParams();
  const currentId = params.id;

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await resumeService.getSessions();
        setSessions(data);
      } catch (error) {
        console.error("Failed to fetch sessions", error);
      }
    };
    fetchSessions();
  }, [currentId]); // 當路徑改變時重新整理列表（例如上傳新檔案後）

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
        >
          + New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => router.push(`/chat/${session.id}`)}
            className={`p-3 rounded cursor-pointer transition flex items-center space-x-2 ${
              currentId === session.id ? 'bg-gray-700 border-l-4 border-blue-500' : 'hover:bg-gray-800'
            }`}
          >
            <span className="truncate text-sm">{session.title || 'Untitled Chat'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}