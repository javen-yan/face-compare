export interface FaceCompareConfig {
  api: string;
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

export interface FaceCompareResponse {
  success: boolean;
  message: string;
  data?: {
    similarity: number;
    isMatch: boolean;
    confidence: number;
    threshold?: number;
  };
}

export interface FaceCompareBatchResponse {
  success: boolean;
  message: string;
  data?: {
    results: Array<{
      index: number;
      similarity: number;
      isMatch: boolean;
      confidence: number;
      threshold?: number;
    }>;
    errors: Array<{
      index: number;
      error: string;
    }>;
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

export interface UsersListResponse {
  success: boolean;
  message: string;
  data?: {
    users: UserInfo[];
    totalCount: number;
  };
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

export interface FaceCompareResult {
  similarity: number;
  isMatch: boolean;
  confidence: number;
  threshold?: number;
}

// InsightFace 特定的配置选项
export interface InsightFaceConfig {
  threshold?: number; // 相似度阈值，默认 0.6
  enableBatchCompare?: boolean; // 是否启用批量对比
  enableUserManagement?: boolean; // 是否启用用户管理
  enableSystemMonitoring?: boolean; // 是否启用系统监控
}
