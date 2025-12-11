# 使用官方 Node.js 20 LTS 镜像作为基础镜像
FROM node:20-alpine AS base

# 安装依赖（仅在需要时）
FROM base AS deps
# 检查 https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine 以了解为什么可能需要 libc6-compat
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装依赖
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# 重建源代码
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用程序
RUN corepack enable pnpm && pnpm build

# 生产镜像，复制所有文件并运行自定义服务器
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户以运行应用程序
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建输出和依赖
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 复制自定义服务器相关文件
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/models ./models
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tsconfig.server.json ./

# 设置正确的文件权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 运行自定义服务器
CMD ["node_modules/.bin/ts-node", "--project", "tsconfig.server.json", "server.ts"]