import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  RefreshControl
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { SuccessCaseDB, UserDB } from '@/lib/database';
import { RecommendationEngine } from '@/lib/recommendation';
import { Link } from 'expo-router';
import { Image } from 'expo-image';

interface SuccessCaseWithAuthor {
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
  author?: {
    nickname: string;
    avatar?: string;
  };
}

export default function SuccessCasesScreen() {
  const { user } = useApp();
  const [cases, setCases] = useState<SuccessCaseWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCases: 0,
    thisMonthCases: 0,
    totalLikes: 0
  });

  const loadCases = async () => {
    try {
      const casesList = await SuccessCaseDB.getList(50, 0);

      // 获取作者信息
      const casesWithAuthor = await Promise.all(
        casesList.map(async (caseItem) => {
          const author = await UserDB.getUser(caseItem.userId);
          return {
            ...caseItem,
            author: author ? {
              nickname: author.nickname,
              avatar: author.avatar
            } : undefined
          };
        })
      );

      setCases(casesWithAuthor);

      // 计算统计数据
      const now = Date.now();
      const thisMonth = now - 30 * 24 * 60 * 60 * 1000;
      const thisMonthCases = casesList.filter(c => c.createdAt >= thisMonth).length;
      const totalLikes = casesList.reduce((sum, c) => sum + c.likesCount, 0);

      setStats({
        totalCases: casesList.length,
        thisMonthCases,
        totalLikes
      });

    } catch (error) {
      console.error('Error loading success cases:', error);
      Alert.alert('错误', '加载成功案例失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCases();
  };

  const handleLike = async (caseId: string) => {
    if (!user) return;

    try {
      // TODO: 实现点赞功能（需要创建SuccessCaseLikeDB）
      Alert.alert('提示', '点赞功能开发中');
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = async (caseItem: SuccessCaseWithAuthor) => {
    Alert.alert('提示', '分享功能开发中');
  };

  const renderCase = ({ item }: { item: SuccessCaseWithAuthor }) => (
    <View style={styles.caseCard}>
      {/* 头部图片 */}
      {item.images && item.images.length > 0 && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.images[0] }}
            style={styles.caseImage}
            contentFit="cover"
          />
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.badgeText}>成功案例</Text>
          </View>
        </View>
      )}

      {/* 内容 */}
      <View style={styles.contentContainer}>
        <ThemedText style={styles.caseTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.caseDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>

        {/* 时间线 */}
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <Ionicons name="medical" size={16} color={Colors.light.tint} />
            <ThemedText style={styles.timelineText}>
              救助: {new Date(item.rescueDate).toLocaleDateString()}
            </ThemedText>
          </View>
          {item.adoptionDate && (
            <View style={styles.timelineItem}>
              <Ionicons name="home" size={16} color="#4CAF50" />
              <ThemedText style={styles.timelineText}>
                领养: {new Date(item.adoptionDate).toLocaleDateString()}
              </ThemedText>
            </View>
          )}
        </View>

        {/* 作者信息 */}
        <View style={styles.authorContainer}>
          <View style={styles.avatarContainer}>
            {item.author?.avatar ? (
              <Image
                source={{ uri: item.author.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
            )}
          </View>
          <ThemedText style={styles.authorName}>
            {item.author?.nickname || '匿名用户'}
          </ThemedText>
          <View style={styles.divider} />
          <ThemedText style={styles.publishTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>

        {/* 故事内容 */}
        {item.story && (
          <TouchableOpacity
            style={styles.storyPreview}
            onPress={() => {
              Alert.alert(
                item.title,
                item.story,
                [{ text: '关闭', style: 'cancel' }]
              );
            }}
          >
            <ThemedText style={styles.storyText} numberOfLines={2}>
              {item.story}
            </ThemedText>
            <ThemedText style={styles.readMore}>查看完整故事</ThemedText>
          </TouchableOpacity>
        )}

        {/* 互动按钮 */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons name="heart-outline" size={20} color={Colors.light.icon} />
            <ThemedText style={styles.actionText}>{item.likesCount}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="share-outline" size={20} color={Colors.light.icon} />
            <ThemedText style={styles.actionText}>分享</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          成功案例
        </ThemedText>
        <Link href="/publish-case" asChild>
          <TouchableOpacity style={styles.publishButton}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{stats.totalCases}</ThemedText>
          <ThemedText style={styles.statLabel}>总案例</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{stats.thisMonthCases}</ThemedText>
          <ThemedText style={styles.statLabel}>本月新增</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{stats.totalLikes}</ThemedText>
          <ThemedText style={styles.statLabel}>总点赞</ThemedText>
        </View>
      </View>

      <FlatList
        data={cases}
        renderItem={renderCase}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={Colors.light.icon} />
            <ThemedText style={styles.emptyText}>暂无成功案例，赶快分享您的救助故事吧！</ThemedText>
            <Link href="/publish-case" asChild>
              <TouchableOpacity style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>去分享</Text>
              </TouchableOpacity>
            </Link>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  publishButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  caseCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  caseImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  contentContainer: {
    padding: 12,
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  caseDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 12,
  },
  timeline: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineText: {
    fontSize: 12,
    opacity: 0.8,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.light.border,
    marginHorizontal: 8,
  },
  publishTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  storyPreview: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  storyText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  readMore: {
    fontSize: 12,
    color: Colors.light.tint,
    marginTop: 4,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
