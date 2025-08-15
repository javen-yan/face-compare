# 使用Python 3.11作为基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV SERVER_PORT=3001
ENV SERVER_HOST=0.0.0.0
ENV SERVER_LOG_LEVEL=info
ENV SERVER_MODEL_PATH=model/insightface/

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgcc-s1 \
    libstdc++6 \
    libgfortran5 \
    libquadmath0 \
    libopenblas64-pthread \
    liblapack64 \
    libatlas-base-dev \
    gfortran \
    wget \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements.txt
COPY requirements.txt .

# 创建模型目录
RUN mkdir -p /app/model/insightface/

# 下载模型
RUN curl -L -o /app/model/insightface/buffalo_l.zip https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
RUN unzip /app/model/insightface/buffalo_l.zip -d /app/model/insightface/
RUN rm /app/model/insightface/buffalo_l.zip

# 安装Python依赖
RUN pip install --no-cache-dir --upgrade pip -i https://mirrors.aliyun.com/pypi/simple && \
    pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# 启动命令
CMD ["python", "main.py"]
