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

  const requestLocationPermission = async () => {
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
    try {
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
    getCurrentLocation();
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
