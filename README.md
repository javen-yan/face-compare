
# FaceCompare 人脸对比系统

> 基于 React + TypeScript 实现的人脸识别和对比插件，支持拍照采集和实时对比功能

## ✨ 功能特性

- 📸 **拍照采集**: 支持摄像头拍照，获取高质量人脸图片
- 🔍 **人脸对比**: 实时对比两张人脸图片，计算相似度和匹配结果
- 🎯 **高精度**: 基于先进的人脸识别算法，提供准确的对比结果
- 📱 **响应式设计**: 支持桌面端和移动端，提供优秀的用户体验
- 🚀 **易于集成**: 提供多种使用方式，支持直接调用和 React 组件
- 🔒 **安全可靠**: 支持 API 认证，保护用户隐私和数据安全
- 🎨 **主题定制**: 支持亮色/暗色主题切换
- 🌍 **多语言**: 支持中文和英文界面
- ⚙️ **高度可配置**: 丰富的配置选项，满足不同需求

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 📖 使用方法

### 方式 1: 直接使用 FaceCompare 类

```typescript
import { FaceCompare, FaceCompareOptions, FaceCompareEvents } from 'face-compare';

const config = {
  api: 'https://your-api-domain.com/api',
  auth: 'your-auth-token'
};

const options: FaceCompareOptions = {
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
  enableLogging: true
};

const events: FaceCompareEvents = {
  onInitStart: () => console.log('开始初始化'),
  onInitSuccess: (response) => console.log('初始化成功:', response),
  onCompareStart: () => console.log('开始对比'),
  onCompareSuccess: (result) => console.log('对比成功:', result),
  onError: (error) => console.error('发生错误:', error)
};

const sdk = new FaceCompare(config, options, events);

// 初始化人脸数据
const initResult = await sdk.init('base64-image-data-here');
console.log('初始化结果:', initResult);

if (initResult.success) {
  // 进行人脸对比
  const compareResult = await sdk.compare('new-base64-image-data-here');
  console.log('对比结果:', compareResult);
  
  // 批量对比
  const batchResults = await sdk.compareBatch(['img1', 'img2', 'img3']);
  console.log('批量对比结果:', batchResults);
}

// 获取状态
const status = sdk.getStatus();
console.log('当前状态:', status);

// 验证图片
const isValid = sdk.validateImage('image-data');
console.log('图片是否有效:', isValid);
```

### 方式 2: 使用 React Hook

```typescript
import { useFaceCompare, UseFaceCompareOptions } from 'face-compare';

function MyComponent() {
  const config = {
    api: 'https://your-api-domain.com/api',
    auth: 'your-auth-token'
  };

  const options: UseFaceCompareOptions = {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    enableLogging: true,
    autoRetry: true,
    maxRetries: 5,
    onStateChange: (state) => console.log('状态变化:', state)
  };

  const {
    isLoading,
    error,
    result,
    isInitialized,
    progress,
    init,
    compare,
    compareBatch,
    clear,
    reset,
    updateConfig,
    updateOptions,
    getStatus,
    validateImage
  } = useFaceCompare(config, options);

  const handleInit = async (imageData: string) => {
    try {
      await init(imageData);
      console.log('初始化成功');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  const handleCompare = async (imageData: string) => {
    try {
      const result = await compare(imageData);
      console.log('对比结果:', result);
    } catch (error) {
      console.error('对比失败:', error);
    }
  };

  const handleBatchCompare = async (imageList: string[]) => {
    try {
      const results = await compareBatch(imageList);
      console.log('批量对比结果:', results);
    } catch (error) {
      console.error('批量对比失败:', error);
    }
  };

  return (
    <div>
      <h2>人脸对比示例</h2>
      
      {/* 显示进度 */}
      {progress.total > 0 && (
        <div>
          <p>处理进度: {progress.current} / {progress.total} ({progress.percentage}%)</p>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#eee' }}>
            <div 
              style={{ 
                width: `${progress.percentage}%`, 
                height: '100%', 
                backgroundColor: '#007bff' 
              }} 
            />
          </div>
        </div>
      )}
      
      {error && <p>错误: {error}</p>}
      {result && (
        <div>
          <p>相似度: {(result.similarity * 100).toFixed(2)}%</p>
          <p>是否匹配: {result.isMatch ? '是' : '否'}</p>
        </div>
      )}
      
      <button onClick={() => clear()}>清除数据</button>
      <button onClick={() => reset()}>重置状态</button>
    </div>
  );
}
```

### 方式 3: 使用完整的 React 组件

```typescript
import { FaceCompareComponent, FaceCompareComponentProps } from 'face-compare';

function App() {
  const config = {
    api: 'https://your-api-domain.com/api',
    auth: 'your-auth-token'
  };

  const componentProps: Partial<FaceCompareComponentProps> = {
    theme: 'dark',
    language: 'en-US',
    showProgress: true,
    showStatus: true,
    showImagePreview: true,
    cameraConfig: {
      width: 1280,
      height: 720,
      quality: 0.9,
      theme: 'dark',
      language: 'en-US',
      maxFileSize: 20
    }
  };

  const handleResult = (result: any) => {
    console.log('收到对比结果:', result);
  };

  const handleInitSuccess = (response: any) => {
    console.log('初始化成功:', response);
  };

  const handleError = (error: Error) => {
    console.error('发生错误:', error);
  };

  return (
    <FaceCompareComponent 
      config={config} 
      onResult={handleResult}
      onInitSuccess={handleInitSuccess}
      onError={handleError}
      {...componentProps}
      className="custom-face-compare"
      style={{ 
        border: '2px solid #007bff',
        borderRadius: '16px'
      }}
    />
  );
}
```

