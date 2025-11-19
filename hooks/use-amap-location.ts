import { useState, useRef, useCallback } from 'react';
import { WebView } from 'react-native-webview';

/**
 * 高德地图定位钩子
 * 通过与 AmapWebView 组件通信实现定位功能
 */

export interface AmapLocationData {
  longitude: number;
  latitude: number;
  accuracy?: number;
  address?: string;
}

export interface UseAmapLocationReturn {
  location: AmapLocationData | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => void;
  webViewRef: React.RefObject<WebView>;
  onLocationUpdate?: (loc: AmapLocationData) => void;
}

export const useAmapLocation = (): UseAmapLocationReturn => {
  const [location, setLocation] = useState<AmapLocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  // 处理定位成功消息
  const handleLocationMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'LOCATION_SUCCESS' && data.data) {
        const { longitude, latitude, accuracy, address } = data.data;
        console.log('✅ 高德定位成功:', { longitude, latitude, address });
        setLocation({ longitude, latitude, accuracy, address });
        setLoading(false);
        setError(null);
      } else if (data.type === 'LOCATION_ERROR' && data.data) {
        console.error('❌ 高德定位失败:', data.data.message);
        setError(data.data.message || '定位失败');
        setLoading(false);
      }
    } catch (err) {
      console.error('解析定位消息失败:', err);
    }
  }, []);

  // 获取当前定位
  const getCurrentLocation = useCallback(() => {
    console.log('🎯 请求高德定位...');
    setLoading(true);
    setError(null);

    if (webViewRef.current) {
      const message = JSON.stringify({
        type: 'GET_LOCATION'
      });
      webViewRef.current.postMessage(message);
    } else {
      console.error('WebView未初始化，无法获取定位');
      setError('地图组件未初始化');
      setLoading(false);
    }
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    webViewRef,
    onLocationUpdate: setLocation
  };
};
