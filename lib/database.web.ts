// Web端SQLite适配器 - 模拟数据库操作

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
  isActive: number;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  petInfoId: string;
  content: string;
  createdAt: number;
  isRead: number;
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

// 模拟数据库操作
const mockData: {
  users: User[];
  petInfos: PetInfo[];
  messages: Message[];
  reports: Report[];
  stories: Story[];
  successCases: SuccessCase[];
} = {
  users: [],
  petInfos: [],
  messages: [],
  reports: [],
  stories: [],
  successCases: [],
};

export const UserDB = {
  async getCurrentUser(): Promise<User | null> {
    return null;
  },
  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mockData.users.push(newUser);
    return newUser;
  },
};

export const PetInfoDB = {
  async getByUserId(userId: string): Promise<PetInfo[]> {
    return mockData.petInfos.filter(p => p.userId === userId);
  },
  async create(petInfo: Omit<PetInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<PetInfo> {
    const newPetInfo: PetInfo = {
      ...petInfo,
      id: `pet_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mockData.petInfos.push(newPetInfo);
    return newPetInfo;
  },
  async getList(params: any): Promise<PetInfo[]> {
    return mockData.petInfos;
  },
};

export const MessageDB = {
  async create(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}`,
      createdAt: Date.now(),
    };
    mockData.messages.push(newMessage);
    return newMessage;
  },
  async getConversation(userId1: string, userId2: string, petInfoId: string): Promise<Message[]> {
    return mockData.messages.filter(
      m =>
        ((m.fromUserId === userId1 && m.toUserId === userId2) ||
         (m.fromUserId === userId2 && m.toUserId === userId1)) &&
        m.petInfoId === petInfoId
    );
  },
  async markAsRead(messageId: string): Promise<void> {
    const message = mockData.messages.find(m => m.id === messageId);
    if (message) {
      message.isRead = 1;
    }
  },
};

export const StoryDB = {
  async getList(limit: number, offset: number): Promise<Story[]> {
    return mockData.stories;
  },
};

export const SuccessCaseDB = {
  async getList(limit: number, offset: number): Promise<SuccessCase[]> {
    return mockData.successCases;
  },
};

export const ReportDB = {
  async create(report: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<Report> {
    const newReport: Report = {
      ...report,
      id: `report_${Date.now()}`,
      createdAt: Date.now(),
      status: 'pending',
    };
    mockData.reports.push(newReport);
    return newReport;
  },
};

export const VerificationDB = {
  async create(verification: any): Promise<any> {
    return { id: `verify_${Date.now()}`, ...verification };
  },
};
