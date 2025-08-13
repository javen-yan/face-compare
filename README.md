
# InsightFace 人脸识别系统

基于开源 InsightFace 深度学习框架的高精度人脸识别系统，提供完整的前后端解决方案。

## 🚀 特性

- **高精度识别**: 使用 InsightFace 深度学习模型，识别准确率超过 99%
- **实时处理**: 支持实时人脸检测和特征提取
- **GPU 加速**: 支持 CUDA 加速，大幅提升处理速度
- **现代化前端**: 基于 React + TypeScript 构建的响应式 Web 界面
- **完整 API**: 提供完整的 RESTful API 接口
- **批量处理**: 支持批量人脸对比
- **用户管理**: 完整的用户注册、管理和删除功能
- **系统监控**: 实时系统状态监控和健康检查

## 🏗️ 技术架构

### 前端技术栈
- **React 18** + **TypeScript**
- **Vite** 构建工具
- **CSS-in-JS** 样式方案
- **响应式设计**，支持移动端和桌面端

### 后端技术栈
- **Node.js** + **Express** 服务器
- **Python** + **InsightFace** 人脸识别引擎
- **ONNX Runtime** 模型推理
- **OpenCV** 图像处理

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

## 🛠️ 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd face-compare
```

### 2. 一键安装（推荐）
```bash
npm run setup
```

### 3. 启动 InsightFace 后端
```bash
npm run start-insightface
```

### 4. 启动前端应用
```bash
npm run dev
```

### 5. 访问应用
打开浏览器访问 `http://localhost:5173`

## 🔧 手动安装

### 安装前端依赖
```bash
npm install
```

### 安装 InsightFace 后端依赖
```bash
cd insightface-server
npm install
pip install -r requirements.txt
```

## 📡 API 接口

### 基础接口
- `GET /health` - 健康检查
- `GET /api/system-info` - 系统信息

### 人脸识别接口
- `POST /api/face-init` - 注册用户人脸
- `POST /api/face-compare` - 人脸对比
- `POST /api/face-compare-batch` - 批量人脸对比

### 用户管理接口
- `GET /api/users` - 获取所有用户
- `GET /api/users/:userId` - 获取用户信息
- `DELETE /api/users/:userId` - 删除用户

## 🎯 使用示例

### 前端使用
```typescript
import { InsightFaceComponent } from './components/InsightFaceComponent';

<InsightFaceComponent
  apiUrl="http://localhost:3001/api"
  config={{
    threshold: 0.6,
    enableBatchCompare: true,
    enableUserManagement: true,
    enableSystemMonitoring: true
  }}
  onResult={(result) => console.log('识别结果:', result)}
  onError={(error) => console.error('错误:', error)}
/>
```

### 后端调用示例
```python
import requests

# 注册用户
response = requests.post('http://localhost:3001/api/face-init', json={
    'imageData': 'data:image/jpeg;base64,...',
    'userId': 'user_001'
})

# 人脸对比
response = requests.post('http://localhost:3001/api/face-compare', json={
    'imageData': 'data:image/jpeg;base64,...',
    'userId': 'user_001',
    'threshold': 0.6
})
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

## 📁 项目结构

```
face-compare/
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   │   ├── CameraModal.tsx        # 摄像头模态框
│   │   └── InsightFaceComponent.tsx # InsightFace 主组件
│   ├── FaceCompare.ts     # 核心业务逻辑类
│   ├── types/             # TypeScript 类型定义
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 应用入口
├── insightface-server/     # InsightFace 后端服务
│   ├── face_recognition.py # Python 人脸识别模块
│   ├── server.js          # Node.js 服务器
│   ├── requirements.txt   # Python 依赖
│   └── package.json       # Node.js 依赖
├── examples/               # 使用示例
│   └── insightface-usage.ts # InsightFace 使用示例
├── start-insightface.sh   # Linux/macOS 启动脚本
├── start-insightface.bat  # Windows 启动脚本
└── README.md              # 项目说明
```

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
- [React 文档](https://react.dev/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请提交 Issue 或联系开发团队。

