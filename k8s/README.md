# Drawing Place Kubernetes 部署指南

## 📋 前置要求

- Kubernetes 集群（v1.19+）
- kubectl 命令行工具
- Nginx Ingress Controller（用于外部访问）
- 存储类（用于 MongoDB 持久化）

## 🚀 部署步骤

### 1. 配置 GitHub Container Registry 访问

创建 GitHub Personal Access Token，然后生成 Docker 配置：

```bash
# 生成 Docker 配置的 base64 编码
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --namespace=drawing-place \
  --dry-run=client -o yaml | grep '\.dockerconfigjson:' | awk '{print $2}'
```

将输出的 base64 字符串替换到 `deployment.yaml` 中的 `ghcr-secret` Secret。

### 2. 配置环境变量

编辑 `deployment.yaml` 中的 ConfigMap，替换以下值：

```yaml
data:
  CASDOOR_SERVER_URL: "https://your-casdoor-server.com"
  CASDOOR_CLIENT_ID: "your_actual_client_id"
  CASDOOR_CLIENT_SECRET: "your_actual_client_secret"
  CASDOOR_APP_NAME: "your_actual_app_name"
  CASDOOR_ORGANIZATION_NAME: "your_organization"
```

### 3. 配置域名

编辑 Ingress 配置中的域名：

```yaml
spec:
  rules:
  - host: drawing-place.yourdomain.com  # 替换为你的域名
```

### 4. 部署应用

```bash
# 应用所有配置
kubectl apply -f k8s/deployment.yaml

# 检查部署状态
kubectl get pods -n drawing-place

# 查看服务状态
kubectl get svc -n drawing-place

# 查看 Ingress 状态
kubectl get ingress -n drawing-place
```

## 🔧 管理命令

### 查看应用状态

```bash
# 查看所有资源
kubectl get all -n drawing-place

# 查看 Pod 日志
kubectl logs -f deployment/drawing-place -n drawing-place

# 查看 MongoDB 日志
kubectl logs -f deployment/mongo -n drawing-place
```

### 扩容/缩容

```bash
# 扩展应用副本数
kubectl scale deployment drawing-place --replicas=3 -n drawing-place

# 重启部署
kubectl rollout restart deployment/drawing-place -n drawing-place
```

### 更新镜像

```bash
# 使用特定版本
kubectl set image deployment/drawing-place \
  drawing-place=ghcr.io/hezebang/drawingplace:v1.0.0 \
  -n drawing-place

# 使用最新版本
kubectl set image deployment/drawing-place \
  drawing-place=ghcr.io/hezebang/drawingplace:latest \
  -n drawing-place
```

## 🗃️ 数据管理

### 备份 MongoDB

```bash
# 进入 MongoDB Pod
kubectl exec -it deployment/mongo -n drawing-place -- bash

# 在容器内执行备份
mongodump --host localhost --port 27017 --db place --out /tmp/backup

# 从容器复制备份文件
kubectl cp drawing-place/mongo-pod-name:/tmp/backup ./backup
```

### 恢复 MongoDB

```bash
# 复制备份文件到容器
kubectl cp ./backup drawing-place/mongo-pod-name:/tmp/backup

# 进入容器并恢复
kubectl exec -it deployment/mongo -n drawing-place -- bash
mongorestore --host localhost --port 27017 --db place /tmp/backup/place
```

## 🔒 安全配置

### 启用 TLS

1. 安装 cert-manager：
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

2. 创建 ClusterIssuer：
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

3. 在 Ingress 中启用 TLS：
```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - drawing-place.yourdomain.com
    secretName: drawing-place-tls
```

## 🔍 故障排除

### Pod 启动失败

```bash
# 查看 Pod 详情
kubectl describe pod -l app=drawing-place -n drawing-place

# 查看事件
kubectl get events -n drawing-place --sort-by='.lastTimestamp'
```

### 镜像拉取失败

```bash
# 验证 Secret 配置
kubectl get secret ghcr-secret -n drawing-place -o yaml

# 测试镜像拉取
kubectl run test-pod --image=ghcr.io/hezebang/drawingplace:latest \
  --image-pull-policy=Always -n drawing-place
```

### 网络问题

```bash
# 检查服务端点
kubectl get endpoints -n drawing-place

# 测试服务连通性
kubectl run debug --image=busybox --rm -it --restart=Never -n drawing-place \
  -- wget -qO- http://drawing-place-service/
```

## 📁 文件说明

- `deployment.yaml` - 完整的 Kubernetes 部署配置
  - Namespace: drawing-place
  - ConfigMap: 环境变量配置
  - Secret: GHCR 访问凭据
  - PVC: MongoDB 数据持久化
  - Deployments: 应用和 MongoDB 部署
  - Services: 内部服务暴露
  - Ingress: 外部访问配置