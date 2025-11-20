import { getApiKeyForPlatform } from '@/config/amap-api-keys';

/**
 * 坐标接口
 */
export interface Coordinate {
  longitude: number;
  latitude: number;
}

/**
 * 逆地理编码结果接口
 */
export interface RegeoResult {
  address: string;
  province: string;
  city: string;
  district: string;
  township?: string;
  streetNumber?: string;
  businessCircle?: string;
  adcode: string;
  citycode: string;
  name?: string;
  type?: string;
  id?: string;
  location?: Coordinate;
  distance?: number;
  [key: string]: any;
}

/**
 * 路径规划结果接口
 */
export interface RouteResult {
  distance: number; // 米
  duration: number; // 秒
  path: Coordinate[]; // 路径点
  strategy: number; // 路径策略
  tolls: number; // 收费（元）
  trafficLights?: number; // 红绿灯数量
}

/**
 * 高德地图服务类
 * 单例模式，提供统一的API调用接口
 */
export class AmapService {
  private static instance: AmapService;
  private apiKey: string;
  private cache: Map<string, { data: RegeoResult; timestamp: number }>;

  private constructor() {
    this.apiKey = getApiKeyForPlatform();
    this.cache = new Map();
    console.log('🗺️ 高德地图服务初始化完成');
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AmapService {
    if (!AmapService.instance) {
      AmapService.instance = new AmapService();
    }
    return AmapService.instance;
  }

  /**
   * 逆地理编码 - 坐标转地址
   * @param coord 坐标
   * @param options 配置选项
   * @returns 地址信息
   */
  async regeo(
    coord: Coordinate,
    options: {
      radius?: number; // 搜索半径，默认1000米
      extensions?: 'base' | 'all'; // 扩展信息级别
      useCache?: boolean; // 是否使用缓存
      batch?: Coordinate[]; // 批量查询
    } = {}
  ): Promise<RegeoResult> {
    const { radius = 1000, extensions = 'all', useCache = true, batch } = options;

    // 批量查询优化
    if (batch && batch.length > 0) {
      return this.batchRegeo(batch, { radius, extensions, useCache });
    }

    // 检查缓存
    const cacheKey = `${coord.longitude.toFixed(6)},${coord.latitude.toFixed(6)}`;
    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('✅ 使用缓存地址:', cached.address);
        return cached;
      }
    }

    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${this.apiKey}&location=${coord.longitude},${coord.latitude}&radius=${radius}&extensions=${extensions}&roadlevel=0`;

    try {
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
        throw new Error(`逆地理编码失败: ${data.info || data.infocode}`);
      }
    } catch (error) {
      console.error('❌ 逆地理编码错误:', error);
      throw new Error(`获取地址失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
  }): Promise<RegeoResult[]> {
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
      if (location) {
        url += `&location=${location.longitude},${location.latitude}`;
        if (radius) url += `&radius=${radius}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.pois) {
        return data.pois.map((poi: any) => this.parsePOI(poi));
      } else {
        throw new Error(`POI搜索失败: ${data.info}`);
      }
    } catch (error) {
      console.error('❌ POI搜索错误:', error);
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
  }): Promise<RegeoResult[]> {
    try {
      const { keyword, location, city, types, datatype = 'all' } = params;

      let url = `https://restapi.amap.com/v3/assistant/inputtips?key=${this.apiKey}&keywords=${encodeURIComponent(keyword)}&datatype=${datatype}`;

      if (location) url += `&location=${location.longitude},${location.latitude}`;
      if (city) url += `&city=${city}`;
      if (types) url += `&types=${types}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.tips) {
        return data.tips.filter((tip: any) => tip.location).map((tip: any) => this.parseTip(tip));
      } else {
        throw new Error(`输入提示失败: ${data.info}`);
      }
    } catch (error) {
      console.error('❌ 输入提示错误:', error);
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
        const pathCoords = this.parsePath(path.polyline);

        return {
          distance: parseInt(path.distance),
          duration: parseInt(path.duration),
          path: pathCoords,
          strategy,
          tolls: parseInt(path.tolls || '0'),
          trafficLights: parseInt(path.trafficLights || '0')
        };
      } else {
        throw new Error(`路径规划失败: ${data.info}`);
      }
    } catch (error) {
      console.error('❌ 路径规划错误:', error);
      throw error;
    }
  }

  /**
   * 坐标转换
   */
  static convertCoords(
    coords: Coordinate | Coordinate[],
    from: 'gps' | 'baidu' | 'mapbar' | 'autonavi' = 'gps',
    to: 'gps' | 'baidu' | 'mapbar' | 'autonavi' = 'autonavi'
  ): Coordinate | Coordinate[] {
    const convert = (coord: Coordinate): Coordinate => {
      if (from === 'gps' && to === 'autonavi') {
        return AmapService.wgs84ToGcj02(coord);
      } else if (from === 'autonavi' && to === 'gps') {
        return AmapService.gcj02ToWgs84(coord);
      }
      return coord;
    };

    return Array.isArray(coords) ? coords.map(convert) : convert(coords);
  }

  // WGS84 -> GCJ02 转换算法
  private static wgs84ToGcj02(coord: Coordinate): Coordinate {
    const { longitude, latitude } = coord;
    const pi = Math.PI / 180;
    const a = 6378245.0;
    const ee = 0.006693421622965943;

    const dLat = this.transformLat(coord.longitude - 105.0, coord.latitude - 35.0);
    const dLon = this.transformLon(coord.longitude - 105.0, coord.latitude - 35.0);

    const radLat = coord.latitude * pi;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic);

    const newLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    const newLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);

    return {
      latitude: coord.latitude + newLat,
      longitude: coord.longitude + newLon
    };
  }

  // GCJ02 -> WGS84 转换算法
  private static gcj02ToWgs84(coord: Coordinate): Coordinate {
    const { longitude, latitude } = coord;
    const pi = Math.PI / 180;
    const a = 6378245.0;
    const ee = 0.006693421622965943;

    const dLat = this.transformLat(coord.longitude - 105.0, coord.latitude - 35.0);
    const dLon = this.transformLon(coord.longitude - 105.0, coord.latitude - 35.0);

    const radLat = coord.latitude * pi;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic);

    const newLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    const newLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);

    return {
      latitude: coord.latitude - newLat,
      longitude: coord.longitude - newLon
    };
  }

  private static transformLat(x: number, y: number): number {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }

  private static transformLon(x: number, y: number): number {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
  }

  private parsePOI(poi: any): RegeoResult {
    return {
      address: poi.address || '',
      province: '',
      city: '',
      district: '',
      adcode: '',
      name: poi.name,
      type: poi.type,
      id: poi.id,
      location: poi.location ? {
        longitude: parseFloat(poi.location.split(',')[0]),
        latitude: parseFloat(poi.location.split(',')[1])
      } : undefined,
      distance: poi.distance ? parseInt(poi.distance) : 0
    };
  }

  private parseTip(tip: any): RegeoResult {
    return {
      address: tip.address || '',
      province: '',
      city: '',
      district: '',
      adcode: '',
      name: tip.name,
      type: tip.type,
      id: tip.id,
      location: tip.location ? {
        longitude: parseFloat(tip.location.split(',')[0]),
        latitude: parseFloat(tip.location.split(',')[1])
      } : undefined
    };
  }

  private parsePath(polyline: string): Coordinate[] {
    if (!polyline) return [];
    return polyline.split(';').map(point => {
      const [lng, lat] = point.split(',').map(Number);
      return { longitude: lng, latitude: lat };
    });
  }

  private parseRegeoResult(regeocode: any): RegeoResult {
    const addr = regeocode.addressComponent || {};
    return {
      address: regeocode.formatted_address || '',
      province: addr.province || '',
      city: addr.city || '',
      district: addr.district || '',
      township: addr.township || '',
      streetNumber: addr.streetNumber?.street || '',
      businessCircle: addr.businessCircles?.[0]?.name || '',
      adcode: addr.adcode || '',
      citycode: addr.citycode || ''
    };
  }

  private getCache(key: string): RegeoResult | null {
    const cached = this.cache.get(key);
    if (cached) {
      // 缓存1小时
      if (Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }
    }
    return null;
  }

  private setCache(key: string, data: RegeoResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 高德API缓存已清除');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default AmapService;
