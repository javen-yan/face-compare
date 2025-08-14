# InsightFace 人脸识别服务器

基于开源 InsightFace 的人脸识别后端服务，提供高精度的人脸检测、特征提取和身份验证功能。

## 🚀 特性

- **高精度识别**: 使用 InsightFace 深度学习模型，识别准确率超过 99%
- **实时处理**: 支持实时人脸检测和特征提取
- **多平台支持**: 支持 Windows、macOS 和 Linux
- **GPU 加速**: 支持 CUDA 加速，大幅提升处理速度
- **RESTful API**: 提供完整的 REST API 接口
- **批量处理**: 支持批量人脸对比
- **数据持久化**: 自动保存用户数据到本地文件

## 📋 系统要求

### 基础要求
- **Python**: 3.7 或更高版本
- **Node.js**: 14 或更高版本
- **内存**: 至少 4GB RAM
- **存储**: 至少 2GB 可用空间

### 推荐配置
- **Python**: 3.8+
- **Node.js**: 16+
- **内存**: 8GB+ RAM
- **GPU**: NVIDIA GPU (支持 CUDA)
- **存储**: SSD 硬盘

## 🛠️ 安装步骤

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd insightface-server
```

### 2. 自动安装（推荐）
```bash
# Linux/macOS
chmod +x start.sh
./start.sh

# Windows
start.bat
```

### 3. 手动安装

#### 安装 Python 依赖
```bash
pip install -r requirements.txt
```

#### 安装 Node.js 依赖
```bash
npm install
```

### 4. 启动服务器
```bash
npm start
```

## 🔧 配置说明

### 环境变量
- `PORT`: 服务器端口，默认 3001
- `NODE_ENV`: 运行环境，development/production

### 模型配置
InsightFace 会自动下载所需的模型文件到 `~/.insightface/models/` 目录。

## 📡 API 接口

### 基础接口

#### 健康检查
```http
GET /health
```

#### 系统信息
```http
GET /api/system-info
```

### 人脸识别接口

#### 注册用户人脸
```http
POST /api/face-init
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "userId": "user_123" // 可选，不提供则自动生成
}
```

#### 人脸对比
```http
POST /api/face-compare
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "userId": "user_123",
  "threshold": 0.6 // 可选，相似度阈值，默认 0.6
}
```

#### 批量人脸对比
```http
POST /api/face-compare-batch
Content-Type: application/json

{
  "imageDataList": [
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,..."
  ],
  "userId": "user_123",
  "threshold": 0.6
}
```

### 用户管理接口

#### 获取用户信息
```http
GET /api/users/:userId
```

#### 获取所有用户
```http
GET /api/users
```

#### 删除用户
```http
DELETE /api/users/:userId
```

## 📊 响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述"
}
```

## 🎯 使用示例

### Python 客户端示例
```python
import requests
import base64

# 服务器地址
API_BASE = "http://localhost:3001/api"

# 读取图片并转换为 base64
with open("face.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()
    image_data = f"data:image/jpeg;base64,{image_data}"

# 注册用户
response = requests.post(f"{API_BASE}/face-init", json={
    "imageData": image_data,
    "userId": "test_user"
})
print("注册结果:", response.json())

# 人脸对比
response = requests.post(f"{API_BASE}/face-compare", json={
    "imageData": image_data,
    "userId": "test_user"
})
print("对比结果:", response.json())
```

### JavaScript 客户端示例
```javascript
// 注册用户
async function registerUser(imageData, userId) {
  const response = await fetch('http://localhost:3001/api/face-init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData: imageData,
      userId: userId
    })
  });
  
  return await response.json();
}

// 人脸对比
async function compareFace(imageData, userId) {
  const response = await fetch('http://localhost:3001/api/face-compare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData: imageData,
      userId: userId
    })
  });
  
  return await response.json();
}
```

## 🔍 性能优化

### GPU 加速
如果系统有 NVIDIA GPU，InsightFace 会自动使用 CUDA 加速：

```python
# 在 face_recognition.py 中
self.app = FaceAnalysis(
    name='buffalo_l', 
    providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
)
```

### 批处理优化
对于大量图片，建议使用批量对比接口：

```http
POST /api/face-compare-batch
```

### 内存优化
- 定期清理不需要的用户数据
- 监控内存使用情况
- 适当调整图片质量

## 🐛 故障排除

### 常见问题

#### 1. Python 环境问题
```bash
# 检查 Python 版本
python --version

# 检查 InsightFace 安装
python -c "import insightface; print('OK')"
```

#### 2. 模型下载失败
```bash
# 手动下载模型
python -c "import insightface; insightface.app.FaceAnalysis(name='buffalo_l')"
```

#### 3. GPU 不可用
```bash
# 检查 CUDA 安装
nvidia-smi

# 检查 ONNX Runtime
python -c "import onnxruntime; print(onnxruntime.get_device())"
```

#### 4. 内存不足
- 减少并发请求数量
- 降低图片分辨率
- 增加系统内存

### 日志查看
服务器运行时会输出详细的日志信息，包括：
- 人脸检测结果
- 特征提取状态
- 对比结果
- 错误信息

## 📈 监控和维护

### 健康检查
定期调用 `/health` 接口检查服务状态。

### 性能监控
- 响应时间
- 内存使用
- GPU 利用率
- 并发请求数

### 数据备份
用户数据自动保存到 `user_data.pkl` 文件，建议定期备份。

## 🔒 安全考虑

### 数据保护
- 图片数据仅用于特征提取，不永久存储
- 特征向量加密存储
- 支持 HTTPS 传输

### 访问控制
- 实现 API 密钥认证
- 限制请求频率
- 日志审计

## 📚 参考资料

- [InsightFace 官方文档](https://github.com/deepinsight/insightface)
- [ONNX Runtime 文档](https://onnxruntime.ai/)
- [OpenCV 文档](https://opencv.org/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请提交 Issue 或联系开发团队。 