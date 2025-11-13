import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, View, Text, Alert, TouchableOpacity } from 'react-native';
import { useLocation } from '@/hooks/use-location';
import { PetInfo, PetInfoDB } from '@/lib/database';
import { Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { AmapWebView } from './AmapWebView';
import type { AmapWebViewProps } from './AmapWebView';

const { width, height } = Dimensions.get('window');

interface MapViewProps {
  onMarkerPress?: (petInfo: PetInfo) => void;
}

export const MapComponent: React.FC<MapViewProps> = ({ onMarkerPress }) => {
  const { user } = useApp();
  const { location: initialLocation } = useLocation(); // 保留兼容性
  const [petInfos, setPetInfos] = useState<PetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{longitude: number, latitude: number} | null>(initialLocation || null);
  const [currentAddress, setCurrentAddress] = useState<string>('定位中...');

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
    setCurrentLocation({
      longitude: loc.longitude,
      latitude: loc.latitude
    });
    if (loc.address) {
      setCurrentAddress(loc.address);
    } else {
      setCurrentAddress('定位成功，但无法获取详细地址');
    }
  };

  // 处理定位错误
  const handleLocationError = (error: { message: string }) => {
    console.error('定位失败:', error.message);
    setCurrentAddress('定位失败');
    Alert.alert('定位失败', '无法获取您的位置信息，请检查定位权限设置。');
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
      </View>

      <AmapWebView
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
    right: 80,
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
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default MapComponent;
