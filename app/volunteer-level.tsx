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
import { CreditScoreDB } from '@/lib/database';

const LEVEL_CONFIG = {
  bronze: {
    name: '铜牌志愿者',
    color: '#CD7F32',
    minScore: 80,
    icon: 'medal-outline',
    benefits: ['基础活动参与', '社区交流', '积分获取'],
    nextLevel: 'silver',
    progressToNext: 20,
  },
  silver: {
    name: '银牌志愿者',
    color: '#C0C0C0',
    minScore: 100,
    icon: 'medal-outline',
    benefits: ['优先活动报名', '专属徽章', '积分加成10%', '优先客服'],
    nextLevel: 'gold',
    progressToNext: 20,
  },
  gold: {
    name: '金牌志愿者',
    color: '#FFD700',
    minScore: 120,
    icon: 'medal-outline',
    benefits: ['免费培训', '积分加成20%', '专属标识', '优先推荐'],
    nextLevel: 'platinum',
    progressToNext: 30,
  },
  platinum: {
    name: '铂金志愿者',
    color: '#E5E4E2',
    minScore: 150,
    icon: 'trophy-outline',
    benefits: ['免费认证', '积分加成30%', '专属客服', '年度表彰'],
    nextLevel: null,
    progressToNext: 0,
  },
};

const ACHIEVEMENTS = [
  { id: 1, title: '初次救助', desc: '完成第一次救助', icon: 'paw-outline', unlocked: true },
  { id: 2, title: '连续志愿者', desc: '连续7天参与活动', icon: 'calendar-outline', unlocked: true },
  { id: 3, title: '爱心大使', desc: '成功帮助10只宠物', icon: 'heart-outline', unlocked: true },
  { id: 4, title: '金牌志愿者', desc: '达到金牌等级', icon: 'ribbon-outline', unlocked: false },
  { id: 5, title: '英雄时刻', desc: '参与紧急救助', icon: 'shield-outline', unlocked: false },
  { id: 6, title: '百次服务', desc: '累计服务100小时', icon: 'time-outline', unlocked: false },
];

export default function VolunteerLevelScreen() {
  const { user } = useApp();
  const [creditScore, setCreditScore] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    totalHours: 68,
    rescuedCount: 15,
    adoptionCount: 8,
    ranking: 156,
    totalVolunteers: 1024,
  });

  useEffect(() => {
    if (user) {
      loadUserLevel();
    }
  }, [user]);

  const loadUserLevel = async () => {
    try {
      const score = await CreditScoreDB.getCreditScore(user!.id);
      setCreditScore(score);
    } catch (error) {
      console.error('Failed to load user level:', error);
    }
  };

  const currentLevel = getCurrentLevel(creditScore?.score || 100);
  const nextLevel = currentLevel.nextLevel ? LEVEL_CONFIG[currentLevel.nextLevel as keyof typeof LEVEL_CONFIG] : null;
  const progressPercent = nextLevel
    ? ((creditScore?.score - currentLevel.minScore) / (nextLevel.minScore - currentLevel.minScore)) * 100
    : 100;

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.indigoPurple} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>志愿者等级</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelBadge}>
            <Ionicons
              name={currentLevel.icon as any}
              size={48}
              color={currentLevel.color}
              style={styles.levelIcon}
            />
            <View style={styles.levelBadgeText}>
              <Text style={styles.levelName}>{currentLevel.name}</Text>
              <Text style={styles.levelScore}>{creditScore?.score || 100} 分</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: currentLevel.color }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {nextLevel
                ? `距离${nextLevel.name}还需 ${nextLevel.minScore - (creditScore?.score || 100)} 分`
                : '已满级'}
            </Text>
          </View>
        </View>

        <View style={styles.rankingRow}>
          <View style={styles.rankingItem}>
            <Ionicons name="trophy-outline" size={16} color="#FFD700" />
            <Text style={styles.rankingText}>全站排名 #{userStats.ranking}</Text>
          </View>
          <View style={styles.rankingDivider} />
          <Text style={styles.rankingText}>共 {userStats.totalVolunteers} 名志愿者</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>我的贡献</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userStats.totalHours}</Text>
              <Text style={styles.statLabel}>服务时长(h)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userStats.rescuedCount}</Text>
              <Text style={styles.statLabel}>救助数量</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userStats.adoptionCount}</Text>
              <Text style={styles.statLabel}>成功领养</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{creditScore?.level || 'bronze'}</Text>
              <Text style={styles.statLabel}>当前等级</Text>
            </View>
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>等级权益</Text>
          <View style={styles.benefitsList}>
            {currentLevel.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>成就徽章</Text>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((achievement) => (
              <TouchableOpacity
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.unlocked && styles.achievementCardUnlocked
                ]}
                onPress={() => {
                  if (achievement.unlocked) {
                    Alert.alert(achievement.title, achievement.desc);
                  }
                }}
              >
                <View style={[
                  styles.achievementIcon,
                  achievement.unlocked
                    ? { backgroundColor: '#FFE8E8' }
                    : { backgroundColor: '#F5F7FB' }
                ]}>
                  <Ionicons
                    name={achievement.icon as any}
                    size={24}
                    color={achievement.unlocked ? '#FF6B6B' : '#CBD2E3'}
                  />
                </View>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && { color: '#8A94A6' }
                ]}>
                  {achievement.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/volunteer-activities')}>
            <Text style={styles.actionButtonText}>参与志愿活动</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonOutline} onPress={() => router.push('/volunteer-stats')}>
            <Text style={styles.actionButtonOutlineText}>查看详细统计</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function getCurrentLevel(score: number) {
  if (score >= 150) return LEVEL_CONFIG.platinum;
  if (score >= 120) return LEVEL_CONFIG.gold;
  if (score >= 100) return LEVEL_CONFIG.silver;
  if (score >= 80) return LEVEL_CONFIG.bronze;
  return LEVEL_CONFIG.bronze;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  placeholder: {
    width: 40,
  },
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    padding: 20,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelIcon: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 32,
    padding: 12,
    marginRight: 12,
  },
  levelBadgeText: {
    flex: 1,
  },
  levelName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  levelScore: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  rankingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  rankingDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 12,
  },
  statsSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7B3FE4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#4B5675',
  },
  benefitsSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5675',
  },
  achievementsSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '31%',
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  achievementCardUnlocked: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFE8E8',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2A44',
    textAlign: 'center',
  },
  actionSection: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#7B3FE4',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonOutline: {
    borderWidth: 1,
    borderColor: '#7B3FE4',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonOutlineText: {
    color: '#7B3FE4',
    fontSize: 16,
    fontWeight: '600',
  },
});
