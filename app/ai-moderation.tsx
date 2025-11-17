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

const TABS = [
  { key: 'pending', label: '待审核', count: 23 },
  { key: 'approved', label: '已通过', count: 156 },
  { key: 'rejected', label: '已拒绝', count: 12 },
  { key: 'reported', label: '被举报', count: 5 },
];

const CONTENT_ITEMS = [
  {
    id: 1,
    type: 'pet_info',
    title: '三里屯发现流浪猫需要救助',
    userId: 'user_001',
    userName: '爱心志愿者',
    status: 'pending',
    submitTime: '2小时前',
    aiScore: 85,
    aiResult: 'passed',
    aiReasons: ['图片清晰', '位置信息完整', '描述详细'],
    image: 'https://via.placeholder.com/150/FFE8E8/FF6B6B?text=猫咪',
    location: '朝阳区三里屯',
    riskLevel: 'low',
  },
  {
    id: 2,
    type: 'story',
    title: '成功救助小橘的康复日记',
    userId: 'user_002',
    userName: '救助达人',
    status: 'pending',
    submitTime: '3小时前',
    aiScore: 92,
    aiResult: 'passed',
    aiReasons: ['内容积极正能量', '图片真实', '无不当内容'],
    image: 'https://via.placeholder.com/150/E8F8EE/2ECC71?text=故事',
    location: '海淀区',
    riskLevel: 'low',
  },
  {
    id: 3,
    type: 'pet_info',
    title: '免费领养纯种金毛',
    userId: 'user_003',
    userName: '可疑用户',
    status: 'pending',
    submitTime: '5小时前',
    aiScore: 45,
    aiResult: 'flagged',
    aiReasons: ['疑似商业行为', '品种描述可疑', '价格信息缺失'],
    image: 'https://via.placeholder.com/150/E7E4FF/FF6B6B?text=金毛',
    location: '待确认',
    riskLevel: 'high',
  },
  {
    id: 4,
    type: 'story',
    title: '分享救助经验',
    userId: 'user_004',
    userName: '志愿者小王',
    status: 'pending',
    submitTime: '1天前',
    aiScore: 78,
    aiResult: 'passed',
    aiReasons: ['内容合规', '图片质量良好'],
    image: 'https://via.placeholder.com/150/FFF4E6/FF9F43?text=经验',
    location: '西城区',
    riskLevel: 'medium',
  },
];

const AI_FEATURES = [
  {
    id: 'duplicate',
    title: '重复信息检测',
    desc: '自动识别重复发布的信息',
    icon: 'copy-outline',
    enabled: true,
    accuracy: '98%',
  },
  {
    id: 'fake',
    title: '虚假信息识别',
    desc: '检测可疑的虚假内容',
    icon: 'shield-checkmark-outline',
    enabled: true,
    accuracy: '95%',
  },
  {
    id: 'inappropriate',
    title: '不当内容过滤',
    desc: '过滤暴力、色情等不当内容',
    icon: 'eye-off-outline',
    enabled: true,
    accuracy: '99%',
  },
  {
    id: 'commercial',
    title: '商业行为检测',
    desc: '识别商业广告和售卖行为',
    icon: 'storefront-outline',
    enabled: true,
    accuracy: '92%',
  },
];

