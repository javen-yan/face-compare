
# Face Compare

一个强大的人脸对比 React 组件库，支持 InsightFace 后端服务，提供完整的摄像头管理、人脸识别和对比功能。

## ✨ 特性

- 🎥 **智能摄像头管理** - 自动打开/关闭摄像头，支持前后摄像头切换
- 🔍 **人脸识别与对比** - 基于 InsightFace 的高精度人脸识别
- ⚡ **自动化流程** - 一键完成拍照、识别、对比的完整流程
- 🎯 **批量处理** - 支持多张图片的批量对比
- 📱 **响应式设计** - 适配各种设备和屏幕尺寸
- 🎨 **高度可定制** - 丰富的配置选项和主题支持
- 🔧 **TypeScript 支持** - 完整的类型定义和类型安全
- 🚀 **React Hooks** - 现代化的 React 开发体验

## 📦 安装

```bash
npm install face-compare
# 或
yarn add face-compare
```

## 🚀 快速开始

### 基础用法 - 使用 React Hook

```tsx
import React, { useState } from 'react';
import { useAutoFaceCompare, CameraModal } from 'face-compare';

function FaceCompareApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    isCameraOpen,
    capturedImage,
    isInitialized,
    isComparing,
    compareResult,
    error,
    record,
    compare,
    openCamera,
    closeCamera,
    clearImage,
    modalProps
  } = useAutoFaceCompare({
    faceCompareConfig: {
      api: 'http://localhost:8000',
      userId: 'user123',
      auth: 'your-api-key' // 可选
    },
    faceCompareOptions: {
      enableLogging: true,
      insightFace: {
        threshold: 0.6,
        enableBatchCompare: true
      }
    },
    onCapture: (imageData) => console.log('拍照完成:', imageData),
    onCompareResult: (result) => console.log('对比结果:', result),
    onError: (error) => console.error('发生错误:', error),
    autoCloseAfterCapture: true,
    autoCloseAfterCompare: true
  });

  const handleRecord = async () => {
    try {
      await record(); // 自动打开摄像头并初始化人脸数据
      console.log('人脸数据初始化成功');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  const handleCompare = async () => {
    try {
      const result = await compare(); // 自动打开摄像头并开始对比
      console.log('对比完成:', result);
    } catch (error) {
      console.error('对比失败:', error);
    }
  };

  return (
    <div className="face-compare-app">
      <h1>人脸识别系统</h1>
      
      <div className="controls">
        {!isInitialized ? (
          <button 
            onClick={handleRecord}
            disabled={isComparing}
            className="btn btn-primary"
          >
            {isComparing ? '初始化中...' : '初始化人脸数据'}
          </button>
        ) : (
          <button 
            onClick={handleCompare}
            disabled={isComparing}
            className="btn btn-success"
          >
            {isComparing ? '对比中...' : '开始人脸对比'}
          </button>
        )}
        
        <button 
          onClick={openCamera}
          className="btn btn-secondary"
        >
          手动打开摄像头
        </button>
        
        <button 
          onClick={clearImage}
          className="btn btn-warning"
        >
          清除图片
        </button>
      </div>

      {/* 状态显示 */}
      <div className="status">
        <p>摄像头状态: {isCameraOpen ? '已打开' : '已关闭'}</p>
        <p>初始化状态: {isInitialized ? '已完成' : '未完成'}</p>
        {error && <p className="error">错误: {error.message}</p>}
        {compareResult && (
          <div className="result">
            <h3>对比结果:</h3>
            <pre>{JSON.stringify(compareResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* 摄像头模态框 */}
      <CameraModal {...modalProps} />
    </div>
  );
}

export default FaceCompareApp;
```

### 高级用法 - 使用 FaceCompare 类

