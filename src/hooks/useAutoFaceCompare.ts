import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { FaceCompare, FaceCompareOptions } from '../FaceCompare';
import { FaceCompareConfig, FaceCompareResult, FaceInitResponse, CameraModalProps } from '../types';

// 增强的错误类型
export interface AutoFaceCompareError {
  type: 'CAMERA_ERROR' | 'INIT_ERROR' | 'COMPARE_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
}

// 结果类型
export interface CompareResult {
  type: 'init' | 'compare';
  success: boolean;
  imageData: string;
  data?: FaceCompareResult | FaceInitResponse;
  error?: string;
}

export interface UseAutoFaceCompareOptions {
  faceCompareConfig: FaceCompareConfig;
  faceCompareOptions?: FaceCompareOptions;
  onResult?: (result: CompareResult) => void;
  onError?: (error: Error) => void;
  cameraConfig?: {
    width?: number;
    height?: number;
    quality?: number;
    facingMode?: 'user' | 'environment';
  };
  retryCount?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

export interface UseAutoFaceCompareReturn {
  isComparing: boolean;
  autoCompare: () => Promise<void>;
  cameraModalProps: () => CameraModalProps | null;
}

/**
 * 智能人脸识别流程管理 Hook
 * 自动判断用户是否需要录制人脸还是进行人脸对比
 * @param options 配置选项
 * @returns 人脸识别和摄像头状态
 */
export function useAutoFaceCompare(options: UseAutoFaceCompareOptions): UseAutoFaceCompareReturn {
  const {
    faceCompareConfig,
    faceCompareOptions = {},
    onResult,
    onError,
    cameraConfig = {},
    enableLogging = false
  } = options;

  // 稳定化配置对象
  const stableConfig = useMemo(() => ({
    api: faceCompareConfig.api,
    userId: faceCompareConfig.userId,
    auth: faceCompareConfig.auth
  }), [faceCompareConfig.api, faceCompareConfig.userId, faceCompareConfig.auth]);

  const stableOptions = useMemo(() => ({
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    enableLogging: false,
    enableCache: true,
    cacheTTL: 300000,
    insightFace: {},
    ...faceCompareOptions
  }), [faceCompareOptions]);

  // 状态管理
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [step, setStep] = useState<'init' | 'compare'>('init');

  // 引用管理
  const faceCompareRef = useRef<FaceCompare | null>(null);

  // 日志函数
  const log = useCallback((message: string, data?: any) => {
    if (enableLogging) {
      console.log(`[useAutoFaceCompare] ${message}`, data || '');
    }
  }, [enableLogging]);

  // 错误处理工具函数
  const createError = useCallback((type: AutoFaceCompareError['type'], message: string, details?: any): AutoFaceCompareError => ({
    type,
    message,
    details,
    timestamp: Date.now()
  }), []);

  const setErrorState = useCallback((error: AutoFaceCompareError) => {
    onError?.(new Error(error.message));
  }, [onError]);

  // 监听摄像头状态变化，确保状态同步
  useEffect(() => {
    if (!isCameraOpen && isComparing) {
      log('摄像头关闭但 isComparing 仍为 true，强制重置状态');
      setIsComparing(false);
    }
  }, [isCameraOpen, isComparing, log]);

  // 初始化 FaceCompare 实例
  const getFaceCompare = useCallback(() => {
    if (!faceCompareRef.current) {
      log('初始化 FaceCompare 实例');
      faceCompareRef.current = new FaceCompare(
        stableConfig,
        stableOptions,
        {
          onError: (error) => {
            const sdkError = createError('NETWORK_ERROR', error.message, error);
            setErrorState(sdkError);
          }
        }
      );
    }
    return faceCompareRef.current;
  }, [stableConfig, stableOptions, createError, log]);

  // 关闭摄像头
  const closeCamera = useCallback(() => {
    log('关闭摄像头,重置 isComparing 状态');
    setIsCameraOpen(false);
    setIsComparing(false);
  }, [log]);

  // 处理初始化的内部函数
  const handleInit = useCallback(async (imageData: string): Promise<FaceInitResponse> => {
    log('开始初始化人脸数据');
    
    try {
      setIsComparing(true);
      
      const faceCompare = getFaceCompare();
      const response = await faceCompare.record(imageData);
      
      const result: CompareResult = { 
        type: 'init', 
        success: true, 
        imageData,
        data: response 
      };
      
      onResult?.(result);
      log('初始化成功', result);      
      return response;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('初始化失败');
      const sdkError = createError('INIT_ERROR', errorObj.message, errorObj);
      setErrorState(sdkError);
      
      // 创建失败结果并触发回调
      const failedResult: CompareResult = {
        type: 'init',
        success: false,
        imageData,
        error: errorObj.message
      };
      
      onResult?.(failedResult);
      
      throw errorObj;
    } finally {
      setIsComparing(false);
      log('初始化完成，重置 isComparing 状态');
    }
  }, [getFaceCompare, createError, setErrorState, onResult, log]);

  // 处理对比的内部函数
  const handleCompare = useCallback(async (imageData: string) => {
    log('开始人脸对比', {
      imageDataLength: imageData.length,
      imageDataStart: imageData.substring(0, 50) + '...'
    });
    
    try {
      setIsComparing(true);
      
      const faceCompare = getFaceCompare();
      log('调用 FaceCompare.compare 方法');
      
      const result = await faceCompare.compare(imageData);
      
      const compareResult: CompareResult = { 
        type: 'compare', 
        success: true, 
        imageData,
        data: result 
      };
      
      onResult?.(compareResult);
      log('对比成功', compareResult);
      return result;
    } catch (error) {
      log('对比操作最终失败', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorObj = error instanceof Error ? error : new Error('对比失败');
      const sdkError = createError('COMPARE_ERROR', errorObj.message, errorObj);
      setErrorState(sdkError);
      
      // 创建失败结果并触发回调
      const failedResult: CompareResult = {
        type: 'compare',
        success: false,
        imageData,
        error: errorObj.message
      };
      
      onResult?.(failedResult);
      
      throw errorObj;
    } finally {
      setIsComparing(false);
      log('对比完成，重置 isComparing 状态');
    }
  }, [getFaceCompare, createError, setErrorState, onResult, log]);

  // 处理拍照
  const handleCapture = useCallback(async (imageData: string) => {
    log('处理拍照', { imageDataLength: imageData.length });
    
    // 拍照完成后立即处理请求
    try {
      if (step === 'compare') {
        // 用户存在，假设已初始化，开始对比流程
        log('开始人脸对比流程');
        await handleCompare(imageData);
      } else {
        // 用户不存在，开始录制流程
        log('开始人脸录制流程');
        await handleInit(imageData);
      }
    } catch (error) {
      log('自动流程失败', error);
      setIsComparing(false);
      log('操作失败，重置 isComparing 状态');
    }
  }, [step, handleInit, handleCompare, log]);

  // 智能流程管理：自动判断是录制还是对比
  const autoCompare = useCallback(async () => {
    log('启动智能流程');
    
    try {
      setIsComparing(true);
      
      // 获取 FaceCompare 实例
      const faceCompare = getFaceCompare();
      
      // 检查用户是否存在
      try {
        await faceCompare.getUserInfo();
        setStep('compare');
        log('用户记录存在，设置为对比模式');
      } catch (error) {
        setStep('init');
        log('用户不存在，设置为初始化模式');
      }
      
      // 打开摄像头
      setIsCameraOpen(true);
      log('摄像头已打开，等待用户操作');
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('智能流程启动失败');
      const sdkError = createError('UNKNOWN_ERROR', errorObj.message, errorObj);
      setErrorState(sdkError);
      throw errorObj;
    } finally {
      // 流程启动完成，重置比较状态
      setIsComparing(false);
      log('智能流程启动完成');
    }
  }, [getFaceCompare, createError, setErrorState, log]);

  // 渲染 CameraModal 的方法
  const cameraModalProps = useCallback(() => {
    if (!isCameraOpen) return null;
    
    return {
      isOpen: isCameraOpen,
      onClose: closeCamera,
      onCapture: handleCapture,
      config: cameraConfig,
      title: step === 'init' ? '采集人脸' : '对比人脸'
    };
  }, [isCameraOpen, closeCamera, handleCapture, cameraConfig, step]);

  return {
    isComparing,
    autoCompare,
    cameraModalProps
  };
}
