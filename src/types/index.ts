export interface FaceCompareConfig {
  api: string;
  userId: string;
  auth?: string;
}

export interface FaceInitResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    faceData: string;
    faceCount?: number;
  };
}   

export interface FaceCompareResult {
  similarity: number;
  isMatch: boolean;
  confidence: number;
  threshold?: number;
}

export interface FaceCompareBatchResultItem extends FaceCompareResult {
  index: number;
}

export interface FaceCompareBatchErrorItem {
  index: number;
  error: string;
}

export interface FaceCompareResponse {
  success: boolean;
  message: string;
  data?: FaceCompareResult;
}

export interface FaceCompareBatchResponse {
  success: boolean;
  message: string;
  data?: {
    results: FaceCompareBatchResultItem[];
    errors: FaceCompareBatchErrorItem[];
    total: number;
    successCount: number;
    errorCount: number;
  };
}

export interface UserInfo {
  userId: string;
  createdAt: string;
  imageSize: [number, number, number];
}

export interface SystemInfo {
  nodejs: {
    version: string;
    platform: string;
    arch: string;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    pid: number;
  };
  python: {
    status: string;
    timestamp: string;
    userCount: number;
    modelLoaded: boolean;
    providers: string[];
  };
  server: {
    port: number;
    startTime: string;
    uptime: number;
  };
}

export interface SystemInfoResponse {
  success: boolean;
  message: string;
  data?: SystemInfo;
}

export interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title?: string;
  config?: CameraModalConfig;
}

export interface CameraModalConfig {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  aspectRatio?: number;
  quality?: number;
  showPreview?: boolean;
  showControls?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  language?: 'zh-CN' | 'en-US';
  maxFileSize?: number;
}

export interface InsightFaceConfig {
  threshold?: number;
  enableBatchCompare?: boolean;
  enableUserManagement?: boolean;
  enableSystemMonitoring?: boolean;
}

export interface UseAutoFaceCompareOptions {
  faceCompareConfig: FaceCompareConfig;
  faceCompareOptions?: FaceCompareOptions;
  onCapture?: (imageData: string) => void;
  onFaceDetected?: (imageData: string) => void;
  onCompareResult?: (result: any) => void;
  onError?: (error: Error) => void;
  autoCloseAfterCapture?: boolean;
  autoCloseAfterCompare?: boolean;
  cameraConfig?: {
    width?: number;
    height?: number;
    quality?: number;
    facingMode?: 'user' | 'environment';
  };
}

export interface UseAutoFaceCompareReturn {
  // 摄像头相关
  isCameraOpen: boolean;
  capturedImage: string | null;
  clearImage: () => void;
  
  // 人脸识别相关
  isInitialized: boolean;
  isComparing: boolean;
  compareResult: any;
  error: Error | null;
  
  // 新增：获取初始化状态信息
  getInitializationInfo: () => {
    isInitialized: boolean;
    hasInitializedImage: boolean;
    initializedImageSize?: number;
  };
  
  // 自动管理的方法
  record: () => Promise<void>;
  compare: () => Promise<any>;
  compareBatch: (imageDataList?: string[]) => Promise<any[]>;
  
  // 手动控制
  openCamera: () => void;
  closeCamera: () => void;
  
  // 模态框属性
  modalProps: {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageData: string) => void;
    config?: any;
  };
}

export interface FaceCompareOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  insightFace?: InsightFaceConfig;
}
