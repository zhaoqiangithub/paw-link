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
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { PetInfoDB, UserDB, type PetInfo, type User } from '@/lib/database';
import { useLocation } from '@/hooks/use-location';

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { location } = useLocation();
  const [petInfo, setPetInfo] = useState<PetInfo | null>(null);
  const [rescuer, setRescuer] = useState<User | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      const info = await PetInfoDB.getById(id);
      setPetInfo(info);
      if (info) {
        const author = await UserDB.getUser(info.userId);
        if (author) {
          setRescuer(author);
        }
      }
    };

    loadDetail();
  }, [id]);

  const donationProgress = useMemo(() => {
    // 临时模拟筹款进度
    const current = 3280;
    const target = 8000;
    return {
      current,
      target,
      percent: Math.min(100, (current / target) * 100),
    };
  }, []);

  if (!petInfo) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Ionicons name="paw" size={40} color="#C7CCE2" />
        <Text style={styles.loadingText}>加载中...</Text>
      </ThemedView>
    );
  }

  const statusLabel =
    petInfo.status === 'needs_rescue'
      ? '紧急救助'
      : petInfo.status === 'for_adoption'
      ? '待领养'
      : petInfo.status === 'adopted'
      ? '已救助'
      : '需帮助';

  const statusColor =
    petInfo.status === 'needs_rescue'
      ? '#FF6B6B'
      : petInfo.status === 'for_adoption'
      ? '#4ECDC4'
      : petInfo.status === 'adopted'
      ? '#2ECC71'
      : '#FF9F43';

  const handleContact = () => {
    if (!rescuer) return;
    router.push({
      pathname: '/chat',
      params: {
        userId: rescuer.id,
        petInfoId: petInfo.id,
        userName: rescuer.nickname,
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Image
            source={{ uri: petInfo.images?.[0] || 'https://placekitten.com/600/800' }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroIconButton}>
              <Ionicons name="heart-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroIconButton}>
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{petInfo.title}</Text>
              <Text style={styles.subtitle}>
                {petInfo.address || '未知地址'} · 距离{' '}
                {location
                  ? `${Math.round(
                      Math.max(
                        0.1,
                        Math.hypot(
                          location.latitude - petInfo.latitude,
                          location.longitude - petInfo.longitude,
                        ) * 111,
                      ) * 10,
                    ) / 10}km`
                  : '未知'}
              </Text>
            </View>
            <Text style={styles.publishTime}>
              发布于 {new Date(petInfo.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.tagsRow}>
            <Tag label={petInfo.type === 'cat' ? '猫咪' : petInfo.type === 'dog' ? '狗狗' : '其它'} />
            <Tag label={petInfo.status === 'for_adoption' ? '待领养' : '需要帮助'} />
            <Tag label="精神良好" />
            <Tag label="已打疫苗" />
          </View>

          <View style={styles.rescuerCard}>
            <View style={styles.rescuerInfo}>
              <View style={styles.rescuerAvatar}>
                <Ionicons name="person" size={26} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rescuerName}>{rescuer?.nickname || '救助人'}</Text>
                <Text style={styles.rescuerMeta}>爱心志愿者 · 信赖分 98</Text>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>关注</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.rescuerActions}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleContact}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>联系救助人</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Ionicons name="call-outline" size={18} color="#3A7AFE" />
                <Text style={styles.secondaryButtonText}>电话</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>详细描述</Text>
          <Text style={styles.description}>{petInfo.description}</Text>

          <Text style={styles.sectionTitle}>当前定位</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color="#3A7AFE" />
              <Text style={styles.locationText}>{petInfo.address || '等待定位'}</Text>
            </View>
            <View style={styles.locationActions}>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>导航</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>分享位置</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>医疗众筹</Text>
          <View style={styles.donationCard}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${donationProgress.percent}%` }]} />
            </View>
            <View style={styles.donationRow}>
              <Text style={styles.donationAmount}>¥{donationProgress.current.toLocaleString()}</Text>
              <Text style={styles.donationTarget}>目标 ¥{donationProgress.target.toLocaleString()}</Text>
            </View>
            <View style={styles.donationActions}>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>我要捐赠</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>捐赠记录</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8A94A6',
    marginTop: 12,
  },
  hero: {
    height: 360,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 40,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  heroActions: {
    position: 'absolute',
    top: 36,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A44',
  },
  subtitle: {
    fontSize: 13,
    color: '#4B5675',
    marginTop: 6,
  },
  publishTime: {
    fontSize: 12,
    color: '#8A94A6',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EEF3FF',
  },
  tagText: {
    color: '#3A7AFE',
    fontSize: 12,
    fontWeight: '600',
  },
  rescuerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  rescuerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rescuerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3A7AFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescuerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
  },
  rescuerMeta: {
    fontSize: 12,
    color: '#8A94A6',
  },
  followButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3A7AFE',
  },
  followButtonText: {
    color: '#3A7AFE',
    fontWeight: '600',
  },
  rescuerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3A7AFE',
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5DBED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    color: '#3A7AFE',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2A44',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5675',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1F2A44',
    flex: 1,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  donationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EEF3FF',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  donationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  donationAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  donationTarget: {
    fontSize: 12,
    color: '#8A94A6',
  },
  donationActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