export default function AIModerationScreen() {
  const [activeTab, setActiveTab] = useState('pending');
  const [contents, setContents] = useState(CONTENT_ITEMS);
  const [stats, setStats] = useState({
    totalProcessed: 12580,
    accuracy: '96.8%',
    avgTime: '2.3秒',
    flagged: 234,
  });

  const filteredContents = contents.filter(item => item.status === activeTab);

  const handleApprove = (id: number) => {
    setContents(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'approved' } : item
    ));
    Alert.alert('已通过', '内容审核已通过');
  };

  const handleReject = (id: number) => {
    Alert.alert(
      '拒绝原因',
      '请选择拒绝原因',
      [
        { text: '虚假信息', onPress: () => rejectContent(id, '虚假信息') },
        { text: '重复发布', onPress: () => rejectContent(id, '重复发布') },
        { text: '不当内容', onPress: () => rejectContent(id, '不当内容') },
        { text: '商业行为', onPress: () => rejectContent(id, '商业行为') },
        { text: '其他', onPress: () => rejectContent(id, '其他') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const rejectContent = (id: number, reason: string) => {
    setContents(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'rejected' } : item
    ));
    Alert.alert('已拒绝', `内容已拒绝，原因: ${reason}`);
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.purplePink} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI智能审核</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/ai-settings')}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.aiStatus}>
          <View style={styles.aiStatusItem}>
            <Ionicons name="cpu-outline" size={20} color="#fff" />
            <Text style={styles.aiStatusText}>AI审核运行中</Text>
          </View>
          <View style={styles.aiStatusDot} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalProcessed.toLocaleString()}</Text>
            <Text style={styles.statLabel}>累计审核</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.accuracy}</Text>
            <Text style={styles.statLabel}>准确率</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgTime}</Text>
            <Text style={styles.statLabel}>平均耗时</Text>
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
              {tab.count > 0 && (
                <View style={[styles.countBadge, activeTab === tab.key && styles.countBadgeActive]}>
                  <Text style={[styles.countText, activeTab === tab.key && styles.countTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* AI功能列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI审核功能</Text>
          <View style={styles.featuresGrid}>
            {AI_FEATURES.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={20} color="#7B3FE4" />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                  <Text style={styles.accuracy}>准确率 {feature.accuracy}</Text>
                </View>
                {feature.enabled && (
                  <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 待审核内容列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>待审核内容</Text>
          {filteredContents.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

function ContentCard({ item, onApprove, onReject }: { item: any; onApprove: (id: number) => void; onReject: (id: number) => void }) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FF9F43';
      case 'low': return '#2ECC71';
      default: return '#8A94A6';
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return '未知';
    }
  };

  return (
    <View style={styles.contentCard}>
      <View style={styles.contentHeader}>
        <Image source={{ uri: item.image }} style={styles.contentImage} />
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle}>{item.title}</Text>
          <Text style={styles.contentMeta}>
            {item.userName} · {item.submitTime}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#8A94A6" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.riskLevel) + '22' }]}>
          <Text style={[styles.riskText, { color: getRiskColor(item.riskLevel) }]}>
            {getRiskText(item.riskLevel)}
          </Text>
        </View>
      </View>

      <View style={styles.aiAnalysis}>
        <View style={styles.aiScoreRow}>
          <Ionicons name="cpu-outline" size={16} color="#7B3FE4" />
          <Text style={styles.aiScoreLabel}>AI评分: </Text>
          <Text style={styles.aiScore}>{item.aiScore}</Text>
          <View style={[
            styles.aiResultBadge,
            { backgroundColor: item.aiResult === 'passed' ? '#2ECC71' : '#FF9F43' }
          ]}>
            <Text style={styles.aiResultText}>
              {item.aiResult === 'passed' ? '通过' : '可疑'}
            </Text>
          </View>
        </View>
        <Text style={styles.aiReasons}>
          {item.aiReasons.join(' · ')}
        </Text>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => onApprove(item.id)}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>通过</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => onReject(item.id)}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>拒绝</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    marginBottom: 16,
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiStatusText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  aiStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ECC71',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F7FB',
  },
  tabActive: {
    backgroundColor: '#A855F7',
  },
  tabText: {
    fontSize: 13,
    color: '#4B5675',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: '#CBD2E3',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    fontSize: 11,
    color: '#4B5675',
    fontWeight: '700',
  },
  countTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 12,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    padding: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: '#4B5675',
  },
  accuracy: {
    fontSize: 10,
    color: '#2ECC71',
    marginTop: 2,
  },
  contentCard: {
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    padding: 12,
  },
  contentHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  contentImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E5E9F2',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 4,
  },
  contentMeta: {
    fontSize: 12,
    color: '#8A94A6',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#8A94A6',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
  },
  aiAnalysis: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  aiScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiScoreLabel: {
    fontSize: 12,
    color: '#4B5675',
  },
  aiScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B3FE4',
    flex: 1,
  },
  aiResultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  aiResultText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  aiReasons: {
    fontSize: 11,
    color: '#4B5675',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  approveButton: {
    backgroundColor: '#2ECC71',
  },
  rejectButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
