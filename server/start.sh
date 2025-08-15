#!/bin/bash

echo "🚀 启动 InsightFace FastAPI 人脸识别服务..."
echo "=========================================="

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

# 检查虚拟环境
if [ -d "venv" ]; then
    echo "✅ 找到虚拟环境，正在激活..."
    source venv/bin/activate
    echo "✅ 虚拟环境已激活: $(which python)"
else
    echo "⚠️  未找到虚拟环境，正在创建..."
    $PYTHON_CMD -m venv venv
    if [ $? -eq 0 ]; then
        echo "✅ 虚拟环境创建成功"
        source venv/bin/activate
        echo "✅ 虚拟环境已激活: $(which python)"
        
        # 升级 pip
        echo "📦 升级 pip..."
        pip install --upgrade pip
    else
        echo "❌ 虚拟环境创建失败"
        exit 1
    fi
fi

# 检查 InsightFace 依赖
echo "🔍 检查 InsightFace 依赖..."
python -c "import insightface" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  InsightFace 未安装，正在安装..."
    echo "📦 安装 Python 依赖..."
    pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple
    echo "✅ 依赖安装完成"
else
    echo "✅ InsightFace 已安装"
fi

# 启动服务
echo "🚀 启动 FastAPI 服务..."
echo "📡 服务将在 http://localhost:3001 启动"
echo "📚 API 文档: http://localhost:3001/docs"
echo "💚 健康检查: http://localhost:3001/health"
echo "💡 按 Ctrl+C 停止服务"
echo ""

python main.py 