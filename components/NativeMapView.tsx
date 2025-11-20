import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { PetInfo } from '@/lib/database';
import { Colors } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { useAmap } from '@/hooks/use-amap';
import { getApiKeyForPlatform } from '@/config/amap-api-keys';

const { width, height } = Dimensions.get('window');

interface NativeMapViewProps {
  center?: { longitude: number; latitude: number };
  zoom?: number;
  pets?: PetInfo[];
  onMapLoaded?: () => void;
  onMarkerClick?: (pet: PetInfo) => void;
  onLocationSuccess?: (location: { longitude: number; latitude: number; address?: string }) => void;
  onLocationError?: (error: { message: string; code?: number }) => void;
  onMapClick?: (location: { longitude: number; latitude: number }) => void;
  style?: any;
}

export const NativeMapView: React.FC<NativeMapViewProps> = ({
  center,
  zoom = 15,
  pets = [],
  onMapLoaded,
  onMarkerClick,
  onLocationSuccess,
  onLocationError,
  onMapClick,
  style,
}) => {
  const mapRef = useRef<MapView>(null);
  const { location: initialLocation } = useLocation();
  const { regeo, searchPOI, getRoute } = useAmap();
  const [region, setRegion] = useState({
    longitude: center?.longitude || 116.4074,
    latitude: center?.latitude || 39.9042,
    longitudeDelta: 0.01,
    latitudeDelta: 0.01,
  });
  const [userLocation, setUserLocation] = useState<{
    longitude: number;
    latitude: number;
    address?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationMethod, setLocationMethod] = useState<'native' | 'amap' | 'none'>('none');

  // 默认区域
  const defaultRegion = {
    longitude: 116.4074,
    latitude: 39.9042,
    longitudeDelta: 0.01,
    latitudeDelta: 0.01,
  };

  // 高德反向地理编码 - 使用新的服务
  const getAddressFromAmap = async (latitude: number, longitude: number): Promise<string | undefined> => {
    try {
      const result = await regeo({ latitude, longitude });
      return result?.address;
    } catch (error) {
      console.error('高德反向地理编码失败:', error);
      return undefined;
    }
  };

  // 定位系统
  const getCurrentLocation = useCallback(async () => {
    console.log('🚀 ===== 开始定位流程 =====');
    console.log('📍 状态转换: IDLE → REQUESTING_PERMISSION');
    setLoading(true);
    setLocationMethod('none');

    let retryCount = 0;
    const maxRetries = 3;

    // 错误分类和处理函数
    const handleError = (error: any, retryable: boolean = false) => {
      console.error('❌ 定位错误:', error.message || error);
      setLoading(false);

      let errorMessage = '';
      let errorCode = 0;

      switch (error.message) {
        case 'PERMISSION_DENIED':
          errorMessage = '定位权限被拒绝，请在设置中开启定位权限';
          errorCode = 1;
          setLocationMethod('none');
          break;
        case 'LOCATION_TIMEOUT':
          errorMessage = '定位超时，请检查GPS设置或重试';
          errorCode = 2;
          setLocationMethod('none');
          break;
        case 'API_UNAVAILABLE':
          errorMessage = '此设备GPS不可用，请使用真机或手动选择位置';
          errorCode = 3;
          setLocationMethod('none');
          break;
        case 'NETWORK_ERROR':
          errorMessage = '网络错误，请检查网络连接后重试';
          errorCode = 4;
          setLocationMethod('none');
          break;
        default:
          errorMessage = `获取位置失败: ${error.message || '未知错误'}，请重试`;
          errorCode = 5;
          setLocationMethod('none');
      }

      onLocationError?.({
        message: errorMessage,
        code: errorCode,
      });

      return retryable;
    };

    while (retryCount < maxRetries) {
      try {
        console.log(`🎯 第${retryCount + 1}/${maxRetries}次定位尝试`);
        console.log('📍 状态转换: REQUESTING_PERMISSION → GETTING_LOCATION');

        // 1. 请求权限
        setLocationMethod('requesting');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('❌ 权限被拒绝');
          throw new Error('PERMISSION_DENIED');
        }

        // 2. 创建超时Promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          console.log('⏰ 设置20秒超时限制');
          setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), 20000);
        });

        // 3. 创建定位Promise
        setLocationMethod('native');
        console.log('📱 请求GPS定位...');
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Platform.OS === 'android'
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
          timeInterval: 8000,
          distanceInterval: 10,
        });

        // 4. 竞态处理：定位 vs 超时
        console.log('⏳ 等待定位结果或超时...');
        const locationResult = await Promise.race([locationPromise, timeoutPromise]);

        const { latitude, longitude, accuracy } = locationResult.coords;
        console.log(`✅ GPS定位成功 [${latitude.toFixed(6)}, ${longitude.toFixed(6)}], 精度: ${accuracy}m`);
        console.log('📍 状态转换: GETTING_LOCATION → GETTING_ADDRESS');

        // 更新位置
        setUserLocation({ longitude, latitude });
        setRegion(prev => ({
          ...prev,
          longitude,
          latitude,
          longitudeDelta: 0.01,
          latitudeDelta: 0.01,
        }));

        // 5. 获取地址（使用增强的高德API服务）
        try {
          console.log('🌐 正在获取地址信息...');
          const address = await getAddressFromAmap(latitude, longitude);
          const locationData = { longitude, latitude, address };

          setUserLocation(locationData);
          console.log('✅ 地址获取成功:', address);
        } catch (geoError: any) {
          console.warn('⚠️ 高德反向地理编码失败:', geoError.message || geoError);
          // 地址获取失败不影响定位结果
          setUserLocation({ longitude, latitude });
        }

        // 成功
        console.log('✅ ===== 定位流程完成 =====');
        console.log('📍 状态转换: GETTING_ADDRESS → SUCCESS');
        setLoading(false);
        setLocationMethod('native');
        onLocationSuccess?.({ longitude, latitude, address: userLocation?.address });
        return;

      } catch (error: any) {
        console.warn(`❌ 第${retryCount + 1}次定位失败:`, error.message);

        // 判断是否为可重试错误
        const isRetryableError = ['LOCATION_TIMEOUT', 'NETWORK_ERROR'].includes(error.message);
        const shouldRetry = isRetryableError && retryCount < maxRetries - 1;

        if (error.message === 'PERMISSION_DENIED') {
          // 权限问题不重试
          handleError(error, false);
          return;
        }

        if (shouldRetry) {
          retryCount++;
          const delay = 1000 * retryCount; // 指数退避
          console.log(`⏳ ${delay}ms后重试... (${retryCount}/${maxRetries - 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // 所有重试都失败
          console.log('⚠️ 所有重试均失败，停止定位');
          retryCount++;
          handleError(error, false);
          return;
        }
      }
    }

  }, [onLocationSuccess, onLocationError, userLocation?.address]);

  // 地图加载完成
  const handleMapReady = useCallback(() => {
    console.log('✅ 地图加载完成');
    onMapLoaded?.();

    // 如果有初始位置，移动到该位置
    if (initialLocation) {
      console.log('✅ 使用初始位置:', initialLocation);
      setRegion(prev => ({
        ...prev,
        longitude: initialLocation.longitude,
        latitude: initialLocation.latitude,
      }));
      setUserLocation({
        longitude: initialLocation.longitude,
        latitude: initialLocation.latitude,
      });
      // 如果有初始位置，不需要自动定位
      return;
    }

    // 自动尝试定位（仅在没有初始位置时）
    console.log('🗺️ 地图已准备，开始自动定位');
    getCurrentLocation();
  }, [initialLocation, onMapLoaded, getCurrentLocation]);

  // 地图点击
  const handleMapPress = useCallback((event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log('地图点击:', { latitude, longitude });

    if (onMapClick) {
      onMapClick({ longitude, latitude });
    }
  }, [onMapClick]);

  // 定位按钮
  const handleLocationButtonPress = useCallback(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // POI搜索功能
  const handleSearchPOI = useCallback(async (keyword: string, city?: string) => {
    try {
      const results = await searchPOI({
        keyword,
        city,
        location: userLocation ? { longitude: userLocation.longitude, latitude: userLocation.latitude } : undefined,
        radius: 5000
      });
      return results;
    } catch (error) {
      console.error('POI搜索失败:', error);
      return [];
    }
  }, [searchPOI, userLocation]);

  // 路径规划功能
  const handleGetRoute = useCallback(async (to: { longitude: number; latitude: number }) => {
    if (!userLocation) {
      console.warn('❌ 没有用户位置信息，无法规划路线');
      return null;
    }
    try {
      const route = await getRoute({
        from: { longitude: userLocation.longitude, latitude: userLocation.latitude },
        to,
        mode: 'driving',
        strategy: 1
      });
      return route;
    } catch (error) {
      console.error('路径规划失败:', error);
      return null;
    }
  }, [getRoute, userLocation]);

  // 渲染用户位置标记
  const renderUserLocation = () => {
    if (!userLocation) return null;

    return (
      <Marker
        coordinate={{
          longitude: userLocation.longitude,
          latitude: userLocation.latitude,
        }}
        title="我的位置"
        pinColor="#2196F3"
        anchor={{ x: 0.5, y: 0.5 }}
      />
    );
  };

  // 渲染宠物标记
  const renderPetMarkers = () => {
    return pets.map((pet) => (
      <Marker
        key={pet.id}
        coordinate={{
          longitude: pet.longitude,
          latitude: pet.latitude,
        }}
        title={pet.title}
        description={pet.description}
        pinColor={
          pet.status === 'emergency' ? '#f44336' :
          pet.status === 'needs_rescue' ? '#ff9800' :
          pet.status === 'for_adoption' ? '#4CAF50' :
          '#9E9E9E'
        }
        onPress={() => onMarkerClick?.(pet)}
      />
    ));
  };

  // 定位方法指示器
  const getLocationMethodText = () => {
    if (loading) {
      return `正在尝试定位...`;
    }
    switch (locationMethod) {
      case 'native':
        return 'GPS定位';
      case 'amap':
        return '高德定位';
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        onMapReady={handleMapReady}
        showsUserLocation={false} // 使用自定义标记
        showsMyLocationButton={false}
        showsPointsOfInterest={true}
        showsCompass={true}
        showsScale={true}
      >
        {renderUserLocation()}
        {renderPetMarkers()}
      </MapView>

      {/* 定位按钮 */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={handleLocationButtonPress}
        activeOpacity={0.8}
      >
        <Text style={styles.locationButtonText}>
          {loading ? '⏳' : '📍'}
        </Text>
      </TouchableOpacity>

      {/* 定位状态条 */}
      {(loading || userLocation) && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {loading
              ? `📍 正在尝试定位...`
              : userLocation?.address
                ? `✅ ${userLocation.address}`
                : '✅ 定位成功'
            }
          </Text>
        </View>
      )}

      {/* 加载指示器 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>正在获取您的位置...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationButtonText: {
    fontSize: 24,
    color: 'white',
  },
  statusBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default NativeMapView;
