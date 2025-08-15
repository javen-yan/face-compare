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

# 把默认源替换为清华源（兼容新版本Debian）
RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list 2>/dev/null || \
    echo "deb http://mirrors.tuna.tsinghua.edu.cn/debian/ bullseye main" > /etc/apt/sources.list.d/debian.list

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgcc-s1 \
    libstdc++6 \
    libgfortran5 \
    libquadmath0 \
    libopenblas0-pthread \
    liblapack3 \
    gfortran \
    wget \
    g++ \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements.txt
COPY requirements.txt .

# 创建模型目录
RUN mkdir -p /root/.insightface/models

# 创建模型目录
RUN mkdir -p /root/.insightface/models/buffalo_l

# 下载模型
RUN wget -O /root/.insightface/models/buffalo_l.zip https://ghfast.top/https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip

# 解压模型
RUN unzip /root/.insightface/models/buffalo_l.zip -d /root/.insightface/models/buffalo_l

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
