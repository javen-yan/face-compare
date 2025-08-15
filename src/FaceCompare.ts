import {
  FaceCompareConfig,
  FaceInitResponse,
  FaceCompareResult,
  FaceCompareBatchResultItem,
  SystemInfoResponse,
  InsightFaceConfig,
  UserInfo,
} from './types';

// 配置验证器
class ConfigValidator {
  static validate(config: FaceCompareConfig): void {
    if (!config.api) {
      throw new Error('API endpoint is required');
    }
    if (!config.userId) {
      throw new Error('User ID is required');
    }
    if (config.api && !this.isValidUrl(config.api)) {
      throw new Error('Invalid API endpoint URL');
    }
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// 重试策略管理器
class RetryManager {
  constructor(
    private maxRetries: number = 3,
    private baseDelay: number = 1000,
    private maxDelay: number = 10000
  ) { }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === this.maxRetries) {
          throw new Error(`${context} failed after ${this.maxRetries} attempts: ${lastError.message}`);
        }

        const delay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), this.maxDelay);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 缓存管理器
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

// 事件发射器
class EventEmitter {
  private events = new Map<string, Array<(data?: any) => void>>();

  on<T = any>(event: string, callback: (data?: T) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  emit<T = any>(event: string, data?: T): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(event: string, callback?: (data?: any) => void): void {
    if (!callback) {
      this.events.delete(event);
    } else {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  clear(): void {
    this.events.clear();
  }

  getEventCount(): number {
    return this.events.size;
  }
}

export interface FaceCompareOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  enableCache?: boolean;
  cacheTTL?: number;
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
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
}

export class FaceCompare extends EventEmitter {
  private api: string;
  private auth?: string;
  private userId?: string;
  private options: Required<FaceCompareOptions>;
  private eventCallbacks: FaceCompareEvents;
  private insightFaceConfig: InsightFaceConfig;
  private retryManager: RetryManager;
  private cacheManager: CacheManager;
  private isDestroyed = false;
  private activeControllers: Set<AbortController> = new Set();
  private performanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0
  };

  constructor(config: FaceCompareConfig, options?: FaceCompareOptions, events?: FaceCompareEvents) {
    super();

    // 验证配置
    ConfigValidator.validate(config);

    this.api = config.api;
    this.auth = config.auth;
    this.eventCallbacks = events || {};
    this.userId = config.userId;

    this.options = {
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      enableLogging: false,
      enableCache: true,
      cacheTTL: 300000, // 5分钟
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

    this.retryManager = new RetryManager(
      this.options.retryCount,
      this.options.retryDelay
    );
    this.cacheManager = new CacheManager();

    // 绑定事件
    this.bindEvents();

    this.log('FaceCompare 实例已创建', {
      api: this.api,
      options: this.options,
      insightFace: this.insightFaceConfig,
    });
  }

  private bindEvents(): void {
    // 将外部事件绑定到内部事件发射器
    Object.entries(this.eventCallbacks).forEach(([event, callback]) => {
      if (callback) {
        this.on(event, callback);
      }
    });
  }

  /**
   * 记录用户人脸数据
   * @param imageData 图片数据（base64格式）
   * @returns Promise<FaceInitResponse>
   */
  async record(imageData: string): Promise<FaceInitResponse> {
    this.ensureNotDestroyed();
    this.validateImage(imageData);

    this.emit('initStart');
    this.log('开始初始化人脸数据');

    const cacheKey = `init_${this.userId}_${this.hashImage(imageData)}`;

    // 检查缓存
    if (this.options.enableCache) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        this.emit('cacheHit', cacheKey);
        this.eventCallbacks.onInitSuccess?.(cached);
        return cached;
      }
    }

    try {
      const result = await this.retryManager.executeWithRetry(
        async () => {
          const requestData: any = { imageData };
          if (this.userId) {
            requestData.userId = this.userId;
          }

          const response = await this.makeRequest('/api/face-init', requestData);

          if (response.success && response.data) {
            this.userId = response.data.userId;

            // 缓存结果
            if (this.options.enableCache) {
              this.cacheManager.set(cacheKey, response, this.options.cacheTTL);
            }

            this.log('人脸数据初始化成功', {
              userId: this.userId,
              faceCount: response.data.faceCount
            });

            this.emit('initSuccess', response);
            return response;
          } else {
            throw new Error(response.message || '初始化失败');
          }
        },
        'Face initialization'
      );

      return result;
    } catch (error) {
      const errorObj = this.normalizeError(error, '初始化失败');
      this.emit('initError', errorObj);
      this.emit('error', errorObj);
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
    this.ensureNotDestroyed();
    this.validateImage(imageData);

    if (!this.isInitialized()) {
      const error = new Error('请先初始化人脸数据');
      this.emit('error', error);
      this.eventCallbacks.onError?.(error);
      throw error;
    }

    this.emit('compareStart');
    this.eventCallbacks.onCompareStart?.();
    this.log('开始人脸对比');

    const cacheKey = `compare_${this.userId}_${this.hashImage(imageData)}_${threshold || this.insightFaceConfig.threshold}`;

    // 检查缓存
    if (this.options.enableCache) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        this.emit('cacheHit', cacheKey);
        this.eventCallbacks.onCompareSuccess?.(cached);
        return cached;
      }
    }

