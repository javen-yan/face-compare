# Docker 部署指南

本文档介绍如何使用Docker部署人脸识别服务。

## 前置要求

- Docker (版本 20.10+)
- Docker Compose (版本 2.0+)

## 快速开始

### 方法1: 使用脚本（推荐）

#### Linux/macOS
```bash
cd server
./build-and-run.sh
```

#### Windows
```cmd
cd server
build-and-run.bat
```

### 方法2: 手动执行

```bash
cd server

# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 服务访问

- **服务地址**: http://localhost:3001
- **API文档**: http://localhost:3001/docs
- **健康检查**: http://localhost:3001/health

## 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 进入容器
docker-compose exec face-recognition-server bash

# 查看容器资源使用
docker stats face-recognition-server
```

## 数据持久化

服务会将用户数据保存在以下位置：
- `./data/` - 数据目录
- `./user_data.pkl` - 用户人脸数据文件

这些文件会通过Docker卷挂载到容器中，确保数据不会丢失。

## 环境变量配置

可以通过修改 `docker-compose.yml` 文件中的环境变量来配置服务：

```yaml
environment:
  - SERVER_PORT=3001          # 服务端口
  - SERVER_HOST=0.0.0.0      # 服务主机
  - SERVER_LOG_LEVEL=info     # 日志级别
  - SERVER_MODEL_PATH=        # 模型文件路径
```

## 故障排除

### 1. 端口被占用
如果3001端口被占用，可以修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8080:3001"  # 将主机的8080端口映射到容器的3001端口
```

### 2. 内存不足
InsightFace模型需要较多内存，建议至少4GB可用内存。如果内存不足，可以：
- 关闭其他应用
- 增加Docker内存限制
- 使用CPU版本的模型

### 3. 模型下载失败
首次启动时，服务会自动下载InsightFace模型。如果下载失败：
- 检查网络连接
- 使用代理或镜像源
- 手动下载模型文件并放置到指定目录

### 4. 查看详细日志
```bash
docker-compose logs -f face-recognition-server
```

## 性能优化

### 1. 使用GPU（如果可用）
如果有NVIDIA GPU，可以修改Dockerfile使用GPU版本的PyTorch：
```dockerfile
# 使用GPU基础镜像
FROM nvidia/cuda:11.8-runtime-ubuntu22.04
```

### 2. 调整模型大小
可以在代码中调整模型大小以平衡性能和资源使用：
```python
self.app = FaceAnalysis(name='buffalo_s')  # 使用较小的模型
```

### 3. 批量处理
对于大量图片，建议使用批量API接口以提高效率。

## 安全注意事项

1. **生产环境部署**：
   - 修改默认端口
   - 配置防火墙规则
   - 使用HTTPS
   - 限制CORS来源

2. **数据安全**：
   - 定期备份用户数据
   - 加密敏感信息
   - 实施访问控制

3. **网络安全**：
   - 使用反向代理（如Nginx）
   - 配置负载均衡
   - 实施速率限制

## 监控和维护

### 健康检查
服务内置健康检查，可以通过以下方式监控：
```bash
curl http://localhost:3001/health
```

### 日志轮转
建议配置日志轮转以防止日志文件过大：
```bash
# 在docker-compose.yml中添加日志配置
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 备份策略
定期备份用户数据：
```bash
# 备份数据
cp user_data.pkl user_data_backup_$(date +%Y%m%d).pkl
```

## 更新服务

```bash
# 停止服务
docker-compose down

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 支持

如果遇到问题，请：
1. 查看服务日志
2. 检查Docker状态
3. 验证网络连接
4. 查看本文档的故障排除部分 