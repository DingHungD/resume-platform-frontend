'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { chatService, ChatMessage } from '@/services/chatService';
import { 
  Send, Loader2, ChevronLeft, Share2, Globe, Lock, Check, Link as LinkIcon 
} from 'lucide-react';
import MarkdownMessage from '@/components/ui/MarkdownMessage';
import apiClient from '@/services/apiClient';

export default function ChatPage() {
  const { id: sessionId } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // 分享狀態
  const [isPublic, setIsPublic] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 載入歷史紀錄與分享狀態
  useEffect(() => {
    const loadData = async () => {
      try {
        const [history, sessionData] = await Promise.all([
          chatService.getHistory(sessionId as string),
          apiClient.get(`/chat/sessions/${sessionId}`) // 需後端支援此 API 獲取單一 session 詳情
        ]);
        setMessages(history);
        setIsPublic(sessionData.data.is_public);
        setShareToken(sessionData.data.share_token);
      } catch (error) {
        console.error("無法載入對話資料", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadData();
  }, [sessionId]);

  // 2. WebSocket 初始化 (保持原有邏輯)
  useEffect(() => {
    if (loadingHistory) return;
    const token = localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/chat/${sessionId}?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      if (event.data === "[DONE]") return;
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          const updated = [...prev];
          updated[updated.length - 1].content += event.data;
          return updated;
        } else {
          return [...prev, { id: Date.now().toString(), role: 'assistant', content: event.data, created_at: new Date().toISOString() }];
        }
      });
    };
    socketRef.current = ws;
    return () => ws.close();
  }, [sessionId, loadingHistory]);

  // 3. 分享邏輯處理
  const handleToggleShare = async () => {
    setIsSharingLoading(true);
    try {
      const response = await apiClient.post(`/resume/sessions/${sessionId}/share`);
      setIsPublic(response.data.is_public);
      setShareToken(response.data.share_token);
    } catch (error) {
      alert("更新分享狀態失敗");
    } finally {
      setIsSharingLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    socketRef.current.send(JSON.stringify({ message: input }));
    setInput('');
  };

  if (loadingHistory) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 操作中心 Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="font-bold text-gray-800 text-sm md:text-base truncate max-w-[150px]">AI 履歷分析</h2>
          </div>
        </div>

        {/* 分享控制鈕組 */}
        <div className="flex items-center gap-2">
          {isPublic && (
            <button
              onClick={handleCopyLink}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-all"
            >
              {copied ? <Check size={14} /> : <LinkIcon size={14} />}
              {copied ? "已複製" : "複製連結"}
            </button>
          )}
          <button
            onClick={handleToggleShare}
            disabled={isSharingLoading}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all border shadow-sm ${
              isPublic ? 'bg-green-600 border-green-700 text-white hover:bg-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {isSharingLoading ? <Loader2 size={14} className="animate-spin" /> : isPublic ? <Globe size={14} /> : <Lock size={14} />}
            {isPublic ? "已開啟分享" : "開啟分享"}
          </button>
        </div>
      </header>

      {/* 訊息展示區 */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 md:p-6 max-w-4xl mx-auto w-full">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'
            }`}>
              {msg.role === 'assistant' ? <MarkdownMessage content={msg.content} /> : <div className="whitespace-pre-wrap text-sm">{msg.content}</div>}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* 輸入區塊 */}
      <div className="p-4 bg-white border-t">
        <div className="max-w-4xl mx-auto flex gap-2 p-2 bg-gray-50 border rounded-2xl">
          <input 
            className="flex-1 bg-transparent outline-none px-2 text-gray-700 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="詢問關於這份履歷的問題..."
          />
          <button onClick={sendMessage} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}