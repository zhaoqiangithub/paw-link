import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { PetInfoDB } from '@/lib/database';
import type { PetInfo } from '@/lib/database';
import { useApp } from '@/contexts/AppContext';

export default function MyPostsScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [posts, setPosts] = useState<PetInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      if (!user) return;
      try {
        const data = await PetInfoDB.getByUserId(user.id);
        setPosts(data);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [user]);

  const renderPost = ({ item }: { item: PetInfo }) => (
    <TouchableOpacity style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'adopted' ? '#2ECC71' : '#FF9F43' }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'adopted' ? '已领养' : '救助中'}
          </Text>
        </View>
      </View>
      <Text style={styles.postDesc} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.postDate}>{item.createdAt}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的发布</Text>
        <View style={styles.placeholder} />
      </View>

      <ThemedView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>加载中...</Text>
          </View>
        ) : posts.length > 0 ? (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#CBD2E3" />
            <Text style={styles.emptyText}>暂无发布内容</Text>
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3A7AFE',
  },
  header: {
    backgroundColor: '#3A7AFE',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8A94A6',
  },
  listContainer: {
    gap: 12,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  postDesc: {
    fontSize: 14,
    color: '#4B5675',
    marginBottom: 8,
  },
  postDate: {
    fontSize: 12,
    color: '#8A94A6',
  },
});
