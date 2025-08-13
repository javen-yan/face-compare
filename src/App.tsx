import { useState } from 'react';
import { InsightFaceComponent } from './components/InsightFaceComponent';
import { FaceCompareResult } from './types';
import './App.css';

function App() {
  const [lastResult, setLastResult] = useState<FaceCompareResult | null>(null);

  const handleResult = (result: FaceCompareResult) => {
    setLastResult(result);
    console.log('人脸识别结果:', result);
  };

  const handleError = (error: Error) => {
    console.error('人脸识别错误:', error);
    alert(`操作失败: ${error.message}`);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌟 InsightFace 人脸识别系统</h1>
        <p>基于深度学习的高精度人脸识别解决方案</p>
      </header>

      <main className="main-content">
        <InsightFaceComponent
          apiUrl="http://localhost:3001/api"
          config={{
            threshold: 0.6,
            enableBatchCompare: true,
            enableUserManagement: true,
            enableSystemMonitoring: true
          }}
          onResult={handleResult}
          onError={handleError}
        />
      </main>

      {lastResult && (
        <div className="global-result">
          <h3>🎯 最新识别结果</h3>
          <div className="result-summary">
            <div className="result-item">
              <span>相似度:</span>
              <span className={`similarity ${lastResult.isMatch ? 'match' : 'no-match'}`}>
                {(lastResult.similarity * 100).toFixed(2)}%
              </span>
            </div>
            <div className="result-item">
              <span>匹配结果:</span>
              <span className={lastResult.isMatch ? 'match' : 'no-match'}>
                {lastResult.isMatch ? '✅ 身份验证通过' : '❌ 身份验证失败'}
              </span>
            </div>
            <div className="result-item">
              <span>置信度:</span>
              <span>{(lastResult.confidence * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
