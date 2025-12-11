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

### 新的动态配置系统

从 v2.0 开始，应用使用运行时动态配置，无需重新构建即可更改配置。

编辑 `.env` 文件：

```env
# === 构建时环境变量 ===
# 这些变量在 docker-compose 中被传递给容器
CASDOOR_SERVER_URL=https://auth.geekpie.club
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
CASDOOR_APP_NAME=your_app_name
CASDOOR_ORGANIZATION_NAME=your_organization
MONGO_URI=mongodb://localhost:27017/place
DRAW_DELAY_MS=5000

# === 运行时环境变量 ===
# 服务器端 MongoDB 连接
MONGO_URI=mongodb://mongo:27017/place
```

### 配置说明

- ***** - 构建时传递给 Docker 容器的变量
- **CASDOOR_*** - 运行时从上面变量自动转换
- **MONGO_URI** - 服务器端数据库连接
- **配置加载** - 应用启动时从 `/api/config` 动态加载

### 优势

✅ **无需重新构建** - 更改配置后只需重启容器  
✅ **环境隔离** - 不同环境使用不同配置  
✅ **安全性** - 敏感信息不会被打包进镜像  
✅ **类型安全** - 完整的 TypeScript 类型支持

## 🐳 可用的镜像标签

- `ghcr.io/hezebang/drawingplace:latest` - 最新的 main 分支构建
- `ghcr.io/hezebang/drawingplace:v1.0.0` - 特定版本标签
- `ghcr.io/hezebang/drawingplace:main` - main 分支的最新构建

## 🛠️ 管理命令

### 本地开发

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f drawing-place

# 停止服务
docker-compose down

# 重启服务（保持配置更改）
docker-compose restart

# 更改配置后重启
# 1. 编辑 .env 文件
# 2. 重启容器（无需重新构建）
docker-compose restart drawing-place
```

### 生产部署

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

### 动态配置更新

```bash
# 更改运行时配置（无需重建镜像）
# 1. 更新环境变量
export CASDOOR_SERVER_URL=https://new-auth.example.com
export CASDOOR_CLIENT_ID=new_client_id

# 2. 重启容器
docker-compose restart drawing-place

# 或者直接设置并重启
CASDOOR_SERVER_URL=https://new-auth.example.com \
docker-compose up -d
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

## 🔄 动态配置系统详解

### 配置加载流程

1. **应用启动** → Docker 容器从环境变量读取配置
2. **客户端请求** → 访问 `/api/config` 获取运行时配置
3. **动态应用** → 客户端组件使用最新配置，无需重新构建

### 配置 API

```bash
# 获取当前运行配置
curl http://localhost:3000/api/config

# 返回示例
{
  "CASDOOR_SERVER_URL": "https://auth.geekpie.club",
  "CASDOOR_CLIENT_ID": "your_client_id",
  "CASDOOR_APP_NAME": "paintboard",
  "MONGO_URI_CLIENT": "mongodb://mongo:27017/place",
  "DRAW_DELAY_MS": 5000
}
```

### 配置优先级

1. **环境变量** (`CASDOOR_*`) - 最高优先级
2. **回退变量** (`*`) - 中等优先级  
3. **默认值** - 最低优先级

### 热更新配置

```bash
# 方法1：环境变量 + 重启容器
CASDOOR_SERVER_URL=https://new-server.com docker-compose restart

# 方法2：更新 .env 文件 + 重启
echo "CASDOOR_SERVER_URL=https://new-server.com" >> .env
docker-compose restart drawing-place

# 方法3：K8s ConfigMap 更新
kubectl patch configmap drawing-place-config -p '{"data":{"CASDOOR_SERVER_URL":"https://new-server.com"}}'
kubectl rollout restart deployment/drawing-place
```

## 🔧 生产环境部署

### 使用外部 MongoDB

```env
# 服务器端连接
MONGO_URI=mongodb://your-mongo-host:27017/place
# 客户端连接（如果不同）
MONGO_URI=mongodb://your-mongo-host:27017/place
```

### 自定义端口

```env
PORT=8080
```

### 安全配置建议

```env
# 生产环境推荐配置
NODE_ENV=production

# 使用安全的 Casdoor 配置
CASDOOR_SERVER_URL=https://your-secure-auth-server.com
CASDOOR_CLIENT_SECRET=your_production_secret

# 数据库安全连接
MONGO_URI=mongodb://username:password@your-mongo-host:27017/place?authSource=admin&ssl=true
```

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
- `lib/runtime-config.ts` - 运行时配置管理
- `app/api/config/route.ts` - 配置 API 端点
- `components/RuntimeConfigProvider.tsx` - 配置上下文提供者

## 🔄 从旧版本迁移

### 从 v1.x 迁移到 v2.x（动态配置）

如果您正在使用旧版本的静态配置，请按以下步骤迁移：

1. **更新环境变量文件**：
```bash
# 备份旧配置
cp .env .env.backup

# 使用新的配置模板
cp .env.example .env
# 然后编辑 .env 文件填入您的实际配置
```

2. **无需修改代码**：新版本向后兼容，您的现有配置仍然有效

3. **验证迁移**：
```bash
# 重新启动服务
docker-compose down
docker-compose up -d

# 检查配置是否正确加载
curl http://localhost:3000/api/config
```

4. **享受新特性**：
   - ✅ 无需重建即可更改配置
   - ✅ 更好的环境隔离
   - ✅ 运行时配置热更新

### 配置映射对照表

| 旧配置（构建时） | 新配置（运行时） | 说明 |
|-----------------|-----------------|------|
| `CASDOOR_SERVER_URL` | `CASDOOR_SERVER_URL` | 认证服务器地址 |
| `CASDOOR_CLIENT_ID` | `CASDOOR_CLIENT_ID` | 客户端 ID |
| `CASDOOR_CLIENT_SECRET` | `CASDOOR_CLIENT_SECRET` | 客户端密钥 |
| `DRAW_DELAY_MS` | `DRAW_DELAY_MS` | 绘制延迟时间 |
| `MONGO_URI` | `MONGO_URI_CLIENT` | 客户端 MongoDB 连接 |

> **注意**: 旧的 `*` 变量仍然被支持，但建议迁移到新的动态配置系统。