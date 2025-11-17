import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { Gradients } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';

const TABS = [
  { key: 'upcoming', label: '即将开始' },
  { key: 'ongoing', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'created', label: '我创建的' },
];

const ACTIVITIES = [
  {
    id: 1,
    title: '三里屯流浪猫TNR行动',
    type: 'TNR',
    startDate: '2025-11-20 09:00',
    endDate: '2025-11-20 18:00',
    location: '朝阳区三里屯',
    status: 'upcoming',
    participants: 8,
    maxParticipants: 15,
    requiredLevel: 'silver',
    reward: 100,
    description: ' Trap-Neuter-Return，即诱捕-绝育-放归，是控制流浪猫数量的科学方法',
    organizer: '城市流浪动物关怀计划',
    requirements: ['有经验志愿者优先', '自备工具'],
  },
  {
    id: 2,
    title: '冬季宠物暖冬计划',
    type: '捐赠',
    startDate: '2025-11-18 10:00',
    endDate: '2025-12-18 18:00',
    location: '全市多个救助站',
    status: 'ongoing',
    participants: 234,
    maxParticipants: 500,
    requiredLevel: 'bronze',
    reward: 50,
    description: '为流浪动物募集冬季保暖用品和食物',
    organizer: 'PawLink官方',
    requirements: ['不限经验', '可远程参与'],
  },
  {
    id: 3,
    title: '宠物医院义诊活动',
    type: '医疗',
    startDate: '2025-11-15 14:00',
    endDate: '2025-11-15 17:00',
    location: '海淀区宠物医院',
    status: 'completed',
    participants: 12,
    maxParticipants: 12,
    requiredLevel: 'gold',
    reward: 150,
    description: '为流浪动物提供免费体检和基础治疗',
    organizer: '爱心宠物医院',
    requirements: ['专业医疗背景', '金卡以上'],
  },
];

export default function ActivityManagerScreen() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [activities, setActivities] = useState(ACTIVITIES);
  const [userActivities, setUserActivities] = useState<any[]>([]);

  useEffect(() => {
    // 加载用户参与的活动
    loadUserActivities();
  }, [user]);

  const loadUserActivities = async () => {
    // TODO: 从数据库加载
    setUserActivities([]);
  };

  const handleCreateActivity = () => {
    Alert.alert(
      '创建活动',
      '请选择活动类型',
      [
        { text: 'TNR行动', onPress: () => router.push('/create-activity?type=TNR') },
        { text: '医疗活动', onPress: () => router.push('/create-activity?type=medical') },
        { text: '捐赠活动', onPress: () => router.push('/create-activity?type=donation') },
        { text: '其他', onPress: () => router.push('/create-activity?type=other') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const handleJoinActivity = (activity: any) => {
    if (activity.participants >= activity.maxParticipants) {
      Alert.alert('活动已满', '该活动参与人数已达上限');
      return;
    }

    Alert.alert(
      '确认参与',
      `参与 ${activity.title}\n时间: ${activity.startDate}\n地点: ${activity.location}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认参与',
          onPress: () => {
            setActivities(prev => prev.map(a =>
              a.id === activity.id
                ? { ...a, participants: a.participants + 1 }
                : a
            ));
            Alert.alert('参与成功', '请准时参加活动', [
              { text: '添加到日历', onPress: () => console.log('添加到日历') }
            ]);
          }
        },
      ]
    );
  };

  const filteredActivities = activities.filter(a => {
    if (activeTab === 'created') {
      return a.organizer === 'PawLink官方';
    }
    return a.status === activeTab;
  });

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.blue} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>活动管理</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateActivity}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>本月参与</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>86</Text>
            <Text style={styles.statLabel}>累计时长(h)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>平均评分</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {filteredActivities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onJoin={handleJoinActivity}
            onPress={() => router.push(`/activity-detail?id=${activity.id}`)}
          />
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreateActivity}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

function ActivityCard({ activity, onJoin, onPress }: { activity: any; onJoin: (a: any) => void; onPress: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#3A7AFE';
      case 'ongoing': return '#2ECC71';
      case 'completed': return '#8A94A6';
      default: return '#4B5675';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '即将开始';
      case 'ongoing': return '进行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const canJoin = activity.status === 'upcoming' || activity.status === 'ongoing';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={[
          styles.statusTag,
          { backgroundColor: getStatusColor(activity.status) + '22' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(activity.status) }
          ]}>
            {getStatusText(activity.status)}
          </Text>
        </View>
        <Text style={styles.activityType}>{activity.type}</Text>
      </View>

      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {activity.description}
      </Text>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={14} color="#4B5675" />
          <Text style={styles.infoText}>{activity.startDate}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color="#4B5675" />
          <Text style={styles.infoText}>{activity.location}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={14} color="#4B5675" />
          <Text style={styles.infoText}>
            {activity.participants}/{activity.maxParticipants} 人
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="ribbon-outline" size={14} color="#4B5675" />
          <Text style={styles.infoText}>
            {activity.requiredLevel} 以上
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="gift-outline" size={14} color="#FF9F43" />
          <Text style={styles.infoText}>奖励 {activity.reward} 积分</Text>
        </View>
        <Text style={styles.organizer}>{activity.organizer}</Text>
      </View>

      {canJoin && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => onJoin(activity)}
        >
          <Text style={styles.joinButtonText}>立即参与</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
  },
  tabsRow: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F7',
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F7FB',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 13,
    color: '#4B5675',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -14,
    alignSelf: 'center',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activityType: {
    fontSize: 11,
    color: '#8A94A6',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#4B5675',
    lineHeight: 18,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#4B5675',
    flex: 1,
  },
  organizer: {
    fontSize: 12,
    color: '#8A94A6',
  },
  joinButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
