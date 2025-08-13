import React, { useState, useCallback } from 'react';
import { useFaceCompare } from '../hooks/useFaceCompare';
import CameraModal from './CameraModal';
import { FaceCompareConfig, CameraModalConfig } from '../types';

export interface FaceCompareComponentProps {
  config: FaceCompareConfig;
  onResult?: (result: any) => void;
  onInitSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: 'zh-CN' | 'en-US';
  showProgress?: boolean;
  showStatus?: boolean;
  showImagePreview?: boolean;
  cameraConfig?: CameraModalConfig;
  className?: string;
  style?: React.CSSProperties;
}

export interface FaceCompareComponentTheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

const FaceCompareComponent: React.FC<FaceCompareComponentProps> = ({
  config,
  onResult,
  onInitSuccess,
  onError,
  theme = 'light',
  language = 'zh-CN',
  showProgress = true,
  showStatus = true,
  showImagePreview = true,
  cameraConfig = {},
  className = '',
  style = {}
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'init' | 'compare'>('init');
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // 主题配置
  const themes: Record<string, FaceCompareComponentTheme> = {
    light: {
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e9ecef',
      shadow: 'rgba(0, 0, 0, 0.1)',
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    },
    dark: {
      primary: '#0d6efd',
      secondary: '#adb5bd',
      background: '#212529',
      surface: '#343a40',
      text: '#ffffff',
      textSecondary: '#adb5bd',
      border: '#495057',
      shadow: 'rgba(0, 0, 0, 0.3)',
      success: '#198754',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#0dcaf0'
    }
  };

  const currentTheme = themes[theme] || themes.light;

  // 语言配置
  const languages = {
    'zh-CN': {
      title: '人脸对比系统',
      status: {
        initialized: '已初始化',
        notInitialized: '未初始化'
      },
      steps: {
        step1: '第一步：初始化人脸数据',
        step2: '第二步：人脸对比',
        step1Desc: '请拍摄一张清晰的人脸照片作为初始数据',
        step2Desc: '拍摄照片与初始数据进行对比'
      },
      buttons: {
        init: '拍照初始化',
        compare: '拍照对比',
        reinit: '重新初始化',
        processing: '处理中...',
        clearError: '清除错误'
      },
      results: {
        title: '对比结果',
        similarity: '相似度',
        match: '是否匹配',
        confidence: '置信度',
        yes: '是',
        no: '否'
      },
      preview: '当前图片预览',
      errors: {
        initFailed: '初始化失败',
        compareFailed: '对比失败'
      }
    },
    'en-US': {
      title: 'Face Comparison System',
      status: {
        initialized: 'Initialized',
        notInitialized: 'Not Initialized'
      },
      steps: {
        step1: 'Step 1: Initialize Face Data',
        step2: 'Step 2: Face Comparison',
        step1Desc: 'Please take a clear face photo as initial data',
        step2Desc: 'Take a photo to compare with initial data'
      },
      buttons: {
        init: 'Take Photo & Init',
        compare: 'Take Photo & Compare',
        reinit: 'Re-initialize',
        processing: 'Processing...',
        clearError: 'Clear Error'
      },
      results: {
        title: 'Comparison Result',
        similarity: 'Similarity',
        match: 'Is Match',
        confidence: 'Confidence',
        yes: 'Yes',
        no: 'No'
      },
      preview: 'Current Image Preview',
      errors: {
        initFailed: 'Initialization failed',
        compareFailed: 'Comparison failed'
      }
    }
  };

  const currentLanguage = languages[language];

  const {
    isLoading,
    error,
    result,
    isInitialized,
    init,
    compare,
    clear,
    reset,
    progress
  } = useFaceCompare(config, {
    enableLogging: true,
    onStateChange: (state) => {
      // 可以在这里监听状态变化
      console.log('FaceCompare state changed:', state);
    }
  }, {
    onInitSuccess: (response) => {
      if (onInitSuccess) {
        onInitSuccess(response);
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error);
      }
    }
  });

  const handleInitCapture = useCallback(async (imageData: string) => {
    setCurrentImage(imageData);
    try {
      const response = await init(imageData);
      if (response.success) {
        console.log('人脸数据初始化成功！');
      }
    } catch (err) {
      console.error('初始化失败:', err);
    }
  }, [init]);

  const handleCompareCapture = useCallback(async (imageData: string) => {
    setCurrentImage(imageData);
    try {
      const compareResult = await compare(imageData);
      if (onResult) {
        onResult(compareResult);
      }
    } catch (err) {
      console.error('对比失败:', err);
    }
  }, [compare, onResult]);

  const openCamera = useCallback((mode: 'init' | 'compare') => {
    setCameraMode(mode);
    setShowCamera(true);
  }, []);

  const closeCamera = useCallback(() => {
    setShowCamera(false);
  }, []);

  const handleClear = useCallback(() => {
    clear();
    setCurrentImage(null);
  }, [clear]);

  const handleReset = useCallback(() => {
    reset();
    setCurrentImage(null);
  }, [reset]);

  return (
    <div 
      className={`face-compare-component ${className}`}
      style={{ 
        backgroundColor: currentTheme.background,
        color: currentTheme.text,
        ...style 
      }}
    >
      <div className="face-compare-header" style={{ borderBottomColor: currentTheme.border }}>
        <h2 style={{ color: currentTheme.text }}>{currentLanguage.title}</h2>
        {showStatus && (
          <div className="status-indicator">
            <span 
              className={`status ${isInitialized ? 'success' : 'warning'}`}
              style={{ 
                backgroundColor: isInitialized ? currentTheme.success : currentTheme.warning,
                color: '#fff'
              }}
            >
              {isInitialized ? currentLanguage.status.initialized : currentLanguage.status.notInitialized}
            </span>
          </div>
        )}
      </div>

      <div className="face-compare-content">
        {!isInitialized ? (
          <div className="init-section" style={{ 
            backgroundColor: currentTheme.surface,
            borderLeftColor: currentTheme.primary
          }}>
            <h3 style={{ color: currentTheme.text }}>{currentLanguage.steps.step1}</h3>
            <p style={{ color: currentTheme.textSecondary }}>{currentLanguage.steps.step1Desc}</p>
            <button
              className="action-button primary"
              onClick={() => openCamera('init')}
              disabled={isLoading}
              style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
            >
              {isLoading ? currentLanguage.buttons.processing : currentLanguage.buttons.init}
            </button>
          </div>
        ) : (
          <div className="compare-section" style={{ 
            backgroundColor: currentTheme.surface,
            borderLeftColor: currentTheme.primary
          }}>
            <h3 style={{ color: currentTheme.text }}>{currentLanguage.steps.step2}</h3>
            <p style={{ color: currentTheme.textSecondary }}>{currentLanguage.steps.step2Desc}</p>
            <button
              className="action-button primary"
              onClick={() => openCamera('compare')}
              disabled={isLoading}
              style={{ backgroundColor: currentTheme.primary, color: '#fff' }}
            >
              {isLoading ? currentLanguage.buttons.processing : currentLanguage.buttons.compare}
            </button>
            
            <button
              className="action-button secondary"
              onClick={handleClear}
              disabled={isLoading}
              style={{ backgroundColor: currentTheme.secondary, color: '#fff' }}
            >
              {currentLanguage.buttons.reinit}
            </button>
          </div>
        )}

        {showProgress && progress.total > 0 && (
          <div className="progress-section" style={{ 
            backgroundColor: currentTheme.surface,
            borderLeftColor: currentTheme.info
          }}>
            <h3 style={{ color: currentTheme.text }}>处理进度</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${progress.percentage}%`,
                  backgroundColor: currentTheme.primary
                }}
              />
            </div>
            <p style={{ color: currentTheme.textSecondary }}>
              {progress.current} / {progress.total} ({progress.percentage}%)
            </p>
          </div>
        )}

        {error && (
          <div className="error-message" style={{ 
            backgroundColor: currentTheme.error,
            color: '#fff'
          }}>
            <p>❌ {error}</p>
            <button onClick={handleReset} className="reset-button">
              {currentLanguage.buttons.clearError}
            </button>
          </div>
        )}

        {result && (
          <div className="result-section" style={{ 
            backgroundColor: currentTheme.info + '20',
            borderLeftColor: currentTheme.success
          }}>
            <h3 style={{ color: currentTheme.text }}>{currentLanguage.results.title}</h3>
            <div className="result-grid">
              <div className="result-item" style={{ 
                backgroundColor: currentTheme.background,
                boxShadow: `0 2px 8px ${currentTheme.shadow}`
              }}>
                <span className="label" style={{ color: currentTheme.textSecondary }}>
                  {currentLanguage.results.similarity}:
                </span>
                <span className="value" style={{ color: currentTheme.text }}>
                  {(result.similarity * 100).toFixed(2)}%
                </span>
              </div>
              <div className="result-item" style={{ 
                backgroundColor: currentTheme.background,
                boxShadow: `0 2px 8px ${currentTheme.shadow}`
              }}>
                <span className="label" style={{ color: currentTheme.textSecondary }}>
                  {currentLanguage.results.match}:
                </span>
                <span 
                  className={`value ${result.isMatch ? 'success' : 'error'}`}
                  style={{ color: result.isMatch ? currentTheme.success : currentTheme.error }}
                >
                  {result.isMatch ? currentLanguage.results.yes : currentLanguage.results.no}
                </span>
              </div>
              <div className="result-item" style={{ 
                backgroundColor: currentTheme.background,
                boxShadow: `0 2px 8px ${currentTheme.shadow}`
              }}>
                <span className="label" style={{ color: currentTheme.textSecondary }}>
                  {currentLanguage.results.confidence}:
                </span>
                <span className="value" style={{ color: currentTheme.text }}>
                  {(result.confidence * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {showImagePreview && currentImage && (
          <div className="image-preview" style={{ 
            backgroundColor: currentTheme.background,
            boxShadow: `0 4px 12px ${currentTheme.shadow}`
          }}>
            <h4 style={{ color: currentTheme.text }}>{currentLanguage.preview}</h4>
            <img 
              src={currentImage} 
              alt="预览" 
              className="preview-image"
              style={{ borderColor: currentTheme.border }}
            />
          </div>
        )}
      </div>

      <CameraModal
        isOpen={showCamera}
        onClose={closeCamera}
        onCapture={cameraMode === 'init' ? handleInitCapture : handleCompareCapture}
        title={cameraMode === 'init' ? currentLanguage.steps.step1 : currentLanguage.steps.step2}
        config={{
          theme,
          language,
          ...cameraConfig
        }}
      />

      <style>{`
        .face-compare-component {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border-radius: 12px;
          box-shadow: 0 4px 20px ${currentTheme.shadow};
        }

        .face-compare-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid;
        }

        .face-compare-header h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }

        .status-indicator .status {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .face-compare-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .init-section,
        .compare-section,
        .progress-section {
          padding: 25px;
          border-radius: 12px;
          border-left: 4px solid;
        }

        .init-section h3,
        .compare-section h3,
        .progress-section h3 {
          margin: 0 0 15px 0;
          font-size: 20px;
        }

        .init-section p,
        .compare-section p,
        .progress-section p {
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .action-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-right: 15px;
          margin-bottom: 10px;
        }

        .action-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px ${currentTheme.shadow};
        }

        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: ${currentTheme.border};
          border-radius: 4px;
          overflow: hidden;
          margin: 15px 0;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .error-message {
          padding: 15px;
          border-radius: 8px;
          border: 1px solid;
        }

        .error-message p {
          margin: 0 0 10px 0;
        }

        .reset-button {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .reset-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .result-section {
          padding: 25px;
          border-radius: 12px;
          border-left: 4px solid;
        }

        .result-section h3 {
          margin: 0 0 20px 0;
          font-size: 20px;
        }

        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-radius: 8px;
        }

        .result-item .label {
          font-weight: 600;
        }

        .result-item .value {
          font-weight: 700;
          font-size: 18px;
        }

        .image-preview {
          padding: 20px;
          border-radius: 12px;
        }

        .image-preview h4 {
          margin: 0 0 15px 0;
        }

        .preview-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          border: 2px solid;
        }

        @media (max-width: 768px) {
          .face-compare-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .result-grid {
            grid-template-columns: 1fr;
          }

          .action-button {
            width: 100%;
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FaceCompareComponent;
