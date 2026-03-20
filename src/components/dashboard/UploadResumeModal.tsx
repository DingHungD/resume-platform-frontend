'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { resumeService } from '@/services/resumeService';
import Modal from '../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sessionId?: string) => void;
  sessionId?: string; 
}

export default function UploadResumeModal({ isOpen, onClose, onSuccess, sessionId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // 支援 PDF, DOCX, TXT (對齊後端 ALLOWED_EXTENSIONS)
      const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/plain'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('目前支援 PDF, DOCX 或 TXT 格式');
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    try {
      const response = await resumeService.uploadResume(file, sessionId);
      
      // 取得後端回傳的 session_id (對齊後端 ResumeRead Schema)
      const newSessionId = response.data.session_id;

      setStatus('success');
      
      // 延遲執行，讓使用者看清成功狀態
      setTimeout(() => {
        // 1. 通知 Sidebar 重新抓取 Session 列表
        window.dispatchEvent(new Event('refresh-sessions'));
        
        // 2. 執行頁面回呼 (可能是 Dashboard 刷新列表或跳轉)
        onSuccess(newSessionId);
        
        // 3. 關閉並重置
        onClose();
        setFile(null);
        setStatus('idle');
      }, 1500);
    } catch (error: any) {
      console.error("Upload error:", error);
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || '上傳失敗，請檢查網路或檔案格式');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="上傳新履歷">
      <div className="space-y-6">
        {/* 檔案拖放/選擇區 */}
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
            file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={status === 'uploading'}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            {file ? (
              <>
                <div className="p-3 bg-blue-100 rounded-full mb-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <div className="p-3 bg-gray-50 rounded-full mb-3">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-800">點擊或拖入檔案</p>
                <p className="text-xs text-gray-400 mt-1 text-balance">支援 PDF, DOCX, TXT (最大 10MB)</p>
              </>
            )}
          </div>
        </div>

        {/* 狀態顯示與按鈕 */}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
            <AlertCircle size={16} className="shrink-0" /> 
            <span className="break-words">{errorMessage}</span>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || status === 'uploading' || status === 'success'}
          className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
            status === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none'
          }`}
        >
          {status === 'uploading' ? (
            <><Loader2 className="animate-spin" size={20} /> 解析中...</>
          ) : status === 'success' ? (
            <><CheckCircle2 size={20} /> 完成，即將跳轉</>
          ) : (
            '開始 AI 分析'
          )}
        </button>
      </div>
    </Modal>
  );
}