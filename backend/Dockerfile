# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制包文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 编译TypeScript
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -D -H -u 1001 -h /app -s /bin/sh -G nodejs -g nodejs nodejs

# 设置工作目录
WORKDIR /app

# 复制包文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 复制构建文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 创建必要的目录
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# 启动应用
CMD ["node", "dist/index.js"]
