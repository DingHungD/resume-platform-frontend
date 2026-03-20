import apiClient from './apiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const chatService = {
  // 獲取特定會話的歷史對話
  getHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/resume/session/${sessionId}/history`);
    return response.data;
  }
};