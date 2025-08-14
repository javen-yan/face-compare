import { useState, useCallback, useRef } from 'react';
import { FaceCompare, FaceCompareOptions } from '../FaceCompare';
import { FaceCompareConfig } from '../types';

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
  
  // 智能流程管理
  autoCompare: () => Promise<void>;
  
  // 手动控制方法
  record: () => Promise<void>;
  compare: () => Promise<any>;
  
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
    cameraConfig = {}
  } = options;

  // 状态管理
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  // FaceCompare 实例引用
  const faceCompareRef = useRef<FaceCompare | null>(null);
  // 使用ref来跟踪最新的图片数据，避免状态同步问题
  const latestImageRef = useRef<string | null>(null);
  // 跟踪当前操作类型
  const currentOperationRef = useRef<'record' | 'compare' | null>(null);

  // 初始化 FaceCompare 实例
  const getFaceCompare = useCallback(() => {
    if (!faceCompareRef.current) {
      faceCompareRef.current = new FaceCompare(
        faceCompareConfig,
        faceCompareOptions,
        {
          onError: (error) => {
            setError(error);
            onError?.(error);
          }
        }
      );
    }
    return faceCompareRef.current;
  }, [faceCompareConfig, faceCompareOptions, onError]);

  // 摄像头控制
  const openCamera = useCallback(() => {
    setIsCameraOpen(true);
    setError(null);
  }, []);

  const closeCamera = useCallback(() => {
    setIsCameraOpen(false);
  }, []);

  const clearImage = useCallback(() => {
    setCapturedImage(null);
    setCompareResult(null);
    latestImageRef.current = null;
  }, []);

  // 处理拍照
  const handleCapture = useCallback(async (imageData: string) => {
    setCapturedImage(imageData);
    latestImageRef.current = imageData;
    setError(null);
    onCapture?.(imageData);
    onFaceDetected?.(imageData);

    // 拍照完成后立即处理请求，不需要等待用户确认
    // 如果启用了自动关闭
    if (autoCloseAfterCapture) {
      setIsCameraOpen(false);
    }

    // 如果有待处理的操作，立即执行
    if (currentOperationRef.current) {
      const operation = currentOperationRef.current;
      currentOperationRef.current = null; // 清除操作标记
      
      try {
        if (operation === 'record') {
          await handleInit(imageData);
        } else if (operation === 'compare') {
          await handleCompare(imageData);
        }
      } catch (error) {
        console.error(`自动${operation === 'record' ? '初始化' : '对比'}失败:`, error);
      }
    }
  }, [autoCloseAfterCapture, onCapture, onFaceDetected]);

  // 处理初始化的内部函数
  const handleInit = async (imageData: string) => {
    try {
      setIsComparing(true);
      setError(null);
      
      const faceCompare = getFaceCompare();
      await faceCompare.record(imageData);
      
      setIsInitialized(true);
      setCompareResult({ type: 'init', success: true });
      
      // 如果启用了自动关闭
      if (autoCloseAfterCapture) {
        setIsCameraOpen(false);
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('初始化失败');
      setError(errorObj);
      onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsComparing(false);
    }
  };

  // 处理对比的内部函数
  const handleCompare = async (imageData: string) => {
    try {
      setIsComparing(true);
      setError(null);
      
      const faceCompare = getFaceCompare();
      const result = await faceCompare.compare(imageData);
      
      setCompareResult({ type: 'compare', ...result });
      onCompareResult?.(result);
      
      // 如果启用了自动关闭
      if (autoCloseAfterCompare) {
        setIsCameraOpen(false);
      }
      
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('对比失败');
      setError(errorObj);
      onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsComparing(false);
    }
  };

  // 智能流程管理：自动判断是录制还是对比
  const autoCompare = useCallback(async () => {
    try {
      setError(null);
      
      // 首先尝试获取用户信息
      const faceCompare = getFaceCompare();
      let userExists = false;
      
      try {
        await faceCompare.getUserInfo();
        userExists = true;
        console.log('用户已存在，开始人脸对比流程');
      } catch (error) {
        // 用户不存在，需要录制人脸
        userExists = false;
        console.log('用户不存在，开始人脸录制流程');
      }

      if (userExists) {
        // 用户已存在，开始对比流程
        currentOperationRef.current = 'compare';
        openCamera();
      } else {
        // 用户不存在，开始录制流程
        currentOperationRef.current = 'record';
        openCamera();
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('智能流程启动失败');
      setError(errorObj);
      onError?.(errorObj);
      throw errorObj;
    }
  }, [getFaceCompare, openCamera, onError]);

  // 手动录制人脸数据（自动打开摄像头）
  const record = useCallback(async () => {
    // 如果已经有图片，直接处理
    if (latestImageRef.current) {
      return handleInit(latestImageRef.current);
    }

    // 标记当前操作为初始化
    currentOperationRef.current = 'record';
    
    // 自动打开摄像头
    openCamera();
    
    // 等待摄像头打开并拍照完成
    return new Promise<void>((resolve, reject) => {
      const checkCamera = () => {
        if (isCameraOpen) {
          // 摄像头已打开，等待拍照完成
          const checkImage = () => {
            if (latestImageRef.current && currentOperationRef.current === 'record') {
              // 有图片了，开始初始化
              handleInit(latestImageRef.current!)
                .then(resolve)
                .catch(reject);
            } else {
              // 继续等待
              setTimeout(checkImage, 100);
            }
          };
          checkImage();
        } else {
          // 等待摄像头打开
          setTimeout(checkCamera, 100);
        }
      };
      checkCamera();
    });
  }, [openCamera, isCameraOpen, handleInit]);

  // 手动人脸对比（自动打开摄像头）
  const compare = useCallback(async () => {
    // 如果已经有图片，直接处理
    if (latestImageRef.current) {
      return handleCompare(latestImageRef.current);
    }

    // 标记当前操作为对比
    currentOperationRef.current = 'compare';
    
    // 自动打开摄像头
    openCamera();
    
    // 等待摄像头打开并拍照完成
    return new Promise<any>((resolve, reject) => {
      const checkCamera = () => {
        if (isCameraOpen) {
          // 摄像头已打开，等待拍照完成
          const checkImage = () => {
            if (latestImageRef.current && currentOperationRef.current === 'compare') {
              // 有图片了，开始对比
              handleCompare(latestImageRef.current!)
                .then(resolve)
                .catch(reject);
            } else {
              // 继续等待
              setTimeout(checkImage, 100);
            }
          };
          checkImage();
        } else {
          // 等待摄像头打开
          setTimeout(checkCamera, 100);
        }
      };
      checkCamera();
    });
  }, [openCamera, isCameraOpen, handleCompare]);

  // 模态框属性
  const modalProps = {
    isOpen: isCameraOpen,
    onClose: closeCamera,
    onCapture: handleCapture,
    config: cameraConfig
  };

  return {
    // 摄像头相关
    isCameraOpen,
    capturedImage,
    clearImage,
    
    // 人脸识别相关
    isInitialized,
    isComparing,
    compareResult,
    error,
    
    // 智能流程管理
    autoCompare,
    
    // 手动控制方法
    record,
    compare,
    
    // 手动控制
    openCamera,
    closeCamera,
    
    // 模态框属性
    modalProps
  };
}
