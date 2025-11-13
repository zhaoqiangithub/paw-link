import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDatabase, UserDB, type User } from '@/lib/database';
import { getDeviceId } from '@/lib/device';

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  isDatabaseReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  const refreshUser = async () => {
    try {
      const deviceId = await getDeviceId();
      let existingUser = await UserDB.getOrCreateUser(deviceId);

      if (!existingUser) {
        // 创建新用户
        const nickname = `用户${deviceId.substring(0, 8)}`;
        existingUser = await UserDB.createUser({
          deviceId,
          nickname,
          avatar: undefined,
          phone: undefined,
          wechat: undefined,
          qq: undefined
        });
        console.log('Created new user:', existingUser);
      } else {
        console.log('Using existing user:', existingUser);
      }

      setUser(existingUser);
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing database...');
        await initDatabase();
        console.log('Database initialized successfully');

        console.log('Initializing user...');
        await refreshUser();

        setIsDatabaseReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      isLoading,
      setUser,
      refreshUser,
      isDatabaseReady
    }}>
      {children}
    </AppContext.Provider>
  );
};
