import axios from 'axios';

const apiClient = axios.create({
  // 確保使用環境變數，或正確指向 Docker Nginx 反向代理地址
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost/api/v1',
  // 注意：不要在這裡硬編碼 Content-Type，讓 Axios 根據 data 類型自動判定
});

// 輔助函式：從 Cookie 獲取 Token (用於預防 LocalStorage 與 Cookie 不同步)
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

// --- 請求攔截器 ---
apiClient.interceptors.request.use(
  (config) => {
    // 1. 處理 Token
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      token = getCookie('token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. 自動處理 Content-Type (如果是上傳檔案，移除 JSON 預設)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- 回應攔截器 ---
apiClient.interceptors.response.use(
  (response) => {
    // Axios 預設 200-299 狀態碼都會進入這裡
    // 包含我們後端回傳的 201 Created
    return response;
  },
  (error) => {
    // 處理伺服器回傳的錯誤
    const status = error.response?.status;

    if (status === 401) {
      // 只有在瀏覽器環境下執行跳轉
      if (typeof window !== 'undefined') {
        // 檢查是否已經在登入頁，避免無限循環
        if (window.location.pathname === '/login') {
          return Promise.reject(error);
        }

        console.warn("認證失效，正在清理狀態並重新導向...");
        
        // 1. 清除認證資訊
        localStorage.removeItem('token');
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        
        // 2. 導向登入頁 (使用 replace 避免使用者按返回鍵回到失效頁面)
        window.location.replace('/login');
      }
    }

    // 針對 422 錯誤（Schema 不匹配）在控制台輸出詳細資訊，方便開發者除錯
    if (status === 422) {
      console.error("API 422 錯誤 (資料格式不符):", error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default apiClient;