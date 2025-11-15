import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/contexts/AppContext';
import { StoryDB, StoryLikeDB, UserDB, type Story } from '@/lib/database';

const FILTERS = ['热门', '救助经验', '领养心得', '医疗知识'];

interface StoryWithAuthor extends Story {
  authorName?: string;
  authorAvatar?: string;
  liked?: boolean;
}

export default function CommunityScreen() {
  const { user } = useApp();
  const [stories, setStories] = useState<StoryWithAuthor[]>([]);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  useEffect(() => {
    const loadStories = async () => {
      const data = await StoryDB.getList(50, 0);
      const enhanced = await Promise.all(
        data.map(async (story) => {
          const author = await UserDB.getUser(story.userId);
          const liked = user ? await StoryLikeDB.isLiked(story.id, user.id) : false;
          return {
            ...story,
            authorName: author?.nickname || '志愿者',
            authorAvatar: author?.avatar,
            liked,
          };
        })
      );
      setStories(enhanced);
    };

    loadStories();
  }, [user]);

  const filteredStories = useMemo(() => {
    if (activeFilter === '热门') return stories;
    return stories.filter(
      (story) =>
        story.title.includes(activeFilter) ||
        story.content.includes(activeFilter),
    );
  }, [stories, activeFilter]);

  const toggleLike = async (story: StoryWithAuthor) => {
    if (!user) return;
    try {
      const result = await StoryLikeDB.toggle(story.id, user.id);
      setStories((prev) =>
        prev.map((item) =>
          item.id === story.id
            ? {
                ...item,
                liked: result.liked,
                likesCount: item.likesCount + (result.action === 'like' ? 1 : -1),
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('toggle like failed', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>爱心社区</Text>
          <Text style={styles.heroSubtitle}>分享救助经验 · 连接更多伙伴</Text>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = filter === activeFilter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredStories.map((story) => (
          <View key={story.id} style={styles.storyCard}>
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{story.authorName}</Text>
                <Text style={styles.authorMeta}>
                  {new Date(story.createdAt).toLocaleString()} · 认证志愿者
                </Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>认证志愿者</Text>
              </View>
            </View>

            <Text style={styles.storyTitle}>{story.title}</Text>
            <Text style={styles.storyContent}>{story.content}</Text>

            {story.images?.[0] && (
              <Image
                source={{ uri: story.images[0] }}
                style={styles.storyImage}
                contentFit="cover"
              />
            )}

            <View style={styles.storyActions}>
              <TouchableOpacity style={styles.storyAction} onPress={() => toggleLike(story)}>
                <Ionicons
                  name={story.liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={story.liked ? '#FF7EB3' : '#4B5675'}
                />
                <Text style={styles.storyActionText}>{story.likesCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storyAction}>
                <Ionicons name="chatbubble-outline" size={20} color="#4B5675" />
                <Text style={styles.storyActionText}>{story.commentsCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.storyAction}>
                <Ionicons name="share-outline" size={20} color="#4B5675" />
                <Text style={styles.storyActionText}>分享</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE5F1',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FF7EB3',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 6,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFE5F1',
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  filterChipActive: {
    backgroundColor: '#fff',
  },
  filterText: {
    color: '#C45A8A',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FF4D8D',
  },
  storyCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF7EB3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
  },
  authorMeta: {
    fontSize: 12,
    color: '#8A94A6',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFE0EA',
  },
  tagText: {
    color: '#FF4D8D',
    fontSize: 11,
    fontWeight: '600',
  },
  storyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2A44',
  },
  storyContent: {
    fontSize: 14,
    color: '#4B5675',
    lineHeight: 20,
  },
  storyImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  storyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storyActionText: {
    color: '#4B5675',
    fontSize: 13,
  },
});
