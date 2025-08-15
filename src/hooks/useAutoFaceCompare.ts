import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { FaceCompare, FaceCompareOptions } from '../FaceCompare';
import { FaceCompareConfig, FaceCompareResult, FaceInitResponse } from '../types';

export interface UseAutoFaceCompareOptions {
  faceCompareConfig: FaceCompareConfig;
  faceCompareOptions?: FaceCompareOptions;
  onCapture?: (imageData: string) => void;
  onFaceDetected?: (imageData: string) => void;
  onCompareResult?: (result: FaceCompareResult) => void;
  onError?: (error: Error) => void;
  autoCloseAfterCapture?: boolean;
  autoCloseAfterCompare?: boolean;
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
  data?: FaceCompareResult | FaceInitResponse;
  error?: string;
}

export interface UseAutoFaceCompareReturn {
  // 摄像头相关
  isCameraOpen: boolean;
  capturedImage: string | null;
  
  // 人脸识别相关
  isInitialized: boolean;
  isComparing: boolean;
  compareResult: CompareResult | null;
  error: AutoFaceCompareError | null;
  
  // 智能流程管理
  autoCompare: () => Promise<void>;
  
  // 模态框属性
  modalProps: {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageData: string) => void;
    config?: any;
  };
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
    onCapture,
    onFaceDetected,
    onCompareResult,
    onError,
    autoCloseAfterCapture = false,
    autoCloseAfterCompare = false,
    cameraConfig = {},
    retryCount = 3,
    retryDelay = 1000,
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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<AutoFaceCompareError | null>(null);

  // 引用管理
  const faceCompareRef = useRef<FaceCompare | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);

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
    if (isMountedRef.current) {
      setError(error);
      onError?.(new Error(error.message));
    }
  }, [onError]);

  // 组件卸载标记
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
  }, [stableConfig, stableOptions, createError, setErrorState, log]);

  // 重试逻辑
  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = retryCount
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      log(`操作失败，错误详情:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        retryCount: retryCountRef.current,
        maxRetries
      });
      
      // 检查是否是验证错误，如果是则不重试
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('请先初始化人脸数据') || 
          errorMessage.includes('SDK 未初始化') ||
          errorMessage.includes('未初始化')) {
        log('检测到验证错误，不进行重试');
        throw error;
      }
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = retryDelay * Math.pow(2, retryCountRef.current - 1); // 指数退避
        
        log(`操作失败，${delay}ms 后重试 (${retryCountRef.current}/${maxRetries})`);
        
        const retryError = createError('NETWORK_ERROR', `操作失败，${delay}ms 后重试 (${retryCountRef.current}/${maxRetries})`);
        setErrorState(retryError);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, maxRetries);
      }
      
      log(`操作最终失败，已达到最大重试次数 ${maxRetries}`, {
        finalError: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw error;
    } finally {
      retryCountRef.current = 0;
    }
  }, [retryCount, retryDelay, createError, setErrorState, log]);

  // 关闭摄像头
  const closeCamera = useCallback(() => {
    log('关闭摄像头');
    setIsCameraOpen(false);
    if (isMountedRef.current) {
      setIsComparing(false);
      log('关闭摄像头时重置 isComparing 状态');
    }
  }, [log]);

  // 处理初始化的内部函数
  const handleInit = useCallback(async (imageData: string): Promise<FaceInitResponse> => {
    log('开始初始化人脸数据');
    
    try {
      setIsComparing(true);
      setError(null);
      
      const faceCompare = getFaceCompare();
      const response = await retryOperation(async () => {
        return await faceCompare.record(imageData);
      });
      
      const result: CompareResult = { 
        type: 'init', 
        success: true, 
        data: response 
      };
      
      if (isMountedRef.current) {
        setIsInitialized(true);
        setCompareResult(result);
        log('初始化结果已设置到状态:', result);
      }
      
      log('初始化成功', result);
      
      // 延迟关闭摄像头以确保结果能显示
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsCameraOpen(false);
          log('延迟关闭摄像头完成');
        }
      }, 3000);
      
      return response;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('初始化失败');
      const sdkError = createError('INIT_ERROR', errorObj.message, errorObj);
      setErrorState(sdkError);
      throw errorObj;
    } finally {
      if (isMountedRef.current) {
        setIsComparing(false);
        log('初始化完成，重置 isComparing 状态');
      }
    }
  }, [getFaceCompare, retryOperation, createError, setErrorState, log]);

  // 处理对比的内部函数
  const handleCompare = useCallback(async (imageData: string) => {
    log('开始人脸对比', {
      imageDataLength: imageData.length,
      imageDataStart: imageData.substring(0, 50) + '...'
    });
    
    try {
      setIsComparing(true);
      setError(null);
      
      const faceCompare = getFaceCompare();
      log('调用 FaceCompare.compare 方法');
      
      const result = await retryOperation(async () => {
        log('执行对比操作...');
        return await faceCompare.compare(imageData);
      });
      
      const compareResult: CompareResult = { 
        type: 'compare', 
        success: true, 
        data: result 
      };
      
      if (isMountedRef.current) {
        setCompareResult(compareResult);
        onCompareResult?.(result);
        log('对比结果已设置到状态:', compareResult);
      }
      
      log('对比成功', compareResult);
      
      // 延迟关闭摄像头以确保结果能显示
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsCameraOpen(false);
          log('延迟关闭摄像头完成');
        }
      }, 3000);
      
      return result;
    } catch (error) {
      log('对比操作最终失败', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorObj = error instanceof Error ? error : new Error('对比失败');
      const sdkError = createError('COMPARE_ERROR', errorObj.message, errorObj);
      setErrorState(sdkError);
      throw errorObj;
    } finally {
      if (isMountedRef.current) {
        setIsComparing(false);
        log('对比完成，重置 isComparing 状态');
      }
    }
  }, [getFaceCompare, retryOperation, createError, setErrorState, onCompareResult, log]);

  // 处理拍照
  const handleCapture = useCallback(async (imageData: string) => {
    log('处理拍照', { imageDataLength: imageData.length });
    
    setCapturedImage(imageData);
    setError(null);
    
    onCapture?.(imageData);
    onFaceDetected?.(imageData);

    // 拍照完成后立即处理请求
    try {
      // 检查用户是否存在
      const faceCompare = getFaceCompare();
      let userExists = false;
      
      try {
        await faceCompare.getUserInfo();
        userExists = true;
        log('用户记录存在，假设已初始化人脸数据');
      } catch (error) {
        userExists = false;
        log('用户不存在，需要录制人脸');
      }

      if (userExists) {
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
      if (isMountedRef.current) {
        setIsComparing(false);
        log('操作失败，重置 isComparing 状态');
      }
    }
  }, [onCapture, onFaceDetected, getFaceCompare, handleInit, handleCompare, log]);

  // 智能流程管理：自动判断是录制还是对比
  const autoCompare = useCallback(async () => {
    log('启动智能流程');
    
    try {
      setError(null);
      setIsComparing(true);
      
      // 获取 FaceCompare 实例
      const faceCompare = getFaceCompare();
      
      // 检查用户是否存在
      let userExists = false;
      
      try {
        await faceCompare.getUserInfo();
        userExists = true;
        log('用户记录存在，假设已初始化人脸数据');
      } catch (error) {
        userExists = false;
        log('用户不存在，需要录制人脸');
      }

      if (userExists) {
        // 用户存在，假设已初始化，开始对比流程
        log('开始人脸对比流程');
      } else {
        // 用户不存在，开始录制流程
        log('开始人脸录制流程');
      }
      
      // 打开摄像头
      setIsCameraOpen(true);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('智能流程启动失败');
      const sdkError = createError('UNKNOWN_ERROR', errorObj.message, errorObj);
      setErrorState(sdkError);
      if (isMountedRef.current) {
        setIsComparing(false);
      }
      throw errorObj;
    }
  }, [getFaceCompare, createError, setErrorState, log]);

  // 模态框属性
  const modalProps = useMemo(() => ({
    isOpen: isCameraOpen,
    onClose: closeCamera,
    onCapture: handleCapture,
    config: cameraConfig
  }), [isCameraOpen, closeCamera, handleCapture, cameraConfig]);

  return {
    // 摄像头相关
    isCameraOpen,
    capturedImage,
    
    // 人脸识别相关
    isInitialized,
    isComparing,
    compareResult,
    error,
    
    // 智能流程管理
    autoCompare,
    
    // 模态框属性
    modalProps
  };
}
