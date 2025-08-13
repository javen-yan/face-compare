import { FaceCompare } from './FaceCompare';

// 导出核心类
export { FaceCompare } from './FaceCompare';

// 导出类型定义
export type {
  FaceCompareConfig,
  FaceInitResponse,
  FaceCompareResponse,
  FaceCompareResult,
  CameraModalProps,
  CameraModalConfig
} from './types';

// 导出 FaceCompare 类的接口
export type {
  FaceCompareOptions,
  FaceCompareEvents
} from './FaceCompare';

// 导出 React Hook
export { useFaceCompare } from './hooks/useFaceCompare';

// 导出 Hook 的类型
export type {
  UseFaceCompareOptions,
  UseFaceCompareState
} from './hooks/useFaceCompare';

// 导出 React 组件
export { InsightFaceComponent } from './components/InsightFaceComponent';
export { default as CameraModal } from './components/CameraModal';

// 导出组件的类型
export type {
  InsightFaceComponentProps
} from './components/InsightFaceComponent';

export type {
  CameraModalConfig as CameraModalConfigType,
  CameraModalTheme
} from './components/CameraModal';

// 默认导出
export default FaceCompare;
