const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// 存储用户数据
const users = new Map();

// 模拟人脸识别算法
function simulateFaceRecognition(imageData) {
  // 这里应该使用真实的人脸识别算法
  // 现在只是模拟返回随机结果
  const similarity = Math.random() * 0.4 + 0.6; // 60%-100%
  const confidence = Math.random() * 0.2 + 0.8; // 80%-100%
  const isMatch = similarity > 0.7; // 相似度大于70%认为匹配
  
  return {
    similarity,
    confidence,
    isMatch
  };
}

// 初始化人脸数据
app.post('/api/face-init', (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '缺少图片数据'
      });
    }

    // 生成用户ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 存储用户数据
    users.set(userId, {
      userId,
      faceData: imageData,
      createdAt: new Date().toISOString()
    });

    console.log(`用户 ${userId} 初始化成功`);

    res.json({
      success: true,
      message: '初始化成功',
      data: {
        userId,
        faceData: imageData
      }
    });
  } catch (error) {
    console.error('初始化失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 人脸对比
app.post('/api/face-compare', (req, res) => {
  try {
    const { imageData, userId } = req.body;
    
    if (!imageData || !userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 检查用户是否存在
    if (!users.has(userId)) {
      return res.status(404).json({
        success: false,
        message: '用户不存在，请先初始化'
      });
    }

    // 模拟人脸对比
    const result = simulateFaceRecognition(imageData);
    
    console.log(`用户 ${userId} 对比结果:`, result);

    res.json({
      success: true,
      message: '对比成功',
      data: result
    });
  } catch (error) {
    console.error('对比失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取用户列表（用于调试）
app.get('/api/users', (req, res) => {
  const userList = Array.from(users.values()).map(user => ({
    userId: user.userId,
    createdAt: user.createdAt
  }));
  
  res.json({
    success: true,
    data: userList
  });
});

// 清除用户数据（用于调试）
app.delete('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  
  if (users.has(userId)) {
    users.delete(userId);
    res.json({
      success: true,
      message: '用户数据已删除'
    });
  } else {
    res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    usersCount: users.size
  });
});

app.listen(PORT, () => {
  console.log(`🚀 模拟服务器运行在 http://localhost:${PORT}`);
  console.log(`📸 人脸初始化接口: POST http://localhost:${PORT}/api/face-init`);
  console.log(`🔍 人脸对比接口: POST http://localhost:${PORT}/api/face-compare`);
  console.log(`👥 用户列表接口: GET http://localhost:${PORT}/api/users`);
  console.log(`💚 健康检查接口: GET http://localhost:${PORT}/health`);
});

module.exports = app;
