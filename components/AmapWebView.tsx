import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Platform, Alert } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { getAmapHtmlTemplate } from '@/utils/amap-js-bridge';
import { MAP_STYLES, MapStyleType } from '@/constants/amap-config';
import { getApiKeyForPlatform } from '@/config/amap-api-keys';

// 宠物信息接口
export interface PetInfo {
  id: string;
  title: string;
  longitude: number;
  latitude: number;
  status: 'emergency' | 'needs_rescue' | 'for_adoption' | 'adopted';
  description?: string;
}

// 位置信息接口
export interface LocationInfo {
  longitude: number;
  latitude: number;
  accuracy?: number;
  address?: string;
}

// 搜索结果接口
export interface SearchResult {
  id: string;
  name: string;
  address: string;
  location: {
    longitude: number;
    latitude: number;
  };
  distance?: number;
}

// Props 接口
export interface AmapWebViewProps {
  center?: { longitude: number; latitude: number };
  zoom?: number;
  pets?: PetInfo[];
  mapStyle?: MapStyleType;  // 新增：地图样式
  onMapLoaded?: () => void;
  onMarkerClick?: (pet: PetInfo) => void;
  onLocationSuccess?: (location: LocationInfo) => void;
  onLocationError?: (error: { message: string }) => void;
  onMapClick?: (location: { longitude: number; latitude: number }) => void;
  onSearchResults?: (results: SearchResult[]) => void;
  onPOISearchResults?: (results: SearchResult[]) => void;
  style?: any;
}

// 默认中心点（北京天安门）
const DEFAULT_CENTER = {
  longitude: 116.407526,
  latitude: 39.90403,
};

