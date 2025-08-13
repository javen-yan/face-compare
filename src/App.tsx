import React from 'react';
import FaceCompareComponent from './components/FaceCompareComponent';
import { FaceCompareConfig } from './types';

const App: React.FC = () => {
  // 配置 API 地址和认证信息
  const config: FaceCompareConfig = {
    api: 'https://your-api-domain.com/api', // 替换为实际的 API 地址
    auth: 'your-auth-token' // 替换为实际的认证令牌
  };

  const handleResult = (result: any) => {
    console.log('人脸对比结果:', result);
    // 这里可以处理对比结果，比如显示通知、记录日志等
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>🚀 FaceCompare 人脸对比系统</h1>
        <p>基于 React 的人脸识别和对比插件</p>
      </div>
      
      <FaceCompareComponent 
        config={config} 
        onResult={handleResult}
      />
      
      <div className="app-footer">
        <p>© 2024 FaceCompare. 基于 React + TypeScript 构建</p>
      </div>

      <style>{`
        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .app-header {
          text-align: center;
          color: white;
          margin-bottom: 40px;
        }

        .app-header h1 {
          margin: 0 0 10px 0;
          font-size: 36px;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .app-header p {
          margin: 0;
          font-size: 18px;
          opacity: 0.9;
        }

        .app-footer {
          text-align: center;
          color: white;
          margin-top: 40px;
          opacity: 0.7;
        }

        .app-footer p {
          margin: 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default App;
