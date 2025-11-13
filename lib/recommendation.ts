import { UserBehaviorDB, PetInfoDB, type PetInfo } from '@/lib/database';

// 推荐权重配置
const WEIGHTS = {
  // 行为权重
  VIEW: 1,
  CLICK: 3,
  MESSAGE: 5,
  FAVORITE: 4,
  SHARE: 2,

  // 距离权重 (km)
  DISTANCE_WEIGHT: 0.3,

  // 时间权重 (天数)
  TIME_WEIGHT: 0.2,

  // 紧急性权重
  EMERGENCY_BOOST: 5
};

// 推荐项接口
export interface RecommendationItem {
  petInfo: PetInfo;
  score: number;
  reasons: string[];
}

// 排序参数
export interface SortOptions {
  distance?: number; // 最大距离 (km)
  days?: number; // 时间范围 (天)
  emergencyFirst?: boolean; // 紧急情况优先
}

/**
 * 智能推荐算法
 * 基于用户行为、距离、时间和紧急性进行综合排序
 */
export class RecommendationEngine {
  /**
   * 获取个性化推荐列表
   */
  static async getRecommendations(
    userId: string,
    userLatitude: number,
    userLongitude: number,
    options: SortOptions = {}
  ): Promise<RecommendationItem[]> {
    const {
      distance = 50, // 默认50km
      days = 30, // 默认30天
      emergencyFirst = true
    } = options;

    try {
      // 1. 获取用户行为历史
      const behaviors = await UserBehaviorDB.getUserBehaviors(userId, days);

      // 2. 分析用户偏好
      const preferences = this.analyzePreferences(behaviors);

      // 3. 获取候选宠物信息
      const candidatePets = await PetInfoDB.getList({
        latitude: userLatitude,
        longitude: userLongitude,
        maxDistance: distance,
        days: days,
        limit: 100
      });

      // 4. 计算推荐分数
      const recommendations: RecommendationItem[] = candidatePets.map(pet => {
        const score = this.calculateScore(pet, preferences, userLatitude, userLongitude, emergencyFirst);
        const reasons = this.generateReasons(pet, preferences, score);

        return {
          petInfo: pet,
          score,
          reasons
        };
      });

      // 5. 排序并返回前N个
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * 分析用户偏好
   */
  private static analyzePreferences(behaviors: any[]): {
    preferredTypes: Record<string, number>;
    preferredStatuses: Record<string, number>;
    activeHours: number[];
    interactionRate: number;
  } {
    const preferredTypes: Record<string, number> = {};
    const preferredStatuses: Record<string, number> = {};
    const activeHours: number[] = [];
    let interactionCount = 0;

    for (const behavior of behaviors) {
      // 统计宠物类型偏好
      if (behavior.targetType === 'pet_info') {
        // 这里需要根据targetId获取pet info的类型，暂时使用行为权重
        switch (behavior.action) {
          case 'view':
            interactionCount += WEIGHTS.VIEW;
            break;
          case 'click':
            interactionCount += WEIGHTS.CLICK;
            break;
          case 'message':
            interactionCount += WEIGHTS.MESSAGE;
            break;
          case 'favorite':
            interactionCount += WEIGHTS.FAVORITE;
            break;
          case 'share':
            interactionCount += WEIGHTS.SHARE;
            break;
        }

        // 记录活跃时间
        const hour = new Date(behavior.createdAt).getHours();
        activeHours.push(hour);
      }
    }

    return {
      preferredTypes,
      preferredStatuses,
      activeHours,
      interactionRate: interactionCount / Math.max(behaviors.length, 1)
    };
  }

  /**
   * 计算推荐分数
   */
  private static calculateScore(
    pet: PetInfo,
    preferences: any,
    userLat: number,
    userLng: number,
    emergencyFirst: boolean
  ): number {
    let score = 0;

    // 1. 距离分数 (距离越近分数越高)
    const distance = this.calculateDistance(userLat, userLng, pet.latitude, pet.longitude);
    const distanceScore = Math.max(0, 100 - distance);
    score += distanceScore * WEIGHTS.DISTANCE_WEIGHT;

    // 2. 时间分数 (越新的分数越高)
    const daysSinceCreated = (Date.now() - pet.createdAt) / (1000 * 60 * 60 * 24);
    const timeScore = Math.max(0, 100 - daysSinceCreated);
    score += timeScore * WEIGHTS.TIME_WEIGHT;

    // 3. 紧急性加分
    if (pet.status === 'emergency') {
      score += WEIGHTS.EMERGENCY_BOOST * 10;
    } else if (pet.status === 'needs_rescue') {
      score += WEIGHTS.EMERGENCY_BOOST * 5;
    }

    // 4. 基于用户互动的个性化分数
    score += preferences.interactionRate * 10;

    // 5. 紧急情况优先排序
    if (emergencyFirst && pet.status === 'emergency') {
      score += 50;
    }

    return score;
  }

  /**
   * 生成推荐理由
   */
  private static generateReasons(pet: PetInfo, preferences: any, score: number): string[] {
    const reasons: string[] = [];

    // 基于状态的理由
    if (pet.status === 'emergency') {
      reasons.push('紧急救助');
    } else if (pet.status === 'needs_rescue') {
      reasons.push('需要救助');
    }

    // 基于位置的理由
    const distance = this.calculateDistance(
      preferences.userLat || 0,
      preferences.userLng || 0,
      pet.latitude,
      pet.longitude
    );

    if (distance < 5) {
      reasons.push('距离很近');
    } else if (distance < 20) {
      reasons.push('距离较近');
    }

    // 基于时间的理由
    const daysSinceCreated = (Date.now() - pet.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 1) {
      reasons.push('最新发布');
    }

    // 基于分数的理由
    if (score > 80) {
      reasons.push('高度匹配');
    } else if (score > 60) {
      reasons.push('较好匹配');
    }

    return reasons;
  }

  /**
   * 计算两点间距离 (Haversine公式)
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球半径 (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }

  /**
   * 记录用户行为
   */
  static async logBehavior(
    userId: string,
    action: 'view' | 'click' | 'message' | 'favorite' | 'share',
    targetType: 'pet_info' | 'story' | 'case',
    targetId: string
  ): Promise<void> {
    try {
      await UserBehaviorDB.log({
        userId,
        action,
        targetType,
        targetId
      });
    } catch (error) {
      console.error('Error logging user behavior:', error);
    }
  }
}

/**
 * 热点分析工具
 * 分析特定区域的热点宠物信息
 */
export class HotspotAnalyzer {
  /**
   * 获取热点区域
   */
  static async getHotspots(
    centerLat: number,
    centerLng: number,
    radiusKm: number = 10
  ): Promise<{
    latitude: number;
    longitude: number;
    count: number;
    types: Record<string, number>;
  }[]> {
    // 这里可以实现基于地理围栏的热点分析
    // 当前版本返回模拟数据
    return [];
  }

  /**
   * 计算区域密度
   */
  static calculateDensity(
    pets: PetInfo[],
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): number {
    const petsInRadius = pets.filter(pet => {
      const distance = RecommendationEngine['calculateDistance'](
        centerLat, centerLng, pet.latitude, pet.longitude
      );
      return distance <= radiusKm;
    });

    const area = Math.PI * radiusKm * radiusKm;
    return petsInRadius.length / area; // 每平方公里宠物数量
  }
}

export default RecommendationEngine;
