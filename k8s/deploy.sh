#!/bin/bash

# Drawing Place Kubernetes 部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
NAMESPACE="drawing-place"
IMAGE_NAME="ghcr.io/hezebang/drawingplace:latest"

echo -e "${GREEN}🚀 Drawing Place Kubernetes 部署脚本${NC}"
echo "=================================="

# 检查 kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl 未安装或不在 PATH 中${NC}"
    exit 1
fi

# 检查集群连接
echo -e "${YELLOW}🔍 检查 Kubernetes 集群连接...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ 无法连接到 Kubernetes 集群${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 集群连接正常${NC}"

# 检查配置文件
if [ ! -f "k8s/deployment.yaml" ]; then
    echo -e "${RED}❌ 找不到 k8s/deployment.yaml 文件${NC}"
    exit 1
fi

# 询问是否继续
echo -e "${YELLOW}📋 部署配置:${NC}"
echo "  命名空间: $NAMESPACE"
echo "  镜像: $IMAGE_NAME"
echo ""
read -p "是否继续部署？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️ 部署已取消${NC}"
    exit 0
fi

# 检查命名空间是否存在
echo -e "${YELLOW}🏗️ 检查命名空间...${NC}"
if kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${GREEN}✅ 命名空间 $NAMESPACE 已存在${NC}"
else
    echo -e "${YELLOW}📦 创建命名空间 $NAMESPACE...${NC}"
fi

# 应用配置
echo -e "${YELLOW}🚀 部署应用...${NC}"
kubectl apply -f k8s/deployment.yaml

# 等待部署完成
echo -e "${YELLOW}⏳ 等待部署完成...${NC}"
kubectl rollout status deployment/mongo -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/drawing-place -n $NAMESPACE --timeout=300s

# 检查 Pod 状态
echo -e "${YELLOW}🔍 检查 Pod 状态...${NC}"
kubectl get pods -n $NAMESPACE

# 获取服务信息
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo -e "${YELLOW}📊 服务信息:${NC}"
kubectl get svc -n $NAMESPACE
echo ""
echo -e "${YELLOW}🌐 Ingress 信息:${NC}"
kubectl get ingress -n $NAMESPACE

# 显示访问信息
INGRESS_HOST=$(kubectl get ingress drawing-place-ingress -n $NAMESPACE -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "未配置")
if [ "$INGRESS_HOST" != "未配置" ] && [ "$INGRESS_HOST" != "drawing-place.yourdomain.com" ]; then
    echo ""
    echo -e "${GREEN}🎉 应用访问地址: http://$INGRESS_HOST${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️ 请配置 Ingress 域名后访问应用${NC}"
fi

echo ""
echo -e "${YELLOW}📝 有用的命令:${NC}"
echo "  查看日志: kubectl logs -f deployment/drawing-place -n $NAMESPACE"
echo "  查看状态: kubectl get all -n $NAMESPACE"
echo "  删除部署: kubectl delete namespace $NAMESPACE"