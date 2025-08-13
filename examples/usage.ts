import { FaceCompare, useFaceCompare, FaceCompareComponent } from '../src/index';

// 示例 1: 直接使用 FaceCompare 类
async function example1() {
  const config = {
    api: 'https://your-api-domain.com/api',
    auth: 'your-auth-token'
  };

  const sdk = new FaceCompare(config);

  try {
    // 初始化人脸数据
    const initResult = await sdk.init('base64-image-data-here');
    console.log('初始化结果:', initResult);

    if (initResult.success) {
      // 进行人脸对比
      const compareResult = await sdk.compare('new-base64-image-data-here');
      console.log('对比结果:', compareResult);
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
}

// 示例 2: 在 React 组件中使用 Hook
function ExampleComponent() {
  const config = {
    api: 'https://your-api-domain.com/api',
    auth: 'your-auth-token'
  };

  const {
    isLoading,
    error,
    result,
    isInitialized,
    init,
    compare,
    clear
  } = useFaceCompare(config);

  const handleInit = async (imageData: string) => {
    try {
      await init(imageData);
      console.log('初始化成功');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  const handleCompare = async (imageData: string) => {
    try {
      const result = await compare(imageData);
      console.log('对比结果:', result);
    } catch (error) {
      console.error('对比失败:', error);
    }
  };

  return {
    error,
    result,
    handleInit,
    handleCompare,
    clear
  };
}

// 示例 3: 使用完整的 React 组件
function AppExample() {
  const config = {
    api: 'https://your-api-domain.com/api',
    auth: 'your-auth-token'
  };

  const handleResult = (result: any) => {
    console.log('收到对比结果:', result);
    // 处理结果，比如显示通知、记录日志等
  };

  return {
    config,
    handleResult
  };
}

// 导出示例函数
export {
  example1,
  ExampleComponent,
  AppExample
};
