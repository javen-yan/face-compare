import React, { useState } from 'react';
import { 
  FaceCompareComponent, 
  CameraModal,
  FaceCompareComponentProps,
  CameraModalConfig 
} from '../src/index';

// 高级配置示例
const AdvancedUsageExample: React.FC = () => {
  const [config, setConfig] = useState({
    api: 'https://your-api-domain.com/api',
    auth: 'your-auth-token'
  });

  const [componentProps, setComponentProps] = useState<Partial<FaceCompareComponentProps>>({
    theme: 'light',
    language: 'zh-CN',
    showProgress: true,
    showStatus: true,
    showImagePreview: true
  });

  const [cameraConfig, setCameraConfig] = useState<CameraModalConfig>({
    width: 640,
    height: 480,
    quality: 0.8,
    theme: 'light',
    language: 'zh-CN',
    maxFileSize: 10
  });

  const handleResult = (result: any) => {
    console.log('人脸对比结果:', result);
    // 处理结果
  };

  const handleInitSuccess = (response: any) => {
    console.log('初始化成功:', response);
    // 处理初始化成功
  };

  const handleError = (error: Error) => {
    console.error('发生错误:', error);
    // 处理错误
  };

  const toggleTheme = () => {
    const newTheme = componentProps.theme === 'light' ? 'dark' : 'light';
    setComponentProps(prev => ({ ...prev, theme: newTheme }));
    setCameraConfig(prev => ({ ...prev, theme: newTheme }));
  };

  const toggleLanguage = () => {
    const newLanguage = componentProps.language === 'zh-CN' ? 'en-US' : 'zh-CN';
    setComponentProps(prev => ({ ...prev, language: newLanguage }));
    setCameraConfig(prev => ({ ...prev, language: newLanguage }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>FaceCompare 高级使用示例</h1>
      
      {/* 配置控制面板 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h3>配置控制</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={componentProps.showProgress}
              onChange={(e) => setComponentProps(prev => ({ 
                ...prev, 
                showProgress: e.target.checked 
              }))}
            />
            显示进度条
          </label>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={componentProps.showStatus}
              onChange={(e) => setComponentProps(prev => ({ 
                ...prev, 
                showStatus: e.target.checked 
              }))}
            />
            显示状态指示器
          </label>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={componentProps.showImagePreview}
              onChange={(e) => setComponentProps(prev => ({ 
                ...prev, 
                showImagePreview: e.target.checked 
              }))}
            />
            显示图片预览
          </label>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <button onClick={toggleTheme} style={{ marginRight: '10px' }}>
            切换主题 ({componentProps.theme})
          </button>
          <button onClick={toggleLanguage}>
            切换语言 ({componentProps.language})
          </button>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            摄像头质量:
            <select
              value={cameraConfig.quality}
              onChange={(e) => setCameraConfig(prev => ({ 
                ...prev, 
                quality: parseFloat(e.target.value) 
              }))}
            >
              <option value={0.5}>低质量 (0.5)</option>
              <option value={0.8}>中等质量 (0.8)</option>
              <option value={1.0}>高质量 (1.0)</option>
            </select>
          </label>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            最大文件大小 (MB):
            <input
              type="number"
              min="1"
              max="50"
              value={cameraConfig.maxFileSize}
              onChange={(e) => setCameraConfig(prev => ({ 
                ...prev, 
                maxFileSize: parseInt(e.target.value) 
              }))}
              style={{ marginLeft: '10px', width: '80px' }}
            />
          </label>
        </div>
      </div>

      {/* 主要组件 */}
      <FaceCompareComponent
        config={config}
        onResult={handleResult}
        onInitSuccess={handleInitSuccess}
        onError={handleError}
        {...componentProps}
        cameraConfig={cameraConfig}
        style={{
          border: '2px solid #007bff',
          borderRadius: '16px'
        }}
      />

      {/* 独立使用 CameraModal 的示例 */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h3>独立使用 CameraModal</h3>
        <p>这里展示了如何单独使用拍照组件</p>
        
        <StandaloneCameraExample config={cameraConfig} />
      </div>
    </div>
  );
};

// 独立使用 CameraModal 的示例组件
const StandaloneCameraExample: React.FC<{ config: CameraModalConfig }> = ({ config }) => {
  const [isOpen, setOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    console.log('独立拍照组件捕获到图片');
  };

  return (
    <div>
      <button 
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '15px'
        }}
      >
        打开独立拍照组件
      </button>

      {capturedImage && (
        <div style={{ marginTop: '15px' }}>
          <h4>捕获的图片:</h4>
          <img 
            src={capturedImage} 
            alt="捕获的图片" 
            style={{ 
              maxWidth: '200px', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }} 
          />
        </div>
      )}

      <CameraModal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        onCapture={handleCapture}
        title="独立拍照组件"
        config={config}
      />
    </div>
  );
};

export default AdvancedUsageExample;
