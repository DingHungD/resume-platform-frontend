'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { MessageSquare, Send, Loader2, Share2, ShieldCheck } from 'lucide-react';
import apiClient from '@/services/apiClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function GuestChatPage() {
  const { token } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionTitle, setSessionTitle] = useState('載入中...');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 初始化獲取 Session 資訊與歷史訊息
  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const response = await apiClient.get(`/chat/share/${token}`);
        setSessionTitle(response.data.title);
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error("Failed to load shared session:", error);
        setSessionTitle("連結已失效或不存在");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionInfo();
  }, [token]);

  // 2. 建立訪客 WebSocket 連線
  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/chat_ws/guest/${token}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      if (event.data === '[DONE]') {
        setIsTyping(false);
        return;
      }

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + event.data }
          ];
        }
        return [...prev, { role: 'assistant', content: event.data }];
      });
    };

    return () => ws.current?.close();
  }, [token]);

  // 滾動置底
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !ws.current || isTyping) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    
    ws.current.send(JSON.stringify({ message: input }));
    setInput('');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Share2 size={20} />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">{sessionTitle}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <ShieldCheck size={12} /> 訪客模式：對話不留痕跡
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t">
        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="輸入訊息與 AI 討論履歷..."
            disabled={isTyping}
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="absolute right-2 top-1.5 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {isTyping ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          此對話由擁有者分享，您的對話內容在關閉分頁後將不會被儲存。
        </p>
      </footer>
    </div>
  );
}