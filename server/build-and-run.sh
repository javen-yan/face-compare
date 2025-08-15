#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始构建人脸识别服务Docker镜像...${NC}"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker未安装，请先安装Docker${NC}"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose未安装，请先安装Docker Compose${NC}"
    exit 1
fi

# 创建数据目录
mkdir -p data

# 构建镜像
echo -e "${YELLOW}📦 构建Docker镜像...${NC}"
docker-compose build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker镜像构建成功！${NC}"
else
    echo -e "${RED}❌ Docker镜像构建失败${NC}"
    exit 1
fi

# 启动服务
echo -e "${YELLOW}🚀 启动服务...${NC}"
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    echo -e "${GREEN}🌐 服务地址: http://localhost:3001${NC}"
    echo -e "${GREEN}📚 API文档: http://localhost:3001/docs${NC}"
    echo -e "${GREEN}💚 健康检查: http://localhost:3001/health${NC}"
    echo ""
    echo -e "${YELLOW}📋 查看服务状态: docker-compose ps${NC}"
    echo -e "${YELLOW}📋 查看服务日志: docker-compose logs -f${NC}"
    echo -e "${YELLOW}📋 停止服务: docker-compose down${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    exit 1
fi 