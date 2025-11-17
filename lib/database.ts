import * as SQLite from 'expo-sqlite';

export interface User {
  id: string;
  deviceId: string;
  nickname: string;
  avatar?: string;
  phone?: string;
  wechat?: string;
  qq?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PetInfo {
  id: string;
  userId: string;
  type: 'cat' | 'dog' | 'other';
  status: 'needs_rescue' | 'for_adoption' | 'adopted' | 'emergency';
  title: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  address: string;
  contactPhone?: string;
  contactWechat?: string;
  contactQQ?: string;
  createdAt: number;
  updatedAt: number;
  isActive: number; // 0: inactive, 1: active
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  petInfoId: string;
  content: string;
  createdAt: number;
  isRead: number; // 0: unread, 1: read
}

export interface Report {
  id: string;
  reporterId: string;
  petInfoId: string;
  reason: string;
  description: string;
  createdAt: number;
  status: 'pending' | 'resolved' | 'rejected';
}

// 二期功能 - 新增接口
export interface UserBehaviorLog {
  id: string;
  userId: string;
  action: 'view' | 'click' | 'message' | 'favorite' | 'share';
  targetType: 'pet_info' | 'story' | 'case';
  targetId: string;
  createdAt: number;
}

export interface Payment {
  id: string;
  userId: string;
  petInfoId?: string;
  campaignId?: string;
  amount: number;
  type: 'donation' | 'crowdfunding' | 'medical';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CrowdfundingCampaign {
  id: string;
  petInfoId: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  deadline: number;
  createdAt: number;
  updatedAt: number;
}

export interface Donation {
  id: string;
  campaignId: string;
  userId: string;
  amount: number;
  message?: string;
  anonymous: number;
  createdAt: number;
}

export interface Story {
  id: string;
  userId: string;
  title: string;
  content: string;
  images: string[];
  petInfoId?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: number;
  updatedAt: number;
  isActive: number;
}

export interface StoryLike {
  id: string;
  storyId: string;
  userId: string;
  createdAt: number;
}

export interface StoryComment {
  id: string;
  storyId: string;
  userId: string;
  content: string;
  createdAt: number;
}

export interface SuccessCase {
  id: string;
  userId: string;
  petInfoId: string;
  title: string;
  description: string;
  images: string[];
  rescueDate: number;
  adoptionDate?: number;
  story?: string;
  likesCount: number;
  createdAt: number;
  updatedAt: number;
  isActive: number;
}

let db: SQLite.WebSQLDatabase | null = null;
let initializing = false;

// 异步初始化数据库
const initDb = async (): Promise<SQLite.WebSQLDatabase> => {
  if (db) return db;
  if (initializing) {
    // 等待初始化完成
    while (initializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return db!;
  }

  initializing = true;
  try {
    console.log('Opening database...');
    db = await SQLite.openDatabaseAsync('pawlink.db');
    console.log('Database opened successfully');

    // 创建表
    await createTables();
    return db;
  } catch (error) {
    console.error('Failed to open database:', error);
    throw error;
  } finally {
    initializing = false;
  }
};

// 创建所有表
const createTables = async () => {
  const dbInstance = db!;
  console.log('Creating tables...');

  try {
    // 使用 execAsync 执行每个 CREATE TABLE 语句
    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        deviceId TEXT NOT NULL,
        nickname TEXT NOT NULL,
        avatar TEXT,
        phone TEXT,
        wechat TEXT,
        qq TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS pet_infos (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        images TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT NOT NULL,
        contactPhone TEXT,
        contactWechat TEXT,
        contactQQ TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        fromUserId TEXT NOT NULL,
        toUserId TEXT NOT NULL,
        petInfoId TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        isRead INTEGER NOT NULL DEFAULT 0
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporterId TEXT NOT NULL,
        petInfoId TEXT NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        createdAt INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
      );
    `);

    // 二期功能 - 新增表
    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS user_behavior_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        targetType TEXT NOT NULL,
        targetId TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        petInfoId TEXT,
        campaignId TEXT,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        paymentMethod TEXT,
        transactionId TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS crowdfunding_campaigns (
        id TEXT PRIMARY KEY,
        petInfoId TEXT NOT NULL,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        currentAmount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        deadline INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS donations (
        id TEXT PRIMARY KEY,
        campaignId TEXT NOT NULL,
        userId TEXT NOT NULL,
        amount REAL NOT NULL,
        message TEXT,
        anonymous INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        images TEXT NOT NULL,
        petInfoId TEXT,
        likesCount INTEGER NOT NULL DEFAULT 0,
        commentsCount INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS story_likes (
        id TEXT PRIMARY KEY,
        storyId TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        UNIQUE(storyId, userId)
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS story_comments (
        id TEXT PRIMARY KEY,
        storyId TEXT NOT NULL,
        userId TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS success_cases (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        petInfoId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        images TEXT NOT NULL,
        rescueDate INTEGER NOT NULL,
        adoptionDate INTEGER,
        story TEXT,
        likesCount INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1
      );
    `);

    // P0功能 - 身份认证表
    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS user_verifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        idCardName TEXT,
        idCardNumber TEXT,
        idCardFrontImage TEXT,
        idCardBackImage TEXT,
        faceImage TEXT,
        phone TEXT,
        smsCode TEXT,
        volunteerCertificate TEXT,
        volunteerExperience TEXT,
        organizationLicense TEXT,
        legalPersonName TEXT,
        rejectReason TEXT,
        verifiedAt INTEGER,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    // P0功能 - 信用评分表
    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS user_credit_scores (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 100,
        level TEXT NOT NULL DEFAULT 'bronze',
        rescuedCount INTEGER NOT NULL DEFAULT 0,
        successfulAdoptions INTEGER NOT NULL DEFAULT 0,
        volunteerHours INTEGER NOT NULL DEFAULT 0,
        positiveReviews INTEGER NOT NULL DEFAULT 0,
        negativeReviews INTEGER NOT NULL DEFAULT 0,
        reportCount INTEGER NOT NULL DEFAULT 0,
        lastUpdatedAt INTEGER NOT NULL
      );
    `);

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

// 初始化数据库
export const initDatabase = async (): Promise<void> => {
  try {
    await initDb();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// 用户相关操作
export const UserDB = {
  // 根据设备ID获取或创建用户
  getOrCreateUser: async (deviceId: string): Promise<User | null> => {
    try {
      const dbInstance = await initDb();

      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM users WHERE deviceId = ?'
      );

      try {
        const result = await stmt.executeAsync([deviceId]);
        const rows = await result.getAllAsync();

        if (rows.length > 0) {
          return rows[0] as User;
        }
        return null;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // 创建新用户
  createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const dbInstance = await initDb();
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const user: User = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO users (id, deviceId, nickname, avatar, phone, wechat, qq, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        user.id, user.deviceId, user.nickname, user.avatar,
        user.phone, user.wechat, user.qq, user.createdAt, user.updatedAt
      ]);
      console.log('User created successfully');
      return user;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  // 获取用户信息
  getUser: async (userId: string): Promise<User | null> => {
    try {
      const dbInstance = await initDb();

      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM users WHERE id = ?'
      );

      try {
        const result = await stmt.executeAsync([userId]);
        const rows = await result.getAllAsync();

        if (rows.length > 0) {
          return rows[0] as User;
        }
        return null;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
};

// 宠物信息相关操作
export const PetInfoDB = {
  // 创建宠物信息
  create: async (petInfoData: Omit<PetInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<PetInfo> => {
    const dbInstance = await initDb();
    const id = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const petInfo: PetInfo = {
      id,
      ...petInfoData,
      createdAt: now,
      updatedAt: now
    };

    const stmt = await dbInstance.prepareAsync(
      `INSERT INTO pet_infos (
        id, userId, type, status, title, description, images,
        latitude, longitude, address, contactPhone, contactWechat,
        contactQQ, createdAt, updatedAt, isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    try {
      await stmt.executeAsync([
        petInfo.id, petInfo.userId, petInfo.type, petInfo.status,
        petInfo.title, petInfo.description, JSON.stringify(petInfo.images),
        petInfo.latitude, petInfo.longitude, petInfo.address,
        petInfo.contactPhone, petInfo.contactWechat, petInfo.contactQQ,
        petInfo.createdAt, petInfo.updatedAt, petInfo.isActive
      ]);
      console.log('Pet info created successfully');
      return petInfo;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  // 获取宠物信息列表（带过滤）
  getList: async (filters: {
    type?: string;
    status?: string;
    latitude?: number;
    longitude?: number;
    maxDistance?: number; // km
    days?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<PetInfo[]> => {
    try {
      const dbInstance = await initDb();
      const {
        type,
        status,
        days = 30,
        limit = 50,
        offset = 0
      } = filters;

      let query = `
        SELECT *
        FROM pet_infos
        WHERE isActive = 1
      `;

      const params: any[] = [];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (days) {
        query += ' AND createdAt >= ?';
        params.push(Date.now() - days * 24 * 60 * 60 * 1000);
      }

      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const stmt = await dbInstance.prepareAsync(query);

      try {
        const result = await stmt.executeAsync(params);
        const rows = await result.getAllAsync();

        const results: PetInfo[] = [];
        for (const row of rows) {
          results.push({
            ...row,
            images: JSON.parse(row.images || '[]')
          } as PetInfo);
        }

        // 如果有位置信息，在前端过滤距离
        if (filters.latitude && filters.longitude && filters.maxDistance) {
          const filtered = results.filter(petInfo => {
            const distance = calculateDistance(
              filters.latitude!,
              filters.longitude!,
              petInfo.latitude,
              petInfo.longitude
            );
            return distance <= filters.maxDistance!;
          });
          return filtered;
        }

        return results;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting pet infos:', error);
      return [];
    }
  },

  // 根据用户ID获取宠物信息
  getByUserId: async (userId: string): Promise<PetInfo[]> => {
    try {
      const dbInstance = await initDb();

      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM pet_infos WHERE userId = ? ORDER BY createdAt DESC'
      );

      try {
        const result = await stmt.executeAsync([userId]);
        const rows = await result.getAllAsync();

        const results: PetInfo[] = [];
        for (const row of rows) {
          results.push({
            ...row,
            images: JSON.parse(row.images || '[]')
          } as PetInfo);
        }
        return results;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting pet infos by user:', error);
      return [];
    }
  },

  // 根据ID获取单条宠物信息
  getById: async (id: string): Promise<PetInfo | null> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM pet_infos WHERE id = ? LIMIT 1'
      );
      try {
        const result = await stmt.executeAsync([id]);
        const row = await result.getFirstAsync();
        if (!row) return null;
        return {
          ...row,
          images: JSON.parse(row.images || '[]')
        } as PetInfo;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting pet info by id:', error);
      return null;
    }
  }
};

// 计算两点间距离（公里）
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

// 消息相关操作
export const MessageDB = {
  create: async (messageData: Omit<Message, 'id' | 'createdAt' | 'isRead'>): Promise<Message> => {
    const dbInstance = await initDb();
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const message: Message = {
      id,
      ...messageData,
      createdAt: now,
      isRead: 0
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO messages (id, fromUserId, toUserId, petInfoId, content, createdAt, isRead) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        message.id, message.fromUserId, message.toUserId,
        message.petInfoId, message.content, message.createdAt, message.isRead
      ]);
      console.log('Message created successfully');
      return message;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  getConversation: async (userId1: string, userId2: string, petInfoId: string): Promise<Message[]> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM messages WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?) AND petInfoId = ? ORDER BY createdAt ASC'
      );
      try {
        const result = await stmt.executeAsync([userId1, userId2, userId2, userId1, petInfoId]);
        return await result.getAllAsync() as Message[];
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
      return [];
    }
  },

  getConversationsList: async (userId: string) => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM messages WHERE fromUserId = ? OR toUserId = ? ORDER BY createdAt DESC'
      );
      try {
        const result = await stmt.executeAsync([userId, userId]);
        const rows = await result.getAllAsync();

        // 在前端处理去重
        const conversations: any[] = [];
        for (const row of rows) {
          const otherUserId = row.fromUserId === userId ? row.toUserId : row.fromUserId;
          const key = `${otherUserId}_${row.petInfoId}`;
          if (!conversations.find((c: any) => c.key === key)) {
            conversations.push({
              ...row,
              userId: otherUserId,
              key
            });
          }
        }
        return conversations;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting conversations list:', error);
      return [];
    }
  },

