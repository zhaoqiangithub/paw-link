import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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

  // 处理 WebView 消息
  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('AmapWebView收到消息:', data);

      switch (data.type) {
        case 'MAP_LOADED':
          setMapLoaded(true);
          onMapLoaded?.();
          // 地图加载完成后，如果有宠物数据，发送到WebView
          if (pets.length > 0) {
            sendPetsToWebView(pets);
          }
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

        default:
          console.log('未知消息类型:', data.type);
      }
    } catch (error) {
      console.error('解析WebView消息失败:', error);
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
    </View>
  );

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
        onLoadStart={() => console.log('WebView开始加载')}
        onLoadEnd={() => console.log('WebView加载完成')}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView加载失败:', nativeEvent);
        }}
      />
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
