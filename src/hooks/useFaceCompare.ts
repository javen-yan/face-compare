import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { FaceCompare, FaceCompareOptions, FaceCompareEvents } from '../FaceCompare';
import { 
  FaceCompareConfig, 
  FaceCompareResult, 
  FaceInitResponse,
  SystemInfoResponse
} from '../types';

export interface UseFaceCompareOptions extends FaceCompareOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onStateChange?: (state: UseFaceCompareState) => void;
}

// 增强的错误类型
export interface UseFaceCompareError {
  type: 'INIT_ERROR' | 'COMPARE_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
}

export interface UseFaceCompareState {
  isLoading: boolean;
  error: UseFaceCompareError | null;
  result: FaceCompareResult | null;
  isInitialized: boolean;
  status: {
    isInitialized: boolean;
    userId: string | undefined; 
    apiEndpoint: string;
    options: Required<FaceCompareOptions>;
    insightFaceConfig: any;
    systemInfo?: any;
  };
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

export const useFaceCompare = (
  config: FaceCompareConfig, 
  options?: UseFaceCompareOptions,
  events?: FaceCompareEvents
) => {
  // 稳定化配置对象，避免不必要的重新初始化
  const stableConfig = useMemo(() => ({
    api: config.api,
    userId: config.userId,
    auth: config.auth
  }), [config.api, config.userId, config.auth]);

  // 稳定化选项对象
  const stableOptions = useMemo(() => ({
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    enableLogging: false,
    enableCache: true,
    cacheTTL: 300000,
    insightFace: {},
    ...options
  }), [options]);

  const [state, setState] = useState<UseFaceCompareState>({
    isLoading: false,
    error: null,
    result: null,
    isInitialized: false,
    status: {
      isInitialized: false,
      userId: undefined,
      apiEndpoint: stableConfig.api,
      options: stableOptions,
      insightFaceConfig: {}
    },
    progress: {
      current: 0,
      total: 0,
      percentage: 0
    },
  });

  const sdkRef = useRef<FaceCompare | null>(null);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // 错误处理工具函数
  const createError = useCallback((type: UseFaceCompareError['type'], message: string, details?: any): UseFaceCompareError => ({
    type,
    message,
    details,
    timestamp: Date.now()
  }), []);

  const setError = useCallback((error: UseFaceCompareError) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, error }));
    }
  }, []);

  // 进度更新工具函数
  const updateProgress = useCallback((current: number, total: number) => {
    if (isMountedRef.current) {
      const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
      setState(prev => ({
        ...prev,
        progress: { current, total, percentage }
      }));
    }
  }, []);

  // URL 验证辅助函数
  const isValidUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // 初始化 SDK
  useEffect(() => {
    // 验证配置
    if (!stableConfig.api || !isValidUrl(stableConfig.api)) {
      const error = createError('VALIDATION_ERROR', '无效的 API 端点 URL');
      setError(error);
      return;
    }

    if (!stableConfig.userId) {
      const error = createError('VALIDATION_ERROR', '用户 ID 是必需的');
      setError(error);
      return;
    }

    const sdk = new FaceCompare(stableConfig, stableOptions, {
      ...events,
      onInitStart: () => {
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, isLoading: true, error: null }));
          events?.onInitStart?.();
        }
      },
      onInitSuccess: (response: FaceInitResponse) => {
        if (isMountedRef.current) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isInitialized: true,
            status: sdk.getStatus()
          }));
          events?.onInitSuccess?.(response);
        }
      },
      onInitError: (error: Error) => {
        if (isMountedRef.current) {
          const sdkError = createError('INIT_ERROR', error.message, error);
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: sdkError
          }));
          events?.onInitError?.(error);
        }
      },
      onCompareStart: () => {
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, isLoading: true, error: null }));
          events?.onCompareStart?.();
        }
      },
      onCompareSuccess: (result: FaceCompareResult) => {
        if (isMountedRef.current) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            result,
            progress: { current: 1, total: 1, percentage: 100 }
          }));
          events?.onCompareSuccess?.(result);
        }
      },
      onCompareError: (error: Error) => {
        if (isMountedRef.current) {
          const sdkError = createError('COMPARE_ERROR', error.message, error);
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: sdkError
          }));
          events?.onCompareError?.(error);
        }
      },
      onBatchCompareStart: () => {
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, isLoading: true, error: null }));
          events?.onBatchCompareStart?.();
        }
      },
      onBatchCompareSuccess: (results: FaceCompareResult[]) => {
        if (isMountedRef.current) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            result: results[0] || null,
            progress: { current: results.length, total: results.length, percentage: 100 }
          }));
          events?.onBatchCompareSuccess?.(results);
        }
      },
      onBatchCompareError: (error: Error) => {
        if (isMountedRef.current) {
          const sdkError = createError('COMPARE_ERROR', error.message, error);
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: sdkError
          }));
          events?.onBatchCompareError?.(error);
        }
      },
      onError: (error: Error) => {
        if (isMountedRef.current) {
          const sdkError = createError('UNKNOWN_ERROR', error.message, error);
          setState(prev => ({ ...prev, error: sdkError }));
          events?.onError?.(error);
        }
      }
    });

    sdkRef.current = sdk;
    
    // 更新状态
    if (isMountedRef.current) {
      setState(prev => ({ 
        ...prev, 
        status: sdk.getStatus() 
      }));
    }

    return () => {
      // 增强清理逻辑
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (sdkRef.current) {
        sdkRef.current.clear();
        sdkRef.current = null;
      }
      retryCountRef.current = 0;
    };
  }, [stableConfig, stableOptions, events, createError, setError, isValidUrl]);

  // 组件卸载标记
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 状态变化回调
  useEffect(() => {
    if (options?.onStateChange && isMountedRef.current) {
      options.onStateChange(state);
    }
  }, [state, options?.onStateChange]);

  // 重试逻辑优化
  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = stableOptions.maxRetries || 3
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (retryCountRef.current < maxRetries && stableOptions.autoRetry !== false) {
        retryCountRef.current++;
        const delay = (stableOptions.retryDelay || 1000) * Math.pow(2, retryCountRef.current - 1); // 指数退避
        
        const retryError = createError('NETWORK_ERROR', `操作失败，${delay}ms 后重试 (${retryCountRef.current}/${maxRetries})`);
        setError(retryError);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, maxRetries);
      }
      throw error;
    } finally {
      retryCountRef.current = 0;
    }
  }, [stableOptions.autoRetry, stableOptions.maxRetries, stableOptions.retryDelay, createError, setError]);

  const record = useCallback(async (imageData: string): Promise<FaceInitResponse> => {
    if (!sdkRef.current) {
      const error = createError('VALIDATION_ERROR', 'SDK 未初始化');
      setError(error);
      throw new Error(error.message);
    }

    // 验证图片
    if (!sdkRef.current.validateImage(imageData)) {
      const error = createError('VALIDATION_ERROR', '图片格式无效或文件过大');
      setError(error);
      throw new Error(error.message);
    }

    return retryOperation(async () => {
      const response = await sdkRef.current!.record(imageData);
      return response;
    });
  }, [retryOperation, createError, setError]);

  const compare = useCallback(async (imageData: string, threshold?: number): Promise<FaceCompareResult> => {
    if (!sdkRef.current) {
      const error = createError('VALIDATION_ERROR', 'SDK 未初始化');
      setError(error);
      throw new Error(error.message);
    }

    if (!sdkRef.current.isInitialized()) {
      const error = createError('VALIDATION_ERROR', '请先初始化人脸数据');
      setError(error);
      throw new Error(error.message);
    }

    // 验证图片
    if (!sdkRef.current.validateImage(imageData)) {
      const error = createError('VALIDATION_ERROR', '图片格式无效或文件过大');
      setError(error);
      throw new Error(error.message);
    }

    return retryOperation(async () => {
      const result = await sdkRef.current!.compare(imageData, threshold);
      return result;
    });
  }, [retryOperation, createError, setError]);

  const compareBatch = useCallback(async (imageDataList: string[], threshold?: number): Promise<FaceCompareResult[]> => {
    if (!sdkRef.current) {
      const error = createError('VALIDATION_ERROR', 'SDK 未初始化');
      setError(error);
      throw new Error(error.message);
    }

    if (!sdkRef.current.isInitialized()) {
      const error = createError('VALIDATION_ERROR', '请先初始化人脸数据');
      setError(error);
      throw new Error(error.message);
    }

    // 验证所有图片
    const invalidImages = imageDataList.filter(img => !sdkRef.current!.validateImage(img));
    if (invalidImages.length > 0) {
      const error = createError('VALIDATION_ERROR', `${invalidImages.length} 张图片格式无效或文件过大`);
      setError(error);
      throw new Error(error.message);
    }

    if (isMountedRef.current) {
      setState(prev => ({ 
        ...prev, 
        isLoading: true,
        progress: { current: 0, total: imageDataList.length, percentage: 0 }
      }));
    }

    try {
      // 使用 InsightFace 的批量对比功能
      updateProgress(0, imageDataList.length);
      
      const results = await sdkRef.current!.compareBatch(imageDataList, threshold);
      
      updateProgress(results.length, imageDataList.length);

      if (isMountedRef.current) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          result: results[0] || null,
          progress: { current: results.length, total: imageDataList.length, percentage: 100 }
        }));
      }

      return results;
    } catch (error) {
      const sdkError = createError('COMPARE_ERROR', error instanceof Error ? error.message : '批量对比失败', error);
      setError(sdkError);
      
      if (isMountedRef.current) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false
        }));
      }
      
      throw error;
    }
  }, [createError, setError, updateProgress]);

  // InsightFace 新功能：获取用户信息
  const getUserInfo = useCallback(async (): Promise<any> => {
    if (!sdkRef.current) {
      const error = createError('VALIDATION_ERROR', 'SDK 未初始化');
      setError(error);
      throw new Error(error.message);
    }

    try {
      const response = await sdkRef.current.getUserInfo();
      return response;
    } catch (error) {
      const sdkError = createError('NETWORK_ERROR', error instanceof Error ? error.message : '获取用户信息失败', error);
      setError(sdkError);
      throw error;
    }
  }, [createError, setError]);

  // InsightFace 新功能：获取系统信息
  const getSystemInfo = useCallback(async (): Promise<SystemInfoResponse> => {
    if (!sdkRef.current) {
      const error = createError('VALIDATION_ERROR', 'SDK 未初始化');
      setError(error);
      throw new Error(error.message);
    }

    try {
      const response = await sdkRef.current.getSystemInfo();
      if (isMountedRef.current) {
        setState(prev => ({ 
          ...prev, 
          status: { ...prev.status, systemInfo: response.data }
        }));
      }
      return response;
    } catch (error) {
      const sdkError = createError('NETWORK_ERROR', error instanceof Error ? error.message : '获取系统信息失败', error);
      setError(sdkError);
      throw error;
    }
  }, [createError, setError]);

  // InsightFace 新功能：健康检查
  const healthCheck = useCallback(async (): Promise<any> => {
    if (!sdkRef.current) {
      const error = createError('VALIDATION_ERROR', 'SDK 未初始化');
      setError(error);
      throw new Error(error.message);
    }

    try {
      const response = await sdkRef.current.healthCheck();
      return response;
    } catch (error) {
      const sdkError = createError('NETWORK_ERROR', error instanceof Error ? error.message : '健康检查失败', error);
      setError(sdkError);
      throw error;
    }
  }, [createError, setError]);

  const clear = useCallback(() => {
    if (sdkRef.current) {
      sdkRef.current.clear();
      if (isMountedRef.current) {
        setState(prev => ({ 
          ...prev, 
          isInitialized: false,
          result: null,
          error: null,
          status: sdkRef.current!.getStatus(),
          progress: { current: 0, total: 0, percentage: 0 }
        }));
      }
    }
  }, []);

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState(prev => ({ 
        ...prev, 
        error: null,
        result: null,
        progress: { current: 0, total: 0, percentage: 0 }
      }));
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<FaceCompareConfig>) => {
    if (sdkRef.current) {
      // 验证配置
      if (newConfig.api && !isValidUrl(newConfig.api)) {
        const error = createError('VALIDATION_ERROR', '无效的 API 端点 URL');
        setError(error);
        throw new Error(error.message);
      }
      
      sdkRef.current.updateConfig(newConfig);
      if (isMountedRef.current) {
        setState(prev => ({ 
          ...prev, 
          status: sdkRef.current!.getStatus() 
        }));
      }
    }
  }, [createError, setError, isValidUrl]);

  const updateOptions = useCallback((newOptions: Partial<UseFaceCompareOptions>) => {
    if (sdkRef.current) {
      sdkRef.current.updateOptions(newOptions);
      if (isMountedRef.current) {
        setState(prev => ({ 
          ...prev, 
          status: sdkRef.current!.getStatus() 
        }));
      }
    }
  }, []);

  const getStatus = useCallback(() => {
    return sdkRef.current?.getStatus();
  }, []);

  const validateImage = useCallback((imageData: string) => {
    return sdkRef.current?.validateImage(imageData) || false;
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, error: null }));
    }
  }, []);

  return {
    // SDK 实例
    sdk: sdkRef.current,
    
    // 状态
    ...state,
    
    // 基础操作方法
    record,
    compare,
    compareBatch,
    clear,
    reset,
    
    // InsightFace 新功能
    getUserInfo,
    getSystemInfo,
    healthCheck,
    
    // 配置方法
    updateConfig,
    updateOptions,
    
    // 工具方法
    getStatus,
    validateImage,
    clearError,
    
    // 进度信息
    progress: state.progress
  };
};
