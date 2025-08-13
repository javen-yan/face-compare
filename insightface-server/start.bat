@echo off
chcp 65001 >nul
echo 🚀 启动 InsightFace FastAPI 人脸识别服务...
echo ==========================================

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

REM 检查虚拟环境
if exist "venv\Scripts\activate.bat" (
    echo ✅ 找到虚拟环境，正在激活...
    call venv\Scripts\activate.bat
    echo ✅ 虚拟环境已激活
) else (
    echo ⚠️  未找到虚拟环境，正在创建...
    %PYTHON_CMD% -m venv venv
    if %errorlevel% equ 0 (
        echo ✅ 虚拟环境创建成功
        call venv\Scripts\activate.bat
        echo ✅ 虚拟环境已激活
        
        REM 升级 pip
        echo 📦 升级 pip...
        python -m pip install --upgrade pip
    ) else (
        echo ❌ 虚拟环境创建失败
        pause
        exit /b 1
    )
)

REM 检查 InsightFace 依赖
echo 🔍 检查 InsightFace 依赖...
python -c "import insightface" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  InsightFace 未安装，正在安装...
    echo 📦 安装 Python 依赖...
    python -m pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple
    echo ✅ 依赖安装完成
) else (
    echo ✅ InsightFace 已安装
)

REM 启动服务
echo 🚀 启动 FastAPI 服务...
echo 📡 服务将在 http://localhost:3001 启动
echo 📚 API 文档: http://localhost:3001/docs
echo 💚 健康检查: http://localhost:3001/health
echo 💡 按 Ctrl+C 停止服务
echo.

python main.py
pause 