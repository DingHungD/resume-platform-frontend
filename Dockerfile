# 階段 1: 編譯
FROM node:18-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_BASE_URL

# 複製設定檔
COPY package*.json ./
# 如果你有 tsconfig.json 也一起複製
COPY tsconfig.json* ./
COPY next.config.js* ./

RUN npm install

# 複製所有原始碼 (包含 public, src 等)
COPY . .

# 注入環境變數
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_WS_BASE_URL=$NEXT_PUBLIC_WS_BASE_URL

RUN npm run build

# 階段 2: 執行 (使用最保險的搬運方式)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# 搬運 node_modules 與編譯後的檔案
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

COPY --from=builder /app/public* ./public/
COPY --from=builder /app/next.config.js* ./

EXPOSE 3000

# 啟動命令
CMD ["npm", "start"]