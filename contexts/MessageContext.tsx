import React, { createContext, useContext, useState, useEffect } from 'react';
import { MessageDB, Message, PetInfo } from '@/lib/database';
import { useApp } from './AppContext';

interface MessageContextType {
  conversations: Array<{
    userId: string;
    petInfoId: string;
    lastMessage: Message;
    unreadCount: number;
  }>;
  loading: boolean;
  sendMessage: (toUserId: string, petInfoId: string, content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: React.ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { user } = useApp();
  const [conversations, setConversations] = useState<MessageContextType['conversations']>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await MessageDB.getConversationsList(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    toUserId: string,
    petInfoId: string,
    content: string
  ): Promise<void> => {
    if (!user) return;

    try {
      await MessageDB.create({
        fromUserId: user.id,
        toUserId,
        petInfoId,
        content: content.trim()
      });

      // 刷新对话列表
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const markAsRead = async (messageId: string): Promise<void> => {
    try {
      await MessageDB.markAsRead(messageId);
      await loadConversations();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const refreshConversations = async () => {
    await loadConversations();
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  return (
    <MessageContext.Provider value={{
      conversations,
      loading,
      sendMessage,
      markAsRead,
      refreshConversations
    }}>
      {children}
    </MessageContext.Provider>
  );
};
