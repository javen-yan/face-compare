
# Face Compare

一个强大的人脸对比 React 组件库，支持 InsightFace 后端服务。

## 安装

```bash
npm install face-compare
```

## 使用方法

### 基本用法

```tsx
import { FaceCompare, CameraModal } from 'face-compare';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageData, setImageData] = useState('');

  const handleCapture = (capturedImage: string) => {
    setImageData(capturedImage);
    setIsModalOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        打开摄像头
      </button>
      
      <CameraModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCapture={handleCapture}
        config={{
          width: 640,
          height: 480,
          quality: 0.8
        }}
      />
    </div>
  );
}
```

### 使用 FaceCompare 类

```tsx
import { FaceCompare } from 'face-compare';

const faceCompare = new FaceCompare({
  api: 'http://localhost:8000',
  auth: 'your-api-key' // 可选
}, {
  enableLogging: true,
  insightFace: {
    threshold: 0.7,
    enableBatchCompare: true
  }
}, {
  onInitSuccess: (response) => console.log('初始化成功:', response),
  onCompareSuccess: (result) => console.log('对比成功:', result)
});

// 初始化人脸数据
const initResult = await faceCompare.init(imageData, userId);

// 对比人脸
const compareResult = await faceCompare.compare(newImageData);
```

### 使用 React Hook

```tsx
import { useFaceCompare } from 'face-compare';

function FaceCompareComponent() {
  const { 
    init, 
    compare, 
    isInitialized, 
    loading, 
    error 
  } = useFaceCompare({
    api: 'http://localhost:8000',
    options: {
      enableLogging: true,
      insightFace: { threshold: 0.6 }
    }
  });

  const handleInit = async (imageData: string) => {
    try {
      await init(imageData);
      console.log('人脸数据初始化成功');
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

  return (
    <div>
      {!isInitialized ? (
        <button onClick={() => handleInit(imageData)}>
          初始化人脸数据
        </button>
      ) : (
        <button onClick={() => handleCompare(newImageData)}>
          开始对比
        </button>
      )}
      
      {loading && <div>处理中...</div>}
      {error && <div>错误: {error.message}</div>}
    </div>
  );
}
```

### 批量对比

```tsx
// 批量对比多张图片
const batchResults = await faceCompare.compareBatch([
  image1,
  image2,
  image3
]);
```

## 组件列表

### CameraModal
摄像头模态框组件，支持拍照和图片预览。

**Props:**
- `isOpen`: 是否显示模态框
- `onClose`: 关闭回调
- `onCapture`: 拍照完成回调
- `config`: 配置选项

### InsightFaceComponent
InsightFace 主组件，集成人脸识别功能。

**Props:**
- `apiUrl`: API 地址
- `config`: 配置选项
- `onResult`: 结果回调
- `onError`: 错误回调

## Hook

### useFaceCompare
React Hook，提供人脸对比功能的状态管理。

**返回值:**
- `init`: 初始化函数
- `compare`: 对比函数
- `compareBatch`: 批量对比函数
- `isInitialized`: 是否已初始化
- `loading`: 加载状态
- `error`: 错误信息

## 类型支持

完整的 TypeScript 类型定义，包括：

- `FaceCompareConfig`
- `FaceCompareOptions`
- `FaceCompareEvents`
- `FaceCompareResult`
- `CameraModalProps`
- `CameraModalConfig`
- 等等...

## 环境要求

- React >= 16.8.0
- TypeScript >= 4.0.0
- 现代浏览器（支持 fetch、AbortController 等 API）

## 许可证

MIT

