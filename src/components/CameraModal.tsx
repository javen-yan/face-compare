import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraModalProps } from '../types';

export interface CameraModalConfig {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  aspectRatio?: number;
  quality?: number;
  showPreview?: boolean;
  showControls?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  language?: 'zh-CN' | 'en-US';
  maxFileSize?: number; // MB
}

export interface CameraModalTheme {
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
}

const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = '拍照采集',
  config = {}
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraStartTimeout, setCameraStartTimeout] = useState<number | null>(null);

  // 默认配置
  const defaultConfig: Required<CameraModalConfig> = {
    width: 640,
    height: 480,
    facingMode: 'user',
    aspectRatio: 4/3,
    quality: 0.8,
    showPreview: true,
    showControls: true,
    theme: 'light',
    language: 'zh-CN',
    maxFileSize: 10
  };

  const finalConfig = { ...defaultConfig, ...config };

  // 主题配置
  const themes: Record<string, CameraModalTheme> = {
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
      warning: '#ffc107'
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
      warning: '#ffc107'
    }
  };

  const currentTheme = themes[finalConfig.theme] || themes.light;

  // 语言配置
  const languages = {
    'zh-CN': {
      title: '拍照采集',
      capture: '拍照',
      retake: '重拍',
      confirm: '确认',
      cancel: '取消',
      loading: '摄像头加载中...',
      error: '无法访问摄像头',
      permissionError: '请允许访问摄像头权限',
      deviceError: '摄像头设备不可用',
      fileSizeError: '图片文件过大',
      switchCamera: '切换摄像头'
    },
    'en-US': {
      title: 'Take Photo',
      capture: 'Capture',
      retake: 'Retake',
      confirm: 'Confirm',
      cancel: 'Cancel',
      loading: 'Camera loading...',
      error: 'Cannot access camera',
      permissionError: 'Please allow camera permission',
      deviceError: 'Camera device unavailable',
      fileSizeError: 'Image file too large',
      switchCamera: 'Switch Camera'
    }
  };

  const currentLanguage = languages[finalConfig.language];

  // 获取摄像头设备列表
  useEffect(() => {
    const getCameraDevices = async () => {
      try {
        // 先请求权限
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // 立即停止，只是获取权限
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setCameraDevices(cameras);
        
        if (cameras.length > 0) {
          setSelectedDevice(cameras[0].deviceId);
        }
      } catch (error) {
        console.error('获取摄像头设备失败:', error);
        setError('无法访问摄像头，请检查权限设置');
      }
    };

    if (isOpen) {
      getCameraDevices();
    }
  }, [isOpen]);

  // 启动摄像头
  const startCamera = useCallback(async () => {
    // 防止重复启动
    if (isStartingCamera || stream) {
      console.log('摄像头已在启动中或已启动，跳过');
      return;
    }

    // 清除之前的超时
    if (cameraStartTimeout) {
      clearTimeout(cameraStartTimeout);
      setCameraStartTimeout(null);
    }

    try {
      setIsStartingCamera(true);
      setError(null);
      setIsCameraReady(false); // 重置状态
      
      const constraints = {
        video: {
          width: { ideal: finalConfig.width },
          height: { ideal: finalConfig.height },
          facingMode: finalConfig.facingMode,
          aspectRatio: finalConfig.aspectRatio
        }
      };

      // 如果选择了特定设备且设备ID有效
      if (selectedDevice && selectedDevice.trim() !== '') {
        (constraints.video as any).deviceId = { exact: selectedDevice };
      }

      console.log('启动摄像头，约束条件:', constraints);

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          console.log('视频元数据加载完成', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight
          });
          setIsCameraReady(true);
          setError(null); // 清除之前的错误
        };
        videoRef.current.onerror = () => {
          console.error('视频加载失败');
          setError('视频加载失败');
          setIsCameraReady(false);
        };
        videoRef.current.oncanplay = () => {
          console.log('视频可以播放');
          setIsCameraReady(true);
        };
        videoRef.current.onloadeddata = () => {
          console.log('视频数据加载完成');
          setIsCameraReady(true);
        };
        videoRef.current.onstalled = () => {
          console.log('视频加载停滞');
        };
        videoRef.current.onwaiting = () => {
          console.log('视频等待数据');
        };
      }
    } catch (error) {
      console.error('无法访问摄像头:', error);
      let errorMessage = currentLanguage.error;
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = currentLanguage.permissionError;
        } else if (error.name === 'NotFoundError') {
          errorMessage = currentLanguage.deviceError;
        } else if (error.name === 'NotReadableError') {
          errorMessage = '摄像头被其他应用占用';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = '摄像头不支持指定的分辨率';
        }
      }
      
      setError(errorMessage);
      setIsCameraReady(false);
    } finally {
      setIsStartingCamera(false);
    }
  }, [finalConfig, selectedDevice, currentLanguage, isStartingCamera, stream, cameraStartTimeout]);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    console.log('停止摄像头');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('停止轨道:', track.kind);
      });
      setStream(null);
    }
    setIsCameraReady(false);
    setIsStartingCamera(false);
  }, [stream]);

  // 切换摄像头
  const switchCamera = useCallback(async () => {
    if (cameraDevices.length < 2) return;
    
    const currentIndex = cameraDevices.findIndex(device => device.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % cameraDevices.length;
    const nextDevice = cameraDevices[nextIndex];
    
    setSelectedDevice(nextDevice.deviceId);
    
    // 重新启动摄像头
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 100));
    await startCamera();
  }, [cameraDevices, selectedDevice, startCamera, stopCamera]);

  // 拍照
  const capturePhoto = useCallback(() => {
    console.log('=== 拍照函数开始 ===');
    console.log('拍照函数被调用', {
      hasVideo: !!videoRef.current,
      hasCanvas: !!canvasRef.current,
      isCameraReady,
      isCapturing,
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight,
      streamActive: !!stream
    });

    if (!videoRef.current) {
      console.error('视频元素不存在');
      setError('视频元素不存在');
      return;
    }

    if (!canvasRef.current) {
      console.error('画布元素不存在');
      setError('画布元素不存在');
      return;
    }

    if (!isCameraReady) {
      console.error('摄像头未就绪');
      setError('摄像头未就绪，请等待摄像头加载完成');
      return;
    }

    if (isCapturing) {
      console.log('正在拍照中，忽略重复点击');
      return;
    }

    setIsCapturing(true);
    console.log('设置拍照状态为 true');
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      console.log('开始拍照处理', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        hasContext: !!context,
        videoReadyState: video.readyState
      });

      if (!context) {
        throw new Error('无法获取画布上下文');
      }

      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        throw new Error(`视频尺寸无效: ${video.videoWidth}x${video.videoHeight}`);
      }

      // 设置画布尺寸
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log('画布尺寸设置为:', canvas.width, 'x', canvas.height);

      // 绘制视频帧到画布
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log('视频帧已绘制到画布');
      
      // 生成图片数据
      const imageData = canvas.toDataURL('image/jpeg', finalConfig.quality);
      console.log('图片生成成功', {
        imageDataLength: imageData.length,
        quality: finalConfig.quality,
        imageDataStart: imageData.substring(0, 50) + '...'
      });
      
      // 检查文件大小
      const base64Length = imageData.length;
      const estimatedSizeInMB = (base64Length * 3) / 4 / 1024 / 1024;
      console.log('文件大小估算:', estimatedSizeInMB.toFixed(2), 'MB');
      
      if (estimatedSizeInMB > finalConfig.maxFileSize) {
        const errorMsg = `图片文件过大: ${estimatedSizeInMB.toFixed(2)}MB > ${finalConfig.maxFileSize}MB`;
        console.error(errorMsg);
        setError(currentLanguage.fileSizeError);
        setIsCapturing(false);
        return;
      }
      
      // 设置拍摄的图片
      setCapturedImage(imageData);
      setError(null); // 清除之前的错误
      console.log('拍照成功，图片已设置到状态');
      
    } catch (error) {
      console.error('拍照失败:', error);
      const errorMsg = `拍照失败: ${error instanceof Error ? error.message : '未知错误'}`;
      setError(errorMsg);
    } finally {
      setIsCapturing(false);
      console.log('拍照状态已重置为 false');
    }
    
    console.log('=== 拍照函数结束 ===');
  }, [finalConfig, currentLanguage, isCapturing, stream]);

  // 重拍
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError(null);
  }, []);

  // 确认拍照
  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  }, [capturedImage, onCapture, onClose]);

  // 监听摄像头状态 - 只在模态框打开时启动一次
  useEffect(() => {
    if (isOpen && !stream) {
      // 延迟启动摄像头，确保设备列表已获取
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (!isOpen && stream) {
      // 模态框关闭时清理资源
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }
  }, [isOpen, stream, startCamera, stopCamera]);

  // 监听设备变化 - 避免频繁重启
  useEffect(() => {
    if (selectedDevice && isOpen && stream) {
      // 清除之前的超时
      if (cameraStartTimeout) {
        clearTimeout(cameraStartTimeout);
      }
      
      // 使用防抖，延迟重启摄像头
      const timeoutId = setTimeout(() => {
        console.log('设备变化，重启摄像头');
        stopCamera();
        const restartTimeout = setTimeout(() => startCamera(), 200);
        setCameraStartTimeout(restartTimeout);
      }, 800);
      
      setCameraStartTimeout(timeoutId);
      
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [selectedDevice, isOpen, stream, startCamera, stopCamera, cameraStartTimeout]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (cameraStartTimeout) {
        clearTimeout(cameraStartTimeout);
      }
      stopCamera();
    };
  }, [stopCamera, cameraStartTimeout]);

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay" style={{ backgroundColor: `rgba(0, 0, 0, 0.8)` }}>
      <div className="camera-modal" style={{ backgroundColor: currentTheme.background }}>
        <div className="camera-modal-header" style={{ borderBottomColor: currentTheme.border }}>
          <h3 style={{ color: currentTheme.text }}>{currentLanguage.title}</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            style={{ color: currentTheme.textSecondary }}
          >
            ×
          </button>
        </div>
        
        <div className="camera-modal-content">
          {!capturedImage ? (
            <>
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                  style={{ 
                    backgroundColor: '#000',
                    transition: 'opacity 0.3s ease-in-out'
                  }}
                />
                
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                
                {error && (
                  <div className="camera-error" style={{ backgroundColor: currentTheme.error, color: '#fff' }}>
                    <p>{error}</p>
                    <button onClick={startCamera}>重试</button>
                  </div>
                )}

                {isStartingCamera && (
                  <div className="camera-loading" style={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p>摄像头启动中...</p>
                  </div>
                )}
              </div>
              
              {finalConfig.showControls && (
                <div className="camera-controls">
                  {cameraDevices.length > 1 && (
                    <button
                      className="control-button secondary"
                      onClick={switchCamera}
                      disabled={!isCameraReady}
                      style={{ 
                        backgroundColor: currentTheme.secondary,
                        color: '#fff'
                      }}
                    >
                      {currentLanguage.switchCamera}
                    </button>
                  )}
                  
                  <button
                    className="capture-button"
                    onClick={capturePhoto}
                    disabled={!isCameraReady || isCapturing}
                    style={{ 
                      backgroundColor: currentTheme.primary,
                      color: '#fff'
                    }}
                  >
                    {isCapturing ? '拍照中...' : currentLanguage.capture}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="capture-preview">
              <img 
                src={capturedImage} 
                alt="预览" 
                className="preview-image"
                style={{ borderColor: currentTheme.border }}
              />
              
              <div className="preview-controls">
                <button
                  className="control-button secondary"
                  onClick={retakePhoto}
                  style={{ 
                    backgroundColor: currentTheme.secondary,
                    color: '#fff'
                  }}
                >
                  {currentLanguage.retake}
                </button>
                
                <button
                  className="control-button primary"
                  onClick={confirmPhoto}
                  style={{ 
                    backgroundColor: currentTheme.success,
                    color: '#fff'
                  }}
                >
                  {currentLanguage.confirm}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <style>{`
          .camera-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .camera-modal {
            border-radius: 12px;
            padding: 0;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 40px ${currentTheme.shadow};
          }
          
          .camera-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid;
          }
          
          .camera-modal-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
          }
          
          .close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
          }
          
          .close-button:hover {
            background-color: ${currentTheme.surface};
          }
          
          .camera-modal-content {
            padding: 20px;
          }
          
          .camera-container {
            position: relative;
            margin-bottom: 20px;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .camera-video {
            width: 100%;
            max-width: ${finalConfig.width}px;
            height: auto;
            border-radius: 8px;
            display: block;
            opacity: ${isCameraReady ? 1 : 0.7};
            transition: opacity 0.3s ease-in-out;
            will-change: opacity;
          }
          
          .camera-error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          
          .camera-error button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: #fff;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
          }
          
          .camera-controls {
            display: flex;
            gap: 15px;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
          }
          
          .control-button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .control-button:hover:not(:disabled) {
            transform: translateY(-1px);
            opacity: 0.9;
          }
          
          .control-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .capture-button {
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 120px;
          }
          
          .capture-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px ${currentTheme.shadow};
          }
          
          .capture-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          
          .capture-preview {
            text-align: center;
          }
          
          .preview-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            border: 2px solid;
            margin-bottom: 20px;
          }
          
          .preview-controls {
            display: flex;
            gap: 15px;
            justify-content: center;
          }
          
          @media (max-width: 768px) {
            .camera-modal {
              max-width: 95vw;
              max-height: 95vh;
            }
            
            .camera-controls {
              flex-direction: column;
            }
            
            .preview-controls {
              flex-direction: column;
              align-items: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CameraModal;
