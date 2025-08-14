import { 
  FaceCompareConfig, 
  FaceInitResponse, 
  FaceCompareResult,
  FaceCompareBatchResultItem,
  SystemInfoResponse,
  InsightFaceConfig,
  UserInfo
} from './types';

export interface FaceCompareOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  insightFace?: InsightFaceConfig;
}

export interface FaceCompareEvents {
  onInitStart?: () => void;
  onInitSuccess?: (response: FaceInitResponse) => void;
  onInitError?: (error: Error) => void;
  onCompareStart?: () => void;
  onCompareSuccess?: (result: FaceCompareResult) => void;
  onCompareError?: (error: Error) => void;
  onBatchCompareStart?: () => void;
  onBatchCompareSuccess?: (results: FaceCompareResult[]) => void;
  onBatchCompareError?: (error: Error) => void;
  onError?: (error: Error) => void;
}

export class FaceCompare {
  private api: string;
  private auth?: string;
  private userId?: string;
  private faceData?: string;
  private options: Required<FaceCompareOptions>;
  private events: FaceCompareEvents;
  private insightFaceConfig: InsightFaceConfig;

  constructor(config: FaceCompareConfig, options?: FaceCompareOptions, events?: FaceCompareEvents) {
    this.api = config.api;
    this.auth = config.auth;
    this.events = events || {};
    this.userId = config.userId;
    
    this.options = {
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      enableLogging: false,
      insightFace: {},
      ...options
    };

    this.insightFaceConfig = {
      threshold: 0.6,
      enableBatchCompare: true,
      enableUserManagement: true,
      enableSystemMonitoring: true,
      ...this.options.insightFace
    };

    this.log('FaceCompare 实例已创建', { 
      api: this.api, 
      options: this.options,
      insightFace: this.insightFaceConfig
    });
  }

  /**
   * 记录用户人脸数据
   * @param imageData 图片数据（base64格式）
   * @returns Promise<FaceInitResponse>
   */
  async record(imageData: string): Promise<FaceInitResponse> {
    this.events.onInitStart?.();
    this.log('开始初始化人脸数据');

    try {
      const requestData: any = { imageData };
      if (this.userId) {
        requestData.userId = this.userId;
      }

      const response = await this.makeRequest('/api/face-init', requestData);
      
      if (response.success && response.data) {
        this.userId = response.data.userId;
        this.faceData = response.data.faceData;
        this.log('人脸数据初始化成功', { 
          userId: this.userId, 
          faceCount: response.data.faceCount 
        });
        this.events.onInitSuccess?.(response);
      } else {
        const error = new Error(response.message || '初始化失败');
        this.events.onInitError?.(error);
        this.events.onError?.(error);
        throw error;
      }

      return response;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('未知错误');
      this.log('初始化失败', { error: errorObj.message });
      this.events.onInitError?.(errorObj);
      this.events.onError?.(errorObj);
      throw errorObj;
    }
  }

