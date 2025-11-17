/**
 * AI 审核服务
 *
 * BUG-004 修复: 集成 AI 审核到发布流程
 *
 * 功能包括：
 * 1. 图片内容审核 - 检测不当图片
 * 2. 文本内容审核 - 检测敏感信息
 * 3. 重复信息检测 - 检测重复发布
 * 4. 位置相似度检测 - 检测虚假位置
 */

export interface ModerationResult {
  passed: boolean;
  riskLevel: 'safe' | 'low' | 'medium' | 'high';
  reasons: string[];
  suggestions?: string[];
  blockedImages?: number[]; // 被屏蔽的图片索引
  details?: {
    duplicateDetected?: boolean;
    locationSuspicious?: boolean;
    contentViolations?: string[];
    imageViolations?: Array<{ index: number; reason: string }>;
  };
}

export interface ModerationInput {
  images: string[]; // 图片 URI 列表
  description: string; // 描述文本
  title: string; // 标题
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  userId: string;
}

class AIModerationServiceClass {
  // 相同位置检测的最小距离（米）
  private readonly LOCATION_THRESHOLD = 100;

  // 标题相似度阈值
  private readonly TITLE_SIMILARITY_THRESHOLD = 0.8;

  // 文本描述相似度阈值
  private readonly DESCRIPTION_SIMILARITY_THRESHOLD = 0.7;

  /**
   * 执行内容审核
   * @param input 审核输入
   * @returns 审核结果
   */
  async moderate(input: ModerationInput): Promise<ModerationResult> {
    const reasons: string[] = [];
    const details: ModerationResult['details'] = {
      contentViolations: [],
      imageViolations: []
    };
    let riskLevel: ModerationResult['riskLevel'] = 'safe';
    const blockedImages: number[] = [];

    try {
      // 1. 文本内容审核
      const textResult = await this.moderateText(input.title, input.description);
      if (!textResult.passed) {
        reasons.push(...textResult.violations);
        details.contentViolations = textResult.violations;
        riskLevel = 'medium';
      }

      // 2. 图片内容审核
      const imageResult = await this.moderateImages(input.images);
      if (imageResult.violations.length > 0) {
        for (const violation of imageResult.violations) {
          reasons.push(`图片 ${violation.index + 1}: ${violation.reason}`);
          blockedImages.push(violation.index);
        }
        details.imageViolations = imageResult.violations;
        riskLevel = violationToRiskLevel(imageResult.violations);
      }

      // 3. 重复信息检测
      const duplicateResult = await this.checkDuplicate(input);
      if (duplicateResult.isDuplicate) {
        details.duplicateDetected = true;
        reasons.push(`检测到相似信息（相似度: ${(duplicateResult.similarity * 100).toFixed(1)}%）`);
        riskLevel = 'medium';
      }

      // 4. 位置相似度检测
      const locationResult = await this.checkLocationSuspicious(input);
      if (locationResult.suspicious) {
        details.locationSuspicious = true;
        reasons.push(`位置信息可疑: ${locationResult.reason}`);
        riskLevel = 'high';
      }

      const passed = reasons.length === 0;

      return {
        passed,
        riskLevel,
        reasons,
        blockedImages: blockedImages.length > 0 ? blockedImages : undefined,
        suggestions: this.generateSuggestions(reasons),
        details
      };
    } catch (error) {
      console.error('AI审核失败:', error);
      // 审核失败时允许通过，但记录错误
      return {
        passed: true,
        riskLevel: 'safe',
        reasons: ['审核服务异常，已自动放行'],
        suggestions: ['建议稍后重新提交以确保内容合规']
      };
    }
  }

  /**
   * 文本内容审核
   */
  private async moderateText(title: string, description: string): Promise<{
    passed: boolean;
    violations: string[];
  }> {
    const violations: string[] = [];

    // 检测敏感词
    const sensitivePatterns = [
      { pattern: /微信[：:]?\s*[a-zA-Z0-9_-]+/gi, message: '包含微信号（站外交易）' },
      { pattern: /QQ[：:]?\s*\d{5,12}/gi, message: '包含QQ号（站外交易）' },
      { pattern: /\d{11}/g, message: '包含手机号（站外交易）' },
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, message: '包含邮箱（站外交易）' }
    ];

    const fullText = `${title} ${description}`;
    for (const { pattern, message } of sensitivePatterns) {
      if (pattern.test(fullText)) {
        violations.push(message);
      }
    }

