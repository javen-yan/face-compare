import {
  useAutoFaceCompare,
  CompareResult,
} from "../../src/hooks/useAutoFaceCompare";
import CameraModal from "../../src/components/CameraModal";
import { useState } from "react";
import "./App.css";

// 配置面板组件
function ConfigPanel({
  config,
  onConfigChange,
  onSave,
  onReset,
}: {
  config: {
    faceCompareConfig: {
      api: string;
      userId: string;
      auth?: string;
    };
    cameraConfig: {
      width: number;
      height: number;
      quality: number;
      facingMode: "user" | "environment";
    };
    retryCount: number;
    retryDelay: number;
    enableLogging: boolean;
    timeout: number;
    enableCache: boolean;
    cacheTTL: number;
    threshold: number;
  };
  onConfigChange: (newConfig: any) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateConfig = (section: string, key: string, value: any) => {
    const newConfig = { ...config };
    if (section === "faceCompareConfig") {
      newConfig.faceCompareConfig = {
        ...newConfig.faceCompareConfig,
        [key]: value,
      };
    } else if (section === "cameraConfig") {
      newConfig.cameraConfig = { ...newConfig.cameraConfig, [key]: value };
    } else {
      (newConfig as any)[section] = {
        ...(newConfig as any)[section],
        [key]: value,
      };
    }
    onConfigChange(newConfig);
  };

  return (
    <div className="config-panel">
      <div className="config-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>⚙️ 配置面板</h3>
        <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div className="config-content">
          {/* 人脸识别配置 */}
          <div className="config-section">
            <h4>🔐 人脸识别配置</h4>
            <div className="config-row">
              <label>API 地址:</label>
              <input
                type="text"
                value={config.faceCompareConfig.api}
                onChange={(e) =>
                  updateConfig("faceCompareConfig", "api", e.target.value)
                }
                placeholder="http://localhost:3001"
              />
            </div>
            <div className="config-row">
              <label>用户ID:</label>
              <input
                type="text"
                value={config.faceCompareConfig.userId}
                onChange={(e) =>
                  updateConfig("faceCompareConfig", "userId", e.target.value)
                }
                placeholder="test-user-123"
              />
            </div>
            <div className="config-row">
              <label>认证令牌:</label>
              <input
                type="text"
                value={config.faceCompareConfig.auth || ""}
                onChange={(e) =>
                  updateConfig(
                    "faceCompareConfig",
                    "auth",
                    e.target.value || undefined
                  )
                }
                placeholder="可选"
              />
            </div>
          </div>

          {/* 摄像头配置 */}
          <div className="config-section">
            <h4>📷 摄像头配置</h4>
            <div className="config-row">
              <label>宽度:</label>
              <input
                type="number"
                value={config.cameraConfig.width}
                onChange={(e) =>
                  updateConfig(
                    "cameraConfig",
                    "width",
                    parseInt(e.target.value)
                  )
                }
                min="320"
                max="1920"
                step="32"
              />
            </div>
            <div className="config-row">
              <label>高度:</label>
              <input
                type="number"
                value={config.cameraConfig.height}
                onChange={(e) =>
                  updateConfig(
                    "cameraConfig",
                    "height",
                    parseInt(e.target.value)
                  )
                }
                min="240"
                max="1080"
                step="32"
              />
            </div>
            <div className="config-row">
              <label>质量:</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={config.cameraConfig.quality}
                onChange={(e) =>
                  updateConfig(
                    "cameraConfig",
                    "quality",
                    parseFloat(e.target.value)
                  )
                }
              />
              <span>{Math.round(config.cameraConfig.quality * 100)}%</span>
            </div>
            <div className="config-row">
              <label>摄像头方向:</label>
              <select
                value={config.cameraConfig.facingMode}
                onChange={(e) =>
                  updateConfig(
                    "cameraConfig",
                    "facingMode",
                    e.target.value as "user" | "environment"
                  )
                }
              >
                <option value="user">前置摄像头</option>
                <option value="environment">后置摄像头</option>
              </select>
            </div>
          </div>

          {/* 网络配置 */}
          <div className="config-section">
            <h4>🌐 网络配置</h4>
            <div className="config-row">
              <label>超时时间 (ms):</label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) =>
                  updateConfig("timeout", "timeout", parseInt(e.target.value))
                }
                min="5000"
                max="120000"
                step="1000"
              />
            </div>
            <div className="config-row">
              <label>重试次数:</label>
              <input
                type="number"
                value={config.retryCount}
                onChange={(e) =>
                  updateConfig(
                    "retryCount",
                    "retryCount",
                    parseInt(e.target.value)
                  )
                }
                min="0"
                max="10"
                step="1"
              />
            </div>
            <div className="config-row">
              <label>重试延迟 (ms):</label>
              <input
                type="number"
                value={config.retryDelay}
                onChange={(e) =>
                  updateConfig(
                    "retryDelay",
                    "retryDelay",
                    parseInt(e.target.value)
                  )
                }
                min="100"
                max="10000"
                step="100"
              />
            </div>
          </div>

          {/* 缓存配置 */}
          <div className="config-section">
            <h4>💾 缓存配置</h4>
            <div className="config-row">
              <label>启用缓存:</label>
              <input
                type="checkbox"
                checked={config.enableCache}
                onChange={(e) =>
                  updateConfig("enableCache", "enableCache", e.target.checked)
                }
              />
            </div>
            {config.enableCache && (
              <div className="config-row">
                <label>缓存TTL (ms):</label>
                <input
                  type="number"
                  value={config.cacheTTL}
                  onChange={(e) =>
                    updateConfig(
                      "cacheTTL",
                      "cacheTTL",
                      parseInt(e.target.value)
                    )
                  }
                  min="60000"
                  max="3600000"
                  step="60000"
                />
              </div>
            )}
          </div>

          {/* 算法配置 */}
          <div className="config-section">
            <h4>🧠 算法配置</h4>
            <div className="config-row">
              <label>相似度阈值:</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.threshold}
                onChange={(e) =>
                  updateConfig(
                    "threshold",
                    "threshold",
                    parseFloat(e.target.value)
                  )
                }
              />
              <span>{Math.round(config.threshold * 100)}%</span>
            </div>
          </div>

          {/* 调试配置 */}
          <div className="config-section">
            <h4>🐛 调试配置</h4>
            <div className="config-row">
              <label>启用日志:</label>
              <input
                type="checkbox"
                checked={config.enableLogging}
                onChange={(e) =>
                  updateConfig(
                    "enableLogging",
                    "enableLogging",
                    e.target.checked
                  )
                }
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="config-section config-actions">
            <h4>💾 配置操作</h4>
            <div className="config-actions-row">
              <button onClick={onSave} className="save-button">
                💾 保存配置
              </button>
              <button onClick={onReset} className="reset-button">
                🔄 重置配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 默认配置
  const defaultConfig = {
    faceCompareConfig: {
      api: "http://localhost:3001",
      userId: "test-user-123",
      auth: undefined as string | undefined,
    },
    cameraConfig: {
      width: 640,
      height: 480,
      quality: 0.8,
      facingMode: "user" as "user" | "environment",
    },
    retryCount: 3,
    retryDelay: 1000,
    enableLogging: true,
    timeout: 30000,
    enableCache: true,
    cacheTTL: 300000,
    threshold: 0.6,
  };

  // 配置状态
  const [config, setConfig] = useState(() => {
    // 尝试从 localStorage 加载配置
    const savedConfig = localStorage.getItem("faceCompareConfig");
    if (savedConfig) {
      try {
        return { ...defaultConfig, ...JSON.parse(savedConfig) };
      } catch (e) {
        console.warn("加载配置失败，使用默认配置:", e);
      }
    }
    return defaultConfig;
  });

  // 保存配置到 localStorage
  const saveConfig = () => {
    try {
      localStorage.setItem("faceCompareConfig", JSON.stringify(config));
      alert("配置已保存！");
    } catch (e) {
      alert("保存配置失败: " + e);
    }
  };

  // 重置配置
  const resetConfig = () => {
    if (confirm("确定要重置所有配置吗？")) {
      setConfig(defaultConfig);
      localStorage.removeItem("faceCompareConfig");
      alert("配置已重置！");
    }
  };

  const sdk = useAutoFaceCompare({
    faceCompareConfig: config.faceCompareConfig,
    faceCompareOptions: {
      timeout: config.timeout,
      retryCount: config.retryCount,
      retryDelay: config.retryDelay,
      enableLogging: config.enableLogging,
      enableCache: config.enableCache,
      cacheTTL: config.cacheTTL,
      insightFace: {
        threshold: config.threshold,
      },
    },
    cameraConfig: config.cameraConfig,
    onResult: (result) => {
      console.log("人脸识别结果:", result);
      setResult(result);
      setError(null);
    },
    onError: (error) => {
      console.error("人脸识别错误:", error);
      setError(error.message);
      setResult(null);
    },
    enableLogging: config.enableLogging,
  });

  const handleStartFaceCompare = async () => {
    try {
      console.log("开始智能人脸识别流程...");
      setResult(null);
      setError(null);
      await sdk.autoCompare();
    } catch (error) {
      console.error("启动失败:", error);
      setError(error instanceof Error ? error.message : "启动失败");
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>人脸识别 SDK 示例</h1>
        {/* 配置面板 */}
        <ConfigPanel
          config={config}
          onConfigChange={setConfig}
          onSave={saveConfig}
          onReset={resetConfig}
        />
        <div className="controls">
          <button
            onClick={handleStartFaceCompare}
            disabled={sdk.isComparing}
            className="start-button"
          >
            {sdk.isComparing ? "处理中..." : "开始人脸识别"}
          </button>

          {(result || error) && (
            <button onClick={clearResults} className="clear-button">
              清除结果
            </button>
          )}
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="error-display">
            <h3>❌ 错误信息</h3>
            <p>{error}</p>
          </div>
        )}

        {/* 结果显示 */}
        {result && (
          <div className="result-display">
            <h3>🎯 识别结果</h3>

            <div className="result-header">
              <div className="result-type">
                <span className="label">类型:</span>
                <span className={`value ${result.type}`}>
                  {result.type === "init" ? "人脸初始化" : "人脸对比"}
                </span>
              </div>

              <div className="result-status">
                <span className="label">状态:</span>
                <span
                  className={`value ${result.success ? "success" : "failed"}`}
                >
                  {result.success ? "✅ 成功" : "❌ 失败"}
                </span>
              </div>
            </div>

            {result.success && result.data && (
              <div className="result-details">
                {result.type === "init" && "data" in result.data && (
                  <div className="init-details">
                    <h4>初始化详情</h4>
                    <p>
                      <strong>用户ID:</strong>{" "}
                      {result.data.data?.userId || "N/A"}
                    </p>
                    <p>
                      <strong>人脸数量:</strong>{" "}
                      {result.data.data?.faceCount || "N/A"}
                    </p>
                    <p>
                      <strong>消息:</strong> {result.data.message}
                    </p>
                  </div>
                )}

                {result.type === "compare" && "similarity" in result.data && (
                  <div className="compare-details">
                    <h4>对比详情</h4>
                    <p>
                      <strong>相似度:</strong>{" "}
                      {result.data.similarity
                        ? `${(result.data.similarity * 100).toFixed(2)}%`
                        : "N/A"}
                    </p>
                    <p>
                      <strong>是否匹配:</strong>{" "}
                      {result.data.isMatch ? "✅ 是" : "❌ 否"}
                    </p>
                    <p>
                      <strong>置信度:</strong>{" "}
                      {result.data.confidence
                        ? `${(result.data.confidence * 100).toFixed(2)}%`
                        : "N/A"}
                    </p>
                    {result.data.threshold && (
                      <p>
                        <strong>阈值:</strong>{" "}
                        {(result.data.threshold * 100).toFixed(2)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!result.success && result.error && (
              <div className="error-details">
                <h4>失败原因</h4>
                <p>{result.error}</p>
              </div>
            )}

            <div className="result-meta">
              <p>
                <strong>图片大小:</strong>{" "}
                {result.imageData
                  ? `${((result.imageData.length * 0.75) / 1024).toFixed(2)} KB`
                  : "N/A"}
              </p>
            </div>
          </div>
        )}

        {/* 自动渲染 CameraModal */}
        {sdk.cameraModalProps() && <CameraModal {...sdk.cameraModalProps()!} />}
      </header>
    </div>
  );
}

export default App;
