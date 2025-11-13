import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'pawlink_device_id';

// 生成设备ID
const generateDeviceId = async (): Promise<string> => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  const deviceInfo = Device.modelName || 'unknown';
  return `dev_${timestamp}_${random}_${deviceInfo.replace(/\s+/g, '_')}`;
};

// 获取或创建设备ID
export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = await generateDeviceId();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      console.log('Generated new device ID:', deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // 如果 SecureStore 不可用，使用备用方案
    return `dev_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// 清理设备ID（用于测试或重置）
export const clearDeviceId = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    console.log('Device ID cleared');
  } catch (error) {
    console.error('Error clearing device ID:', error);
  }
};

// 获取设备信息
export const getDeviceInfo = async () => {
  const device = await Device.getDeviceTypeAsync();
  const modelName = Device.modelName || 'Unknown';
  const osName = Platform.OS;
  const osVersion = Platform.Version;

  return {
    deviceType: device,
    modelName,
    osName,
    osVersion,
    platform: Platform
  };
};

export default {
  getDeviceId,
  clearDeviceId,
  getDeviceInfo
};
