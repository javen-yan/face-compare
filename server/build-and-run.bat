@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 开始构建人脸识别服务Docker镜像...

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker未安装，请先安装Docker
    pause
    exit /b 1
)

REM 检查Docker Compose是否安装
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose未安装，请先安装Docker Compose
    pause
    exit /b 1
)

REM 创建数据目录
if not exist "data" mkdir data

REM 构建镜像
echo 📦 构建Docker镜像...
docker-compose build

if errorlevel 1 (
    echo ❌ Docker镜像构建失败
    pause
    exit /b 1
) else (
    echo ✅ Docker镜像构建成功！
)

REM 启动服务
echo 🚀 启动服务...
docker-compose up -d

if errorlevel 1 (
    echo ❌ 服务启动失败
    pause
    exit /b 1
) else (
    echo ✅ 服务启动成功！
    echo 🌐 服务地址: http://localhost:3001
    echo 📚 API文档: http://localhost:3001/docs
    echo 💚 健康检查: http://localhost:3001/health
    echo.
    echo 📋 查看服务状态: docker-compose ps
    echo 📋 查看服务日志: docker-compose logs -f
    echo 📋 停止服务: docker-compose down
)

pause 