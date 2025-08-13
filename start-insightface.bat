@echo off
chcp 65001 >nul
echo 🌟 启动 InsightFace 人脸识别系统...
echo ==================================

REM 检查 Python 环境
echo 📝 检查 Python 环境...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 找到 Python: 
    python --version
    set PYTHON_CMD=python
) else (
    python3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ 找到 Python3: 
        python3 --version
        set PYTHON_CMD=python3
    ) else (
        echo ❌ 未找到 Python 环境，请先安装 Python 3.7+
        pause
        exit /b 1
    )
)

REM 检查 Node.js 环境
echo 📝 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 找到 Node.js: 
    node --version
) else (
    echo ❌ 未找到 Node.js 环境，请先安装 Node.js 14+
    pause
    exit /b 1
)

REM 检查 npm
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 找到 npm: 
    npm --version
) else (
    echo ❌ 未找到 npm，请先安装 npm
    pause
    exit /b 1
)

echo.
echo 🚀 启动 InsightFace 后端服务...

REM 进入 InsightFace 服务器目录
cd insightface-server

REM 检查并安装依赖
if not exist "node_modules" (
    echo 📦 安装 Node.js 依赖...
    npm install
)

REM 检查 Python 依赖
echo 🔍 检查 InsightFace 依赖...
%PYTHON_CMD% -c "import insightface" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  InsightFace 未安装，正在安装...
    echo 📦 安装 Python 依赖...
    %PYTHON_CMD% -m pip install -r requirements.txt
    
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败，请手动运行: pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ InsightFace 已安装
)

REM 启动后端服务
echo 🚀 启动 InsightFace 后端服务...
echo 📡 服务将在 http://localhost:3001 启动
echo 💡 按 Ctrl+C 停止服务
echo.

npm start
pause 