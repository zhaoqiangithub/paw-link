/**
 * 消息防骚扰服务
 *
 * BUG-008 修复: 实现消息防骚扰机制
 *
 * 功能包括：
 * 1. 频率限制 - 同一用户向同一对象 1 分钟内最多 10 条消息
 * 2. 拉黑功能 - 用户可拉黑其他用户
 * 3. 免打扰功能 - 用户可设置免打扰
 */

import { BlacklistDB, MuteSettingsDB } from '@/lib/database';

export interface RateLimitResult {
  allowed: boolean;
  remainingTime: number; // 剩余等待时间（秒）
  message?: string;
}

export interface BlacklistEntry {
  id: string;
  userId: string; // 当前用户ID
  blockedUserId: string; // 被拉黑的用户ID
  reason?: string; // 拉黑原因
  createdAt: number;
}

export interface MuteSettings {
  id: string;
  userId: string;
  mutedUserId?: string; // 特定用户（可选）
  muteAllMessages: boolean; // 全部免打扰
  muteAllNotifications: boolean; // 全部推送免打扰
  startTime?: number; // 免打扰开始时间
  endTime?: number; // 免打扰结束时间
  createdAt: number;
  updatedAt: number;
}

class AntiSpamServiceClass {
  // 内存中存储消息频率限制（生产环境应使用Redis）
  private messageCounts = new Map<string, { count: number; timestamp: number }>();

  // 消息频率限制配置（毫秒）
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 分钟
  private readonly RATE_LIMIT_MAX_MESSAGES = 10; // 最多 10 条消息

  /**
   * 检查消息频率限制
   * @param fromUserId 发送者ID
   * @param toUserId 接收者ID
   * @returns 限制结果
   */
  checkRateLimit(fromUserId: string, toUserId: string): RateLimitResult {
    const key = `${fromUserId}_${toUserId}`;
    const now = Date.now();
    const record = this.messageCounts.get(key);

    if (!record) {
      // 首次发送消息
      this.messageCounts.set(key, { count: 1, timestamp: now });
      return {
        allowed: true,
        remainingTime: 0
      };
    }

    // 检查时间窗口
    if (now - record.timestamp > this.RATE_LIMIT_WINDOW) {
      // 时间窗口已过，重置计数
      this.messageCounts.set(key, { count: 1, timestamp: now });
      return {
        allowed: true,
        remainingTime: 0
      };
    }

    // 检查消息数量
    if (record.count >= this.RATE_LIMIT_MAX_MESSAGES) {
      const remainingTime = Math.ceil(
        (this.RATE_LIMIT_WINDOW - (now - record.timestamp)) / 1000
      );
      return {
        allowed: false,
        remainingTime,
        message: `发送消息太频繁，请等待 ${remainingTime} 秒后再试`
      };
    }

    // 增加计数
    record.count++;
    this.messageCounts.set(key, record);

    return {
      allowed: true,
      remainingTime: 0
    };
  }

  /**
   * 检查是否被拉黑
   * @param fromUserId 发送者ID
   * @param toUserId 接收者ID
   * @returns 是否被拉黑
   */
  async isBlocked(fromUserId: string, toUserId: string): Promise<boolean> {
    return await BlacklistDB.isBlocked(toUserId, fromUserId);
  }

  /**
   * 检查是否免打扰
   * @param fromUserId 发送者ID
   * @param toUserId 接收者ID
   * @returns 是否免打扰
   */
  async isMuted(fromUserId: string, toUserId: string): Promise<boolean> {
    return await MuteSettingsDB.isMuted(toUserId, fromUserId);
  }

  /**
   * 拉黑用户
   * @param userId 当前用户ID
   * @param blockedUserId 被拉黑的用户ID
   * @param reason 拉黑原因（可选）
   */
  async blockUser(userId: string, blockedUserId: string, reason?: string): Promise<void> {
    await BlacklistDB.add(userId, blockedUserId, reason);
  }

  /**
   * 取消拉黑
   * @param userId 当前用户ID
   * @param blockedUserId 被拉黑的用户ID
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    await BlacklistDB.remove(userId, blockedUserId);
  }

  /**
   * 获取黑名单列表
   * @param userId 当前用户ID
   * @returns 黑名单列表
   */
  async getBlacklist(userId: string): Promise<BlacklistEntry[]> {
    return await BlacklistDB.getList(userId);
  }

  /**
   * 设置免打扰
   * @param userId 当前用户ID
   * @param settings 免打扰设置
   */
  async setMuteSettings(userId: string, settings: {
    mutedUserId?: string;
    muteAllMessages?: boolean;
    muteAllNotifications?: boolean;
    startTime?: number;
    endTime?: number;
  }): Promise<string> {
    return await MuteSettingsDB.create(userId, settings);
  }

  /**
   * 移除免打扰设置
   * @param userId 当前用户ID
   * @param muteId 免打扰设置ID
   */
  async removeMuteSettings(userId: string, muteId: string): Promise<void> {
    await MuteSettingsDB.remove(muteId, userId);
  }

  /**
   * 获取免打扰设置列表
   * @param userId 当前用户ID
   * @returns 免打扰设置列表
   */
  async getMuteSettings(userId: string): Promise<MuteSettings[]> {
    const settings = await MuteSettingsDB.getList(userId);
    return settings.map(s => ({
      ...s,
      muteAllMessages: Boolean(s.muteAllMessages),
      muteAllNotifications: Boolean(s.muteAllNotifications)
    }));
  }

  /**
   * 清理过期的频率限制记录
   */
  cleanExpiredRecords(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.messageCounts.forEach((record, key) => {
      if (now - record.timestamp > this.RATE_LIMIT_WINDOW) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.messageCounts.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log('[AntiSpam] 清理过期记录:', expiredKeys.length);
    }
  }
}

export const AntiSpamService = new AntiSpamServiceClass();

// 定期清理过期记录（每5分钟）
setInterval(() => {
  AntiSpamService.cleanExpiredRecords();
}, 5 * 60 * 1000);

/**
 * 使用示例：
 *
 * // 发送消息前检查
 * const rateLimit = AntiSpamService.checkRateLimit(fromUserId, toUserId);
 * if (!rateLimit.allowed) {
 *   Alert.alert('提示', rateLimit.message);
 *   return;
 * }
 *
 * const isBlocked = await AntiSpamService.isBlocked(fromUserId, toUserId);
 * if (isBlocked) {
 *   Alert.alert('提示', '您已被对方拉黑，无法发送消息');
 *   return;
 * }
 *
 * const isMuted = await AntiSpamService.isMuted(fromUserId, toUserId);
 * if (isMuted) {
 *   // 消息仍可发送，但可能不推送通知
 *   console.log('接收方已开启免打扰');
 * }
 *
 * // 拉黑用户
 * await AntiSpamService.blockUser(currentUserId, targetUserId, '垃圾消息');
 *
 * // 设置免打扰
 * await AntiSpamService.setMuteSettings(currentUserId, {
 *   muteAllMessages: true,
 *   startTime: Date.now(),
 *   endTime: Date.now() + 24 * 60 * 60 * 1000
 * });
 */