```tsx
import { FaceCompare } from 'face-compare';

// 创建 FaceCompare 实例
const faceCompare = new FaceCompare(
  {
    api: 'http://localhost:8000',
    userId: 'user123',
    auth: 'your-api-key'
  },
  {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    enableLogging: true,
    insightFace: {
      threshold: 0.6,
      enableBatchCompare: true,
      enableUserManagement: true,
      enableSystemMonitoring: true
    }
  },
  {
    onInitStart: () => console.log('开始初始化...'),
    onInitSuccess: (response) => console.log('初始化成功:', response),
    onInitError: (error) => console.error('初始化失败:', error),
    onCompareStart: () => console.log('开始对比...'),
    onCompareSuccess: (result) => console.log('对比成功:', result),
    onCompareError: (error) => console.error('对比失败:', error),
    onError: (error) => console.error('发生错误:', error)
  }
);

// 初始化人脸数据
const initResult = await faceCompare.record(imageData);

// 对比人脸
const compareResult = await faceCompare.compare(newImageData);

// 批量对比
const batchResults = await faceCompare.compareBatch([
  image1,
  image2,
  image3
]);

// 获取系统信息
const systemInfo = await faceCompare.getSystemInfo();

// 获取用户信息
const userInfo = await faceCompare.getUserInfo();
```

## 🎯 核心功能

### 1. 自动人脸识别流程

- **一键初始化**: `record()` 方法自动打开摄像头、拍照、初始化人脸数据
- **一键对比**: `compare()` 方法自动打开摄像头、拍照、进行人脸对比
- **智能管理**: 自动管理摄像头状态，支持配置自动关闭

### 2. 摄像头管理

- **自动控制**: 根据操作自动打开/关闭摄像头
- **配置灵活**: 支持分辨率、质量、前后摄像头等配置
- **状态同步**: 实时同步摄像头状态，提供完整的控制接口

### 3. 人脸识别引擎

- **高精度**: 基于 InsightFace 的先进算法
- **可配置阈值**: 支持自定义相似度阈值
- **批量处理**: 支持多张图片的批量对比
- **错误处理**: 完善的错误处理和重试机制

## 🔧 API 参考

### useAutoFaceCompare Hook

#### 配置选项

```typescript
interface UseAutoFaceCompareOptions {
  faceCompareConfig: FaceCompareConfig;        // 人脸识别配置
  faceCompareOptions?: FaceCompareOptions;     // 可选配置
  onCapture?: (imageData: string) => void;     // 拍照回调
  onFaceDetected?: (imageData: string) => void; // 人脸检测回调
  onCompareResult?: (result: any) => void;     // 对比结果回调
  onError?: (error: Error) => void;            // 错误回调
  autoCloseAfterCapture?: boolean;             // 拍照后自动关闭
  autoCloseAfterCompare?: boolean;             // 对比后自动关闭
  cameraConfig?: {                             // 摄像头配置
    width?: number;
    height?: number;
    quality?: number;
    facingMode?: 'user' | 'environment';
  };
}
```

#### 返回值

```typescript
interface UseAutoFaceCompareReturn {
  // 摄像头状态
  isCameraOpen: boolean;           // 摄像头是否打开
  capturedImage: string | null;    // 拍摄的图片
  clearImage: () => void;          // 清除图片
  
  // 人脸识别状态
  isInitialized: boolean;          // 是否已初始化
  isComparing: boolean;            // 是否正在对比
  compareResult: any;              // 对比结果
  error: Error | null;             // 错误信息
  
  // 自动管理方法
  record: () => Promise<void>;     // 自动初始化
  compare: () => Promise<any>;     // 自动对比
  compareBatch: (imageDataList?: string[]) => Promise<any[]>; // 批量对比
  
  // 手动控制
  openCamera: () => void;          // 打开摄像头
  closeCamera: () => void;         // 关闭摄像头
  
  // 模态框属性
  modalProps: {                    // 摄像头模态框属性
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageData: string) => void;
    config?: any;
  };
}
```

### FaceCompare 类

#### 主要方法