### 方式 4: 独立使用拍照组件

```typescript
import { CameraModal, CameraModalConfig } from 'face-compare';

function PhotoCapture() {
  const [isOpen, setOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const cameraConfig: CameraModalConfig = {
    width: 1280,
    height: 720,
    facingMode: 'user',
    aspectRatio: 16/9,
    quality: 0.9,
    showPreview: true,
    showControls: true,
    theme: 'light',
    language: 'zh-CN',
    maxFileSize: 15
  };

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    console.log('拍照成功');
  };

  return (
    <div>
      <button onClick={() => setOpen(true)}>拍照</button>
      
      {capturedImage && (
        <img src={capturedImage} alt="拍摄的照片" />
      )}

      <CameraModal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        onCapture={handleCapture}
        title="拍照采集"
        config={cameraConfig}
      />
    </div>
  );
}
```

## 🔧 配置选项

### FaceCompare 核心类配置

```typescript
interface FaceCompareOptions {
  timeout?: number;        // 请求超时时间 (ms)
  retryCount?: number;     // 重试次数
  retryDelay?: number;     // 重试延迟 (ms)
  enableLogging?: boolean; // 是否启用日志
}

interface FaceCompareEvents {
  onInitStart?: () => void;                    // 初始化开始
  onInitSuccess?: (response: any) => void;     // 初始化成功
  onInitError?: (error: Error) => void;        // 初始化失败
  onCompareStart?: () => void;                 // 对比开始
  onCompareSuccess?: (result: any) => void;    // 对比成功
  onCompareError?: (error: Error) => void;     // 对比失败
  onError?: (error: Error) => void;            // 通用错误
}
```

### React Hook 配置

```typescript
interface UseFaceCompareOptions extends FaceCompareOptions {
  autoRetry?: boolean;                        // 自动重试
  maxRetries?: number;                        // 最大重试次数
  onStateChange?: (state: any) => void;       // 状态变化回调
}
```

### 组件配置

```typescript
interface FaceCompareComponentProps {
  config: FaceCompareConfig;                  // API 配置
  onResult?: (result: any) => void;           // 结果回调
  onInitSuccess?: (response: any) => void;    // 初始化成功回调
  onError?: (error: Error) => void;           // 错误回调
  theme?: 'light' | 'dark' | 'auto';          // 主题
  language?: 'zh-CN' | 'en-US';               // 语言
  showProgress?: boolean;                     // 显示进度条
  showStatus?: boolean;                       // 显示状态指示器
  showImagePreview?: boolean;                 // 显示图片预览
  cameraConfig?: CameraModalConfig;           // 摄像头配置
  className?: string;                         // 自定义 CSS 类
  style?: React.CSSProperties;                // 自定义样式
}
```

### 摄像头配置

```typescript
interface CameraModalConfig {
  width?: number;                              // 摄像头宽度
  height?: number;                             // 摄像头高度
  facingMode?: 'user' | 'environment';         // 摄像头朝向
  aspectRatio?: number;                        // 宽高比
  quality?: number;                            // 图片质量 (0-1)
  showPreview?: boolean;                       // 显示预览
  showControls?: boolean;                      // 显示控制按钮
  theme?: 'light' | 'dark' | 'auto';          // 主题
  language?: 'zh-CN' | 'en-US';               // 语言
  maxFileSize?: number;                        // 最大文件大小 (MB)
}
```

## 🔧 API 接口

### 初始化人脸数据

**接口**: `POST /api/face-init`

**请求参数**:
```json
{
  "imageData": "base64-encoded-image-data"
}
```

**响应结果**:
```json
{
  "success": true,
  "message": "初始化成功",
  "data": {
    "userId": "user-123",
    "faceData": "face-feature-data"
  }
}
```

### 人脸对比

**接口**: `POST /api/face-compare`

**请求参数**:
```json
{
  "imageData": "base64-encoded-image-data",
  "userId": "user-123"
}
```

**响应结果**:
```json
{
  "success": true,
  "message": "对比成功",
  "data": {
    "similarity": 0.85,
    "isMatch": true,
    "confidence": 0.92
  }
}
```

## 🏗️ 项目结构

```
face-compare/
├── src/
│   ├── components/          # React 组件
│   │   ├── CameraModal.tsx # 拍照模态框
│   │   └── FaceCompareComponent.tsx # 主组件
│   ├── hooks/              # React Hooks
│   │   └── useFaceCompare.ts
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── FaceCompare.ts      # 核心类
│   ├── App.tsx             # 示例应用
│   ├── main.tsx            # 应用入口
│   └── index.ts            # 模块导出
├── examples/                # 使用示例
│   ├── usage.ts            # 基础使用示例
│   └── advanced-usage.tsx  # 高级使用示例
├── mock-server/             # 模拟 API 服务器
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🎨 自定义样式

所有组件都支持自定义样式，您可以通过 CSS 类名、内联样式或主题配置来修改外观：

```css
/* 自定义拍照按钮样式 */
.capture-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  border-radius: 30px;
  font-size: 18px;
}

/* 自定义结果展示样式 */
.result-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

## 🔒 安全注意事项

1. **API 密钥保护**: 不要在客户端代码中硬编码 API 密钥
2. **HTTPS 传输**: 确保所有 API 调用都通过 HTTPS 进行
3. **数据隐私**: 人脸图片数据应该加密传输和存储
4. **权限控制**: 实现适当的用户认证和授权机制
5. **文件大小限制**: 设置合理的图片文件大小限制

## 🌟 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue: [GitHub Issues](https://github.com/your-repo/face-compare/issues)
- 邮箱: your-email@example.com

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！

