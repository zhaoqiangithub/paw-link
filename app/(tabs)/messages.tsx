import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { useMessages } from '@/contexts/MessageContext';
import { useApp } from '@/contexts/AppContext';
import { PetInfoDB, UserDB } from '@/lib/database';

const TABS = [
  { key: 'private', label: '私信' },
  { key: 'notice', label: '通知' },
  { key: 'system', label: '系统' },
] as const;

interface ConversationCard {
  id: string;
  userId: string;
  petInfoId: string;
  userName: string;
  avatar?: string;
  petTitle?: string;
  lastMessage: string;
  timestamp: number;
  unread: number;
  statusTag: string;
}

export default function MessagesScreen() {
  const { user } = useApp();
  const { conversations, loading, refreshConversations } = useMessages();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('private');
  const [conversationCards, setConversationCards] = useState<ConversationCard[]>([]);

  useEffect(() => {
    const enrichConversations = async () => {
      if (!user) return;

      const cards = await Promise.all(
        (conversations as any[]).map(async (conv) => {
          const otherUser = await UserDB.getUser(conv.userId);
          const petInfo = await PetInfoDB.getById(conv.petInfoId);
          const unread = conv.isRead === 0 && conv.toUserId === user.id ? 1 : 0;
          const statusTag = petInfo
            ? petInfo.status === 'needs_rescue'
              ? '需救助'
              : petInfo.status === 'for_adoption'
              ? '待领养'
              : petInfo.status === 'adopted'
              ? '已救助'
              : '紧急'
            : '沟通中';

          return {
            id: conv.id,
            userId: conv.userId,
            petInfoId: conv.petInfoId,
            userName: otherUser?.nickname || '爱心志愿者',
            avatar: otherUser?.avatar,
            petTitle: petInfo?.title,
            lastMessage: conv.content,
            timestamp: conv.createdAt,
            unread,
            statusTag,
          } as ConversationCard;
        })
      );

      setConversationCards(cards);
    };

    enrichConversations();
  }, [conversations, user]);

  const handleConversationPress = (card: ConversationCard) => {
    router.push({
      pathname: '/chat',
      params: {
        userId: card.userId,
        petInfoId: card.petInfoId,
        userName: card.userName,
      },
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case '需救助':
      case '紧急':
        return { backgroundColor: '#FFE8E8', textColor: '#FF6B6B' };
      case '待领养':
        return { backgroundColor: '#E9F2FF', textColor: '#3A7AFE' };
      case '已救助':
        return { backgroundColor: '#E8F8EE', textColor: '#2ECC71' };
      default:
        return { backgroundColor: '#F2F3F7', textColor: '#4B5675' };
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return days === 1 ? '昨天' : `${days}天前`;
  };

  const renderConversation = ({ item }: { item: ConversationCard }) => {
    const statusStyle = getStatusStyle(item.statusTag);
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarWrapper}>
          {item.avatar ? (
            <View style={styles.avatarImagePlaceholder}>
              {/* TODO: replace with Image when avatars are wired */}
              <Ionicons name="person" color="#fff" size={20} />
            </View>
          ) : (
            <View style={[styles.avatarImagePlaceholder, { backgroundColor: '#3A7AFE' }]}>
              <Ionicons name="person" color="#fff" size={20} />
            </View>
          )}
          {item.unread > 0 && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.conversationBody}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {item.userName}
            </Text>
            <Text style={styles.conversationTime}>{formatTimeAgo(item.timestamp)}</Text>
          </View>
          <View style={styles.conversationMetaRow}>
            <Text style={styles.conversationPet} numberOfLines={1}>
              {item.petTitle || '关于发布的信息'}
            </Text>
            <View style={[styles.statusTag, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusTagText, { color: statusStyle.textColor }]}>
                {item.statusTag}
              </Text>
            </View>
          </View>
          <Text style={styles.conversationSnippet} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        <View style={styles.badgeColumn}>
          <Ionicons name="chevron-forward" size={18} color="#CED4E5" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotificationPlaceholder = (
    title: string,
    description: string,
    type: 'info' | 'success' | 'alert',
  ) => (
    <View style={styles.noticeCard}>
      <View
        style={[
          styles.noticeIcon,
          type === 'alert' && { backgroundColor: '#FFE8E8' },
          type === 'success' && { backgroundColor: '#E6F8F2' },
        ]}
      >
        <Ionicons
          name={
            type === 'alert'
              ? 'alert-circle'
              : type === 'success'
              ? 'checkmark-circle'
              : 'notifications-outline'
          }
          size={18}
          color={type === 'alert' ? '#FF6B6B' : type === 'success' ? '#2ECC71' : '#3A7AFE'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C1C7D6" />
    </View>
  );

  const currentList =
    activeTab === 'private'
      ? conversationCards
      : [
          {
            id: 'notice-1',
            title: '感谢您对橘子的关注，情况已稳定',
            description: '救助站反馈：已完成初步救治',
            type: 'success' as const,
          },
          {
            id: 'notice-2',
            title: '系统通知：身份认证成功',
            description: '您现在可以发起志愿者活动',
            type: 'info' as const,
          },
        ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleGroup}>
            <View style={styles.heroIcon}>
              <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>消息</Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroActionButton} onPress={refreshConversations}>
              <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroActionButton}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
                {active && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {activeTab === 'private' ? (
        <FlatList
          data={currentList as ConversationCard[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderConversation}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#C1C7D6" />
              <Text style={styles.emptyText}>
                {loading ? '加载中...' : '还没有消息，去关心一只小动物吧'}
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.noticesContainer}>
          {currentList.map((item) => (
            <React.Fragment key={item.id}>
              {renderNotificationPlaceholder(item.title, item.description, item.type)}
            </React.Fragment>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  hero: {
    backgroundColor: '#1FBA84',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroActionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  tabIndicator: {
    height: 3,
    width: 40,
    borderRadius: 999,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  listContent: {
    paddingTop: 12,
    backgroundColor: '#fff',
    paddingBottom: 160,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF1F5',
    marginLeft: 88,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  avatarWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  avatarImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF8CB8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2ECC71',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationBody: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
  },
  conversationTime: {
    fontSize: 12,
    color: '#8A94A6',
  },
  conversationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 12,
  },
  conversationPet: {
    fontSize: 12,
    color: '#7B3FE4',
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  conversationSnippet: {
    fontSize: 13,
    color: '#4B5675',
    marginTop: 4,
  },
  badgeColumn: {
    marginLeft: 12,
  },
  noticesContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  noticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7E4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
  },
  noticeDescription: {
    fontSize: 12,
    color: '#4B5675',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    color: '#8A94A6',
  },
});
