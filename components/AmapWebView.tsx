import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { getAmapHtmlTemplate } from '../utils/amap-js-bridge';

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
}

// Props 接口
export interface AmapWebViewProps {
  center?: { longitude: number; latitude: number };
  zoom?: number;
  pets?: PetInfo[];
  onMapLoaded?: () => void;
  onMarkerClick?: (pet: PetInfo) => void;
  onLocationSuccess?: (location: LocationInfo) => void;
  onLocationError?: (error: { message: string }) => void;
  onMapClick?: (location: { longitude: number; latitude: number }) => void;
  style?: any;
}

// 默认中心点（北京天安门）
const DEFAULT_CENTER = {
  longitude: 116.407526,
  latitude: 39.90403,
};

export const AmapWebView: React.FC<AmapWebViewProps> = ({
  center = DEFAULT_CENTER,
  zoom = 15,
  pets = [],
  onMapLoaded,
  onMarkerClick,
  onLocationSuccess,
  onLocationError,
  onMapClick,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [apiKey] = useState<string>('5cf2d9bdceb2ce9266c7a489826bf21b'); // TODO: 从环境变量或配置获取
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          if (onLocationSuccess) {
            onLocationSuccess(data.data);
          }
          break;

        case 'LOCATION_ERROR':
          if (onLocationError) {
            onLocationError(data.data);
          }
          break;

        case 'MAP_CLICK':
          if (onMapClick) {
            onMapClick(data.data);
          }
          break;
      }
    } catch (error) {
      // Silent error handling
    }
  }, [pets, onMapLoaded, onMarkerClick, onLocationSuccess, onLocationError, onMapClick]);

  // 发送宠物数据到WebView
  const sendPetsToWebView = useCallback((petsData: PetInfo[]) => {
    if (webViewRef.current) {
      const message = {
        type: 'ADD_PETS',
        pets: petsData,
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, []);

  // 获取用户位置
  const getUserLocation = useCallback(() => {
    if (webViewRef.current) {
      const message = {
        type: 'GET_LOCATION',
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, []);

  // 清除所有宠物标记
  const clearPetMarkers = useCallback(() => {
    if (webViewRef.current) {
      const message = {
        type: 'CLEAR_PETS',
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, []);

  // 设置地图中心
  const setMapCenter = useCallback((longitude: number, latitude: number) => {
    if (webViewRef.current) {
      const message = {
        type: 'CENTER_MAP',
        longitude,
        latitude,
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, []);

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
        ref={webViewRef}
        source={{
          html: getAmapHtmlTemplate(apiKey, center, zoom),
        }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={renderLoading}
        onMessage={handleWebViewMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setError(`WebView加载失败: ${nativeEvent.description || '未知错误'}`);
        }}
      />
      {/* 定位按钮 */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => getUserLocation()}
      >
        <Text style={styles.locationButtonText}>📍</Text>
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
  getUserLocation: (ref: React.RefObject<React.Component<AmapWebViewProps>>) => {
    // @ts-ignore - 访问内部方法
    ref.current?.getUserLocation?.();
  },
  clearPetMarkers: (ref: React.RefObject<React.Component<AmapWebViewProps>>) => {
    // @ts-ignore - 访问内部方法
    ref.current?.clearPetMarkers?.();
  },
  setMapCenter: (ref: React.RefObject<React.Component<AmapWebViewProps>>, lng: number, lat: number) => {
    // @ts-ignore - 访问内部方法
    ref.current?.setMapCenter?.(lng, lat);
  },
};
