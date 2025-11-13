import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocation } from '@/hooks/use-location';
import { PetInfo, PetInfoDB } from '@/lib/database';
import { Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface MapViewProps {
  onMarkerPress?: (petInfo: PetInfo) => void;
}

export const MapComponent: React.FC<MapViewProps> = ({ onMarkerPress }) => {
  const { user } = useApp();
  const { location } = useLocation();
  const [petInfos, setPetInfos] = useState<PetInfo[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getMarkerColor = (type: string, status: string) => {
    if (status === 'emergency') return '#FF4444';
    if (status === 'needs_rescue') return '#FF9800';
    if (status === 'for_adoption') return '#4CAF50';
    if (status === 'adopted') return '#9E9E9E';
    return '#2196F3';
  };

  const getMarkerIcon = (type: string, status: string) => {
    if (status === 'emergency') return '🚨';
    if (status === 'needs_rescue') return '🆘';
    if (status === 'for_adoption') return type === 'cat' ? '🐱' : type === 'dog' ? '🐶' : '🐾';
    return '📍';
  };

  const handleMarkerPress = (petInfo: PetInfo) => {
    onMarkerPress?.(petInfo);
  };

  // 计算屏幕上标记位置（简化版，实际项目中应使用真实地图坐标转换）
  const calculateScreenPosition = (petInfo: PetInfo) => {
    if (!location) return { x: width / 2, y: height / 2 };

    const latDelta = 0.0922;
    const lonDelta = 0.0421;

    const x = ((petInfo.longitude - location.longitude) / lonDelta) * width + width / 2;
    const y = height / 2 - ((petInfo.latitude - location.latitude) / latDelta) * height;

    return { x: Math.max(30, Math.min(width - 30, x)), y: Math.max(100, Math.min(height - 100, y)) };
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="location-outline" size={64} color={Colors.light.icon} />
        <Text style={styles.loadingText}>正在获取位置信息...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 简化版地图背景 */}
      <View style={styles.mapBackground}>
        <View style={[styles.userLocation, {
          left: width / 2 - 10,
          top: height / 2 - 10
        }]} />
        <Text style={styles.mapTitle}>PawLink 宠物地图</Text>
        <Text style={styles.mapSubtitle}>当前位置：{location.address || '未知位置'}</Text>
      </View>

      {/* 标记点 */}
      {!loading && petInfos.map((petInfo) => {
        const position = calculateScreenPosition(petInfo);
        return (
          <TouchableOpacity
            key={petInfo.id}
            style={[
              styles.marker,
              {
                left: position.x - 20,
                top: position.y - 20,
                backgroundColor: getMarkerColor(petInfo.type, petInfo.status)
              }
            ]}
            onPress={() => handleMarkerPress(petInfo)}
          >
            <Text style={styles.markerIcon}>
              {getMarkerIcon(petInfo.type, petInfo.status)}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* 图例 */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>图例</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>需救助</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>待领养</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF4444' }]} />
          <Text style={styles.legendText}>紧急</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocation: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: 'white',
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 20,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  markerIcon: {
    fontSize: 20,
  },
  legend: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    color: Colors.light.text,
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
});

export default MapComponent;
