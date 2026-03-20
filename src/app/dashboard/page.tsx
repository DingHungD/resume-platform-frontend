'use client';

import { useEffect, useState, useCallback } from 'react';
import { resumeService } from '@/services/resumeService';
import Link from 'next/link';
import { 
  FileText, 
  MessageSquare, 
  Plus, 
  Loader2, 
  RefreshCw, 
  Trash2, 
  Hash, 
  Globe,
  Lock
} from 'lucide-react';
import UploadResumeModal from '@/components/dashboard/UploadResumeModal';
import apiClient from '@/services/apiClient';

interface Resume {
  id: string;
  file_name: string;
  status: string;
  session_id: string; 
  created_at: string;
  is_public: boolean; // 新增：分享狀態
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
    if (!confirm(`確定要刪除「${filename}」嗎？\n此動作將永久移除該履歷、AI 索引與所有對話紀錄。`)) return;

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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">履歷管理中心</h1>
          <p className="text-gray-500 mt-1 italic">管理 AI 知識庫與 Session 分享狀態。</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchResumes(true)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100">
            <RefreshCw size={20} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
            <Plus size={20} /> 上傳新履歷
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {resumes.map((resume) => (
          <div key={resume.id} className="group border border-gray-100 rounded-3xl p-6 bg-white shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative overflow-hidden">
            
            <button
              onClick={(e) => handleDelete(e, resume.id, resume.file_name)}
              disabled={deletingId === resume.id}
              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10"
            >
              {deletingId === resume.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            </button>

            <div className="flex items-start justify-between mb-5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-105 transition-transform">
                <FileText size={28} />
              </div>
              
              {/* 分享狀態標籤：讓管理一眼即知 */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                resume.is_public ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'
              }`}>
                {resume.is_public ? <Globe size={10} /> : <Lock size={10} />}
                {resume.is_public ? 'Public' : 'Private'}
              </div>
            </div>
            
            <h3 className="font-bold text-gray-800 truncate mb-1 text-lg pr-6" title={resume.file_name}>
              {resume.file_name}
            </h3>
            
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-xs text-gray-400">上傳於 {new Date(resume.created_at).toLocaleDateString()}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-blue-500 font-mono bg-blue-50/50 border border-blue-100 px-2 py-1 rounded-lg w-fit">
                <Hash size={10} />
                <span>Session: {resume.session_id ? resume.session_id.slice(0, 8) : '未分配'}</span>
              </div>
            </div>

            <Link
              href={`/chat/${resume.session_id}`}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all ${
                resume.status === 'completed' && resume.session_id
                  ? 'bg-gray-900 text-white hover:bg-blue-600 active:scale-95 shadow-md shadow-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              onClick={(e) => (resume.status !== 'completed' || !resume.session_id) && e.preventDefault()}
            >
              <MessageSquare size={18} />
              {resume.status === 'completed' ? '進入對話室' : '處理中...'}
            </Link>
          </div>
        ))}
      </div>

      <UploadResumeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => fetchResumes(false)} />
    </div>
  );
}