  markAsRead: async (messageId: string): Promise<void> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync('UPDATE messages SET isRead = 1 WHERE id = ?');
      try {
        await stmt.executeAsync([messageId]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }
};

// 举报相关操作
export const ReportDB = {
  create: async (reportData: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<Report> => {
    const dbInstance = await initDb();
    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const report: Report = {
      id,
      ...reportData,
      createdAt: now,
      status: 'pending'
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO reports (id, reporterId, petInfoId, reason, description, createdAt, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        report.id, report.reporterId, report.petInfoId,
        report.reason, report.description, report.createdAt, report.status
      ]);
      console.log('Report created successfully');
      return report;
    } finally {
      await stmt.finalizeAsync();
    }
  }
};

// 二期功能 - 用户行为日志操作
export const UserBehaviorDB = {
  log: async (behaviorData: Omit<UserBehaviorLog, 'id' | 'createdAt'>): Promise<UserBehaviorLog> => {
    const dbInstance = await initDb();
    const id = `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const behavior: UserBehaviorLog = {
      id,
      ...behaviorData,
      createdAt: now
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO user_behavior_logs (id, userId, action, targetType, targetId, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        behavior.id, behavior.userId, behavior.action,
        behavior.targetType, behavior.targetId, behavior.createdAt
      ]);
      console.log('User behavior logged successfully');
      return behavior;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  getUserBehaviors: async (userId: string, days: number = 30): Promise<UserBehaviorLog[]> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM user_behavior_logs WHERE userId = ? AND createdAt >= ? ORDER BY createdAt DESC'
      );
      try {
        const result = await stmt.executeAsync([userId, Date.now() - days * 24 * 60 * 60 * 1000]);
        return await result.getAllAsync() as UserBehaviorLog[];
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting user behaviors:', error);
      return [];
    }
  }
};

// 二期功能 - 支付记录操作
export const PaymentDB = {
  create: async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
    const dbInstance = await initDb();
    const id = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const payment: Payment = {
      id,
      ...paymentData,
      createdAt: now,
      updatedAt: now
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO payments (id, userId, petInfoId, campaignId, amount, type, status, paymentMethod, transactionId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        payment.id, payment.userId, payment.petInfoId, payment.campaignId,
        payment.amount, payment.type, payment.status, payment.paymentMethod,
        payment.transactionId, payment.createdAt, payment.updatedAt
      ]);
      console.log('Payment created successfully');
      return payment;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  updateStatus: async (paymentId: string, status: Payment['status'], transactionId?: string): Promise<void> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'UPDATE payments SET status = ?, transactionId = ?, updatedAt = ? WHERE id = ?'
      );
      try {
        await stmt.executeAsync([status, transactionId, Date.now(), paymentId]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  },

  getUserPayments: async (userId: string): Promise<Payment[]> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM payments WHERE userId = ? ORDER BY createdAt DESC'
      );
      try {
        const result = await stmt.executeAsync([userId]);
        return await result.getAllAsync() as Payment[];
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting user payments:', error);
      return [];
    }
  }
};

// 二期功能 - 众筹活动操作
export const CrowdfundingDB = {
  create: async (campaignData: Omit<CrowdfundingCampaign, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount'>): Promise<CrowdfundingCampaign> => {
    const dbInstance = await initDb();
    const id = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const campaign: CrowdfundingCampaign = {
      id,
      ...campaignData,
      currentAmount: 0,
      createdAt: now,
      updatedAt: now
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO crowdfunding_campaigns (id, petInfoId, userId, title, description, targetAmount, currentAmount, status, deadline, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        campaign.id, campaign.petInfoId, campaign.userId, campaign.title,
        campaign.description, campaign.targetAmount, campaign.currentAmount,
        campaign.status, campaign.deadline, campaign.createdAt, campaign.updatedAt
      ]);
      console.log('Crowdfunding campaign created successfully');
      return campaign;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  getList: async (status?: string): Promise<CrowdfundingCampaign[]> => {
    try {
      const dbInstance = await initDb();
      let query = 'SELECT * FROM crowdfunding_campaigns WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY createdAt DESC';

      const stmt = await dbInstance.prepareAsync(query);
      try {
        const result = await stmt.executeAsync(params);
        return await result.getAllAsync() as CrowdfundingCampaign[];
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting crowdfunding campaigns:', error);
      return [];
    }
  },

  updateAmount: async (campaignId: string, amount: number): Promise<void> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'UPDATE crowdfunding_campaigns SET currentAmount = currentAmount + ?, updatedAt = ? WHERE id = ?'
      );
      try {
        await stmt.executeAsync([amount, Date.now(), campaignId]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error updating campaign amount:', error);
    }
  }
};

// 二期功能 - 捐赠记录操作
export const DonationDB = {
  create: async (donationData: Omit<Donation, 'id' | 'createdAt'>): Promise<Donation> => {
    const dbInstance = await initDb();
    const id = `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const donation: Donation = {
      id,
      ...donationData,
      createdAt: now
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO donations (id, campaignId, userId, amount, message, anonymous, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        donation.id, donation.campaignId, donation.userId,
        donation.amount, donation.message, donation.anonymous, donation.createdAt
      ]);
      console.log('Donation created successfully');

      // 更新众筹金额
      await CrowdfundingDB.updateAmount(donation.campaignId, donation.amount);

      return donation;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  getByCampaignId: async (campaignId: string): Promise<Donation[]> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM donations WHERE campaignId = ? ORDER BY createdAt DESC'
      );
      try {
        const result = await stmt.executeAsync([campaignId]);
        return await result.getAllAsync() as Donation[];
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting donations:', error);
      return [];
    }
  }
};

// 二期功能 - 救助故事操作
export const StoryDB = {
  create: async (storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>): Promise<Story> => {
    const dbInstance = await initDb();
    const id = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const story: Story = {
      id,
      ...storyData,
      likesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO stories (id, userId, title, content, images, petInfoId, likesCount, commentsCount, createdAt, updatedAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        story.id, story.userId, story.title, story.content,
        JSON.stringify(story.images), story.petInfoId, story.likesCount,
        story.commentsCount, story.createdAt, story.updatedAt, story.isActive
      ]);
      console.log('Story created successfully');
      return story;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  getList: async (limit: number = 50, offset: number = 0): Promise<Story[]> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM stories WHERE isActive = 1 ORDER BY createdAt DESC LIMIT ? OFFSET ?'
      );
      try {
        const result = await stmt.executeAsync([limit, offset]);
        const rows = await result.getAllAsync();

        const results: Story[] = [];
        for (const row of rows) {
          results.push({
            ...row,
            images: JSON.parse(row.images || '[]')
          } as Story);
        }
        return results;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting stories:', error);
      return [];
    }
  },

