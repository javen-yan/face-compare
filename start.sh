#!/bin/bash

echo "🚀 启动 FaceCompare 人脸对比系统..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 和 npm 已安装"

# 安装主项目依赖
echo "📦 安装主项目依赖..."
npm install

# 安装模拟服务器依赖
echo "📦 安装模拟服务器依赖..."
cd mock-server
npm install
cd ..

echo ""
echo "🎉 依赖安装完成！"
echo ""
echo "📋 接下来您可以："
echo "1. 启动模拟 API 服务器: cd mock-server && npm start"
echo "2. 启动前端开发服务器: npm run dev"
echo "3. 在浏览器中访问: http://localhost:3000"
echo ""
echo "🔧 配置说明："
echo "- 修改 src/App.tsx 中的 API 地址为: http://localhost:3001/api"
echo "- 修改认证令牌为任意值（模拟服务器不验证）"
echo ""
echo "💡 提示：建议先启动模拟服务器，再启动前端应用"
