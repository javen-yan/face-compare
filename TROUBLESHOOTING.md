# FaceCompare 故障排除指南

## 📸 拍照功能问题排查

### 常见问题

#### 1. 点击拍照按钮没有反应

**症状**: 点击拍照按钮后没有任何反应，控制台没有错误信息

**可能原因**:
- 摄像头未完全加载
- 视频元素状态异常
- 组件状态不同步

**解决方案**:
1. 检查浏览器控制台是否有错误信息
2. 确保摄像头权限已授予
3. 等待摄像头完全加载（视频画面稳定）
4. 刷新页面重试

#### 2. 拍照后没有显示预览

**症状**: 点击拍照后没有显示图片预览

**可能原因**:
- 画布绘制失败
- 图片数据生成失败
- 状态更新异常

**解决方案**:
1. 检查控制台日志，查看拍照过程
2. 确认视频尺寸是否有效
3. 检查画布上下文是否正确获取

#### 3. 摄像头无法启动

**症状**: 打开拍照模态框后显示"无法访问摄像头"

**可能原因**:
- 浏览器权限被拒绝
- 摄像头被其他应用占用
- 设备不支持指定的分辨率

**解决方案**:
1. 检查浏览器摄像头权限设置
2. 关闭其他可能使用摄像头的应用
3. 尝试降低摄像头分辨率要求

### 调试步骤

#### 步骤 1: 检查控制台日志

打开浏览器开发者工具，查看控制台输出：

```javascript
// 应该看到类似这样的日志
=== 拍照函数开始 ===
拍照函数被调用 { hasVideo: true, hasCanvas: true, isCameraReady: true, ... }
开始拍照处理 { videoWidth: 640, videoHeight: 480, ... }
画布尺寸设置为: 640 x 480
视频帧已绘制到画布
图片生成成功 { imageDataLength: 12345, ... }
拍照成功，图片已设置到状态
=== 拍照函数结束 ===
```

#### 步骤 2: 检查摄像头状态

在控制台中执行：

```javascript
// 检查视频元素状态
const video = document.querySelector('video');
console.log('视频状态:', {
  readyState: video.readyState,
  videoWidth: video.videoWidth,
  videoHeight: video.videoHeight,
  srcObject: !!video.srcObject
});
```

#### 步骤 3: 检查画布状态

```javascript
// 检查画布状态
const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
console.log('画布状态:', {
  width: canvas.width,
  height: canvas.height,
  hasContext: !!context
});
```

### 测试页面

我们提供了一个独立的测试页面 `test-camera.html`，可以用来验证基本的摄像头功能：

1. 在浏览器中打开 `test-camera.html`
2. 点击"启动摄像头"按钮
3. 等待摄像头加载完成
4. 点击"拍照"按钮测试

### 环境要求

#### 浏览器支持
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

#### 硬件要求
- 可用的摄像头设备
- 支持 getUserMedia API

#### 权限要求
- 摄像头访问权限
- HTTPS 环境（生产环境）

### 常见错误代码

| 错误名称 | 错误描述 | 解决方案 |
|---------|---------|---------|
| `NotAllowedError` | 权限被拒绝 | 检查浏览器权限设置 |
| `NotFoundError` | 设备不可用 | 检查摄像头连接 |
| `NotReadableError` | 设备被占用 | 关闭其他应用 |
| `OverconstrainedError` | 约束条件不满足 | 降低分辨率要求 |

### 联系支持

如果问题仍然存在，请：

1. 收集控制台错误信息
2. 记录浏览器版本和操作系统
3. 描述具体的操作步骤
4. 提交 Issue 到项目仓库

### 预防措施

1. **权限管理**: 确保在用户交互后请求摄像头权限
2. **错误处理**: 实现完善的错误处理和用户提示
3. **状态检查**: 在关键操作前检查组件状态
4. **资源清理**: 及时释放摄像头资源
5. **降级方案**: 提供摄像头不可用时的替代方案
