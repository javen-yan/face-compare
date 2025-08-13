#!/bin/bash

echo "🌟 启动 InsightFace 人脸识别系统..."
echo "=================================="

# 检查 Python 环境
echo "📝 检查 Python 环境..."
if command -v python3 &> /dev/null; then
    echo "✅ 找到 Python3: $(python3 --version)"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    echo "✅ 找到 Python: $(python --version)"
    PYTHON_CMD="python"
else
    echo "❌ 未找到 Python 环境，请先安装 Python 3.7+"
    exit 1
fi

# 检查 Node.js 环境
echo "📝 检查 Node.js 环境..."
if command -v node &> /dev/null; then
    echo "✅ 找到 Node.js: $(node --version)"
else
    echo "❌ 未找到 Node.js 环境，请先安装 Node.js 14+"
    exit 1
fi

# 检查 npm
if command -v npm &> /dev/null; then
    echo "✅ 找到 npm: $(npm --version)"
else
    echo "❌ 未找到 npm，请先安装 npm"
    exit 1
fi

echo ""
echo "🚀 启动 InsightFace 后端服务..."

# 进入 InsightFace 服务器目录
cd insightface-server

# 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装 Node.js 依赖..."
    npm install
fi

# 检查 Python 依赖
echo "🔍 检查 InsightFace 依赖..."
$PYTHON_CMD -c "import insightface" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  InsightFace 未安装，正在安装..."
    echo "📦 安装 Python 依赖..."
    pip3 install -r requirements.txt 2>/dev/null || pip install -r requirements.txt 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败，请手动运行: pip install -r requirements.txt"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ InsightFace 已安装"
fi

# 启动后端服务
echo "🚀 启动 InsightFace 后端服务..."
echo "📡 服务将在 http://localhost:3001 启动"
echo "💡 按 Ctrl+C 停止服务"
echo ""

npm start 