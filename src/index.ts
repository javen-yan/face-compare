// 导出核心类
export { FaceCompare } from './FaceCompare';

// 导出类型定义
export type {
  FaceCompareConfig,
  FaceInitResponse,
  FaceCompareResponse,
  FaceCompareResult,
  FaceCompareBatchResponse,
  FaceCompareBatchResultItem,
  FaceCompareBatchErrorItem,
  SystemInfoResponse,
  InsightFaceConfig,
  CameraModalProps,
  CameraModalConfig
} from './types';

// 导出类相关的类型
export type {
  FaceCompareOptions,
  FaceCompareEvents
} from './FaceCompare';

// 导出 React 组件
export { default as CameraModal } from './components/CameraModal';

// 导出 React Hook
export { useFaceCompare } from './hooks/useFaceCompare';
export { useAutoFaceCompare } from './hooks/useAutoFaceCompare';

export type {
  UseFaceCompareOptions,
  UseFaceCompareState
} from './hooks/useFaceCompare';

export type {
  UseAutoFaceCompareOptions,
  UseAutoFaceCompareReturn
} from './hooks/useAutoFaceCompare';

// 默认导出核心类
export { FaceCompare as default } from './FaceCompare';
