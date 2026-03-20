'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { resumeService } from '@/services/resumeService';
import Modal from '../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 上傳成功後刷新列表
}

export default function UploadResumeModal({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        alert('目前僅支援 PDF 格式');
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
      await resumeService.uploadResume(file);
      setStatus('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        setFile(null);
        setStatus('idle');
      }, 1500);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || '上傳失敗，請稍後再試');
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
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={status === 'uploading'}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            {file ? (
              <>
                <FileText className="h-12 w-12 text-blue-600 mb-2" />
                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-800">點擊或拖入 PDF 檔案</p>
                <p className="text-xs text-gray-500 mt-1">檔案大小建議不超過 10MB</p>
              </>
            )}
          </div>
        </div>

        {/* 狀態顯示與按鈕 */}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || status === 'uploading' || status === 'success'}
          className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
            status === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300'
          }`}
        >
          {status === 'uploading' ? (
            <><Loader2 className="animate-spin" size={20} /> 解析中...</>
          ) : status === 'success' ? (
            <><CheckCircle2 size={20} /> 完成，即將跳轉</>
          ) : (
            '開始分析履歷'
          )}
        </button>
      </div>
    </Modal>
  );
}