- `record(imageData: string)`: 初始化人脸数据
- `compare(imageData: string)`: 对比人脸
- `compareBatch(imageDataList: string[])`: 批量对比
- `getSystemInfo()`: 获取系统信息
- `getUserInfo()`: 获取用户信息

#### 事件回调

- `onInitStart`: 初始化开始
- `onInitSuccess`: 初始化成功
- `onInitError`: 初始化失败
- `onCompareStart`: 对比开始
- `onCompareSuccess`: 对比成功
- `onCompareError`: 对比失败
- `onError`: 通用错误

### CameraModal 组件

#### Props

```typescript
interface CameraModalProps {
  isOpen: boolean;                    // 是否显示
  onClose: () => void;               // 关闭回调
  onCapture: (imageData: string) => void; // 拍照回调
  title?: string;                     // 标题
  config?: CameraModalConfig;         // 配置选项
}

interface CameraModalConfig {
  width?: number;                     // 宽度
  height?: number;                    // 高度
  facingMode?: 'user' | 'environment'; // 摄像头方向
  aspectRatio?: number;               // 宽高比
  quality?: number;                   // 图片质量
  showPreview?: boolean;              // 显示预览
  showControls?: boolean;             // 显示控制按钮
  theme?: 'light' | 'dark' | 'auto'; // 主题
  language?: 'zh-CN' | 'en-US';      // 语言
  maxFileSize?: number;               // 最大文件大小
}
```

## 🎨 样式定制

### 主题配置

```tsx
<CameraModal
  {...modalProps}
  config={{
    theme: 'dark',
    language: 'zh-CN',
    showPreview: true,
    showControls: true
  }}
/>
```

### 自定义样式

```css
/* 自定义摄像头模态框样式 */
.face-compare-modal {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
}

/* 自定义按钮样式 */
.btn {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.btn-primary { background-color: var(--primary-color); color: white; }
.btn-success { background-color: var(--success-color); color: white; }
.btn-secondary { background-color: var(--secondary-color); color: white; }
.btn-warning { background-color: var(--warning-color); color: black; }
```

## 🔌 后端服务配置

### InsightFace 服务

确保您的 InsightFace 后端服务正在运行，并配置正确的 API 端点：

```typescript
const config = {
  api: 'http://localhost:8000',  // InsightFace 服务地址
  userId: 'unique-user-id',      // 用户唯一标识
  auth: 'your-api-key'           // 认证密钥（可选）
};
```

### 环境变量

```bash
# .env 文件
REACT_APP_FACE_COMPARE_API=http://localhost:8000
REACT_APP_FACE_COMPARE_AUTH=your-api-key
```

## 📱 浏览器兼容性

- Chrome >= 60
- Firefox >= 55
- Safari >= 11
- Edge >= 79

**注意**: 需要支持以下 Web API：
- `getUserMedia` (摄像头访问)
- `fetch` (网络请求)
- `AbortController` (请求取消)
- `Promise` (异步操作)

## 🚀 性能优化

### 图片质量配置

```typescript
const cameraConfig = {
  width: 640,        // 适中的分辨率
  height: 480,
  quality: 0.8,      // 平衡质量和性能
  facingMode: 'user' // 前置摄像头
};
```

### 批量处理优化

```typescript
// 使用批量对比提高效率
const results = await compareBatch([
  image1, image2, image3, image4, image5
]);
```

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试并监听变化
npm test -- --watch

# 生成测试覆盖率报告
npm test -- --coverage
```

## 📦 构建

```bash
# 构建生产版本
npm run build

# 构建类型定义
npm run build:types

# 开发模式构建
npm run dev
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [InsightFace](https://github.com/deepinsight/insightface) - 强大的人脸识别引擎
- [React](https://reactjs.org/) - 用户界面库
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看 [Issues](https://github.com/javen-yan/face-compare/issues)
2. 创建新的 Issue 描述您的问题
3. 联系维护者获取帮助

---

**Star ⭐ 这个项目如果它对您有帮助！**

