#!/bin/bash

# 构建和部署脚本
echo "🚀 开始构建 Drawing Place Docker 镜像..."

# 检查是否存在 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，请先从 .env.example 复制并配置环境变量"
    echo "cp .env.example .env"
    echo "然后编辑 .env 文件配置您的 Casdoor 设置"
    exit 1
fi

# 构建镜像
echo "📦 构建 Docker 镜像..."
docker build -t drawing-place:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功！"
    echo ""
    echo "🎯 使用方法："
    echo "1. 单独运行应用："
    echo "   docker run -p 3000:3000 --env-file .env drawing-place:latest"
    echo ""
    echo "2. 使用 docker-compose（包含 MongoDB）："
    echo "   docker-compose up -d"
    echo ""
    echo "3. 查看运行状态："
    echo "   docker-compose ps"
    echo ""
    echo "4. 查看日志："
    echo "   docker-compose logs -f"
    echo ""
    echo "5. 停止服务："
    echo "   docker-compose down"
else
    echo "❌ Docker 镜像构建失败！"
    exit 1
fi