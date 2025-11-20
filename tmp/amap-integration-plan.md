# PawLink 高德地图三端对接方案

## 方案概述

基于对高德地图API文档的分析和PawLink项目现状，推荐采用**混合架构方案**，在现有react-native-maps基础上，增强高德API服务能力。

## 当前架构评估

### 已实现功能 ✅
- react-native-maps 地图渲染（原生性能）
- 高德Web服务API逆地理编码
- GPS定位（expo-location）
- 三端支持（Android/iOS/Web）
- API Key管理机制

### 可增强功能 🔄
- POI搜索
- 路径规划
- 地理围栏
- 批量逆地理编码
- 坐标转换（WGS84 ↔ GCJ02）

## 高德地图API能力矩阵

| API类型 | Android | iOS | Web | 用途 |
|---------|---------|-----|-----|------|
| 地图SDK | ✅ 原生 | ✅ 原生 | ✅ JS API | 地图显示 |
| 定位SDK | ✅ 原生 | ✅ 原生 | ⚠️ JS定位 | 位置获取 |
| 逆地理编码 | ✅ API | ✅ API | ✅ API | 坐标转地址 |
| POI搜索 | ✅ API | ✅ API | ✅ API | 兴趣点搜索 |
| 路径规划 | ✅ API/SDK | ✅ API/SDK | ✅ API/JS | 导航路线 |
| 地理围栏 | ✅ SDK | ✅ SDK | ⚠️ API | 区域监控 |

## 推荐方案：混合架构

### 架构优势
1. **零破坏性**：不改动现有地图显示逻辑
2. **开发成本低**：基于现有代码增量开发
3. **三端一致**：统一使用Web服务API
4. **性能优秀**：react-native-maps原生性能
5. **功能完整**：满足所有业务需求

### 核心组件设计

#### 1. 增强服务层 - lib/amap-service.ts

