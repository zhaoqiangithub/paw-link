import { useState, useCallback } from 'react';
import AmapService, { Coordinate, RegeoResult, RouteResult } from '@/lib/amap-service';

/**
 * 高德地图Hook
 * 提供便捷的API调用接口和状态管理
 */
export const useAmap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amapService = AmapService.getInstance();

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 逆地理编码 - 坐标转地址
   */
  const regeo = useCallback(async (
    coord: Coordinate,
    options?: {
      radius?: number;
      extensions?: 'base' | 'all';
      useCache?: boolean;
    }
  ): Promise<RegeoResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await amapService.regeo(coord, options);
      return result;
    } catch (err: any) {
      const message = err.message || '逆地理编码失败';
      setError(message);
      console.error('❌ regeo error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * POI搜索
   */
  const searchPOI = useCallback(async (params: {
    keyword: string;
    city?: string;
    location?: Coordinate;
    radius?: number;
    types?: string;
    offset?: number;
    page?: number;
  }): Promise<RegeoResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await amapService.searchPOI(params);
      return result;
    } catch (err: any) {
      const message = err.message || 'POI搜索失败';
      setError(message);
      console.error('❌ searchPOI error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 输入提示
   */
  const inputTips = useCallback(async (params: {
    keyword: string;
    city?: string;
    location?: Coordinate;
    datatype?: 'all' | 'poi' | 'bus' | 'street' | 'streetNumber' | 'city' | 'district' | 'adcode' | 'township' | 'businessArea';
  }): Promise<RegeoResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await amapService.inputTips(params);
      return result;
    } catch (err: any) {
      const message = err.message || '输入提示失败';
      setError(message);
      console.error('❌ inputTips error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 路径规划
   */
  const getRoute = useCallback(async (params: {
    from: Coordinate;
    to: Coordinate;
    mode?: 'driving' | 'walking' | 'bus';
    strategy?: number;
    waypoints?: Coordinate[];
  }): Promise<RouteResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await amapService.getRoute(params);
      return result;
    } catch (err: any) {
      const message = err.message || '路径规划失败';
      setError(message);
      console.error('❌ getRoute error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 坐标转换
   */
  const convertCoords = useCallback((
    coords: Coordinate | Coordinate[],
    from: 'gps' | 'baidu' | 'mapbar' | 'autonavi' = 'gps',
    to: 'gps' | 'baidu' | 'mapbar' | 'autonavi' = 'autonavi'
  ) => {
    return AmapService.convertCoords(coords, from, to);
  }, []);

  /**
   * 清除缓存
   */
  const clearCache = useCallback(() => {
    amapService.clearCache();
  }, []);

  /**
   * 获取缓存统计
   */
  const getCacheStats = useCallback(() => {
    return amapService.getCacheStats();
  }, []);

  return {
    // 状态
    loading,
    error,
    clearError,

    // API方法
    regeo,
    searchPOI,
    inputTips,
    getRoute,
    convertCoords,
    clearCache,
    getCacheStats
  };
};

export default useAmap;
