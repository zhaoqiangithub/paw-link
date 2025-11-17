/**
 * 内容审核服务
 *
 * BUG-007 修复: 敏感词过滤
 */

// 敏感词库（示例，生产环境应使用更完整的词库）
const SENSITIVE_WORDS = [
  // 辱骂性词汇
  '傻逼', '草泥马', '妈的', '操', '艹',
  // 政治敏感
  // ... (根据实际需求添加)
  // 涉黄涉暴
  // ...
  // 其他
  '骗子', '诈骗',
];

// 替换字符
const REPLACE_CHAR = '*';

export interface ContentModerationResult {
  passed: boolean; // 是否通过审核
  filteredText: string; // 过滤后的文本
  hasSensitiveWords: boolean; // 是否包含敏感词
  sensitiveWords: string[]; // 检测到的敏感词列表
  riskLevel: 'safe' | 'low' | 'medium' | 'high'; // 风险等级
}

class ContentModerationServiceClass {
  private sensitiveWords: Set<string>;
  private useCloudAPI: boolean = false;

  constructor() {
    this.sensitiveWords = new Set(SENSITIVE_WORDS);
  }

  /**
   * 配置审核服务
   */
  configure(config: {
    useCloudAPI?: boolean;
    apiKey?: string;
    customWords?: string[];
  }) {
    this.useCloudAPI = config.useCloudAPI || false;

    if (config.customWords) {
      config.customWords.forEach(word => this.sensitiveWords.add(word));
    }
  }

  /**
   * 审核文本内容
   */
  async moderateText(text: string): Promise<ContentModerationResult> {
    if (this.useCloudAPI) {
      // TODO: 调用云端内容审核 API（阿里云、腾讯云、百度等）
      return this.moderateWithCloudAPI(text);
    }

    return this.moderateLocally(text);
  }

  /**
   * 本地敏感词过滤
   */
  private moderateLocally(text: string): ContentModerationResult {
    if (!text || text.trim().length === 0) {
      return {
        passed: true,
        filteredText: text,
        hasSensitiveWords: false,
        sensitiveWords: [],
        riskLevel: 'safe',
      };
    }

    const detectedWords: string[] = [];
    let filteredText = text;

    // 检测敏感词
    this.sensitiveWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      if (regex.test(filteredText)) {
        detectedWords.push(word);
        filteredText = filteredText.replace(regex, REPLACE_CHAR.repeat(word.length));
      }
    });

    // 计算风险等级
    const riskLevel = this.calculateRiskLevel(detectedWords.length, text.length);

    return {
      passed: detectedWords.length === 0,
      filteredText,
      hasSensitiveWords: detectedWords.length > 0,
      sensitiveWords: detectedWords,
      riskLevel,
    };
  }

  /**
   * 云端内容审核（示例框架）
   */
  private async moderateWithCloudAPI(text: string): Promise<ContentModerationResult> {
    // TODO: 集成第三方内容审核 API
    // 例如：阿里云内容安全、腾讯云天御、百度内容审核

    /*
    const response = await fetch('CLOUD_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        scenes: ['antispam'], // 反垃圾
        tasks: [{
          dataId: Date.now().toString(),
          content: text
        }]
      })
    });

    const result = await response.json();

    // 解析云端返回结果
    const suggestion = result.data[0].results[0].suggestion; // pass/review/block
    const label = result.data[0].results[0].label; // 命中的标签

    return {
      passed: suggestion === 'pass',
      filteredText: text, // 云端API通常不返回过滤后文本
      hasSensitiveWords: suggestion !== 'pass',
      sensitiveWords: label ? [label] : [],
      riskLevel: suggestion === 'block' ? 'high' : suggestion === 'review' ? 'medium' : 'safe'
    };
    */

    // 当前返回本地审核结果
    return this.moderateLocally(text);
  }

  /**
   * 计算风险等级
   */
  private calculateRiskLevel(
    sensitiveCount: number,
    textLength: number
  ): 'safe' | 'low' | 'medium' | 'high' {
    if (sensitiveCount === 0) return 'safe';
    if (sensitiveCount === 1) return 'low';
    if (sensitiveCount <= 3 || sensitiveCount / textLength < 0.1) return 'medium';
    return 'high';
  }

  /**
   * 添加自定义敏感词
   */
  addSensitiveWords(words: string[]) {
    words.forEach(word => this.sensitiveWords.add(word));
  }

  /**
   * 移除敏感词
   */
  removeSensitiveWords(words: string[]) {
    words.forEach(word => this.sensitiveWords.delete(word));
  }

  /**
   * 检查是否包含联系方式（防止站外交易）
   */
  checkForContactInfo(text: string): {
    hasPhone: boolean;
    hasQQ: boolean;
    hasWechat: boolean;
    hasEmail: boolean;
  } {
    return {
      hasPhone: /\d{11}|1[3-9]\d{9}/.test(text),
      hasQQ: /[Qq]{2}[:：]?\s*\d{5,}/.test(text),
      hasWechat: /[Ww]([Xx]|[Ee][Cc][Hh][Aa][Tt])[:：]?\s*[a-zA-Z0-9_-]+/.test(text),
      hasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text),
    };
  }
}

export const ContentModerationService = new ContentModerationServiceClass();

/**
 * 使用示例：
 *
 * // 配置（可选）
 * ContentModerationService.configure({
 *   useCloudAPI: true,
 *   apiKey: 'YOUR_API_KEY',
 *   customWords: ['违禁词1', '违禁词2']
 * });
 *
 * // 审核文本
 * const result = await ContentModerationService.moderateText('这是一段需要审核的文本');
 *
 * if (!result.passed) {
 *   console.log('包含敏感词:', result.sensitiveWords);
 *   console.log('过滤后文本:', result.filteredText);
 * }
 *
 * // 检查联系方式
 * const contactCheck = ContentModerationService.checkForContactInfo('我的微信是abc123');
 * if (contactCheck.hasWechat) {
 *   console.log('文本包含微信号');
 * }
 */
