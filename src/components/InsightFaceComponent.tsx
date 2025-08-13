import React, { useState, useCallback, useEffect } from 'react';
import { FaceCompare } from '../FaceCompare';
import CameraModal from './CameraModal';
import { FaceCompareResult, InsightFaceConfig } from '../types';

export interface InsightFaceComponentProps {
  apiUrl?: string;
  config?: InsightFaceConfig;
  onResult?: (result: FaceCompareResult) => void;
  onError?: (error: Error) => void;
}

export const InsightFaceComponent: React.FC<InsightFaceComponentProps> = ({
  apiUrl = 'http://localhost:3001/api',
  config = {},
  onResult,
  onError
}) => {
  const [sdk, setSdk] = useState<FaceCompare | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<FaceCompareResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'init' | 'compare'>('init');
  const [threshold, setThreshold] = useState(0.6);

  // 初始化 SDK
  useEffect(() => {
    const faceCompare = new FaceCompare(
      { api: apiUrl },
      {
        enableLogging: true,
        insightFace: {
          threshold: 0.6,
          enableBatchCompare: true,
          enableUserManagement: true,
          enableSystemMonitoring: true,
          ...config
        }
      },
      {
        onInitSuccess: (response) => {
          setIsInitialized(true);
          setUserId(response.data?.userId || '');
          setIsLoading(false);
        },
        onInitError: (error) => {
          setIsLoading(false);
          onError?.(error);
        },
        onCompareSuccess: (result) => {
          setLastResult(result);
          setIsLoading(false);
          onResult?.(result);
        },
        onCompareError: (error) => {
          setIsLoading(false);
          onError?.(error);
        }
      }
    );

    setSdk(faceCompare);
    return () => faceCompare.clear();
  }, [apiUrl, config, onResult, onError]);

  // 打开摄像头进行初始化
  const openInitCamera = useCallback(() => {
    setCameraMode('init');
    setShowCamera(true);
  }, []);

  // 打开摄像头进行对比
  const openCompareCamera = useCallback(() => {
    if (!isInitialized) {
      alert('请先初始化人脸数据');
      return;
    }
    setCameraMode('compare');
    setShowCamera(true);
  }, [isInitialized]);

  // 处理拍照
  const handleCapture = useCallback(async (imageData: string) => {
    if (!sdk) return;
    
    setIsLoading(true);
    setShowCamera(false);

    try {
      if (cameraMode === 'init') {
        await sdk.init(imageData);
      } else {
        await sdk.compare(imageData, threshold);
      }
    } catch (error) {
      console.error('操作失败:', error);
      onError?.(error as Error);
    }
  }, [sdk, cameraMode, threshold, onError]);

  // 清除当前用户数据
  const handleClear = useCallback(() => {
    if (sdk) {
      sdk.clear();
      setIsInitialized(false);
      setUserId('');
      setLastResult(null);
    }
  }, [sdk]);

  return (
    <div className="insightface-component">
      <div className="controls">
        <button onClick={openInitCamera} disabled={isLoading}>
          📸 注册新用户
        </button>
        <button onClick={openCompareCamera} disabled={!isInitialized || isLoading}>
          🔍 人脸对比
        </button>
        <button onClick={handleClear} disabled={!isInitialized || isLoading}>
          🗑️ 清除当前用户
        </button>
      </div>
      {isInitialized && (
        <div className="user-status">
          <h3>当前用户: {userId}</h3>
          <p>状态: ✅ 已初始化</p>
        </div>
      )}

      <div className="threshold-setting">
        <h3>相似度阈值: {threshold.toFixed(2)}</h3>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
        />
        <div className="threshold-labels">
          <span>严格 (0.9)</span>
          <span>标准 (0.6)</span>
          <span>宽松 (0.3)</span>
        </div>
      </div>

      {lastResult && (
        <div className="result">
          <h3>对比结果</h3>
          <div className="result-grid">
            <div>相似度: <span className={lastResult.isMatch ? 'match' : 'no-match'}>
              {(lastResult.similarity * 100).toFixed(2)}%
            </span></div>
            <div>匹配: <span className={lastResult.isMatch ? 'match' : 'no-match'}>
              {lastResult.isMatch ? '✅ 是' : '❌ 否'}
            </span></div>
            <div>置信度: {(lastResult.confidence * 100).toFixed(2)}%</div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>处理中...</span>
        </div>
      )}

      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
        title={cameraMode === 'init' ? '注册用户人脸' : '人脸对比'}
      />

              <style>{`
        .insightface-component {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
          
        .controls {
          display: flex;
          gap: 15px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        button {
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          background: #007bff;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        button:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-1px);
        }

        button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .user-status {
          margin-bottom: 30px;
          padding: 20px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
        }

        .threshold-setting {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .threshold-setting h3 {
          margin: 0 0 15px 0;
        }

        .threshold-setting input[type="range"] {
          width: 100%;
          height: 8px;
          margin-bottom: 10px;
        }

        .threshold-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6c757d;
        }

        .result {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .match {
          color: #28a745;
          font-weight: 600;
        }

        .no-match {
          color: #dc3545;
          font-weight: 600;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #dee2e6;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .controls {
            flex-direction: column;
          }
          
          .result-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}; 