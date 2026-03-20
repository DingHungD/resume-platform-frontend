import apiClient from './apiClient';

export const resumeService = {
  // 獲取履歷列表
  listResumes: () => apiClient.get('/resume/'),
  
  // 上傳履歷
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 獲取特定履歷細節 (Metadata)
  getResumeDetail: (id: string) => apiClient.get(`/resume/${id}`),
};