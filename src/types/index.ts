export interface FaceCompareConfig {
  api: string;
  auth: string;
}

export interface FaceInitResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    faceData: string;
  };
}

export interface FaceCompareResponse {
  success: boolean;
  message: string;
  data?: {
    similarity: number;
    isMatch: boolean;
    confidence: number;
  };
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
  maxFileSize?: number; // MB
}

export interface FaceCompareResult {
  similarity: number;
  isMatch: boolean;
  confidence: number;
}
