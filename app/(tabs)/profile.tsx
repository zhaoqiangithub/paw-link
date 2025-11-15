import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/contexts/AppContext';
import { PetInfoDB, StoryDB, SuccessCaseDB } from '@/lib/database';

interface ProfileStats {
  rescued: number;
  successCases: number;
  volunteerHours: number;
  points: number;
  favorites: number;
  volunteerActions: number;
}

const ACTIVITY_SHORTCUTS = [
  { key: 'posts', label: '我的发布', value: '5条', color: '#6B7BFF', icon: 'documents' },
  { key: 'adoptions', label: '我的领养', value: '2只', color: '#58C6AF', icon: 'paw' },
  { key: 'favorites', label: '我的收藏', value: '12条', color: '#FF9F43', icon: 'heart' },
  { key: 'volunteer', label: '志愿服务', value: '8次', color: '#F66EBB', icon: 'ribbon' },
];

const SERVICE_ITEMS = [
  { icon: 'person-circle', label: '实名认证', hint: '已完成认证' },
  { icon: 'shield-checkmark', label: '志愿者认证', hint: '解锁更多活动' },
  { icon: 'wallet', label: '我的钱包', hint: '余额 ¥128.50，众筹记录' },
  { icon: 'notifications', label: '消息通知', hint: '开启推送' },
  { icon: 'footsteps', label: '我的公益足迹', hint: '记录每一次行动' },
  { icon: 'share-social', label: '邀请好友', hint: '一起加入 PawLink' },
  { icon: 'help-circle', label: '帮助与反馈', hint: '常见问题 / 意见' },
  { icon: 'information-circle', label: '关于我们', hint: '了解 PawLink' },
];

export default function ProfileScreen() {
  const { user } = useApp();
  const [stats, setStats] = useState<ProfileStats>({
    rescued: 0,
    successCases: 0,
    volunteerHours: 0,
    points: 0,
    favorites: 0,
    volunteerActions: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      const myPosts = await PetInfoDB.getByUserId(user.id);
      const successCases = await SuccessCaseDB.getList(200, 0);
      const stories = await StoryDB.getList(200, 0);

      const rescued = myPosts.filter((p) => p.status === 'adopted').length;
      const volunteerHours = successCases.length * 2;
      const points = rescued * 20 + stories.length * 5;

      setStats({
        rescued,
        successCases: successCases.length,
        volunteerHours,
        points,
        favorites: stories.length,
        volunteerActions: Math.max(1, Math.round(volunteerHours / 4)),
      });
    };

    loadStats();
  }, [user]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroName}>{user?.nickname || '志愿者'}</Text>
              <Text style={styles.heroRole}>爱心志愿者 · 北京朝阳区</Text>
            </View>
            <TouchableOpacity style={styles.heroSettings}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.rescued}</Text>
              <Text style={styles.heroStatLabel}>已救助</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.successCases}</Text>
              <Text style={styles.heroStatLabel}>成功领养</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.volunteerHours}</Text>
              <Text style={styles.heroStatLabel}>志愿时长(h)</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{stats.points}</Text>
              <Text style={styles.heroStatLabel}>积分</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>我的活动</Text>
            <Text style={styles.sectionHint}>PO · 核心</Text>
          </View>
          <View style={styles.activityGrid}>
            {ACTIVITY_SHORTCUTS.map((item) => (
              <View key={item.key} style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.activityLabel}>{item.label}</Text>
                <Text style={styles.activityValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>能力与认证</Text>
          </View>
          <View style={styles.certificationCard}>
            <View style={styles.certificationItem}>
              <Ionicons name="shield-checkmark" size={24} color="#58C6AF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.certTitle}>实名认证</Text>
                <Text style={styles.certDesc}>已完成认证，享受更多服务</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD2E3" />
            </View>
            <View style={styles.divider} />
            <View style={styles.certificationItem}>
              <Ionicons name="ribbon" size={24} color="#FF9F43" />
              <View style={{ flex: 1 }}>
                <Text style={styles.certTitle}>志愿者认证</Text>
                <Text style={styles.certDesc}>成为认证志愿者，参加更多活动</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD2E3" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>服务与支持</Text>
          </View>
          <View style={styles.serviceList}>
            {SERVICE_ITEMS.map((item) => (
              <TouchableOpacity key={item.label} style={styles.serviceItem}>
                <View style={styles.serviceIcon}>
                  <Ionicons name={item.icon as any} size={18} color="#7B8AB8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceLabel}>{item.label}</Text>
                  <Text style={styles.serviceHint}>{item.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD2E3" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
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
  hero: {
    backgroundColor: '#7B3FE4',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  heroRole: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  heroSettings: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  heroStat: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2A44',
  },
  sectionHint: {
    fontSize: 12,
    color: '#8A94A6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EFE9FE',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 13,
    color: '#4B5675',
  },
  activityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
  },
  certificationCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
  },
  certDesc: {
    fontSize: 12,
    color: '#4B5675',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF1F7',
  },
  serviceList: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingLeft: 14,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFF2F7',
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceLabel: {
    fontSize: 15,
    color: '#1F2A44',
    fontWeight: '600',
  },
  serviceHint: {
    fontSize: 12,
    color: '#8A94A6',
    marginTop: 2,
  },
});
