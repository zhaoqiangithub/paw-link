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

export default {
  initDatabase,
  UserDB,
  PetInfoDB,
  MessageDB,
  ReportDB
};
