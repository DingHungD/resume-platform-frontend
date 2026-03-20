'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { chatService, ChatMessage } from '@/services/chatService';
import { Send, Loader2 } from 'lucide-react';
import MarkdownMessage from '@/components/ui/MarkdownMessage';

export default function ChatPage() {
  const { id: sessionId } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 初始載入歷史紀錄
  useEffect(() => {
    const loadData = async () => {
      try {
        const history = await chatService.getHistory(sessionId as string);
        setMessages(history);
      } catch (error) {
        console.error("無法載入歷史訊息", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadData();
  }, [sessionId]);

  // 2. 初始化 WebSocket (需帶上 Token)
  useEffect(() => {
    if (loadingHistory) return;

    const token = localStorage.getItem('token');
    // 注意：這裡的路徑要對應你 main.py 裡的 /api/v1/ws/chat/{id}
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/chat/${sessionId}?token=${token}`;
    
    console.log("正在連線至:", wsUrl); // 方便你偵錯
    const ws = new WebSocket(wsUrl);
    // const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/chat/${resumeId}?token=${token}`);
    
    ws.onmessage = (event) => {
      if (event.data === "[DONE]") return;
      
      // 這裡需要處理串流顯示邏輯 (簡化版)
      // 實務上建議使用一個 tempMessage 來處理打字機效果
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

  // 自動捲動到底部
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    
    // 先把使用者的話加進畫面
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    
    // 透過 WS 發送
    socketRef.current.send(JSON.stringify({ message: input }));
    setInput('');
  };

  if (loadingHistory) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /> 載入對話中...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100-64px)] max-w-4xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border text-gray-800'
            }`}>
              {msg.role === 'assistant' ? (
                <MarkdownMessage content={msg.content} />
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2 p-4 bg-white border rounded-2xl shadow-sm">
        <input 
          className="flex-1 outline-none text-gray-700"
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
  );
}