    // 检测辱骂词汇
    const abuseWords = ['傻逼', '草泥马', '滚', '垃圾'];
    for (const word of abuseWords) {
      if (fullText.includes(word)) {
        violations.push(`包含不当词汇: ${word}`);
      }
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * 图片内容审核
   */
  private async moderateImages(images: string[]): Promise<{
    violations: Array<{ index: number; reason: string }>;
  }> {
    const violations: Array<{ index: number; reason: string }> = [];

    // 模拟图片审核（生产环境应调用云端API）
    for (let i = 0; i < images.length; i++) {
      // TODO: 集成图片审核API（如阿里云、腾讯云、百度等）
      // 这里可以进行以下检测：
      // 1. 图片是否包含人脸（如果涉及隐私）
      // 2. 图片是否清晰
      // 3. 图片是否包含不当内容
      // 4. 图片文件大小是否超限

      // Mock 检测：随机标记一些图片违规（仅演示）
      // 生产环境中应该调用真实的AI审核接口
      if (Math.random() < 0.05) { // 5% 概率违规（仅测试用）
        violations.push({
          index: i,
          reason: '图片内容不符合规范'
        });
      }
    }

    return { violations };
  }

  /**
   * 检测重复信息
   */
  private async checkDuplicate(input: ModerationInput): Promise<{
    isDuplicate: boolean;
    similarity: number;
    matchedPetId?: string;
  }> {
    try {
      // 获取用户最近发布的信息
      const recentPets = await this.getRecentPetInfo(input.userId, 7); // 最近7天

      for (const pet of recentPets) {
        // 计算标题相似度
        const titleSim = calculateSimilarity(input.title, pet.title);

        // 计算描述相似度
        const descSim = calculateSimilarity(input.description, pet.description);

        // 计算距离
        if (input.location && pet.latitude && pet.longitude) {
          const distance = calculateDistance(
            input.location.latitude,
            input.location.longitude,
            pet.latitude,
            pet.longitude
          );

          // 综合判断
          const isDuplicate =
            (titleSim > this.TITLE_SIMILARITY_THRESHOLD && descSim > this.DESCRIPTION_SIMILARITY_THRESHOLD) ||
            (titleSim > 0.9 && distance < this.LOCATION_THRESHOLD);

          if (isDuplicate) {
            const similarity = Math.max(titleSim, descSim);
            return {
              isDuplicate: true,
              similarity,
              matchedPetId: pet.id
            };
          }
        }
      }

      return {
        isDuplicate: false,
        similarity: 0
      };
    } catch (error) {
      console.error('重复检测失败:', error);
      return {
        isDuplicate: false,
        similarity: 0
      };
    }
  }

  /**
   * 获取用户最近发布的信息
   */
  private async getRecentPetInfo(userId: string, days: number): Promise<any[]> {
    // TODO: 调用 PetInfoDB.getByUserId 查询数据库
    // 这里应该查询数据库中用户最近几天发布的信息

    /* 示例实现：
    const pets = await PetInfoDB.getByUserId(userId);
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    return pets.filter(pet => pet.createdAt >= cutoffTime);
    */

    // Mock 返回空数组（避免在服务初始化时查询数据库）
    return [];
  }

  /**
   * 检测位置可疑性
   */
  private async checkLocationSuspicious(input: ModerationInput): Promise<{
    suspicious: boolean;
    reason?: string;
  }> {
    if (!input.location) {
      return { suspicious: false };
    }

    // 检查位置是否在合理范围内（如海洋中、国外等）
    const { latitude, longitude } = input.location;

    // 简单的合理性检查（中国境内）
    if (latitude < 18 || latitude > 54 || longitude < 73 || longitude > 135) {
      return {
        suspicious: true,
        reason: '位置超出合理范围'
      };
    }

    // 检查是否在已知的问题区域
    const problematicAreas = [
      // 可以添加已知的问题坐标
    ];

    for (const area of problematicAreas) {
      const distance = calculateDistance(
        latitude,
        longitude,
        area.latitude,
        area.longitude
      );
      if (distance < area.radius) {
        return {
          suspicious: true,
          reason: `位置在问题区域附近`
        };
      }
    }

    return { suspicious: false };
  }

  /**
   * 生成建议
   */
  private generateSuggestions(reasons: string[]): string[] {
    const suggestions: string[] = [];

    for (const reason of reasons) {
      if (reason.includes('站外交易')) {
        suggestions.push('请勿在描述中留下联系方式，宠物信息仅通过平台沟通');
      }
      if (reason.includes('不当词汇')) {
        suggestions.push('请修改不当用词，使用文明用语');
      }
      if (reason.includes('重复')) {
        suggestions.push('请检查是否重复发布，相同位置和时间的信息只能发布一次');
      }
      if (reason.includes('位置信息可疑')) {
        suggestions.push('请确认位置的准确性，确保在真实位置附近');
      }
      if (reason.includes('图片')) {
        suggestions.push('请上传清晰、真实反映宠物状况的照片');
      }
    }

    return suggestions;
  }
}

export const AIModerationService = new AIModerationServiceClass();

// 工具函数：计算文本相似度（编辑距离算法）
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// 计算编辑距离
function getEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// 计算两点距离（米）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // 地球半径（米）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

// 根据违规数量和类型判断风险等级
function violationToRiskLevel(violations: Array<{ index: number; reason: string }>): 'safe' | 'low' | 'medium' | 'high' {
  if (violations.length === 0) return 'safe';
  if (violations.length <= 2) return 'low';
  if (violations.length <= 4) return 'medium';
  return 'high';
}

/**
 * 使用示例：
 *
 * import { AIModerationService } from '@/lib/services/ai-moderation';
 *
 * const result = await AIModerationService.moderate({
 *   images: ['uri1', 'uri2'],
 *   description: '这是一只可爱的小猫',
 *   title: '流浪猫求助',
 *   location: {
 *     latitude: 39.9042,
 *     longitude: 116.4074,
 *     address: '北京市朝阳区'
 *   },
 *   userId: 'user_123'
 * });
 *
 * if (!result.passed) {
 *   Alert.alert('审核未通过', result.reasons.join('\n'));
 *   return;
 * }
 */