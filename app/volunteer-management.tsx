import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { Gradients } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';

const TABS = [
  { key: 'all', label: '全部团队' },
  { key: 'my', label: '我的团队' },
  { key: 'nearby', label: '附近团队' },
];

const TEAMS = [
  {
    id: 1,
    name: '三里屯TNR小分队',
    leader: '张队长',
    members: 12,
    maxMembers: 20,
    level: 'gold',
    location: '朝阳区三里屯',
    distance: '0.8km',
    tasksCompleted: 45,
    rating: 4.9,
    description: '专注于TNR行动的志愿者团队，已成功绝育300+只流浪猫',
    skills: ['TNR', '诱捕', '医疗协助'],
    avatar: 'https://via.placeholder.com/100/7B3FE4/FFFFFF?text=TNR',
    activity: 'active',
  },
  {
    id: 2,
    name: '城市流浪动物关怀',
    leader: '李队长',
    members: 28,
    maxMembers: 50,
    level: 'platinum',
    location: '海淀区中关村',
    distance: '3.2km',
    tasksCompleted: 128,
    rating: 4.8,
    description: '综合性救助团队，覆盖救助、医疗、领养全流程',
    skills: ['救助', '医疗', '领养协调'],
    avatar: 'https://via.placeholder.com/100/2ECC71/FFFFFF?text=关怀',
    activity: 'active',
  },
  {
    id: 3,
    name: '急救先锋队',
    leader: '王队长',
    members: 8,
    maxMembers: 15,
    level: 'silver',
    location: '东城区王府井',
    distance: '5.6km',
    tasksCompleted: 32,
    rating: 4.7,
    description: '24小时待命的紧急救助团队，专门处理紧急情况',
    skills: ['紧急救援', '医疗急救', '运输'],
    avatar: 'https://via.placeholder.com/100/FF6B6B/FFFFFF?text=急救',
    activity: 'active',
  },
];

export default function VolunteerManagementScreen() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [teams, setTeams] = useState(TEAMS);
  const [myTeams, setMyTeams] = useState<any[]>([]);

  useEffect(() => {
    loadMyTeams();
  }, [user]);

  const loadMyTeams = async () => {
    // TODO: 从数据库加载用户加入的团队
    setMyTeams([]);
  };

  const handleCreateTeam = () => {
    router.push('/create-team');
  };

  const handleJoinTeam = (team: any) => {
    if (team.members >= team.maxMembers) {
      Alert.alert('团队已满', '该团队人数已达上限');
      return;
    }

    Alert.alert(
      '申请加入',
      `申请加入 ${team.name}\n团队规模: ${team.members}/${team.maxMembers}人\n团队leader: ${team.leader}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '申请加入',
          onPress: () => {
            Alert.alert('申请已提交', '请等待团队leader审核', [
              { text: '查看申请状态', onPress: () => router.push('/my-applications') }
            ]);
          }
        },
      ]
    );
  };

  const handleViewTeam = (team: any) => {
    router.push(`/team-detail?id=${team.id}`);
  };

  const filteredTeams = teams.filter(team => {
    if (activeTab === 'my') {
      return myTeams.some(myTeam => myTeam.id === team.id);
    }
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.indigoPurple} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>志愿者团队</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateTeam}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>186</Text>
            <Text style={styles.statLabel}>活跃团队</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1,234</Text>
            <Text style={styles.statLabel}>志愿者</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>892</Text>
            <Text style={styles.statLabel}>本月任务</Text>
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
        <View style={styles.featureBanner}>
          <Ionicons name="trophy-outline" size={24} color="#FFD700" />
          <Text style={styles.featureTitle}>团队协作，更高效</Text>
          <Text style={styles.featureDesc}>加入专业团队，与志同道合的伙伴一起帮助更多小动物</Text>
        </View>

        {filteredTeams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onJoin={() => handleJoinTeam(team)}
            onView={() => handleViewTeam(team)}
          />
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreateTeam}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

function TeamCard({ team, onJoin, onView }: { team: any; onJoin: () => void; onView: () => void }) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#8A94A6';
    }
  };

  const getActivityStatus = (status: string) => {
    return status === 'active';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onView}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: team.avatar }} style={styles.avatar} />
        <View style={styles.teamInfo}>
          <View style={styles.teamNameRow}>
            <Text style={styles.teamName}>{team.name}</Text>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(team.level) + '22' }]}>
              <Text style={[styles.levelText, { color: getLevelColor(team.level) }]}>
                {team.level.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.leader}>队长: {team.leader}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#4B5675" />
              <Text style={styles.metaText}>{team.location} · {team.distance}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.metaText}>{team.rating}</Text>
            </View>
          </View>
        </View>
        {getActivityStatus(team.activity) && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>活跃</Text>
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {team.description}
      </Text>

      <View style={styles.skillsRow}>
        {team.skills.map((skill: string, index: number) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardStatsRow}>
        <View style={styles.statItem}>
          <Text style={styles.cardStatValue}>{team.members}/{team.maxMembers}</Text>
          <Text style={styles.cardStatLabel}>成员</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.cardStatValue}>{team.tasksCompleted}</Text>
          <Text style={styles.cardStatLabel}>完成任务</Text>
        </View>
        <TouchableOpacity style={styles.joinButton} onPress={onJoin}>
          <Text style={styles.joinButtonText}>加入团队</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#7B3FE4',
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
    backgroundColor: '#7B3FE4',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  featureBanner: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2A44',
  },
  featureDesc: {
    fontSize: 12,
    color: '#4B5675',
    flex: 1,
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
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F7FB',
  },
  teamInfo: {
    flex: 1,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  leader: {
    fontSize: 12,
    color: '#4B5675',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#8A94A6',
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: '#4B5675',
    lineHeight: 18,
    marginBottom: 12,
  },
  skillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  skillTag: {
    backgroundColor: '#F5F7FB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillText: {
    fontSize: 11,
    color: '#4B5675',
    fontWeight: '600',
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  cardStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
  },
  cardStatLabel: {
    fontSize: 11,
    color: '#8A94A6',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#7B3FE4',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7B3FE4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
