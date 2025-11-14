import { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { PetInfoDB, StoryDB, SuccessCaseDB, PaymentDB } from '@/lib/database';

interface StatisticsData {
  // 总体数据
  totalPets: number;
  totalStories: number;
  totalCases: number;
  totalDonations: number;

  // 宠物状态统计
  needsRescueCount: number;
  forAdoptionCount: number;
  adoptedCount: number;
  emergencyCount: number;

  // 时间段统计
  thisMonthPets: number;
  thisMonthStories: number;
  thisMonthCases: number;

  // 地区分布 (模拟数据)
  hotspotAreas: Array<{
    name: string;
    count: number;
  }>;
}

export default function StatisticsScreen() {
  const [stats, setStats] = useState<StatisticsData>({
    totalPets: 0,
    totalStories: 0,
    totalCases: 0,
    totalDonations: 0,
    needsRescueCount: 0,
    forAdoptionCount: 0,
    adoptedCount: 0,
    emergencyCount: 0,
    thisMonthPets: 0,
    thisMonthStories: 0,
    thisMonthCases: 0,
    hotspotAreas: []
  });
  const [loading, setLoading] = useState(true);

  const loadStatistics = async () => {
    try {
      // 获取所有宠物信息
      const allPets = await PetInfoDB.getList({ limit: 1000 });
      const stories = await StoryDB.getList(1000, 0);
      const cases = await SuccessCaseDB.getList(1000, 0);

      // 计算时间段
      const now = Date.now();
      const thisMonth = now - 30 * 24 * 60 * 60 * 1000;

      // 统计数据
      const needsRescueCount = allPets.filter(p => p.status === 'needs_rescue').length;
      const forAdoptionCount = allPets.filter(p => p.status === 'for_adoption').length;
      const adoptedCount = allPets.filter(p => p.status === 'adopted').length;
      const emergencyCount = allPets.filter(p => p.status === 'emergency').length;

      const thisMonthPets = allPets.filter(p => p.createdAt >= thisMonth).length;
      const thisMonthStories = stories.filter(s => s.createdAt >= thisMonth).length;
      const thisMonthCases = cases.filter(c => c.createdAt >= thisMonth).length;

      // 模拟热点区域数据（实际应基于地理位置聚类）
      const hotspotAreas = [
        { name: '朝阳区', count: Math.floor(allPets.length * 0.3) },
        { name: '海淀区', count: Math.floor(allPets.length * 0.25) },
        { name: '西城区', count: Math.floor(allPets.length * 0.2) },
        { name: '东城区', count: Math.floor(allPets.length * 0.15) },
        { name: '其他', count: Math.floor(allPets.length * 0.1) }
      ];

      setStats({
        totalPets: allPets.length,
        totalStories: stories.length,
        totalCases: cases.length,
        totalDonations: 0, // TODO: 从 PaymentDB 获取
        needsRescueCount,
        forAdoptionCount,
        adoptedCount,
        emergencyCount,
        thisMonthPets,
        thisMonthStories,
        thisMonthCases,
        hotspotAreas
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const StatCard = ({ icon, title, value, subtitle, color }: {
    icon: string;
    title: string;
    value: number;
    subtitle?: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <ThemedText style={styles.statTitle}>{title}</ThemedText>
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      {subtitle && (
        <ThemedText style={styles.statSubtitle}>{subtitle}</ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          数据统计
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* 总体概览 */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>总体概览</ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              icon="paw-outline"
              title="宠物信息"
              value={stats.totalPets}
              subtitle={`本月新增 ${stats.thisMonthPets}`}
              color="#FF6B6B"
            />
            <StatCard
              icon="bookmark-outline"
              title="救助故事"
              value={stats.totalStories}
              subtitle={`本月新增 ${stats.thisMonthStories}`}
              color="#4ECDC4"
            />
            <StatCard
              icon="trophy-outline"
              title="成功案例"
              value={stats.totalCases}
              subtitle={`本月新增 ${stats.thisMonthCases}`}
              color="#FFD93D"
            />
            <StatCard
              icon="heart-outline"
              title="爱心捐赠"
              value={stats.totalDonations}
              subtitle="累计金额"
              color="#A8E6CF"
            />
          </View>
        </View>

        {/* 宠物状态分布 */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>宠物状态分布</ThemedText>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#FF6B6B' }]} />
              <ThemedText style={styles.statusLabel}>需要救助</ThemedText>
              <ThemedText style={styles.statusValue}>{stats.needsRescueCount}</ThemedText>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#4ECDC4' }]} />
              <ThemedText style={styles.statusLabel}>待领养</ThemedText>
              <ThemedText style={styles.statusValue}>{stats.forAdoptionCount}</ThemedText>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#FFD93D' }]} />
              <ThemedText style={styles.statusLabel}>已领养</ThemedText>
              <ThemedText style={styles.statusValue}>{stats.adoptedCount}</ThemedText>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#FF0000' }]} />
              <ThemedText style={styles.statusLabel}>紧急救助</ThemedText>
              <ThemedText style={styles.statusValue}>{stats.emergencyCount}</ThemedText>
            </View>
          </View>
        </View>

        {/* 热点区域 */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>热点区域分布</ThemedText>
          <View style={styles.hotspotContainer}>
            {stats.hotspotAreas.map((area, index) => (
              <View key={index} style={styles.hotspotItem}>
                <ThemedText style={styles.hotspotName}>{area.name}</ThemedText>
                <View style={styles.hotspotBar}>
                  <View
                    style={[
                      styles.hotspotFill,
                      {
                        width: `${(area.count / Math.max(...stats.hotspotAreas.map(a => a.count))) * 100}%`,
                        backgroundColor: `hsl(${200 - index * 30}, 70%, 60%)`
                      }
                    ]}
                  />
                </View>
                <ThemedText style={styles.hotspotValue}>{area.count}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* 成功率统计 */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>救助成功率</ThemedText>
          <View style={styles.successRateCard}>
            <View style={styles.successRateCircle}>
              <ThemedText style={styles.successRateValue}>
                {stats.totalPets > 0
                  ? Math.round((stats.adoptedCount / stats.totalPets) * 100)
                  : 0}%
              </ThemedText>
            </View>
            <View style={styles.successRateInfo}>
              <ThemedText style={styles.successRateText}>
                已成功帮助 {stats.adoptedCount} 只宠物找到家
              </ThemedText>
              <ThemedText style={styles.successRateHint}>
                {stats.totalPets - stats.adoptedCount} 只宠物仍在等待救助
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statTitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    opacity: 0.6,
  },
  statusContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  hotspotContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  hotspotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hotspotName: {
    width: 80,
    fontSize: 14,
  },
  hotspotBar: {
    flex: 1,
    height: 24,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  hotspotFill: {
    height: '100%',
    borderRadius: 12,
  },
  hotspotValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  successRateCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  successRateCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successRateValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  successRateInfo: {
    flex: 1,
  },
  successRateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  successRateHint: {
    fontSize: 13,
    opacity: 0.7,
  },
});