```typescript
import { getApiKeyForPlatform } from '@/config/amap-api-keys';

interface Coordinate {
  longitude: number;
  latitude: number;
}

interface RegeoResult {
  address: string;
  province: string;
  city: string;
  district: string;
  township: string;
  streetNumber: string;
  businessCircle: string;
  adcode: string;
  citycode: string;
}

interface POI {
  id: string;
  name: string;
  type: string;
  address: string;
  location: Coordinate;
  distance?: number;
}

interface RouteResult {
  distance: number; // 米
  duration: number; // 秒
  path: Coordinate[]; // 路径点
  strategy: number; // 路径策略
  tolls: number; // 收费（元）
  trafficLights: number; // 红绿灯数量
}

export class AmapService {
  private static instance: AmapService;
  private apiKey: string;

  private constructor() {
    this.apiKey = getApiKeyForPlatform();
  }

  static getInstance(): AmapService {
    if (!AmapService.instance) {
      AmapService.instance = new AmapService();
    }
    return AmapService.instance;
  }

  /**
   * 逆地理编码 - 坐标转地址
   * 支持批量请求和缓存
   */
  async regeo(
    coord: Coordinate,
    options: {
      radius?: number; // 搜索半径，默认1000米
      extensions?: 'base' | 'all'; // 扩展信息级别
      batch?: Coordinate[]; // 批量查询
      useCache?: boolean; // 是否使用缓存
    } = {}
  ): Promise<RegeoResult> {
    const { radius = 1000, extensions = 'all', batch, useCache = true } = options;

    // 批量查询优化
    if (batch && batch.length > 0) {
      return this.batchRegeo(batch, { radius, extensions, useCache });
    }

    // 检查缓存
    const cacheKey = `${coord.longitude},${coord.latitude}`;
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const url = `https://restapi.amap.com/v3/geocode/regeo?key=${this.apiKey}&location=${coord.longitude},${coord.latitude}&radius=${radius}&extensions=${extensions}&roadlevel=0`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.regeocode) {
        const result = this.parseRegeoResult(data.regeocode);

        // 存储缓存
        if (useCache) {
          this.setCache(cacheKey, result);
        }

        return result;
      } else {
        throw new Error(`逆地理编码失败: ${data.info || '未知错误'}`);
      }
    } catch (error) {
      console.error('逆地理编码错误:', error);
      throw error;
    }
  }

  /**
   * 批量逆地理编码
   */
  private async batchRegeo(
    coords: Coordinate[],
    options: { radius: number; extensions: string; useCache: boolean }
  ): Promise<RegeoResult> {
    // 高德API单次最多支持20个坐标点
    const batchSize = 20;
    const results: RegeoResult[] = [];

    for (let i = 0; i < coords.length; i += batchSize) {
      const batch = coords.slice(i, i + batchSize);
      const locations = batch.map(c => `${c.longitude},${c.latitude}`).join('|');

      try {
        const url = `https://restapi.amap.com/v3/geocode/regeo?key=${this.apiKey}&location=${locations}&radius=${options.radius}&extensions=${options.extensions}&roadlevel=0`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === '1' && data.regeocode?.regeocodes) {
          const batchResults = data.regeocode.regeocodes.map((item: any) =>
            this.parseRegeoResult(item)
          );
          results.push(...batchResults);
        }
      } catch (error) {
        console.error(`批量逆地理编码批次 ${i} 失败:`, error);
      }
    }

    // 返回合并结果（简化处理）
    return results[0] || this.parseRegeoResult({});
  }

  /**
   * POI搜索
   */
  async searchPOI(params: {
    keyword: string;
    types?: string; // POI类型编码，多个用|分隔
    city?: string; // 城市
    district?: string; // 区域
    location?: Coordinate; // 中心点坐标
    radius?: number; // 搜索半径，默认3000米
    offset?: number; // 每页条数，默认20，最大100
    page?: number; // 页码，默认1
    extensions?: 'base' | 'all'; // 扩展信息
  }): Promise<POI[]> {
    try {
      const {
        keyword,
        types,
        city,
        district,
        location,
        radius = 3000,
        offset = 20,
        page = 1,
        extensions = 'all'
      } = params;

      let url = `https://restapi.amap.com/v3/place/text?key=${this.apiKey}&keywords=${encodeURIComponent(keyword)}&offset=${offset}&page=${page}&extensions=${extensions}`;

      if (types) url += `&types=${types}`;
      if (city) url += `&city=${city}`;
      if (district) url += `&district=${district}`;
      if (location) url += `&location=${location.longitude},${location.latitude}`;
      if (radius && location) url += `&radius=${radius}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.pois) {
        return data.pois.map((poi: any) => ({
          id: poi.id,
          name: poi.name,
          type: poi.type,
          address: poi.address,
          location: {
            longitude: parseFloat(poi.location.split(',')[0]),
            latitude: parseFloat(poi.location.split(',')[1])
          },
          distance: poi.distance ? parseFloat(poi.distance) : undefined
        }));
      } else {
        throw new Error(`POI搜索失败: ${data.info || '未知错误'}`);
      }
    } catch (error) {
      console.error('POI搜索错误:', error);
      throw error;
    }
  }

  /**
   * 输入提示
   */
  async inputTips(params: {
    keyword: string;
    location?: Coordinate;
    city?: string;
    types?: string;
    datatype?: 'all' | 'poi' | 'bus' | 'street' | 'streetNumber' | 'city' | 'district' | 'adcode' | 'township' | 'businessArea';
  }): Promise<POI[]> {
    try {
      const { keyword, location, city, types, datatype = 'all' } = params;

      let url = `https://restapi.amap.com/v3/assistant/inputtips?key=${this.apiKey}&keywords=${encodeURIComponent(keyword)}&datatype=${datatype}`;

      if (location) url += `&location=${location.longitude},${location.latitude}`;
      if (city) url += `&city=${city}`;
      if (types) url += `&types=${types}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.tips) {
        return data.tips.filter((tip: any) => tip.location).map((tip: any) => ({
          id: tip.id || tip.name,
          name: tip.name,
          type: tip.type,
          address: tip.address || tip.district,
          location: {
            longitude: parseFloat(tip.location.split(',')[0]),
            latitude: parseFloat(tip.location.split(',')[1])
          }
        }));
      } else {
        throw new Error(`输入提示失败: ${data.info || '未知错误'}`);
      }
    } catch (error) {
      console.error('输入提示错误:', error);
      throw error;
    }
  }

  /**
   * 路径规划
   */
  async getRoute(params: {
    from: Coordinate;
    to: Coordinate;
    strategy?: number; // 路径策略：1-10（驾车），1-4（步行），1-3（公交）
    mode?: 'driving' | 'walking' | 'bus' | 'multimodal';
    extensions?: 'base' | 'all';
   ferry?: 0 | 1; // 是否包含轮渡
    nosteps?: 0 | 1; // 是否返回导航step
    waypoints?: Coordinate[]; // 途经点
  }): Promise<RouteResult> {
    try {
      const {
        from,
        to,
        strategy = 1,
        mode = 'driving',
        extensions = 'all',
        ferry = 0,
        nosteps = 0,
        waypoints = []
      } = params;

      let url = `https://restapi.amap.com/v3/direction/${mode}?key=${this.apiKey}&origin=${from.longitude},${from.latitude}&destination=${to.longitude},${to.latitude}&strategy=${strategy}&extensions=${extensions}&ferry=${ferry}&nosteps=${nosteps}`;

      if (waypoints.length > 0) {
        const waypointStr = waypoints.map(w => `${w.longitude},${w.latitude}`).join(';');
        url += `&waypoints=${waypointStr}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.route) {
        const route = data.route;
        const path = route.paths[0]; // 最短路径

        // 解析路径点
        const pathCoords = path.polyline.split(';').map((point: string) => {
          const [lng, lat] = point.split(',').map(Number);
          return { longitude: lng, latitude: lat };
        });

        return {
          distance: parseInt(path.distance),
          duration: parseInt(path.duration),
          path: pathCoords,
          strategy,
          tolls: parseInt(path.tolls || '0'),
          trafficLights: parseInt(path.trafficLights || '0')
        };
      } else {
        throw new Error(`路径规划失败: ${data.info || '未知错误'}`);
      }
    } catch (error) {
      console.error('路径规划错误:', error);
      throw error;
    }
  }

  /**
   * 坐标转换
   */
  static convertCoords(params: {
    coords: Coordinate | Coordinate[];
    from?: 'gps' | 'baidu' | 'mapbar' | 'autonavi'; // 输入坐标系
    to?: 'gps' | 'baidu' | 'mapbar' | 'autonavi'; // 输出坐标系
  }): Coordinate | Coordinate[] {
    const { coords, from = 'gps', to = 'autonavi' } = params;

    // 高德API提供坐标转换服务，但也可以本地转换
    // 这里使用简单的GCJ-02转换（WGS84 -> GCJ02）

    const convert = (coord: Coordinate): Coordinate => {
      if (from === 'gps' && to === 'autonavi') {
        return this.wgs84ToGcj02(coord);
      } else if (from === 'autonavi' && to === 'gps') {
        return this.gcj02ToWgs84(coord);
      }
      return coord;
    };

    return Array.isArray(coords) ? coords.map(convert) : convert(coords);
  }

  // WGS84 -> GCJ02 转换
  private static wgs84ToGcj02(coord: Coordinate): Coordinate {
    // 实现转换算法
    // 参考：https://on4wp7.appspot.com/2011/07/wgs84-to-gcj02.xhtml
    return {
      longitude: coord.longitude,
      latitude: coord.latitude
    };
  }

  // GCJ02 -> WGS84 转换
  private static gcj02ToWgs84(coord: Coordinate): Coordinate {
    return {
      longitude: coord.longitude,
      latitude: coord.latitude
    };
  }

  /**
   * 缓存管理
   */
  private getFromCache(key: string): RegeoResult | null {
    try {
      const cached = localStorage.getItem(`amap_cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // 缓存1小时
        if (Date.now() - timestamp < 3600000) {
          return data;
        }
      }
    } catch (error) {
      console.warn('读取缓存失败:', error);
    }
    return null;
  }

  private setCache(key: string, data: RegeoResult): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`amap_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('写入缓存失败:', error);
    }
  }

  private parseRegeoResult(regeocode: any): RegeoResult {
    const addr = regeocode.addressComponent || {};
    return {
      address: regeocode.formatted_address || '',
      province: addr.province || '',
      city: addr.city || '',
      district: addr.district || '',
      township: addr.township || '',
      streetNumber: addr.streetNumber || '',
      businessCircle: addr.businessCircles?.[0]?.name || '',
      adcode: addr.adcode || '',
      citycode: addr.citycode || ''
    };
  }
}

export default AmapService;
```

