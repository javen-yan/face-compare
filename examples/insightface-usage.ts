import { FaceCompare } from '../src/FaceCompare';

// InsightFace 后端配置
const insightfaceConfig = {
  api: 'http://localhost:3001/api',
  // auth: 'your-token', // InsightFace 后端不需要认证
};

// 创建 FaceCompare 实例，启用 InsightFace 功能
const sdk = new FaceCompare(insightfaceConfig, {
  enableLogging: true,
  insightFace: {
    threshold: 0.6, // 相似度阈值
    enableBatchCompare: true, // 启用批量对比
    enableUserManagement: true, // 启用用户管理
    enableSystemMonitoring: true, // 启用系统监控
  }
}, {
  onInitStart: () => console.log('🚀 开始初始化人脸数据...'),
  onInitSuccess: (response) => console.log('✅ 初始化成功:', response),
  onInitError: (error) => console.error('❌ 初始化失败:', error),
  onCompareStart: () => console.log('🔍 开始人脸对比...'),
  onCompareSuccess: (result) => console.log('✅ 对比成功:', result),
  onCompareError: (error) => console.error('❌ 对比失败:', error),
  onBatchCompareStart: () => console.log('📊 开始批量对比...'),
  onBatchCompareSuccess: (results) => console.log('✅ 批量对比成功:', results),
  onBatchCompareError: (error) => console.error('❌ 批量对比失败:', error),
});

// 示例：完整的人脸识别流程
async function faceRecognitionDemo() {
  try {
    console.log('🎯 开始 InsightFace 人脸识别演示...\n');

    // 1. 健康检查
    console.log('1️⃣ 检查服务健康状态...');
    const health = await sdk.healthCheck();
    console.log('健康状态:', health);
    console.log('');

    // 2. 获取系统信息
    console.log('2️⃣ 获取系统信息...');
    const systemInfo = await sdk.getSystemInfo();
    console.log('系统信息:', systemInfo);
    console.log('');

    // 3. 模拟图片数据（实际使用时从摄像头获取）
    const sampleImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'; // 示例 base64 数据

    // 4. 注册用户人脸
    console.log('3️⃣ 注册用户人脸...');
    const initResult = await sdk.init(sampleImageData, 'demo_user_001');
    console.log('注册结果:', initResult);
    console.log('');

    // 5. 人脸对比
    console.log('4️⃣ 进行人脸对比...');
    const compareResult = await sdk.compare(sampleImageData, 0.7); // 使用 0.7 的阈值
    console.log('对比结果:', compareResult);
    console.log('');

    // 6. 批量人脸对比
    console.log('5️⃣ 进行批量人脸对比...');
    const imageList = [
      sampleImageData,
      sampleImageData, // 实际使用时是不同的图片
      sampleImageData
    ];
    const batchResult = await sdk.compareBatch(imageList, 0.6);
    console.log('批量对比结果:', batchResult);
    console.log('');

    // 7. 获取用户信息
    console.log('6️⃣ 获取用户信息...');
    const userInfo = await sdk.getUserInfo('demo_user_001');
    console.log('用户信息:', userInfo);
    console.log('');

    // 8. 获取所有用户列表
    console.log('7️⃣ 获取所有用户列表...');
    const usersList = await sdk.getUsersList();
    console.log('用户列表:', usersList);
    console.log('');

    // 9. 获取当前状态
    console.log('8️⃣ 获取当前状态...');
    const status = sdk.getStatus();
    console.log('当前状态:', status);
    console.log('');

    console.log('🎉 InsightFace 人脸识别演示完成！');

  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error);
  }
}

// 示例：高级功能演示
async function advancedFeaturesDemo() {
  try {
    console.log('🚀 开始高级功能演示...\n');

    // 1. 动态调整阈值
    console.log('1️⃣ 动态调整相似度阈值...');
    sdk.updateOptions({
      insightFace: {
        threshold: 0.8 // 提高阈值，要求更高的相似度
      }
    });
    console.log('阈值已调整为 0.8');
    console.log('');

    // 2. 批量操作演示
    console.log('2️⃣ 批量操作演示...');
    
    // 注册多个用户
    const users = ['user_001', 'user_002', 'user_003'];
    const sampleImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...';
    
    for (const userId of users) {
      try {
        await sdk.init(sampleImage, userId);
        console.log(`✅ 用户 ${userId} 注册成功`);
      } catch (error) {
        console.log(`❌ 用户 ${userId} 注册失败:`, error);
      }
    }
    console.log('');

    // 3. 系统监控
    console.log('3️⃣ 系统监控...');
    const health = await sdk.healthCheck();
    console.log('服务健康状态:', health);
    console.log('');

    // 4. 清理演示数据
    console.log('4️⃣ 清理演示数据...');
    for (const userId of users) {
      try {
        await sdk.deleteUser(userId);
        console.log(`✅ 用户 ${userId} 删除成功`);
      } catch (error) {
        console.log(`❌ 用户 ${userId} 删除失败:`, error);
      }
    }
    console.log('');

    console.log('🎉 高级功能演示完成！');

  } catch (error) {
    console.error('❌ 高级功能演示过程中出现错误:', error);
  }
}

// 示例：错误处理和重试
async function errorHandlingDemo() {
  try {
    console.log('🛡️ 开始错误处理演示...\n');

    // 1. 测试无效的图片数据
    console.log('1️⃣ 测试无效的图片数据...');
    try {
      await sdk.init('invalid_image_data');
    } catch (error) {
      console.log('✅ 正确捕获到错误:', error.message);
    }
    console.log('');

    // 2. 测试未初始化状态下的对比
    console.log('2️⃣ 测试未初始化状态下的对比...');
    try {
      await sdk.compare('some_image_data');
    } catch (error) {
      console.log('✅ 正确捕获到错误:', error.message);
    }
    console.log('');

    // 3. 测试网络错误处理
    console.log('3️⃣ 测试网络错误处理...');
    const invalidSdk = new FaceCompare({
      api: 'http://invalid-url:9999/api'
    });
    
    try {
      await invalidSdk.healthCheck();
    } catch (error) {
      console.log('✅ 正确捕获到网络错误:', error.message);
    }
    console.log('');

    console.log('🎉 错误处理演示完成！');

  } catch (error) {
    console.error('❌ 错误处理演示过程中出现错误:', error);
  }
}

// 主函数
async function main() {
  console.log('🌟 InsightFace 人脸识别系统演示\n');
  console.log('请确保 InsightFace 后端服务正在运行 (http://localhost:3001)\n');

  try {
    // 基础功能演示
    await faceRecognitionDemo();
    console.log('\n' + '='.repeat(50) + '\n');

    // 高级功能演示
    await advancedFeaturesDemo();
    console.log('\n' + '='.repeat(50) + '\n');

    // 错误处理演示
    await errorHandlingDemo();

  } catch (error) {
    console.error('❌ 主程序执行失败:', error);
  }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main().catch(console.error);
}

export {
  faceRecognitionDemo,
  advancedFeaturesDemo,
  errorHandlingDemo
}; 