export const AmapWebView: React.FC<AmapWebViewProps & { webViewRef?: React.RefObject<WebView> }> = (props) => {
  const {
    center = DEFAULT_CENTER,
    zoom = 15,
    pets = [],
    mapStyle = 'normal',
    onMapLoaded,
    onMarkerClick,
    onLocationSuccess,
    onLocationError,
    onMapClick,
    onSearchResults,
    onPOISearchResults,
    style,
    webViewRef
  } = props;

  const internalWebViewRef = useRef<WebView>(null);
  const actualWebViewRef = webViewRef || internalWebViewRef;
  const [apiKey] = useState<string>(getApiKeyForPlatform()); // 从配置文件获取
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false); // 是否正在重试
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 原生定位降级方案
  const getNativeLocation = useCallback(async () => {
    console.log('🔄 使用原生 expo-location 作为降级方案');
    try {
      // 请求权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('PERMISSION_DENIED');
      }

      // 获取位置（增加超时时间到 20 秒）
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 20000);
        })
      ]);

      const { latitude, longitude, accuracy } = location.coords;

      // 逆地理编码获取地址
      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = [addr.region, addr.city, addr.district, addr.street]
            .filter(Boolean).join('') || address;
        }
      } catch (geoError) {
        console.warn('逆地理编码失败:', geoError);
      }

      console.log('✅ 原生定位成功:', { latitude, longitude, accuracy, address });

      if (onLocationSuccess) {
        onLocationSuccess({
          longitude,
          latitude,
          accuracy,
          address
        });
      }

      return true;
    } catch (error: any) {
      console.error('❌ 原生定位失败:', error.message);
      if (error.message !== 'PERMISSION_DENIED') {
        // 如果不是权限问题，给用户更友好的错误信息
        if (onLocationError) {
          onLocationError({
            message: `定位失败（已尝试所有方案）。请检查：\n1. 设备GPS是否开启\n2. 网络连接是否正常\n3. 是否允许定位权限`
          });
        }
      } else {
        if (onLocationError) {
          onLocationError({
            message: '定位权限被拒绝。请在设置中允许PawLink访问定位服务：\n设置 → 应用 → PawLink → 权限 → 定位 → 允许'
          });
        }
      }
      return false;
    }
  }, [onLocationSuccess, onLocationError]);

  // 处理 WebView 消息
  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'MAP_LOADED':
          setMapLoaded(true);
          onMapLoaded?.();
          // 地图加载完成后，如果有宠物数据，发送到WebView
          if (pets.length > 0) {
            sendPetsToWebView(pets);
          }
          break;

        case 'MAP_ERROR':
          setError(data.data?.message || '地图加载失败');
          break;

        case 'MARKER_CLICK':
          const clickedPet = pets.find(p => p.id === data.data.id);
          if (clickedPet && onMarkerClick) {
            onMarkerClick(clickedPet);
          }
          break;

        case 'LOCATION_SUCCESS':
          setIsRetrying(false);
          if (onLocationSuccess) {
            onLocationSuccess(data.data);
          }
          break;

        case 'LOCATION_ERROR':
          // WebView 定位失败，尝试原生定位降级
          if (Platform.OS === 'android' || Platform.OS === 'ios') {
            const errorCode = data.data?.code;
            console.log('⚠️ WebView 定位失败，错误码:', errorCode);

            // 清除之前的重试计时器
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }

            // 如果是权限或超时错误，尝试原生定位
            setIsRetrying(true);
            retryTimeoutRef.current = setTimeout(async () => {
              console.log('🔄 尝试原生定位作为降级方案...');
              const success = await getNativeLocation();
              if (!success) {
                setIsRetrying(false);
              }
            }, 1000); // 1秒后尝试原生定位
          } else {
            // Web 平台直接传递错误
            if (onLocationError) {
              onLocationError(data.data);
            }
          }
          break;

        case 'MAP_CLICK':
          if (onMapClick) {
            onMapClick(data.data);
          }
          break;

        case 'ADDRESS_SEARCH_RESULT':
          if (onSearchResults && data.data?.results) {
            onSearchResults(data.data.results);
          }
          break;

        case 'POI_SEARCH_RESULT':
          if (onPOISearchResults && data.data?.results) {
            onPOISearchResults(data.data.results);
          }
          break;
      }
    } catch (error) {
      // Silent error handling
    }
  }, [pets, onMapLoaded, onMarkerClick, onLocationSuccess, onLocationError, onMapClick, onSearchResults, onPOISearchResults, getNativeLocation]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // 发送宠物数据到WebView
  const sendPetsToWebView = useCallback((petsData: PetInfo[]) => {
    if (actualWebViewRef.current) {
      const message = {
        type: 'ADD_PETS',
        pets: petsData,
      };
      actualWebViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [actualWebViewRef]);

  // 获取用户位置
  const getUserLocation = useCallback(() => {
    if (actualWebViewRef.current) {
      const message = {
        type: 'GET_LOCATION',
      };
      actualWebViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [actualWebViewRef]);

  // 清除所有宠物标记
  const clearPetMarkers = useCallback(() => {
    if (actualWebViewRef.current) {
      const message = {
        type: 'CLEAR_PETS',
      };
      actualWebViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [actualWebViewRef]);

  // 设置地图中心
  const setMapCenter = useCallback((longitude: number, latitude: number, zoom?: number) => {
    if (actualWebViewRef.current) {
      const message = {
        type: 'CENTER_MAP',
        longitude,
        latitude,
        zoom,
      };
      actualWebViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [actualWebViewRef]);

  // 切换地图样式
  const setMapStyle = useCallback((style: MapStyleType) => {
    if (actualWebViewRef.current) {
      const message = {
        type: 'SET_MAP_STYLE',
        style: MAP_STYLES[style],
      };
      actualWebViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [actualWebViewRef]);

  // 地址搜索
  const searchAddress = useCallback((keyword: string) => {
    if (actualWebViewRef.current && keyword.trim()) {
      const message = {
        type: 'ADDRESS_SEARCH',
        keyword: keyword.trim(),
      };
      actualWebViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [actualWebViewRef]);

  // POI 搜索
  const searchPOI = useCallback((keyword: string, longitude?: number, latitude?: number) => {
    if (actualWebViewRef.current && keyword.trim()) {
      const message = {
        type: 'POI_SEARCH',
        keyword: keyword.trim(),
        longitude,
        latitude,
      };
      actualWebViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [actualWebViewRef]);

  // 当宠物数据变化时，更新WebView
  useEffect(() => {
    if (mapLoaded && pets.length > 0) {
      sendPetsToWebView(pets);
    }
  }, [mapLoaded, pets, sendPetsToWebView]);


  // 渲染加载指示器
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>正在加载地图...</Text>
    </View>
  );

  // 渲染错误提示
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorEmoji}>⚠️</Text>
      <Text style={styles.errorTitle}>地图加载失败</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => {
        setError(null);
        setMapLoaded(false);
      }}>
        <Text style={styles.retryButtonText}>重试</Text>
      </TouchableOpacity>
    </View>
  );

  // 如果有错误，显示错误提示
  if (error) {
    return (
      <View style={[styles.container, style]}>
        {renderError()}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={actualWebViewRef}
        source={{
          html: getAmapHtmlTemplate(apiKey, center, zoom, '2.0', MAP_STYLES[mapStyle]),
        }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        geolocationEnabled={true}
        // 性能优化
        androidHardwareAccelerationDisabled={false}  // 启用硬件加速
        androidLayerType="hardware"
        mixedContentMode="always"
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // 其他设置
        startInLoadingState={true}
        renderLoading={renderLoading}
        onMessage={handleWebViewMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setError(`WebView加载失败: ${nativeEvent.description || '未知错误'}`);
        }}
        onLoadProgress={({ nativeEvent }) => {
          // 可选：显示加载进度
        }}
      />
      {/* 定位按钮（显示重试状态） */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => getUserLocation()}
        activeOpacity={0.8}
        disabled={isRetrying}
      >
        <Text style={styles.locationButtonText}>
          {isRetrying ? '🔄' : '📍'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 20,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f57c00',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#e65100',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
});

// 导出方法，供外部调用
export const AmapWebViewMethods = {
  getUserLocation: (ref: React.RefObject<any>) => {
    ref.current?.getUserLocation?.();
  },
  getNativeLocation: async (ref: React.RefObject<any>) => {
    // 直接调用原生定位（不通过 WebView）
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('PERMISSION_DENIED');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      const { latitude, longitude, accuracy } = location.coords;

      let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = [addr.region, addr.city, addr.district, addr.street]
            .filter(Boolean).join('') || address;
        }
      } catch (geoError) {
        console.warn('逆地理编码失败:', geoError);
      }

      return {
        longitude,
        latitude,
        accuracy,
        address
      };
    } catch (error: any) {
      throw error;
    }
  },
  clearPetMarkers: (ref: React.RefObject<any>) => {
    ref.current?.clearPetMarkers?.();
  },
  setMapCenter: (ref: React.RefObject<any>, lng: number, lat: number, zoom?: number) => {
    ref.current?.setMapCenter?.(lng, lat, zoom);
  },
  setMapStyle: (ref: React.RefObject<any>, style: MapStyleType) => {
    ref.current?.setMapStyle?.(style);
  },
  sendPetsToWebView: (ref: React.RefObject<any>, pets: PetInfo[]) => {
    ref.current?.sendPetsToWebView?.(pets);
  },
  searchAddress: (ref: React.RefObject<any>, keyword: string) => {
    ref.current?.searchAddress?.(keyword);
  },
  searchPOI: (ref: React.RefObject<any>, keyword: string, lng?: number, lat?: number) => {
    ref.current?.searchPOI?.(keyword, lng, lat);
  },
};

export default AmapWebView;
