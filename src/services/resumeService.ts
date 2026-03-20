import apiClient from './apiClient';

export const resumeService = {
  // 獲取履歷列表
  listResumes: () => apiClient.get('/resume/'),
  
  // 上傳履歷
  uploadResume: (file: File, sessionId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    // 如果有傳入 sessionId，就加進 FormData
    if (sessionId) {
      formData.append('session_id', sessionId);
    }
    const response = await apiClient.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 獲取特定履歷細節 (Metadata)
  getResumeDetail: (id: string) => apiClient.get(`/resume/${id}`),

  // 獲取 Sessions 的方法
  getSessions: async () => {
    const response = await apiClient.get('/resume/sessions');
    return response.data;
  },
  // 預留重新命名的接口
  updateSessionTitle: async (sessionId: string, title: string) => {
    const response = await apiClient.patch(`/resume/session/${sessionId}`, { title });
    return response.data;
  }
};