  updateLikeCount: async (storyId: string, increment: number = 1): Promise<void> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'UPDATE stories SET likesCount = likesCount + ?, updatedAt = ? WHERE id = ?'
      );
      try {
        await stmt.executeAsync([increment, Date.now(), storyId]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error updating story like count:', error);
    }
  },

  updateCommentCount: async (storyId: string, increment: number = 1): Promise<void> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'UPDATE stories SET commentsCount = commentsCount + ?, updatedAt = ? WHERE id = ?'
      );
      try {
        await stmt.executeAsync([increment, Date.now(), storyId]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error updating story comment count:', error);
    }
  }
};

// 二期功能 - 故事点赞操作
export const StoryLikeDB = {
  toggle: async (storyId: string, userId: string): Promise<{ liked: boolean; action: 'like' | 'unlike' }> => {
    try {
      const dbInstance = await initDb();

      // 检查是否已点赞
      const checkStmt = await dbInstance.prepareAsync(
        'SELECT * FROM story_likes WHERE storyId = ? AND userId = ?'
      );
      try {
        const checkResult = await checkStmt.executeAsync([storyId, userId]);
        const existing = await checkResult.getAllAsync();

        if (existing.length > 0) {
          // 取消点赞
          const deleteStmt = await dbInstance.prepareAsync(
            'DELETE FROM story_likes WHERE storyId = ? AND userId = ?'
          );
          try {
            await deleteStmt.executeAsync([storyId, userId]);
          } finally {
            await deleteStmt.finalizeAsync();
          }

          await StoryDB.updateLikeCount(storyId, -1);
          return { liked: false, action: 'unlike' };
        } else {
          // 点赞
          const id = `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const now = Date.now();

          const insertStmt = await dbInstance.prepareAsync(
            'INSERT INTO story_likes (id, storyId, userId, createdAt) VALUES (?, ?, ?, ?)'
          );
          try {
            await insertStmt.executeAsync([id, storyId, userId, now]);
          } finally {
            await insertStmt.finalizeAsync();
          }

          await StoryDB.updateLikeCount(storyId, 1);
          return { liked: true, action: 'like' };
        }
      } finally {
        await checkStmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error toggling story like:', error);
      return { liked: false, action: 'unlike' };
    }
  },

  isLiked: async (storyId: string, userId: string): Promise<boolean> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM story_likes WHERE storyId = ? AND userId = ?'
      );
      try {
        const result = await stmt.executeAsync([storyId, userId]);
        const rows = await result.getAllAsync();
        return rows.length > 0;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error checking if story is liked:', error);
      return false;
    }
  }
};

// 二期功能 - 故事评论操作
export const StoryCommentDB = {
  create: async (commentData: Omit<StoryComment, 'id' | 'createdAt'>): Promise<StoryComment> => {
    const dbInstance = await initDb();
    const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const comment: StoryComment = {
      id,
      ...commentData,
      createdAt: now
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO story_comments (id, storyId, userId, content, createdAt) VALUES (?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        comment.id, comment.storyId, comment.userId, comment.content, comment.createdAt
      ]);
      console.log('Story comment created successfully');

      // 更新评论数
      await StoryDB.updateCommentCount(comment.storyId, 1);

      return comment;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  getByStoryId: async (storyId: string): Promise<StoryComment[]> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM story_comments WHERE storyId = ? ORDER BY createdAt ASC'
      );
      try {
        const result = await stmt.executeAsync([storyId]);
        return await result.getAllAsync() as StoryComment[];
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting story comments:', error);
      return [];
    }
  }
};

// 二期功能 - 成功案例操作
export const SuccessCaseDB = {
  create: async (caseData: Omit<SuccessCase, 'id' | 'createdAt' | 'updatedAt' | 'likesCount'>): Promise<SuccessCase> => {
    const dbInstance = await initDb();
    const id = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const successCase: SuccessCase = {
      id,
      ...caseData,
      likesCount: 0,
      createdAt: now,
      updatedAt: now
    };

    const stmt = await dbInstance.prepareAsync(
      'INSERT INTO success_cases (id, userId, petInfoId, title, description, images, rescueDate, adoptionDate, story, likesCount, createdAt, updatedAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    try {
      await stmt.executeAsync([
        successCase.id, successCase.userId, successCase.petInfoId,
        successCase.title, successCase.description, JSON.stringify(successCase.images),
        successCase.rescueDate, successCase.adoptionDate, successCase.story,
        successCase.likesCount, successCase.createdAt, successCase.updatedAt, successCase.isActive
      ]);
      console.log('Success case created successfully');
      return successCase;
    } finally {
      await stmt.finalizeAsync();
    }
  },

  getList: async (limit: number = 50, offset: number = 0): Promise<SuccessCase[]> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'SELECT * FROM success_cases WHERE isActive = 1 ORDER BY createdAt DESC LIMIT ? OFFSET ?'
      );
      try {
        const result = await stmt.executeAsync([limit, offset]);
        const rows = await result.getAllAsync();

        const results: SuccessCase[] = [];
        for (const row of rows) {
          results.push({
            ...row,
            images: JSON.parse(row.images || '[]')
          } as SuccessCase);
        }
        return results;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting success cases:', error);
      return [];
    }
  },

  updateLikeCount: async (caseId: string, increment: number = 1): Promise<void> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(
        'UPDATE success_cases SET likesCount = likesCount + ?, updatedAt = ? WHERE id = ?'
      );
      try {
        await stmt.executeAsync([increment, Date.now(), caseId]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error updating success case like count:', error);
    }
  }
};

// 身份认证相关操作
export const VerificationDB = {
  // 提交认证
  submitVerification: async (userId: string, data: any): Promise<string> => {
    const id = `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(`
        INSERT INTO user_verifications (
          id, userId, type, status, idCardName, idCardNumber, idCardFrontImage,
          idCardBackImage, faceImage, phone, volunteerCertificate, volunteerExperience,
          organizationLicense, legalPersonName, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      try {
        await stmt.executeAsync([
          id,
          userId,
          data.type || 'identity',
          data.status || 'pending',
          data.idCardName || null,
          data.idCardNumber || null,
          data.idCardFrontImage || null,
          data.idCardBackImage || null,
          data.faceImage || null,
          data.phone || null,
          data.volunteerCertificate || null,
          data.volunteerExperience || null,
          data.organizationLicense || null,
          data.legalPersonName || null,
          now,
          now
        ]);
        return id;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      throw error;
    }
  },

  // 获取用户认证状态
  getVerificationStatus: async (userId: string): Promise<any> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(`
        SELECT * FROM user_verifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 1
      `);
      try {
        const result = await stmt.executeAsync([userId]);
        const rows = await result.getAllAsync();
        return rows[0] || null;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting verification status:', error);
      return null;
    }
  },

  // 更新认证状态
  updateVerificationStatus: async (id: string, status: string, rejectReason?: string): Promise<void> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(`
        UPDATE user_verifications SET status = ?, rejectReason = ?, verifiedAt = ?, updatedAt = ? WHERE id = ?
      `);
      try {
        await stmt.executeAsync([status, rejectReason || null, status === 'verified' ? Date.now() : null, Date.now(), id]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw error;
    }
  }
};

// 信用评分相关操作
export const CreditScoreDB = {
  // 获取用户信用分
  getCreditScore: async (userId: string): Promise<any> => {
    try {
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(`
        SELECT * FROM user_credit_scores WHERE userId = ?
      `);
      try {
        const result = await stmt.executeAsync([userId]);
        const rows = await result.getAllAsync();
        return rows[0] || null;
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error getting credit score:', error);
      return null;
    }
  },

  // 创建或初始化信用分
  initializeCreditScore: async (userId: string): Promise<void> => {
    try {
      const existing = await CreditScoreDB.getCreditScore(userId);
      if (existing) return;

      const id = `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(`
        INSERT INTO user_credit_scores (id, userId, lastUpdatedAt) VALUES (?, ?, ?)
      `);
      try {
        await stmt.executeAsync([id, userId, Date.now()]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error initializing credit score:', error);
      throw error;
    }
  },

  // 更新信用分
  updateCreditScore: async (
    userId: string,
    updates: {
      rescuedCount?: number;
      successfulAdoptions?: number;
      volunteerHours?: number;
      positiveReviews?: number;
      negativeReviews?: number;
      reportCount?: number;
    }
  ): Promise<void> => {
    try {
      const current = await CreditScoreDB.getCreditScore(userId);
      if (!current) {
        await CreditScoreDB.initializeCreditScore(userId);
      }

      const newRescuedCount = updates.rescuedCount !== undefined ? updates.rescuedCount : current?.rescuedCount || 0;
      const newAdoptions = updates.successfulAdoptions !== undefined ? updates.successfulAdoptions : current?.successfulAdoptions || 0;
      const newVolunteerHours = updates.volunteerHours !== undefined ? updates.volunteerHours : current?.volunteerHours || 0;
      const newPositiveReviews = updates.positiveReviews !== undefined ? updates.positiveReviews : current?.positiveReviews || 0;
      const newNegativeReviews = updates.negativeReviews !== undefined ? updates.negativeReviews : current?.negativeReviews || 0;
      const newReportCount = updates.reportCount !== undefined ? updates.reportCount : current?.reportCount || 0;

      // 计算信用分 (基础100分 + 各种加分减分)
      let score = 100;
      score += Math.min(newRescuedCount * 2, 20); // 最多加20分
      score += Math.min(newAdoptions * 3, 30); // 最多加30分
      score += Math.min(newVolunteerHours * 0.5, 25); // 最多加25分
      score += Math.min(newPositiveReviews * 1, 15); // 最多加15分
      score -= newNegativeReviews * 3; // 每次减3分
      score -= newReportCount * 5; // 每次减5分
      score = Math.max(0, Math.min(200, score)); // 限制在0-200分

      // 确定等级
      let level = 'bronze';
      if (score >= 150) level = 'platinum';
      else if (score >= 120) level = 'gold';
      else if (score >= 100) level = 'silver';
      else if (score >= 80) level = 'bronze';
      else level = 'warning';

      const dbInstance = await initDb();
      const stmt = await dbInstance.prepareAsync(`
        UPDATE user_credit_scores SET
          score = ?, level = ?, rescuedCount = ?, successfulAdoptions = ?,
          volunteerHours = ?, positiveReviews = ?, negativeReviews = ?,
          reportCount = ?, lastUpdatedAt = ?
        WHERE userId = ?
      `);
      try {
        await stmt.executeAsync([
          score,
          level,
          newRescuedCount,
          newAdoptions,
          newVolunteerHours,
          newPositiveReviews,
          newNegativeReviews,
          newReportCount,
          Date.now(),
          userId
        ]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      console.error('Error updating credit score:', error);
      throw error;
    }
  }
};

export default {
  initDatabase,
  UserDB,
  PetInfoDB,
  MessageDB,
  ReportDB,
  UserBehaviorDB,
  PaymentDB,
  CrowdfundingDB,
  DonationDB,
  StoryDB,
  StoryLikeDB,
  StoryCommentDB,
  SuccessCaseDB,
  VerificationDB,
  CreditScoreDB
};
