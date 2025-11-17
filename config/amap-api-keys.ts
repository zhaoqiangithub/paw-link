// 高德地图 API Key 配置
// 这些密钥应该从环境变量中获取

// 高德地图 Web 服务 API Key（用于地理编码、搜索等）
export const AMAP_API_KEY = process.env.EXPO_PUBLIC_AMAP_API_KEY || 'f4f3fe154db5361fad122db55f64178c';

// 高德地图 JavaScript API Key（用于地图显示）
export const AMAP_JS_API_KEY = process.env.EXPO_PUBLIC_AMAP_JS_API_KEY || AMAP_API_KEY;

// 高德地图 iOS SDK Key（原生 iOS 应用使用）
export const AMAP_IOS_API_KEY = process.env.EXPO_PUBLIC_AMAP_IOS_API_KEY || AMAP_API_KEY;

// 高德地图 Android SDK Key（原生 Android 应用使用）
export const AMAP_ANDROID_API_KEY = process.env.EXPO_PUBLIC_AMAP_ANDROID_API_KEY || AMAP_API_KEY;

// 开发/生产环境标识
export const IS_DEVELOPMENT = __DEV__;

// API Key 验证
export function validateApiKey(key: string): boolean {
  return !!key && key.length > 10;
}

// 获取当前平台使用的 API Key
export function getApiKeyForPlatform(): string {
  const key = AMAP_API_KEY;
  if (!validateApiKey(key)) {
    console.warn('高德地图 API Key 未正确配置，请检查环境变量 EXPO_PUBLIC_AMAP_API_KEY');
  }
  return key;
}

export default {
  AMAP_API_KEY,
  AMAP_JS_API_KEY,
  AMAP_IOS_API_KEY,
  AMAP_ANDROID_API_KEY,
  IS_DEVELOPMENT,
  validateApiKey,
  getApiKeyForPlatform,
};
