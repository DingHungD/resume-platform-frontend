'use client';

import { useEffect, useState, useCallback } from 'react';
import { resumeService } from '@/services/resumeService';
import Link from 'next/link';
import { FileText, MessageSquare, Plus, Loader2, RefreshCw, Trash2, Hash } from 'lucide-react';
import UploadResumeModal from '@/components/dashboard/UploadResumeModal';
import apiClient from '@/services/apiClient';

interface Resume {
  id: string;
  file_name: string; // 修正：對應後端 Resume 模型欄位
  status: string;
  session_id: string; // 新增：用於導向正確對話
  created_at: string;
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchResumes = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await resumeService.listResumes();
      // 假設 response.data 直接回傳 Resume[] 陣列
      setResumes(response.data);
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  // 輪詢處理中的履歷
  useEffect(() => {
    const hasProcessing = resumes.some(r => r.status === 'processing');
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchResumes(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [resumes, fetchResumes]);

  const handleDelete = async (e: React.MouseEvent, id: string, filename: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`確定要刪除「${filename}」嗎？\n此動作將永久移除該履歷、AI 索引與所有對話紀錄。`)) {
      return;
    }

    setDeletingId(id);
    try {
      await apiClient.delete(`/resume/${id}`);
      setResumes(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      alert("刪除失敗，請稍後再試");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">載入履歷資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">履歷管理中心</h1>
          <p className="text-gray-500 mt-1">管理您的 AI 知識庫，對話將自動儲存於對應的 Session 中。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchResumes(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="手動重新整理">
            <RefreshCw size={20} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95">
            <Plus size={20} /> 上傳新履歷
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {resumes.map((resume) => (
          <div key={resume.id} className="group border border-gray-100 rounded-2xl p-6 bg-white shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative">
            
            <button 
              onClick={(e) => handleDelete(e, resume.id, resume.file_name)}
              disabled={deletingId === resume.id}
              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
            >
              {deletingId === resume.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            </button>

            <div className="flex items-start justify-between mb-5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                resume.status === 'completed' ? 'bg-green-100 text-green-700' : 
                resume.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700 animate-pulse'
              }`}>
                {resume.status === 'completed' ? 'Ready' : resume.status === 'failed' ? 'Error' : 'Parsing'}
              </span>
            </div>
            
            <h3 className="font-bold text-gray-800 truncate mb-1 text-lg pr-8" title={resume.file_name}>
              {resume.file_name}
            </h3>
            
            <div className="flex flex-col gap-1 mb-6">
              <p className="text-xs text-gray-400">
                上傳於 {new Date(resume.created_at).toLocaleString('zh-TW', { dateStyle: 'medium' })}
              </p>
              {/* 大改造需求：顯示所屬 Session */}
              <div className="flex items-center gap-1 text-[10px] text-blue-500 font-mono bg-blue-50 px-2 py-0.5 rounded w-fit">
                <Hash size={10} />
                <span>Session: {resume.session_id.slice(0, 8)}...</span>
              </div>
            </div>

            <Link 
              href={`/chat/${resume.session_id}`} 
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                resume.status === 'completed' 
                  ? 'bg-gray-900 text-white hover:bg-blue-600 active:scale-95' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              onClick={(e) => resume.status !== 'completed' && e.preventDefault()}
            >
              <MessageSquare size={18} /> 
              {resume.status === 'completed' ? '開始對話' : '解析中...'}
            </Link>
          </div>
        ))}

        {resumes.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
            <Plus className="text-gray-300 mx-auto mb-4" size={48} />
            <h3 className="text-gray-900 font-bold text-lg">尚未上傳任何履歷</h3>
            <p className="text-gray-500 mt-1">上傳 PDF 格式的履歷後，AI 將自動建立或關聯對話。</p>
          </div>
        )}
      </div>

      <UploadResumeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchResumes(false)} 
      />
    </div>
  );
}