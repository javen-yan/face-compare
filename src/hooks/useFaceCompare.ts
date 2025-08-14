import { useState, useCallback, useRef, useEffect } from 'react';
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
  onStateChange?: (state: UseFaceCompareState) => void;
}

export interface UseFaceCompareState {
  isLoading: boolean;
  error: string | null;
  result: FaceCompareResult | null;
  isInitialized: boolean;
  status: {
    isInitialized: boolean;
    userId: string | undefined;
    hasFaceData: boolean;
    apiEndpoint: string;
    options: Required<FaceCompareOptions>;
    insightFaceConfig: any;
  };
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  systemInfo: any;
}

export const useFaceCompare = (
  config: FaceCompareConfig, 
  options?: UseFaceCompareOptions,
  events?: FaceCompareEvents
) => {
  const [state, setState] = useState<UseFaceCompareState>({
    isLoading: false,
    error: null,
    result: null,
    isInitialized: false,
    status: {
      isInitialized: false,
      userId: undefined,
      hasFaceData: false,
      apiEndpoint: config.api,
      options: {
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000,
        enableLogging: false,
        insightFace: {}
      },
      insightFaceConfig: {}
    },
    progress: {
      current: 0,
      total: 0,
      percentage: 0
    },
    systemInfo: null,
  });

  const sdkRef = useRef<FaceCompare | null>(null);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 初始化 SDK
  useEffect(() => {
    const sdk = new FaceCompare(config, options, {
      ...events,
      onInitStart: () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        events?.onInitStart?.();
      },
      onInitSuccess: (response) => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          isInitialized: true,
          status: sdk.getStatus()
        }));
        events?.onInitSuccess?.(response);
      },
      onInitError: (error) => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }));
        events?.onInitError?.(error);
      },
      onCompareStart: () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        events?.onCompareStart?.();
      },
      onCompareSuccess: (result) => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          result,
          progress: { current: 1, total: 1, percentage: 100 }
        }));
        events?.onCompareSuccess?.(result);
      },
      onCompareError: (error) => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }));
        events?.onCompareError?.(error);
      },
      onBatchCompareStart: () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        events?.onBatchCompareStart?.();
      },
      onBatchCompareSuccess: (results) => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          result: results[0] || null,
          progress: { current: results.length, total: results.length, percentage: 100 }
        }));
        events?.onBatchCompareSuccess?.(results);
      },
      onBatchCompareError: (error) => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }));
        events?.onBatchCompareError?.(error);
      },
      onError: (error) => {
        setState(prev => ({ ...prev, error: error.message }));
        events?.onError?.(error);
      }
    });

    sdkRef.current = sdk;
    
    // 更新状态
    setState(prev => ({ 
      ...prev, 
      status: sdk.getStatus() 
    }));

    return () => {
      // 清理资源
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [config.api, config.auth]);

  // 状态变化回调
  useEffect(() => {
    if (options?.onStateChange) {
      options.onStateChange(state);
    }
  }, [state, options?.onStateChange]);

  // 重试逻辑
  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = options?.maxRetries || 3
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (retryCountRef.current < maxRetries && options?.autoRetry !== false) {
        retryCountRef.current++;
        const delay = (options?.retryDelay || 1000) * retryCountRef.current;
        
        setState(prev => ({ 
          ...prev, 
          error: `操作失败，${delay}ms 后重试 (${retryCountRef.current}/${maxRetries})` 
        }));
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, maxRetries);
      }
      throw error;
    } finally {
      retryCountRef.current = 0;
    }
  }, [options?.autoRetry, options?.maxRetries, options?.retryDelay]);

  const record = useCallback(async (imageData: string): Promise<FaceInitResponse> => {
    if (!sdkRef.current) {
      throw new Error('SDK 未初始化');
    }

    // 验证图片
    if (!sdkRef.current.validateImage(imageData)) {
      const error = new Error('图片格式无效或文件过大');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    return retryOperation(async () => {
      const response = await sdkRef.current!.record(imageData);
      return response;
    });
  }, [retryOperation]);

  const compare = useCallback(async (imageData: string, threshold?: number): Promise<FaceCompareResult> => {
    if (!sdkRef.current) {
      throw new Error('SDK 未初始化');
    }

    if (!sdkRef.current.isInitialized()) {
      throw new Error('请先初始化人脸数据');
    }

    // 验证图片
    if (!sdkRef.current.validateImage(imageData)) {
      const error = new Error('图片格式无效或文件过大');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    return retryOperation(async () => {
      const result = await sdkRef.current!.compare(imageData, threshold);
      return result;
    });
  }, [retryOperation]);

  const compareBatch = useCallback(async (imageDataList: string[], threshold?: number): Promise<FaceCompareResult[]> => {
    if (!sdkRef.current) {
      throw new Error('SDK 未初始化');
    }

    if (!sdkRef.current.isInitialized()) {
      throw new Error('请先初始化人脸数据');
    }

    // 验证所有图片
    const invalidImages = imageDataList.filter(img => !sdkRef.current!.validateImage(img));
    if (invalidImages.length > 0) {
      const error = new Error(`${invalidImages.length} 张图片格式无效或文件过大`);
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true,
      progress: { current: 0, total: imageDataList.length, percentage: 0 }
    }));

    try {
      // 使用 InsightFace 的批量对比功能
      const results = await sdkRef.current!.compareBatch(imageDataList, threshold);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        result: results[0] || null,
        progress: { current: results.length, total: imageDataList.length, percentage: 100 }
      }));

      return results;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : '批量对比失败'
      }));
      throw error;
    }
  }, []);

  // InsightFace 新功能：获取用户信息
  const getUserInfo = useCallback(async (): Promise<any> => {
    if (!sdkRef.current) {
      throw new Error('SDK 未初始化');
    }

    try {
      const response = await sdkRef.current.getUserInfo();
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // InsightFace 新功能：获取系统信息
  const getSystemInfo = useCallback(async (): Promise<SystemInfoResponse> => {
    if (!sdkRef.current) {
      throw new Error('SDK 未初始化');
    }

    try {
      const response = await sdkRef.current.getSystemInfo();
      setState(prev => ({ ...prev, systemInfo: response.data }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取系统信息失败';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // InsightFace 新功能：健康检查
  const healthCheck = useCallback(async (): Promise<any> => {
    if (!sdkRef.current) {
      throw new Error('SDK 未初始化');
    }

    try {
      const response = await sdkRef.current.healthCheck();
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '健康检查失败';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const clear = useCallback(() => {
    if (sdkRef.current) {
      sdkRef.current.clear();
      setState(prev => ({ 
        ...prev, 
        isInitialized: false,
        result: null,
        error: null,
        status: sdkRef.current!.getStatus(),
        progress: { current: 0, total: 0, percentage: 0 }
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      error: null,
      result: null,
      progress: { current: 0, total: 0, percentage: 0 }
    }));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<FaceCompareConfig>) => {
    if (sdkRef.current) {
      sdkRef.current.updateConfig(newConfig);
      setState(prev => ({ 
        ...prev, 
        status: sdkRef.current!.getStatus() 
      }));
    }
  }, []);

  const updateOptions = useCallback((newOptions: Partial<UseFaceCompareOptions>) => {
    if (sdkRef.current) {
      sdkRef.current.updateOptions(newOptions);
      setState(prev => ({ 
        ...prev, 
        status: sdkRef.current!.getStatus() 
      }));
    }
  }, []);

  const getStatus = useCallback(() => {
    return sdkRef.current?.getStatus();
  }, []);

  const validateImage = useCallback((imageData: string) => {
    return sdkRef.current?.validateImage(imageData) || false;
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
    
    // 进度信息
    progress: state.progress
  };
};
