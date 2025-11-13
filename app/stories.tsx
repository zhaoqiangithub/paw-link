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
import { StoryDB, StoryLikeDB, StoryCommentDB, UserDB } from '@/lib/database';
import { RecommendationEngine } from '@/lib/recommendation';
import { Link } from 'expo-router';
import { Image } from 'expo-image';

interface StoryWithAuthor {
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
  author?: {
    nickname: string;
    avatar?: string;
  };
  liked?: boolean;
}

export default function StoriesScreen() {
  const { user } = useApp();
  const [stories, setStories] = useState<StoryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStories = async () => {
    try {
      const storiesList = await StoryDB.getList(50, 0);

      // 获取作者信息并检查点赞状态
      const storiesWithAuthor = await Promise.all(
        storiesList.map(async (story) => {
          const author = await UserDB.getUser(story.userId);
          const liked = user ? await StoryLikeDB.isLiked(story.id, user.id) : false;

          return {
            ...story,
            author: author ? {
              nickname: author.nickname,
              avatar: author.avatar
            } : undefined,
            liked
          };
        })
      );

      setStories(storiesWithAuthor);
    } catch (error) {
      console.error('Error loading stories:', error);
      Alert.alert('错误', '加载故事失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStories();
  };

  const handleLike = async (storyId: string) => {
    if (!user) return;

    try {
      const result = await StoryLikeDB.toggle(storyId, user.id);

      // 更新本地状态
      setStories(prevStories =>
        prevStories.map(story => {
          if (story.id === storyId) {
            return {
              ...story,
              liked: result.liked,
              likesCount: story.likesCount + (result.action === 'like' ? 1 : -1)
            };
          }
          return story;
        })
      );

      // 记录用户行为
      await RecommendationEngine.logBehavior(
        user.id,
        result.action === 'like' ? 'favorite' : 'view',
        'story',
        storyId
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = (storyId: string) => {
    // TODO: 打开评论页面或评论弹窗
    Alert.alert('提示', '评论功能开发中');
  };

  const handleShare = async (story: StoryWithAuthor) => {
    // TODO: 实现分享功能
    Alert.alert('提示', '分享功能开发中');
  };

  const renderStory = ({ item }: { item: StoryWithAuthor }) => (
    <View style={styles.storyCard}>
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
              <Ionicons name="person" size={24} color="#999" />
            </View>
          )}
        </View>
        <View style={styles.authorInfo}>
          <ThemedText style={styles.authorName}>
            {item.author?.nickname || '匿名用户'}
          </ThemedText>
          <ThemedText style={styles.publishTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>

      {/* 故事内容 */}
      <TouchableOpacity
        style={styles.contentContainer}
        onPress={() => {
          if (user) {
            RecommendationEngine.logBehavior(user.id, 'click', 'story', item.id);
          }
        }}
      >
        <ThemedText style={styles.storyTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.storyContent} numberOfLines={3}>
          {item.content}
        </ThemedText>

        {/* 图片 */}
        {item.images && item.images.length > 0 && (
          <View style={styles.imagesContainer}>
            <FlatList
              data={item.images}
              horizontal
              renderItem={({ item: imageUri }) => (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.storyImage}
                  contentFit="cover"
                />
              )}
              keyExtractor={(uri, index) => `${uri}-${index}`}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* 互动按钮 */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={item.liked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.liked ? Colors.light.tint : Colors.light.icon}
          />
          <ThemedText style={[
            styles.actionText,
            item.liked && { color: Colors.light.tint }
          ]}>
            {item.likesCount}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleComment(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={24} color={Colors.light.icon} />
          <ThemedText style={styles.actionText}>{item.commentsCount}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <Ionicons name="share-outline" size={24} color={Colors.light.icon} />
          <ThemedText style={styles.actionText}>分享</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          救助故事
        </ThemedText>
        <Link href="/publish-story" asChild>
          <TouchableOpacity style={styles.publishButton}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </Link>
      </View>

      <FlatList
        data={stories}
        renderItem={renderStory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color={Colors.light.icon} />
            <ThemedText style={styles.emptyText}>暂无故事，分享您的救助经历吧！</ThemedText>
            <Link href="/publish-story" asChild>
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
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  storyCard: {
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
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  publishTime: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  contentContainer: {
    padding: 12,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  storyContent: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  imagesContainer: {
    marginTop: 12,
  },
  storyImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginRight: 8,
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