  /**
   * 对比人脸图片
   * @param imageData 待对比的图片数据（base64格式）
   * @param threshold 可选的相似度阈值
   * @returns Promise<FaceCompareResult>
   */
  async compare(imageData: string, threshold?: number): Promise<FaceCompareResult> {
    if (!this.isInitialized()) {
      const error = new Error('请先初始化人脸数据');
      this.events.onError?.(error);
      throw error;
    }

    this.events.onCompareStart?.();
    this.log('开始人脸对比');

    try {
      const requestData: any = {
        imageData: imageData,
        userId: this.userId
      };

      // 使用配置的阈值或传入的阈值
      const finalThreshold = threshold ?? this.insightFaceConfig.threshold;
      if (finalThreshold !== undefined) {
        requestData.threshold = finalThreshold;
      }

      const response = await this.makeRequest('/api/face-compare', requestData);
      
      if (response.success && response.data) {
        const result = {
          similarity: response.data.similarity,
          isMatch: response.data.isMatch,
          confidence: response.data.confidence,
          threshold: response.data.threshold
        };
        
        this.log('人脸对比成功', result);
        this.events.onCompareSuccess?.(result);
        return result;
      } else {
        const error = new Error(response.message || '对比失败');
        this.events.onCompareError?.(error);
        this.events.onError?.(error);
        throw error;
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('未知错误');
      this.log('对比失败', { error: errorObj.message });
      this.events.onCompareError?.(errorObj);
      this.events.onError?.(errorObj);
      throw errorObj;
    }
  }

  /**
   * 批量对比多张图片（InsightFace 新功能）
   * @param imageDataList 图片数据列表
   * @param threshold 可选的相似度阈值
   * @returns Promise<FaceCompareResult[]>
   */
  async compareBatch(imageDataList: string[], threshold?: number): Promise<FaceCompareResult[]> {
    if (!this.isInitialized()) {
      const error = new Error('请先初始化人脸数据');
      this.events.onError?.(error);
      throw error;
    }

    if (!this.insightFaceConfig.enableBatchCompare) {
      // 如果不支持批量对比，回退到逐个对比
      this.log('批量对比未启用，使用逐个对比模式');
      return this.compareBatchFallback(imageDataList, threshold);
    }

    this.events.onBatchCompareStart?.();
    this.log('开始批量人脸对比', { count: imageDataList.length });

    try {
      const requestData: any = {
        imageDataList: imageDataList,
        userId: this.userId
      };

      const finalThreshold = threshold ?? this.insightFaceConfig.threshold;
      if (finalThreshold !== undefined) {
        requestData.threshold = finalThreshold;
      }

      const response = await this.makeRequest('/api/face-compare-batch', requestData);
      
      if (response.success && response.data) {
        const results = response.data.results.map((item: FaceCompareBatchResultItem) => ({
          similarity: item.similarity,
          isMatch: item.isMatch,
          confidence: item.confidence,
          threshold: item.threshold
        }));
        
        this.log('批量对比成功', { 
          total: response.data.total,
          success: response.data.successCount,
          failed: response.data.errorCount
        });
        
        this.events.onBatchCompareSuccess?.(results);
        return results;
      } else {
        const error = new Error(response.message || '批量对比失败');
        this.events.onBatchCompareError?.(error);
        this.events.onError?.(error);
        throw error;
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('未知错误');
      this.log('批量对比失败', { error: errorObj.message });
      this.events.onBatchCompareError?.(errorObj);
      this.events.onError?.(errorObj);
      throw errorObj;
    }
  }

  /**
   * 批量对比的回退实现（逐个对比）
   * @private
   */
  private async compareBatchFallback(imageDataList: string[], threshold?: number): Promise<FaceCompareResult[]> {
    this.log('使用逐个对比模式', { count: imageDataList.length });

    const results: FaceCompareResult[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < imageDataList.length; i++) {
      try {
        const result = await this.compare(imageDataList[i], threshold);
        results.push(result);
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('未知错误');
        errors.push(errorObj);
        this.log(`第 ${i + 1} 张图片对比失败`, { error: errorObj.message });
      }
    }

    if (errors.length > 0) {
      this.log('逐个对比完成，部分失败', { 
        total: imageDataList.length, 
        success: results.length, 
        failed: errors.length 
      });
    } else {
      this.log('逐个对比全部成功', { count: results.length });
    }

    return results;
  }

  /**
   * 获取用户信息（InsightFace 新功能）
   * @returns Promise<UserInfo>
   */
  async getUserInfo(): Promise<UserInfo> {
    if (!this.insightFaceConfig.enableUserManagement) {
      throw new Error('用户管理功能未启用');
    }

    try {
      const response = await this.makeRequest(`/api/users/${this.userId}`, {}, 'GET');
      return response;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('获取用户信息失败');
      this.log('获取用户信息失败', { error: errorObj.message });
      throw errorObj;
    }
  }

  /**
   * 获取系统信息（InsightFace 新功能）
   * @returns Promise<SystemInfoResponse>
   */
  async getSystemInfo(): Promise<SystemInfoResponse> {
    if (!this.insightFaceConfig.enableSystemMonitoring) {
      throw new Error('系统监控功能未启用');
    }

    try {
      const response = await this.makeRequest('/', {}, 'GET');
      return response;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('获取系统信息失败');
      this.log('获取系统信息失败', { error: errorObj.message });
      throw errorObj;
    }
  }

  /**
   * 健康检查（InsightFace 新功能）
   * @returns Promise<any>
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await this.makeRequest('/health', {}, 'GET');
      return response;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('健康检查失败');
      this.log('健康检查失败', { error: errorObj.message });
      throw errorObj;
    }
  }

  /**
   * 验证图片格式和大小
   * @param imageData 图片数据
   * @returns boolean
   */
  validateImage(imageData: string): boolean {
    if (!imageData || typeof imageData !== 'string') {
      return false;
    }

    // 检查是否为 base64 格式
    if (!imageData.startsWith('data:image/')) {
      return false;
    }

    // 检查图片大小（base64 编码会增加约 33% 的大小）
    const base64Length = imageData.length;
    const estimatedSizeInBytes = (base64Length * 3) / 4;
    const maxSizeInMB = 10; // 最大 10MB
    
    if (estimatedSizeInBytes > maxSizeInMB * 1024 * 1024) {
      this.log('图片过大', { 
        estimatedSize: `${(estimatedSizeInBytes / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${maxSizeInMB}MB`
      });
      return false;
    }

    return true;
  }

  /**
   * 获取当前用户ID
   * @returns string | undefined
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * 检查是否已初始化
   * @returns boolean
   */
  isInitialized(): boolean {
    return !!(this.userId && this.faceData);
  }

  /**
   * 获取初始化状态
   * @returns object
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized(),
      userId: this.userId,
      hasFaceData: !!this.faceData,
      apiEndpoint: this.api,
      options: this.options,
      insightFaceConfig: this.insightFaceConfig
    };
  }

  /**
   * 清除用户数据
   */
  clear(): void {
    this.userId = undefined;
    this.faceData = undefined;
    this.log('用户数据已清除');
  }

  /**
   * 更新配置
   * @param newConfig 新配置
   */
  updateConfig(newConfig: Partial<FaceCompareConfig>): void {
    if (newConfig.api) {
      this.api = newConfig.api;
    }
    if (newConfig.auth !== undefined) {
      this.auth = newConfig.auth;
    }
    this.log('配置已更新', newConfig);
  }

  /**
   * 更新选项
   * @param newOptions 新选项
   */
  updateOptions(newOptions: Partial<FaceCompareOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // 更新 InsightFace 配置
    if (newOptions.insightFace) {
      this.insightFaceConfig = { ...this.insightFaceConfig, ...newOptions.insightFace };
    }
    
    this.log('选项已更新', newOptions);
  }

  /**
   * 更新事件回调
   * @param newEvents 新事件回调
   */
  updateEvents(newEvents: FaceCompareEvents): void {
    this.events = { ...this.events, ...newEvents };
    this.log('事件回调已更新');
  }

  /**
   * 发送 HTTP 请求
   * @private
   */
  private async makeRequest(
    endpoint: string, 
    data: any, 
    method: 'GET' | 'POST' | 'DELETE' = 'POST'
  ): Promise<any> {
    const url = `${this.api}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const requestOptions: RequestInit = {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      };

      // 添加认证头（如果提供）
      if (this.auth) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${this.auth}`
        };
      }

      // 添加请求体（POST 和 DELETE 请求）
      if (method !== 'GET' && Object.keys(data).length > 0) {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`请求超时 (${this.options.timeout}ms)`);
        }
        throw error;
      }
      
      throw new Error('网络请求失败');
    }
  }

  /**
   * 日志记录
   * @private
   */
  private log(message: string, data?: any): void {
    if (this.options.enableLogging) {
      const timestamp = new Date().toISOString();
      console.log(`[FaceCompare ${timestamp}] ${message}`, data || '');
    }
  }
}