    try {
      const result = await this.retryManager.executeWithRetry(
        async () => {
          const requestData: any = {
            imageData: imageData,
            userId: this.userId
          };

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

            // 缓存结果
            if (this.options.enableCache) {
              this.cacheManager.set(cacheKey, result, this.options.cacheTTL);
            }

            this.log('人脸对比成功', result);
            this.emit('compareSuccess', result);
            this.eventCallbacks.onCompareSuccess?.(result);
            return result;
          } else {
            throw new Error(response.message || '对比失败');
          }
        },
        'Face comparison'
      );

      return result;
    } catch (error) {
      const errorObj = this.normalizeError(error, '对比失败');
      this.emit('compareError', errorObj);
      this.eventCallbacks.onCompareError?.(errorObj);
      this.eventCallbacks.onError?.(errorObj);
      throw errorObj;
    }
  }

  /**
   * 批量对比多张图片
   * @param imageDataList 图片数据列表
   * @param threshold 可选的相似度阈值
   * @returns Promise<FaceCompareResult[]>
   */
  async compareBatch(imageDataList: string[], threshold?: number): Promise<FaceCompareResult[]> {
    this.ensureNotDestroyed();

    if (!this.isInitialized()) {
      const error = new Error('请先初始化人脸数据');
      this.emit('error', error);
      this.eventCallbacks.onError?.(error);
      throw error;
    }

    if (!this.insightFaceConfig.enableBatchCompare) {
      this.log('批量对比未启用，使用逐个对比模式');
      return this.compareBatchFallback(imageDataList, threshold);
    }

    this.emit('batchCompareStart');
    this.eventCallbacks.onBatchCompareStart?.();
    this.log('开始批量人脸对比', { count: imageDataList.length });

    try {
      const result = await this.retryManager.executeWithRetry(
        async () => {
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

            this.emit('batchCompareSuccess', results);
            this.eventCallbacks.onBatchCompareSuccess?.(results);
            return results;
          } else {
            throw new Error(response.message || '批量对比失败');
          }
        },
        'Batch face comparison'
      );

      return result;
    } catch (error) {
      const errorObj = this.normalizeError(error, '批量对比失败');
      this.emit('batchCompareError', errorObj);
      this.eventCallbacks.onBatchCompareError?.(errorObj);
      this.eventCallbacks.onError?.(errorObj);
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
        const errorObj = this.normalizeError(error, `第 ${i + 1} 张图片对比失败`);
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
   * 获取用户信息
   * @returns Promise<UserInfo>
   */
  async getUserInfo(): Promise<UserInfo> {
    this.ensureNotDestroyed();

    if (!this.insightFaceConfig.enableUserManagement) {
      throw new Error('用户管理功能未启用');
    }

    try {
      const result = await this.retryManager.executeWithRetry(
        async () => {
          const response = await this.makeRequest(`/api/users/${this.userId}`, {}, 'GET');
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error('获取用户信息失败');
          }
        },
        'Get user info'
      );

      return result;
    } catch (error) {
      const errorObj = this.normalizeError(error, '获取用户信息失败');
      this.log('获取用户信息失败', { error: errorObj.message });
      throw errorObj;
    }
  }

  /**
   * 获取系统信息
   * @returns Promise<SystemInfoResponse>
   */
  async getSystemInfo(): Promise<SystemInfoResponse> {
    this.ensureNotDestroyed();

    if (!this.insightFaceConfig.enableSystemMonitoring) {
      throw new Error('系统监控功能未启用');
    }

    try {
      const result = await this.retryManager.executeWithRetry(
        async () => {
          const response = await this.makeRequest('/', {}, 'GET');
          return response;
        },
        'Get system info'
      );

      return result;
    } catch (error) {
      const errorObj = this.normalizeError(error, '获取系统信息失败');
      this.log('获取系统信息失败', { error: errorObj.message });
      throw errorObj;
    }
  }

  /**
   * 健康检查
   * @returns Promise<any>
   */
  async healthCheck(): Promise<any> {
    this.ensureNotDestroyed();

    try {
      const result = await this.retryManager.executeWithRetry(
        async () => {
          const response = await this.makeRequest('/health', {}, 'GET');
          return response;
        },
        'Health check'
      );

      return result;
    } catch (error) {
      const errorObj = this.normalizeError(error, '健康检查失败');
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
    return !!(this.userId);
  }

  /**
   * 获取初始化状态
   * @returns object
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized(),
      userId: this.userId,
      apiEndpoint: this.api,
      options: this.options,
      insightFaceConfig: this.insightFaceConfig,
      cacheEnabled: this.options.enableCache,
      retryConfig: {
        maxRetries: this.options.retryCount,
        baseDelay: this.options.retryDelay
      },
      activeRequests: this.activeControllers.size,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * 获取内存使用情况
   * @private
   */
  private getMemoryUsage(): { cacheSize: number; eventCount: number } {
    return {
      cacheSize: this.cacheManager.getSize(),
      eventCount: this.getEventCount()
    };
  }

  /**
   * 清除用户数据
   */
  clear(): void {
    this.userId = undefined;
    this.cacheManager.clear();
    this.log('用户数据和缓存已清除');
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

    // 更新重试管理器
    if (newOptions.retryCount || newOptions.retryDelay) {
      this.retryManager = new RetryManager(
        newOptions.retryCount || this.options.retryCount,
        newOptions.retryDelay || this.options.retryDelay
      );
    }

    this.log('选项已更新', newOptions);
  }

  /**
   * 更新事件回调
   * @param newEvents 新事件回调
   */
  updateEvents(newEvents: FaceCompareEvents): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...newEvents };
    this.bindEvents();
    this.log('事件回调已更新');
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      enabled: this.options.enableCache,
      ttl: this.options.cacheTTL,
      size: this.cacheManager.getSize(),
      hits: this.performanceMetrics.cacheHits,
      misses: this.performanceMetrics.cacheMisses,
      hitRate: this.performanceMetrics.totalRequests > 0 
        ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      successRate: this.performanceMetrics.totalRequests > 0
        ? (this.performanceMetrics.successfulRequests / this.performanceMetrics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 销毁实例，清理资源
   */
  destroy(): void {
    this.isDestroyed = true;
    
    // 取消所有待处理的请求
    this.activeControllers.forEach(controller => {
      controller.abort();
    });
    this.activeControllers.clear();
    
    // 清理缓存和事件监听器
    this.cacheManager.clear();
    this.clear();
    
    this.log('FaceCompare 实例已销毁');
  }

  /**
   * 检查实例是否已销毁
   */
  private ensureNotDestroyed(): void {
    if (this.isDestroyed) {
      throw new Error('FaceCompare 实例已被销毁');
    }
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(error: any, context: string): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`${context}: ${error?.message || error || 'Unknown error'}`);
  }

  /**
   * 生成图片哈希值（用于缓存键）
   */
  private hashImage(imageData: string): string {
    // 使用更安全的哈希算法
    let hash = 0;
    const prime = 31;
    
    for (let i = 0; i < Math.min(imageData.length, 1000); i++) {
      const char = imageData.charCodeAt(i);
      hash = (hash * prime + char) >>> 0; // 使用无符号32位整数
    }
    
    // 添加长度信息，减少哈希冲突
    const lengthHash = (imageData.length * prime) >>> 0;
    const combinedHash = (hash ^ lengthHash) >>> 0;
    
    return combinedHash.toString(36);
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
    this.ensureNotDestroyed();
    
    const url = `${this.api}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
    
    // 添加到活动控制器集合
    this.activeControllers.add(controller);

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
      this.activeControllers.delete(controller);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeControllers.delete(controller);

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
