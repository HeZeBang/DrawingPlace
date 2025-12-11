# Drawing Place - Docker 部署指南

## 📋 前置要求

- Docker
- Docker Compose

## 🚀 部署方式

### 方式 1: 使用 GitHub Container Registry (推荐)

直接使用已构建好的镜像：

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 编辑配置文件
nano .env

# 3. 使用预构建镜像启动
docker-compose -f docker-compose.prod.yml up -d
```

### 方式 2: 本地构建

```bash
# 1. 配置环境变量
cp .env.example .env
nano .env

# 2. 构建和启动
./build.sh
# 或者
docker-compose up --build -d
```

## 🔧 环境变量配置

编辑 `.env` 文件：

```env
# Casdoor 配置
NEXT_PUBLIC_CASDOOR_SERVER_URL=https://door.casdoor.com
NEXT_PUBLIC_CASDOOR_CLIENT_ID=your_client_id
NEXT_PUBLIC_CASDOOR_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_CASDOOR_APP_NAME=your_app_name
NEXT_PUBLIC_CASDOOR_ORGANIZATION_NAME=your_organization

# 应用配置
NEXT_PUBLIC_DRAW_DELAY_MS=5000
NEXT_PUBLIC_MONGO_URI=mongodb://mongo:27017/place

# 数据库配置
MONGO_URI=mongodb://mongo:27017/place
```

## 🐳 可用的镜像标签

- `ghcr.io/hezebang/drawingplace:latest` - 最新的 main 分支构建
- `ghcr.io/hezebang/drawingplace:v1.0.0` - 特定版本标签
- `ghcr.io/hezebang/drawingplace:main` - main 分支的最新构建

## 🛠️ 管理命令

```bash
# 查看运行状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 更新到最新镜像
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 🔄 CI/CD 流程

### 自动构建

每次推送到 main 分支时，GitHub Actions 会自动：
1. 构建 Docker 镜像
2. 推送到 GitHub Container Registry
3. 支持多架构 (amd64/arm64)

### 版本发布

当修改 `package.json` 中的版本号时：
1. 自动创建 Git 标签
2. 创建 GitHub Release
3. 构建对应版本的 Docker 镜像

## 🗃️ 数据持久化

MongoDB 数据存储在 Docker volume `mongo_data` 中，数据会持久保存。

## 🔧 生产环境部署

### 使用外部 MongoDB

```env
MONGO_URI=mongodb://your-mongo-host:27017/place
NEXT_PUBLIC_MONGO_URI=mongodb://your-mongo-host:27017/place
```

### 自定义端口

```env
PORT=8080
```

### 使用反向代理

推荐使用 Nginx 或 Traefik 作为反向代理：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 故障排除

### 拉取最新镜像失败

```bash
# 确保登录到 GHCR
docker login ghcr.io

# 手动拉取镜像
docker pull ghcr.io/hezebang/drawingplace:latest
```

### 查看详细日志

```bash
docker-compose -f docker-compose.prod.yml logs -f drawing-place
```

### 重置数据

```bash
# 停止服务并删除数据
docker-compose -f docker-compose.prod.yml down -v
```

## 📁 文件说明

- `docker-compose.yml` - 本地开发构建配置
- `docker-compose.prod.yml` - 生产环境配置（使用 GHCR 镜像）
- `.github/workflows/docker-publish.yml` - Docker 镜像构建和发布
- `.github/workflows/release.yml` - 自动版本发布