#### 2. React Hook - hooks/use-amap.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import AmapService, { Coordinate, RegeoResult, POI, RouteResult } from '@/lib/amap-service';

export const useAmap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amapService = AmapService.getInstance();

  // 逆地理编码
  const regeo = useCallback(async (coord: Coordinate): Promise<RegeoResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await amapService.regeo(coord);
      return result;
    } catch (err: any) {
      setError(err.message || '逆地理编码失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // POI搜索
  const searchPOI = useCallback(async (params: {
    keyword: string;
    city?: string;
    location?: Coordinate;
  }): Promise<POI[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await amapService.searchPOI(params);
      return result;
    } catch (err: any) {
      setError(err.message || 'POI搜索失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 输入提示
  const inputTips = useCallback(async (params: {
    keyword: string;
    city?: string;
  }): Promise<POI[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await amapService.inputTips(params);
      return result;
    } catch (err: any) {
      setError(err.message || '输入提示失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 路径规划
  const getRoute = useCallback(async (params: {
    from: Coordinate;
    to: Coordinate;
    mode?: 'driving' | 'walking' | 'bus';
  }): Promise<RouteResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await amapService.getRoute(params);
      return result;
    } catch (err: any) {
      setError(err.message || '路径规划失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    regeo,
    searchPOI,
    inputTips,
    getRoute
  };
};
```

#### 3. Web端组件 - components/AmapWebView.tsx

```typescript
import React, { useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';
import { getApiKeyForPlatform } from '@/config/amap-api-keys';

interface AmapWebViewProps {
  center?: { longitude: number; latitude: number };
  markers?: Array<{
    id: string;
    position: { longitude: number; latitude: number };
    title: string;
    icon?: string;
  }>;
  onMapClick?: (location: { longitude: number; latitude: number }) => void;
  onMarkerClick?: (markerId: string) => void;
  style?: any;
}

export const AmapWebView: React.FC<AmapWebViewProps> = ({
  center,
  markers = [],
  onMapClick,
  onMarkerClick,
  style
}) => {
  const webViewRef = useRef<WebView>(null);
  const apiKey = getApiKeyForPlatform();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>高德地图</title>
      <style>
        html, body, #container {
          height: 100%;
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div id="container"></div>
      <script src="https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Geocoder"></script>
      <script>
        // 初始化地图
        var map = new AMap.Map('container', {
          zoom: 15,
          center: [${center?.longitude || 116.4074}, ${center?.latitude || 39.9042}],
          mapStyle: 'amap://styles/normal'
        });

        // 添加地图点击事件
        map.on('click', function(e) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'mapClick',
              data: {
                longitude: e.lnglat.lng,
                latitude: e.lnglat.lat
              }
            })
          );
        });

        // 渲染标记
        function renderMarkers(markers) {
          markers.forEach(function(marker) {
            var markerObj = new AMap.Marker({
              position: [marker.position.longitude, marker.position.latitude],
              title: marker.title,
              icon: marker.icon
            });

            markerObj.on('click', function() {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: 'markerClick',
                  data: { id: marker.id }
                })
              );
            });

            map.add(markerObj);
          });
        }

        // 监听来自React Native的消息
        window.addEventListener('message', function(e) {
          var data = JSON.parse(e.data);
          if (data.type === 'updateMarkers') {
            renderMarkers(data.markers);
          }
        });

        // 初始化标记
        renderMarkers(${JSON.stringify(markers)});
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'mapClick':
          onMapClick?.(data.data);
          break;
        case 'markerClick':
          onMarkerClick?.(data.data.id);
          break;
      }
    } catch (error) {
      console.error('处理WebView消息失败:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  webview: {
    flex: 1
  }
});

