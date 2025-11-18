import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, Alert } from 'react-native';
import { PetInfo, PetInfoDB } from '@/lib/database';
import { Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import NativeMapView from './NativeMapView';

const { width, height } = Dimensions.get('window');

interface MapViewProps {
  onMarkerPress?: (petInfo: PetInfo) => void;
}

export const MapComponent: React.FC<MapViewProps> = ({ onMarkerPress }) => {
  const { user } = useApp();
  const [petInfos, setPetInfos] = useState<PetInfo[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    longitude: number;
    latitude: number;
    address?: string;
  } | null>(null);

  // 加载宠物信息
  const loadPetInfos = async () => {
    if (!currentLocation || !user) return;

    try {
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
    }
  };

  useEffect(() => {
    loadPetInfos();
  }, [currentLocation, user]);

  // 处理标记点击
  const handleMarkerClick = (pet: PetInfo) => {
    if (onMarkerPress) {
      onMarkerPress(pet);
    }
  };

  // 处理定位成功
  const handleLocationSuccess = (loc: {
    longitude: number;
    latitude: number;
    address?: string;
  }) => {
    console.log('✅ Location success:', loc);
    setCurrentLocation(loc);
  };

  // 处理定位错误
  const handleLocationError = (error: { message: string; code?: number }) => {
    console.error('❌ Location failed:', error.message);

    Alert.alert(
      '定位失败',
      `${error.message}\n\n您可以：\n• 点击地图上的任意位置手动选择\n• 检查定位权限是否开启`,
      [
        { text: '手动选择位置', style: 'cancel' },
        { text: '重试', onPress: () => {} }
      ]
    );
  };

  // 使用当前位置或北京作为默认中心点
  const defaultCenter = currentLocation
    ? { longitude: currentLocation.longitude, latitude: currentLocation.latitude }
    : { longitude: 116.4074, latitude: 39.9042 };

  return (
    <NativeMapView
      center={defaultCenter}
      zoom={16}
      pets={petInfos}
      onMapLoaded={() => console.log('Map loaded')}
      onMarkerClick={handleMarkerClick}
      onLocationSuccess={handleLocationSuccess}
      onLocationError={handleLocationError}
      style={styles.map}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapComponent;
