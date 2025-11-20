import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AmapWebView, { LocationInfo, SearchResult } from '../components/AmapWebView';
import AddressSearch from '../components/AddressSearch';
import { WebView } from 'react-native-webview';
import { useLocationContext } from '../contexts/LocationContext';

export default function SelectLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);
  const { selectLocation, clearLocation } = useLocationContext();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // 从路由参数获取初始位置（如果有）
  const initialLng = params.longitude ? parseFloat(params.longitude as string) : undefined;
  const initialLat = params.latitude ? parseFloat(params.latitude as string) : undefined;
  const initialCenter = useMemo(() => {
    if (initialLng && initialLat) {
      return { longitude: initialLng, latitude: initialLat };
    }
    return undefined;
  }, [initialLng, initialLat]);

  // 状态管理
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(
    initialCenter ? { ...initialCenter, address: params.address as string } : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const sendSelectedLocationToMap = useCallback((
    longitude: number,
    latitude: number,
    options?: { center?: boolean; zoom?: number }
  ) => {
    if (!webViewRef.current) return;
    webViewRef.current.postMessage(JSON.stringify({
      type: 'SET_SELECTED_LOCATION',
      longitude,
      latitude,
      shouldCenter: options?.center ?? false,
      zoom: options?.zoom,
    }));
  }, [webViewRef]);

  const requestMapLocation = useCallback(() => {
    if (!webViewRef.current) return;
    setIsLocating(true);
    webViewRef.current.postMessage(JSON.stringify({
      type: 'GET_LOCATION',
    }));
  }, [webViewRef]);

  // 地图加载完成
  const handleMapLoaded = useCallback(() => {
    setMapLoaded(true);
    // 如果有初始位置，渲染标记；否则自动定位
    if (initialCenter) {
      sendSelectedLocationToMap(initialCenter.longitude, initialCenter.latitude, {
        center: true,
        zoom: 16,
      });
    } else {
      requestMapLocation();
    }
  }, [initialCenter, requestMapLocation, sendSelectedLocationToMap]);

  // 搜索结果回调
  const handleSearchResults = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
  }, []);

  // 处理地图点击选点
  const handleMapClick = useCallback((location: { longitude: number; latitude: number }) => {
    setIsLocating(true);
    // 地图点击后会自动触发逆地理编码，等待 onLocationSuccess 回调
    setSelectedLocation({
      longitude: location.longitude,
      latitude: location.latitude,
      address: '正在获取地址...',
    });

    sendSelectedLocationToMap(location.longitude, location.latitude);

    // 向 WebView 发送消息进行逆地理编码
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'REVERSE_GEOCODE',
        longitude: location.longitude,
        latitude: location.latitude,
      }));
    }
  }, [sendSelectedLocationToMap]);

  // 定位成功回调
  const handleLocationSuccess = useCallback((location: LocationInfo) => {
    setIsLocating(false);
    setSelectedLocation({
      longitude: location.longitude,
      latitude: location.latitude,
      address: location.address || '未知地址',
      accuracy: location.accuracy,
    });
    sendSelectedLocationToMap(location.longitude, location.latitude, { center: true });
  }, [sendSelectedLocationToMap]);

  // 定位失败回调
  const handleLocationError = useCallback((error: { message: string }) => {
    console.error('❌ 选择位置页面定位失败:', error.message);
    setIsLocating(false);

    let errorTitle = '定位失败';
    let errorMessage = error.message;

    if (error.message.includes('权限')) {
      errorTitle = '定位权限被拒绝';
      errorMessage = '请在设置中开启定位权限';
    } else if (error.message.includes('超时')) {
      errorTitle = '定位超时';
      errorMessage = '请检查网络连接和GPS设置';
    }

    Alert.alert(
      errorTitle,
      errorMessage,
      [
        { text: '重试', onPress: handleRelocate },
        { text: '取消', style: 'cancel' },
      ]
    );
  }, [handleRelocate]);

  // 重新定位
  const handleRelocate = useCallback(() => {
    if (!mapLoaded) return;
    requestMapLocation();
  }, [mapLoaded, requestMapLocation]);

  // 确认位置
  const handleConfirm = useCallback(() => {
    if (!selectedLocation) {
      Alert.alert('提示', '请先选择一个位置');
      return;
    }

    // 保存位置到 Context
    selectLocation(selectedLocation);

    // 返回上一页
    if (router.canGoBack()) {
      router.back();
    }
  }, [selectedLocation, selectLocation, router]);

  // 跳过定位
  const handleSkip = useCallback(() => {
    Alert.alert(
      '跳过定位',
      '未设置位置可能影响信息展示，是否确认跳过？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '跳过',
          style: 'destructive',
          onPress: () => {
            clearLocation();
            router.back();
          },
        },
      ]
    );
  }, [clearLocation, router]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>选择位置</Text>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.skipText}>跳过</Text>
        </TouchableOpacity>
      </View>

      {/* 地址搜索组件 */}
      <AddressSearch
        webViewRef={webViewRef}
        searchResults={searchResults}
        onLocationSelect={(location) => {
          setSelectedLocation({
            longitude: location.longitude,
            latitude: location.latitude,
            address: location.address,
          });
          sendSelectedLocationToMap(location.longitude, location.latitude, {
            center: true,
            zoom: 17,
          });
          setIsLocating(false);
        }}
        placeholder="搜索地址或地点"
      />

      {/* 地图容器 */}
      <View style={styles.mapContainer}>
        <AmapWebView
          ref={webViewRef}
          webViewRef={webViewRef}
          center={initialCenter}
          zoom={16}
          onMapLoaded={handleMapLoaded}
          onMapClick={handleMapClick}
          onLocationSuccess={handleLocationSuccess}
          onLocationError={handleLocationError}
          onSearchResults={handleSearchResults}
          style={styles.map}
        />

        {/* 中心十字准星指示器 */}
        <View style={styles.centerMarker} pointerEvents="none">
          <View style={styles.crosshair}>
            <View style={styles.crosshairCircle}>
              <Ionicons name="location" size={24} color="#3477FF" />
            </View>
            <View style={styles.crosshairShadow} />
          </View>
        </View>

        {/* 定位按钮 */}
        <TouchableOpacity
          style={styles.relocateButton}
          onPress={handleRelocate}
          disabled={isLocating}
          activeOpacity={0.8}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#3477FF" />
          ) : (
            <Ionicons name="navigate" size={22} color="#3477FF" />
          )}
        </TouchableOpacity>
      </View>

      {/* 底部信息面板 */}
      <View style={styles.bottomPanel}>
        {/* 选中位置信息 */}
        <View style={styles.locationInfo}>
          <View style={styles.locationHeader}>
            <Ionicons name="location-sharp" size={20} color="#3477FF" />
            <Text style={styles.locationTitle}>选中的位置</Text>
          </View>
          {selectedLocation ? (
            <>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {selectedLocation.address || '正在获取地址...'}
              </Text>
              <Text style={styles.locationCoords}>
                经度: {selectedLocation.longitude.toFixed(6)},
                纬度: {selectedLocation.latitude.toFixed(6)}
              </Text>
              {selectedLocation.accuracy && (
                <Text style={styles.locationAccuracy}>
                  精度: ±{selectedLocation.accuracy.toFixed(0)}米
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.locationPlaceholder}>
              点击地图选择位置，或使用右下角的定位按钮
            </Text>
          )}
        </View>

        {/* 确认按钮 */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedLocation && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation || isLocating}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>
            {isLocating ? '定位中...' : '确认位置'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FF',
  },
  header: {
    backgroundColor: '#3A7AFE',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    zIndex: 10,
  },
  crosshair: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  crosshairShadow: {
    position: 'absolute',
    bottom: -8,
    width: 10,
    height: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  relocateButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
  },
  locationAddress: {
    fontSize: 15,
    color: '#1F2A44',
    marginBottom: 6,
    lineHeight: 20,
  },
  locationCoords: {
    fontSize: 12,
    color: '#8A94A6',
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#4CAF50',
  },
  locationPlaceholder: {
    fontSize: 14,
    color: '#C4CBD9',
    fontStyle: 'italic',
  },
  confirmButton: {
    borderRadius: 28,
    paddingVertical: 16,
    backgroundColor: '#3477FF',
    alignItems: 'center',
    shadowColor: '#3477FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: '#C4CBD9',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
