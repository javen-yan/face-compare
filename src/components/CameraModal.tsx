import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraModalProps } from '../types';

const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
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
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // 人脸检测相关状态
  const [faceDetected, setFaceDetected] = useState(false);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [faceDetectionInterval, setFaceDetectionInterval] = useState<number | null>(null);
  
  // 使用 useRef 存储函数引用，避免依赖项问题
  const startCameraRef = useRef<() => Promise<void>>();
  const stopCameraRef = useRef<() => void>();

  // 默认配置
  const defaultConfig = {
    width: 640,
    height: 480,
    facingMode: 'user' as const,
    aspectRatio: 4/3,
    quality: 0.8,
    showPreview: true,
    showControls: true,
    maxFileSize: 10
  };

  const finalConfig = { ...defaultConfig, ...config };

  // 语言配置
  const language = {
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
    switchCamera: '切换摄像头',
    autoCapture: '自动抓拍',
    faceDetected: '检测到人脸',
    noFaceDetected: '未检测到人脸'
  };

  // 获取摄像头设备列表
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      // 重置人脸检测状态
      setFaceDetected(false);
      
      const getCameraDevices = async () => {
        try {
          // 先请求权限
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStream.getTracks().forEach(track => track.stop());
          
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter(device => device.kind === 'videoinput');
          setCameraDevices(cameras);
          
          if (cameras.length > 0) {
            setSelectedDevice(cameras[0].deviceId);
          }
          
          setHasInitialized(true);
        } catch (error) {
          console.error('获取摄像头设备失败:', error);
          setError('无法访问摄像头，请检查权限设置');
        }
      };

      getCameraDevices();
    }
  }, [isOpen, hasInitialized]);

  // 启动摄像头
  const startCamera = useCallback(async () => {
    if (isStartingCamera || stream) {
      return;
    }

    try {
      setIsStartingCamera(true);
      setError(null);
      setIsCameraReady(false);
      
      const constraints = {
        video: {
          width: { ideal: finalConfig.width },
          height: { ideal: finalConfig.height },
          facingMode: finalConfig.facingMode,
          aspectRatio: finalConfig.aspectRatio
        }
      };

      if (selectedDevice && selectedDevice.trim() !== '') {
        (constraints.video as any).deviceId = { exact: selectedDevice };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
          setError(null);
        };
        videoRef.current.onerror = () => {
          setError('视频加载失败');
          setIsCameraReady(false);
        };
      }
    } catch (error) {
      console.error('无法访问摄像头:', error);
      let errorMessage = language.error;
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = language.permissionError;
        } else if (error.name === 'NotFoundError') {
          errorMessage = language.deviceError;
        } else if (error.name === 'NotReadableError') {
          errorMessage = '摄像头被其他应用占用';
        }
      }
      
      setError(errorMessage);
      setIsCameraReady(false);
    } finally {
      setIsStartingCamera(false);
    }
  }, [finalConfig, selectedDevice, language, isStartingCamera, stream]);

  startCameraRef.current = startCamera;

  // 停止摄像头
  const stopCamera = useCallback(() => {
    setStream(currentStream => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      return null;
    });
    setIsCameraReady(false);
    setIsStartingCamera(false);
    
    // 清除人脸检测定时器
    if (faceDetectionInterval) {
      clearInterval(faceDetectionInterval);
      setFaceDetectionInterval(null);
    }
  }, [faceDetectionInterval]);

  stopCameraRef.current = stopCamera;

  // 切换摄像头
  const switchCamera = useCallback(async () => {
    if (cameraDevices.length < 2) return;
    
    const currentIndex = cameraDevices.findIndex(device => device.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % cameraDevices.length;
    const nextDevice = cameraDevices[nextIndex];
    
    setSelectedDevice(nextDevice.deviceId);
    
    if (stopCameraRef.current) {
      stopCameraRef.current();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    if (startCameraRef.current) {
      await startCameraRef.current();
    }
  }, [cameraDevices, selectedDevice]);

  // 拍照
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady || isCapturing) {
      return;
    }

    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('无法获取画布上下文');
      }

      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        throw new Error(`视频尺寸无效: ${video.videoWidth}x${video.videoHeight}`);
      }

      // 设置画布尺寸
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 绘制视频帧到画布
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 生成图片数据
      const imageData = canvas.toDataURL('image/jpeg', finalConfig.quality);
      
      // 检查文件大小
      const base64Length = imageData.length;
      const estimatedSizeInMB = (base64Length * 3) / 4 / 1024 / 1024;
      
      if (estimatedSizeInMB > finalConfig.maxFileSize) {
        setError(language.fileSizeError);
        setIsCapturing(false);
        return;
      }
      
      setCapturedImage(imageData);
      setError(null);
      setFaceDetected(false);
      onCapture(imageData);
    } catch (error) {
      console.error('拍照失败:', error);
      setError(`拍照失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsCapturing(false);
    }
  }, [finalConfig, language, isCapturing, stream, onCapture]);

  // 人脸检测函数
  const detectFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.videoWidth <= 0 || video.videoHeight <= 0) return;

      // 设置画布尺寸
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 绘制视频帧到画布
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 获取图像数据进行分析
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 简单的人脸检测：检测肤色区域
      let skinPixels = 0;
      let totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 简单的肤色检测算法
        if (r > 95 && g > 40 && b > 20 && 
            Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
            Math.abs(r - g) > 15 && r > g && r > b) {
          skinPixels++;
        }
      }

      const skinRatio = skinPixels / totalPixels;
      const hasFace = skinRatio > 0.1; // 如果肤色像素超过10%，认为有人脸

      setFaceDetected(hasFace);

      // 如果启用了自动抓拍且检测到人脸，自动拍照
      if (autoCaptureEnabled && hasFace && !isCapturing && !capturedImage) {
        setTimeout(() => {
          capturePhoto();
        }, 1000); // 延迟1秒自动拍照
      }
    } catch (error) {
      console.error('人脸检测失败:', error);
    }
  }, [isCameraReady, autoCaptureEnabled, isCapturing, capturedImage, capturePhoto]);

  // 启动人脸检测
  useEffect(() => {
    if (isCameraReady && autoCaptureEnabled) {
      const interval = setInterval(detectFace, 500); // 每500ms检测一次
      setFaceDetectionInterval(interval);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isCameraReady, autoCaptureEnabled, detectFace]);

  // 重拍
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    // 重拍时重置人脸检测状态
    setFaceDetected(false);
    
    // 重拍后重新启动摄像头
    // 先停止当前摄像头，然后重新启动
    if (stopCameraRef.current) {
      stopCameraRef.current();
    }
    
    // 延迟一点时间再重新启动，确保资源完全释放
    setTimeout(() => {
      if (startCameraRef.current) {
        startCameraRef.current();
      }
    }, 100);
  }, []);

  // 确认拍照
  const confirmPhoto = useCallback(() => {
    // 拍照完成后已经立即调用了onCapture，这里只需要关闭模态框
    onClose();
  }, [onClose]);

  // 主要的摄像头管理逻辑
  useEffect(() => {
    if (isOpen && hasInitialized && !stream) {
      const timer = setTimeout(() => {
        if (startCameraRef.current) {
          startCameraRef.current();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (!isOpen && stream) {
      if (stopCameraRef.current) {
        stopCameraRef.current();
      }
      setCapturedImage(null);
      setError(null);
      setHasInitialized(false);
      // 重置人脸检测状态
      setFaceDetected(false);
    }
  }, [isOpen, hasInitialized, stream]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (stopCameraRef.current) {
        stopCameraRef.current();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal">
        <div className="camera-modal-header">
          <h3>{language.title}</h3>
          <button className="close-button" onClick={onClose}>×</button>
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
                />
                
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* 人脸检测指示器 - 只在摄像头就绪时显示 */}
                {isCameraReady && (
                  <div className="face-detection-indicator">
                    <div className={`indicator-dot ${faceDetected ? 'detected' : 'not-detected'}`}></div>
                    <span className="indicator-text">
                      {faceDetected ? language.faceDetected : language.noFaceDetected}
                    </span>
                  </div>
                )}

                {/* 圆形取景框 */}
                <div className="camera-frame">
                  <div className="frame-circle"></div>
                </div>
                
                {error && (
                  <div className="camera-error">
                    <p>{error}</p>
                    <button onClick={() => startCameraRef.current?.()}>重试</button>
                  </div>
                )}

                {isStartingCamera && (
                  <div className="camera-loading">
                    <p>{language.loading}</p>
                  </div>
                )}
              </div>
              
              <div className="camera-controls">
                {/* 自动抓拍开关 */}
                <div className="auto-capture-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={autoCaptureEnabled}
                      onChange={(e) => setAutoCaptureEnabled(e.target.checked)}
                    />
                    {language.autoCapture}
                  </label>
                </div>

                {/* 切换摄像头按钮 */}
                {cameraDevices.length > 1 && (
                  <button
                    className="control-button secondary"
                    onClick={switchCamera}
                    disabled={!isCameraReady}
                  >
                    {language.switchCamera}
                  </button>
                )}
                
                {/* 手动拍照按钮 */}
                <button
                  className="capture-button"
                  onClick={capturePhoto}
                  disabled={!isCameraReady || isCapturing}
                >
                  {isCapturing ? '拍照中...' : language.capture}
                </button>
              </div>
            </>
          ) : (
            <div className="capture-preview">
              <img 
                src={capturedImage} 
                alt="预览" 
                className="preview-image"
              />
              
              <div className="preview-controls">
                <button
                  className="control-button secondary"
                  onClick={retakePhoto}
                >
                  {language.retake}
                </button>
                
                <button
                  className="control-button primary"
                  onClick={confirmPhoto}
                >
                  {language.confirm}
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
            background-color: rgba(0, 0, 0, 0.8);
          }
          
          .camera-modal {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 0;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          }
          
          .camera-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
          }
          
          .camera-modal-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: #333333;
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
            color: #666666;
          }
          
          .close-button:hover {
            background-color: #f8f9fa;
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
          }
          
          .camera-frame {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .frame-circle {
            width: 280px;
            height: 280px;
            border: 3px solid #007bff;
            border-radius: 50%;
            box-shadow: 0 0 20px rgba(0, 123, 255, 0.5);
            opacity: 0.5;
          }
          
          .face-detection-indicator {
            position: absolute;
            top: 20px;
            left: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
          }
          
          .indicator-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            transition: background-color 0.3s;
          }
          
          .indicator-dot.detected {
            background-color: #28a745;
            box-shadow: 0 0 8px rgba(40, 167, 69, 0.6);
          }
          
          .indicator-dot.not-detected {
            background-color: #dc3545;
            box-shadow: 0 0 8px rgba(220, 53, 69, 0.6);
          }
          
          .camera-error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          
          .camera-error button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
          }
          
          .camera-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          
          .camera-controls {
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: center;
          }
          
          .auto-capture-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #666666;
          }
          
          .auto-capture-toggle input[type="checkbox"] {
            width: 16px;
            height: 16px;
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
          
          .control-button.secondary {
            background-color: #6c757d;
            color: white;
          }
          
          .control-button.primary {
            background-color: #007bff;
            color: white;
          }
          
          .control-button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          
          .control-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .capture-button {
            background-color: #28a745;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            min-width: 120px;
          }
          
          .capture-button:hover:not(:disabled) {
            background-color: #218838;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
          }
          
          .capture-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .capture-preview {
            text-align: center;
          }
          
          .preview-image {
            max-width: 100%;
            max-height: 400px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }
          
          .preview-controls {
            display: flex;
            gap: 15px;
            justify-content: center;
          }
          
          /* 响应式设计 */
          @media (max-width: 768px) {
            .camera-modal {
              max-width: 95vw;
              max-height: 95vh;
            }
            
            .camera-modal-content {
              padding: 15px;
            }
            
            .camera-modal-header {
              padding: 15px;
            }
            
            .camera-modal-header h3 {
              font-size: 18px;
            }
            
            .frame-circle {
              width: 220px;
              height: 220px;
            }
            
            .capture-button {
              padding: 12px 24px;
              font-size: 14px;
              min-width: 100px;
            }
            
            .preview-controls {
              flex-direction: column;
              align-items: center;
            }
            
            .control-button {
              width: 100%;
              max-width: 200px;
            }
          }
          
          @media (max-width: 480px) {
            .camera-modal {
              border-radius: 8px;
            }
            
            .camera-modal-content {
              padding: 10px;
            }
            
            .camera-modal-header {
              padding: 10px;
            }
            
            .frame-circle {
              width: 180px;
              height: 180px;
            }
            
            .face-detection-indicator {
              top: 10px;
              left: 10px;
              font-size: 11px;
              padding: 6px 10px;
            }
          }
        `}
        </style>
      </div>
    </div>
  );
};

export default CameraModal;