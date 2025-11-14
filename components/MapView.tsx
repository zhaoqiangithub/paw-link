import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, View, Text, Alert, TouchableOpacity } from 'react-native';
import { useLocation } from '@/hooks/use-location';
import { PetInfo, PetInfoDB } from '@/lib/database';
import { Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { AmapWebView, AmapWebViewMethods } from './AmapWebView';
import type { AmapWebViewProps } from './AmapWebView';

const { width, height } = Dimensions.get('window');

interface MapViewProps {
  onMarkerPress?: (petInfo: PetInfo) => void;
}

export const MapComponent: React.FC<MapViewProps> = ({ onMarkerPress }) => {
  const { user } = useApp();
  const { location: initialLocation, getCurrentLocation: getRNLocation } = useLocation();
  const [petInfos, setPetInfos] = useState<PetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{longitude: number, latitude: number} | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('定位中...');
  const [isRetryingLocation, setIsRetryingLocation] = useState(false);
  const webViewRef = useRef<any>(null);

  // 平台检测
  const isWeb = (() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent.toLowerCase();
    const isWebBrowser = ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari');
    const isStandalone = window.navigator?.standalone === true;

    console.log('MapView platform check:', { isWebBrowser, isStandalone, result: isWebBrowser && !isStandalone });
    return isWebBrowser && !isStandalone;
  })();

  // 如果不是Web平台，使用初始位置
  useEffect(() => {
    if (!isWeb && initialLocation && !currentLocation) {
      console.log('✅ Using initial location from device:', initialLocation);
      setCurrentLocation(initialLocation);
    }
  }, [isWeb, initialLocation, currentLocation]);

  const loadPetInfos = async () => {
    if (!currentLocation || !user) return;

    try {
      setLoading(true);
      const data = await PetInfoDB.getList({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        maxDistance: 10, // 10km
        days: 30,
        limit: 100
      });
      setPetInfos(data);
    } catch (error) {
      console.error('Error loading pet infos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentLocation) {
      loadPetInfos();
    }
  }, [currentLocation, user]);

  // 处理标记点击
  const handleMarkerClick = (pet: any) => {
    if (onMarkerPress) {
      // 找到对应的 PetInfo 对象
      const petInfo = petInfos.find(p => p.id === pet.id);
      if (petInfo) {
        onMarkerPress(petInfo);
      }
    }
  };

  // 处理定位成功
  const handleLocationSuccess = (loc: { longitude: number; latitude: number; address?: string }) => {
    console.log('Location success from WebView:', loc);
    setCurrentLocation({
      longitude: loc.longitude,
      latitude: loc.latitude
    });
    if (loc.address) {
      setCurrentAddress(loc.address);
    } else {
      setCurrentAddress('定位成功，但无法获取详细地址');
    }
    setIsRetryingLocation(false);
  };

  // 备选定位方案：使用React Native的expo-location
  const fallbackToReactNativeLocation = async () => {
    console.log('Trying fallback location method...');
    setIsRetryingLocation(true);
    setCurrentAddress('正在重新定位...');

    // 检查是否为Web平台
    const isWeb = typeof window !== 'undefined' && !window.navigator?.standalone;
    if (isWeb) {
      console.log('Web platform detected, skipping React Native location');
      setCurrentAddress('Web端定位不可用，请允许浏览器定位权限');
      setIsRetryingLocation(false);
      Alert.alert(
        '定位不可用',
        '当前为Web端运行，请允许浏览器定位权限后刷新页面重试。\n\n建议：\n• 点击地址栏旁定位图标\n• 允许定位权限\n• 刷新页面',
        [
          { text: '知道了', style: 'default' }
        ]
      );
      return;
    }

    try {
      const location = await new Promise<{longitude: number; latitude: number}>((resolve, reject) => {
        getRNLocation();
        const timeoutId = setTimeout(() => {
          reject(new Error('React Native location timeout'));
        }, 10000);

        // 监听定位结果
        const checkLocation = () => {
          const latestLocation = initialLocation;
          if (latestLocation) {
            clearTimeout(timeoutId);
            resolve({
              longitude: latestLocation.longitude,
              latitude: latestLocation.latitude
            });
          }
        };

        // 轮询检查定位结果
        const intervalId = setInterval(() => {
          checkLocation();
        }, 500);

        // 10秒后清理
        setTimeout(() => {
          clearInterval(intervalId);
        }, 10000);
      });

      console.log('React Native location success:', location);
      setCurrentLocation(location);
      setCurrentAddress('定位成功（系统定位）');
      setIsRetryingLocation(false);
    } catch (error) {
      console.error('All location methods failed:', error);
      setCurrentAddress('定位失败，请检查定位权限设置');
      setIsRetryingLocation(false);
      Alert.alert(
        '定位失败',
        '无法获取您的位置信息。\n\n请检查：\n• 定位权限是否已开启\n• 网络连接是否正常\n• 设备定位服务是否开启',
        [
          { text: '手动输入位置', style: 'default' },
          { text: '重试', onPress: () => {
              setCurrentAddress('定位中...');
              setIsRetryingLocation(false);
            }
          }
        ]
      );
    }
  };

  // 处理定位错误
  const handleLocationError = async (error: { message: string; code?: number }) => {
    console.error('WebView location failed:', error.message, 'code:', error.code);

    // 如果错误代码为7或8，通常是权限问题，可以直接使用备选方案
    if (error.code === 7 || error.code === 8 || error.message.includes('权限')) {
      setCurrentAddress('权限被拒绝，尝试其他方式...');
      setTimeout(() => {
        fallbackToReactNativeLocation();
      }, 1000);
    } else {
      setCurrentAddress('定位失败，正在重试...');
      setIsRetryingLocation(false);

      // 等待3秒后尝试备选方案
      setTimeout(() => {
        fallbackToReactNativeLocation();
      }, 3000);
    }
  };

  // 地图加载完成
  const handleMapLoaded = () => {
    console.log('地图加载完成');
    setMapLoaded(true);
  };

  // 转换宠物数据为 AmapWebView 所需的格式
  const petsForMap = petInfos.map(pet => ({
    id: pet.id,
    title: pet.title,
    longitude: pet.longitude,
    latitude: pet.latitude,
    status: pet.status as 'emergency' | 'needs_rescue' | 'for_adoption' | 'adopted',
    description: pet.description,
  }));

  // 使用初始位置或北京作为默认中心点
  const defaultCenter = currentLocation || {
    longitude: 116.4074,
    latitude: 39.9042
  };

  return (
    <View style={styles.container}>
      {/* 地址显示条 */}
      <View style={styles.addressBar}>
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
          📍 {currentAddress}
        </Text>
        {(currentAddress.includes('失败') || currentAddress.includes('中') || isRetryingLocation) && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              console.log('Retrying location...');
              setCurrentAddress('定位中...');
              setIsRetryingLocation(false);
              // 直接调用WebView的定位方法
              AmapWebViewMethods.getUserLocation(webViewRef);
            }}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        )}
      </View>

      <AmapWebView
        webViewRef={webViewRef}
        center={defaultCenter}
        zoom={16}
        pets={petsForMap}
        onMapLoaded={handleMapLoaded}
        onMarkerClick={handleMarkerClick}
        onLocationSuccess={handleLocationSuccess}
        onLocationError={handleLocationError}
        style={styles.map}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  addressBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MapComponent;
