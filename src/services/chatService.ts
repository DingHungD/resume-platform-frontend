import apiClient from './apiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const chatService = {
  // 獲取特定履歷的歷史對話
  getHistory: async (resumeId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/chat/${resumeId}/history`);
    return response.data;
  }
};