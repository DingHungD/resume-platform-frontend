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
      
      // 額外檢查副檔名作為保險
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['pdf', 'docx', 'txt'];

      if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension || '')) {
        alert('目前支援 PDF, DOCX 或 TXT 格式');
        return;
      }
      
      // 限制 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('檔案大小不能超過 10MB');
        return;
      }

      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setErrorMessage('');

    try {
      // 調用 resumeService (內部已封裝 apiClient.post)
      const response = await resumeService.uploadResume(file, sessionId);
      
      // 取得後端回傳的 session_id
      // 根據 FastAPI 的慣例與 ResumeRead Schema，數據通常在 response 或 response.data 中
      const newSessionId = response.session_id || response.data?.session_id;

      setStatus('success');
      
      // 延遲執行，讓使用者看清成功狀態並給予後端資料庫一點同步時間
      setTimeout(() => {
        // 1. 通知 Sidebar 或其他組件重新抓取 Session 列表 (如果有的話)
        window.dispatchEvent(new Event('refresh-sessions'));
        
        // 2. 執行頁面回呼 (Dashboard 會執行 fetchResumes)
        onSuccess(newSessionId);
        
        // 3. 關閉並重置狀態
        handleClose();
      }, 1500);

    } catch (error: any) {
      console.error("Upload error detail:", error);
      
      // 容錯邏輯：如果後端其實回傳了 201 Created (代表成功)，但被判斷為錯誤
      if (error.status === 201 || error.response?.status === 201) {
        setStatus('success');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
        return;
      }

      setStatus('error');
      setErrorMessage(
        error.response?.data?.detail || 
        error.message || 
        '上傳失敗，請檢查網路或檔案格式'
      );
    }
  };

  // 封裝重置邏輯
  const handleClose = () => {
    onClose();
    // 延遲重置，避免關閉動畫中看到內容閃現
    setTimeout(() => {
      setFile(null);
      setStatus('idle');
      setErrorMessage('');
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="上傳新履歷">
      <div className="space-y-6">
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
            file 
              ? 'border-blue-400 bg-blue-50/50' 
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={status === 'uploading' || status === 'success'}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            {file ? (
              <>
                <div className="p-4 bg-blue-100 rounded-2xl mb-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <div className="p-4 bg-gray-50 rounded-2xl mb-3">
                  <Upload className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-600">點擊或拖入檔案</p>
                <p className="text-[10px] text-gray-400 mt-1">支援 PDF, DOCX, TXT (最大 10MB)</p>
              </>
            )}
          </div>
        </div>

        {status === 'error' && (
          <div className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-xl text-xs border border-red-100 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || status === 'uploading' || status === 'success'}
          className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-sm ${
            status === 'success' 
              ? 'bg-green-600 text-white cursor-default' 
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none'
          }`}
        >
          {status === 'uploading' ? (
            <><Loader2 className="animate-spin" size={20} /> AI 正在分析履歷...</>
          ) : status === 'success' ? (
            <><CheckCircle2 size={20} /> 分析成功</>
          ) : (
            '開始 AI 分析'
          )}
        </button>
      </div>
    </Modal>
  );
}