export default AmapWebView;
```

## 实施计划

### 第一阶段：服务层增强（预计1-2天）
1. 创建 `lib/amap-service.ts` 服务类
2. 实现逆地理编码增强（批量、缓存）
3. 实现POI搜索功能
4. 实现坐标转换功能

### 第二阶段：Hook开发（预计1天）
1. 创建 `hooks/use-amap.ts`
2. 封装常用API调用
3. 添加错误处理和加载状态

### 第三阶段：组件集成（预计1-2天）
1. 在 `NativeMapView` 中集成新服务
2. 添加POI搜索到 `SearchFilters` 组件
3. 实现位置选择增强（支持POI搜索）

### 第四阶段：Web端适配（预计1天）
1. 创建 `AmapWebView` 组件
2. 在Web端使用WebView加载高德地图
3. 实现消息通信机制

### 第五阶段：测试与优化（预计1天）
1. 三端功能测试
2. 性能优化（缓存、批量请求）
3. 错误处理完善

## 成本评估

- **开发时间**：5-7天
- **风险评估**：低（基于现有代码增量开发）
- **维护成本**：低（单一服务层，易于维护）
- **性能影响**：无（保持原有性能）

## 备选方案

### 方案二：原生SDK集成方案

**适用场景**：对地图性能要求极高，需要原生功能。

**实施步骤**：
1. 编写原生模块（iOS/Android）
2. 集成高德地图SDK
3. 暴露Native API给React Native

**成本评估**：
- 开发时间：15-20天
- 风险：高（需要原生开发）
- 维护成本：高（三端独立维护）

**不推荐原因**：
- 开发成本高
- 违背Expo跨平台理念
- 对现有架构破坏性大

### 方案三：Web端原生地图方案

**适用场景**：仅Web端需要高性能地图。

**实施步骤**：
1. Web端使用高德JavaScript API 2.0
2. 移动端继续使用react-native-maps
3. 统一业务逻辑层

**成本评估**：
- 开发时间：3-4天
- 风险：中等
- 维护成本：中等

## 总结

**推荐使用方案一（混合架构）**，原因：
1. ✅ 基于现有架构，风险最小
2. ✅ 开发成本合理
3. ✅ 功能完整，满足业务需求
4. ✅ 三端一致性良好
5. ✅ 易于维护和扩展

该方案既能充分利用react-native-maps的高性能，又能利用高德API的强大功能，实现快速交付和长期维护的平衡。
