# Resume RAG UI (Frontend)

## 📌 項目概述
本專案是 **AI-Powered Resume RAG Platform** 的前端使用者介面。採用現代化的 **Next.js 14 App Router** 架構開發，旨在提供流暢、直覺且具備即時互動感的履歷分析體驗。

* **核心技術棧**: Next.js 14 (App Router) / TypeScript / Tailwind CSS / Axios
* **關鍵功能**: 
    * **即時 AI 對話 (WebSocket)**: 整合實時串流技術，讓 AI 分析結果能逐字呈現，提升使用者體感。
    * **響應式管理後台**: 提供直覺的履歷上傳與管理清單，並透過 **Tailwind CSS** 確保跨裝置的良好兼容性。
    * **Markdown 解析渲染**: 完美支援 AI 輸出的複雜技術文件格式，包含程式碼區塊、標題與條列清單。
    * **安全路由保護**: 實作客戶端與伺服器端（Middleware）的雙重身份驗證檢查，確保數據安全。

## 🛠️ 環境要求
開發與運行前請確保已安裝：
* **Node.js**: 18.x 或以上版本。
* **npm** 或 **yarn**: 用於套件管理。
* **Docker**: 用於容器化部署與環境模擬。

## 🏗️ 技術架構亮點

### 1. **環境變數固化 (Build-time Injection)**
為了配合 Docker 容器化部署，本專案實作了特殊的編譯時注入機制。透過 Dockerfile 的 `ARG` 與 `ENV` 指令，將後端 API 網址與 WebSocket 位址在 `npm run build` 階段注入靜態檔案中，避免執行時的路徑錯誤。

### 2. **WebSocket 狀態管理**
對話系統採用原生 WebSocket API 結合 React Hooks。具備連線狀態監聽、錯誤自動斷開與 Token 注入驗證機制，確保連線穩定且安全。

### 3. **專業排版系統 (Typography)**
透過 @tailwindcss/typography 插件，為 AI 生成的 Markdown 內容提供「Prose」排版風格，自動處理標題層級、粗體強調與清單縮排，優化長文本的閱讀體驗。

## 📖 安裝與配置文檔
本前端服務通常與部署環境緊密結合，請參考以下文檔以獲得完整資訊：
- [全系統部署指南 (Deploy Repo)](https://github.com/DingHungD/resume-platform-deploy/blob/main/README.md)
- [Nginx 反向代理配置說明](https://github.com/DingHungD/resume-platform-deploy/blob/main/nginx/default.conf)

## ⚙️ 開發環境啟動 (Quick Start)

### 1. 安裝依賴
請查看Dockerfile


## 🔍 故障排除與開發提示
- **Markdown 未渲染**: 請檢查 tailwind.config.js 是否已正確匯入 typography 插件，並確認容器組件帶有 prose class。
- **WebSocket 401/403**: 請檢查瀏覽器 localStorage 是否存有有效的 token。本系統會自動在 WS 連線的 Query String 中附加該憑證。
- **跨域問題 (CORS)**: 若本地開發遇到連線問題，請檢查後端 FastAPI 的 CORSMiddleware 配置。

## 🔗 更多資源
- [Next.js 官方文檔](https://nextjs.org/docs)
- [Tailwind CSS 說明書](https://tailwindcss.com/docs)
- [React Markdown 文件](https://github.com/remarkjs/react-markdown)