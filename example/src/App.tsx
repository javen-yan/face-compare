import { useState } from 'react';
import { useAutoFaceCompare, CameraModal, FaceCompare } from 'face-compare';
import './App.css';

interface ConfigState {
  api: string;
  userId: string;
  auth: string;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  enableLogging: boolean;
  threshold: number;
  enableUserManagement: boolean;
  enableSystemMonitoring: boolean;
  width: number;
  height: number;
  quality: number;
  facingMode: 'user' | 'environment';
  aspectRatio: number;
  showPreview: boolean;
  showControls: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  autoCloseAfterCapture: boolean;
  autoCloseAfterCompare: boolean;
}

function App() {
  const [config, setConfig] = useState<ConfigState>({
    api: 'http://localhost:3001',
    userId: 'demo-user-' + Date.now(),
    auth: '',
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    enableLogging: true,
    threshold: 0.6,
    enableUserManagement: true,
    enableSystemMonitoring: true,
    width: 640,
    height: 480,
    quality: 0.8,
    facingMode: 'user',
    aspectRatio: 4/3,
    showPreview: true,
    showControls: true,
    theme: 'auto',
    language: 'zh-CN',
    autoCloseAfterCapture: false,
    autoCloseAfterCompare: false,
  });

  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [faceCompareInstance, setFaceCompareInstance] = useState<FaceCompare | null>(null);

  const {
    isCameraOpen,
    capturedImage,
    isInitialized,
    isComparing,
    compareResult,
    error,
    autoCompare,
    record,
    compare,
    openCamera,
    closeCamera,
    clearImage,
    modalProps
  } = useAutoFaceCompare({
    faceCompareConfig: {
      api: config.api,
      userId: config.userId,
      auth: config.auth || undefined,
    },
    faceCompareOptions: {
      timeout: config.timeout,
      retryCount: config.retryCount,
      retryDelay: config.retryDelay,
      enableLogging: config.enableLogging,
      insightFace: {
        threshold: config.threshold,
        enableUserManagement: config.enableUserManagement,
        enableSystemMonitoring: config.enableSystemMonitoring,
      }
    },
    onCapture: (imageData) => console.log('拍照完成:', imageData),
    onCompareResult: (result) => console.log('对比结果:', result),
    onError: (error) => console.error('发生错误:', error),
    autoCloseAfterCapture: config.autoCloseAfterCapture,
    autoCloseAfterCompare: config.autoCloseAfterCompare,
    cameraConfig: {
      width: config.width,
      height: config.height,
      quality: config.quality,
      facingMode: config.facingMode,
    }
  });

  const createFaceCompareInstance = () => {
    const instance = new FaceCompare(
      {
        api: config.api,
        userId: config.userId,
        auth: config.auth || undefined,
      },
      {
        timeout: config.timeout,
        retryCount: config.retryCount,
        retryDelay: config.retryDelay,
        enableLogging: config.enableLogging,
        insightFace: {
          threshold: config.threshold,
          enableUserManagement: config.enableUserManagement,
          enableSystemMonitoring: config.enableSystemMonitoring,
        }
      }
    );
    setFaceCompareInstance(instance);
    console.log('FaceCompare 实例已创建');
  };

  const getSystemInfo = async () => {
    if (!faceCompareInstance) {
      alert('请先创建 FaceCompare 实例');
      return;
    }
    
    try {
      const info = await faceCompareInstance.getSystemInfo();
      setSystemInfo(info);
      setShowSystemInfo(true);
    } catch (error) {
      console.error('获取系统信息失败:', error);
      alert('获取系统信息失败: ' + (error as Error).message);
    }
  };

  const getUserInfo = async () => {
    if (!faceCompareInstance) {
      alert('请先创建 FaceCompare 实例');
      return;
    }
    
    try {
      const info = await faceCompareInstance.getUserInfo();
      console.log('用户信息:', info);
      alert('用户信息已获取，请查看控制台');
    } catch (error) {
      console.error('获取用户信息失败:', error);
      alert('获取用户信息失败: ' + (error as Error).message);
    }
  };

  const updateConfig = (key: keyof ConfigState, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎭 Face Compare 工具演示</h1>
        <p>一个强大的人脸对比 React 组件库演示</p>
      </header>

      <div className="app-container">
        <div className="config-panel">
          <h2>⚙️ 配置面板</h2>
          
          <div className="config-section">
            <h3>基础配置</h3>
            <div className="config-row">
              <label>API 地址:</label>
              <input
                type="text"
                value={config.api}
                onChange={(e) => updateConfig('api', e.target.value)}
                placeholder="http://localhost:3001"
              />
            </div>
            <div className="config-row">
              <label>用户ID:</label>
              <input
                type="text"
                value={config.userId}
                onChange={(e) => updateConfig('userId', e.target.value)}
                placeholder="用户唯一标识"
              />
            </div>
            <div className="config-row">
              <label>认证密钥:</label>
              <input
                type="text"
                value={config.auth}
                onChange={(e) => updateConfig('auth', e.target.value)}
                placeholder="可选，API认证密钥"
              />
            </div>
          </div>

          <div className="config-section">
            <h3>摄像头配置</h3>
            <div className="config-row">
              <label>分辨率:</label>
              <div className="config-group">
                <input
                  type="number"
                  value={config.width}
                  onChange={(e) => updateConfig('width', parseInt(e.target.value))}
                  placeholder="宽度"
                />
                <span>×</span>
                <input
                  type="number"
                  value={config.height}
                  onChange={(e) => updateConfig('height', parseInt(e.target.value))}
                  placeholder="高度"
                />
              </div>
            </div>
            <div className="config-row">
              <label>图片质量:</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={config.quality}
                onChange={(e) => updateConfig('quality', parseFloat(e.target.value))}
              />
              <span>{Math.round(config.quality * 100)}%</span>
            </div>
            <div className="config-row">
              <label>摄像头方向:</label>
              <select
                value={config.facingMode}
                onChange={(e) => updateConfig('facingMode', e.target.value as 'user' | 'environment')}
              >
                <option value="user">前置摄像头</option>
                <option value="environment">后置摄像头</option>
              </select>
            </div>
            <div className="config-row">
              <label>宽高比:</label>
              <select
                value={config.aspectRatio}
                onChange={(e) => updateConfig('aspectRatio', parseFloat(e.target.value))}
              >
                <option value={4/3}>4:3</option>
                <option value={16/9}>16:9</option>
                <option value={1}>1:1</option>
              </select>
            </div>
            <div className="config-row">
              <label>显示预览:</label>
              <input
                type="checkbox"
                checked={config.showPreview}
                onChange={(e) => updateConfig('showPreview', e.target.checked)}
              />
            </div>
            <div className="config-row">
              <label>显示控制:</label>
              <input
                type="checkbox"
                checked={config.showControls}
                onChange={(e) => updateConfig('showControls', e.target.checked)}
              />
            </div>
            <div className="config-row">
              <label>主题:</label>
              <select
                value={config.theme}
                onChange={(e) => updateConfig('theme', e.target.value as 'light' | 'dark' | 'auto')}
              >
                <option value="auto">自动</option>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            </div>
            <div className="config-row">
              <label>语言:</label>
              <select
                value={config.language}
                onChange={(e) => updateConfig('language', e.target.value as 'zh-CN' | 'en-US')}
              >
                <option value="zh-CN">中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          <div className="config-section">
            <h3>高级配置</h3>
            <div className="config-row">
              <label>超时时间 (ms):</label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
                min="1000"
                step="1000"
              />
            </div>
            <div className="config-row">
              <label>重试次数:</label>
              <input
                type="number"
                value={config.retryCount}
                onChange={(e) => updateConfig('retryCount', parseInt(e.target.value))}
                min="0"
                max="10"
              />
            </div>
            <div className="config-row">
              <label>重试延迟 (ms):</label>
              <input
                type="number"
                value={config.retryDelay}
                onChange={(e) => updateConfig('retryDelay', parseInt(e.target.value))}
                min="100"
                step="100"
              />
            </div>
            <div className="config-row">
              <label>相似度阈值:</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={config.threshold}
                onChange={(e) => updateConfig('threshold', parseFloat(e.target.value))}
              />
              <span>{Math.round(config.threshold * 100)}%</span>
            </div>
            <div className="config-row">
              <label>启用日志:</label>
              <input
                type="checkbox"
                checked={config.enableLogging}
                onChange={(e) => updateConfig('enableLogging', e.target.checked)}
              />
            </div>
            <div className="config-row">
              <label>用户管理:</label>
              <input
                type="checkbox"
                checked={config.enableUserManagement}
                onChange={(e) => updateConfig('enableUserManagement', e.target.checked)}
              />
            </div>
            <div className="config-row">
              <label>系统监控:</label>
              <input
                type="checkbox"
                checked={config.enableSystemMonitoring}
                onChange={(e) => updateConfig('enableSystemMonitoring', e.target.checked)}
              />
            </div>
            <div className="config-row">
              <label>拍照后自动关闭:</label>
              <input
                type="checkbox"
                checked={config.autoCloseAfterCapture}
                onChange={(e) => updateConfig('autoCloseAfterCapture', e.target.checked)}
              />
            </div>
            <div className="config-row">
              <label>对比后自动关闭:</label>
              <input
                type="checkbox"
                checked={config.autoCloseAfterCompare}
                onChange={(e) => updateConfig('autoCloseAfterCompare', e.target.checked)}
              />
            </div>
          </div>
        </div>

        <div className="action-panel">
          <h2>🎯 操作面板</h2>
          
          <div className="action-section">
            <h3>实例管理</h3>
            <button onClick={createFaceCompareInstance} className="btn btn-primary">
              创建 FaceCompare 实例
            </button>
            <button onClick={getSystemInfo} className="btn btn-info">
              获取系统信息
            </button>
            <button onClick={getUserInfo} className="btn btn-info">
              获取用户信息
            </button>
          </div>

          <div className="action-section">
            <h3>智能流程管理</h3>
            <button 
              onClick={autoCompare} 
              className="btn btn-success btn-large"
              disabled={isComparing}
            >
              {isComparing ? '处理中...' : '🚀 开始智能人脸识别'}
            </button>
            <p className="action-description">
              自动判断用户是否需要录制人脸还是进行人脸对比
            </p>
          </div>

          <div className="action-section">
            <h3>手动控制</h3>
            <button onClick={openCamera} className="btn btn-secondary">
              手动打开摄像头
            </button>
            <button onClick={closeCamera} className="btn btn-secondary">
              关闭摄像头
            </button>
            <button onClick={clearImage} className="btn btn-warning">
              清除图片
            </button>
          </div>

          <div className="action-section">
            <h3>人脸识别操作</h3>
            <button 
              onClick={record} 
              className="btn btn-success"
              disabled={isComparing}
            >
              {isComparing ? '初始化中...' : '初始化人脸数据'}
            </button>
            <button 
              onClick={compare} 
              className="btn btn-success"
              disabled={isComparing || !isInitialized}
            >
              {isComparing ? '对比中...' : '开始人脸对比'}
            </button>
          </div>
        </div>

        <div className="status-panel">
          <h2>📊 状态监控</h2>
          
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">摄像头状态:</span>
              <span className={`status-value ${isCameraOpen ? 'online' : 'offline'}`}>
                {isCameraOpen ? '🟢 已打开' : '🔴 已关闭'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">初始化状态:</span>
              <span className={`status-value ${isInitialized ? 'success' : 'pending'}`}>
                {isInitialized ? '✅ 已完成' : '⏳ 未完成'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">处理状态:</span>
              <span className={`status-value ${isComparing ? 'processing' : 'idle'}`}>
                {isComparing ? '🔄 处理中...' : '💤 空闲'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">图片状态:</span>
              <span className="status-value">
                {capturedImage ? '📷 已拍照' : '📷 未拍照'}
              </span>
            </div>
          </div>

          {error && (
            <div className="error-display">
              <h3>❌ 错误信息</h3>
              <pre>{error.message}</pre>
            </div>
          )}

          {compareResult && (
            <div className="result-display">
              <h3>🎯 对比结果</h3>
              <pre>{JSON.stringify(compareResult, null, 2)}</pre>
            </div>
          )}

          {systemInfo && showSystemInfo && (
            <div className="system-info-display">
              <h3>🖥️ 系统信息</h3>
              <button 
                onClick={() => setShowSystemInfo(false)}
                className="close-btn"
              >
                ✕
              </button>
              <pre>{JSON.stringify(systemInfo, null, 2)}</pre>
            </div>
          )}
        </div>

        {capturedImage && (
          <div className="image-preview">
            <h3>📸 拍摄的图片</h3>
            <img src={capturedImage} alt="拍摄的图片" />
          </div>
        )}
      </div>

      <CameraModal 
        {...modalProps}
        config={{
          width: config.width,
          height: config.height,
          facingMode: config.facingMode,
          aspectRatio: config.aspectRatio,
          quality: config.quality,
          showPreview: config.showPreview,
          showControls: config.showControls,
          theme: config.theme,
          language: config.language,
        }}
      />
    </div>
  );
}

export default App;