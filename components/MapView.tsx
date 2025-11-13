import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, View, Text, Alert, TouchableOpacity } from 'react-native';
import { useLocation } from '@/hooks/use-location';
import { PetInfo, PetInfoDB } from '@/lib/database';
import { Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { AmapWebView } from './AmapWebView';
import { TestWebView } from './TestWebView';
import type { AmapWebViewProps } from './AmapWebView';

const { width, height } = Dimensions.get('window');

interface MapViewProps {
  onMarkerPress?: (petInfo: PetInfo) => void;
}

export const MapComponent: React.FC<MapViewProps> = ({ onMarkerPress }) => {
  const { user } = useApp();
  const { location } = useLocation();
  const [petInfos, setPetInfos] = useState<PetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // 调试模式开关

  const loadPetInfos = async () => {
    if (!location || !user) return;

    try {
      setLoading(true);
      const data = await PetInfoDB.getList({
        latitude: location.latitude,
        longitude: location.longitude,
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
    if (location) {
      loadPetInfos();
    }
  }, [location, user]);

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
  const handleLocationSuccess = (loc: { longitude: number; latitude: number }) => {
    console.log('定位成功:', loc);
  };

  // 处理定位错误
  const handleLocationError = (error: { message: string }) => {
    console.error('定位失败:', error.message);
    Alert.alert('定位失败', '无法获取您的位置信息，请检查定位权限设置。');
  };

  // 地图加载完成
  const handleMapLoaded = () => {
    console.log('地图加载完成');
    setMapLoaded(true);
  };

  // 如果位置未获取，显示加载状态
  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>正在获取位置信息...</Text>
      </View>
    );
  }

  // 转换宠物数据为 AmapWebView 所需的格式
  const petsForMap = petInfos.map(pet => ({
    id: pet.id,
    title: pet.title,
    longitude: pet.longitude,
    latitude: pet.latitude,
    status: pet.status as 'emergency' | 'needs_rescue' | 'for_adoption' | 'adopted',
    description: pet.description,
  }));

  return (
    <View style={styles.container}>
      {/* 调试模式切换按钮 */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => setDebugMode(!debugMode)}
      >
        <Text style={styles.debugButtonText}>
          {debugMode ? '🔙 返回地图' : '🐛 调试模式'}
        </Text>
      </TouchableOpacity>

      {/* 根据调试模式显示不同内容 */}
      {debugMode ? (
        <TestWebView
          onMessage={(data) => {
            console.log('调试模式收到消息:', data);
            if (data.type === 'TEST_MESSAGE') {
              Alert.alert(
                '🎉 WebView 测试成功！',
                `WebView 正常工作！\n\n消息内容:\n${JSON.stringify(data.data, null, 2)}`
              );
            }
          }}
        />
      ) : (
        <AmapWebView
          center={{
            longitude: location.longitude,
            latitude: location.latitude,
          }}
          zoom={15}
          pets={petsForMap}
          onMapLoaded={handleMapLoaded}
          onMarkerClick={handleMarkerClick}
          onLocationSuccess={handleLocationSuccess}
          onLocationError={handleLocationError}
          style={styles.map}
        />
      )}
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
  debugButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 1000,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MapComponent;
