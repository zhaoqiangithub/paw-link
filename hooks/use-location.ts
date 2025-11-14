import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 更强的Web平台检测
  const isWeb = (() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    // 检查User-Agent是否包含Web相关标识
    const ua = navigator.userAgent.toLowerCase();
    const isWebBrowser = ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari');
    const isWebView = ua.includes('wv') || ua.includes('webview');
    const isStandalone = window.navigator?.standalone === true;

    console.log('Platform detection:', {
      userAgent: ua,
      isWebBrowser,
      isWebView,
      isStandalone,
      result: isWebBrowser && !isStandalone
    });

    return isWebBrowser && !isStandalone;
  })();

  console.log('useLocation initialized, isWeb:', isWeb);

  const requestLocationPermission = async () => {
    if (isWeb) {
      console.log('❌ Web platform detected, skipping permission request');
      setError('Web端不支持原生定位，请使用浏览器定位');
      setLoading(false);
      return false;
    }

    console.log('✅ Non-web platform, requesting permission...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('定位权限被拒绝');
        setLoading(false);
        return false;
      }
      return true;
    } catch (err) {
      setError('获取定位权限失败');
      console.error('Error requesting location permission:', err);
      setLoading(false);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    if (isWeb) {
      console.log('❌ Web platform detected, skipping getCurrentLocation');
      setError('Web端不支持原生定位，请使用浏览器定位');
      setLoading(false);
      return;
    }

    // 检查是否为模拟器（通过Android模拟器错误）
    try {
      await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    } catch (err: any) {
      const errorCode = err?.code;
      console.log('Location error code:', errorCode);
      if (errorCode === 'API_UNAVAILABLE' || errorCode === 17) {
        console.log('⚠️ API_UNAVAILABLE error - likely simulator or no GPS hardware');
        setError('API_UNAVAILABLE: 此设备不支持GPS，请使用真机或高德地图定位');
        setLoading(false);
        return;
      }
    }

    try {
      console.log('✅ Real device detected, getting current location...');
      setLoading(true);
      setError(null);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10
      });

      const { latitude, longitude } = locationResult.coords;
      setLocation({ latitude, longitude });

      // 获取地址信息
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const addressString = [
            address.region,
            address.city,
            address.district,
            address.street
          ].filter(Boolean).join('');
          setLocation({
            latitude,
            longitude,
            address: addressString
          });
        }
      } catch (addressError) {
        console.warn('Failed to get address:', addressError);
        // 地址获取失败不影响定位结果
      }

      setLoading(false);
    } catch (err) {
      setError('获取位置失败');
      console.error('Error getting location:', err);
      setLoading(false);
    }
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string | undefined> => {
    // 检查是否为Web平台
    const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (isWeb) {
      console.log('Web platform detected, skipping reverse geocoding');
      return undefined;
    }

    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const addressString = [
          address.region,
          address.city,
          address.district,
          address.street
        ].filter(Boolean).join('');
        return addressString;
      }
      return undefined;
    } catch (err) {
      console.error('Error getting address:', err);
      return undefined;
    }
  };

  // 计算两点间距离（公里）
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // 地球半径（公里）
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const toRad = (value: number): number => {
    return value * Math.PI / 180;
  };

  useEffect(() => {
    // 检查是否为Web平台
    const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

    if (!isWeb) {
      console.log('Non-web platform detected, getting location automatically');
      getCurrentLocation();
    } else {
      console.log('Web platform detected, skipping automatic location request');
      setLoading(false);
    }
  }, []);

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    getAddressFromCoordinates,
    calculateDistance,
    requestLocationPermission
  };
};
