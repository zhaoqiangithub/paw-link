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
import { CrowdfundingDB, DonationDB, UserDB, PetInfoDB } from '@/lib/database';
import { Link } from 'expo-router';
import { Image } from 'expo-image';

interface CampaignWithDetails {
  id: string;
  petInfoId: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  deadline: number;
  createdAt: number;
  updatedAt: number;
  petInfo?: {
    title: string;
    images: string[];
  };
  author?: {
    nickname: string;
    avatar?: string;
  };
  progress: number;
  daysLeft: number;
}

export default function CrowdfundingScreen() {
  const { user } = useApp();
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaigns = async () => {
    try {
      const campaignsList = await CrowdfundingDB.getList('active');

      // 获取宠物信息和作者信息
      const campaignsWithDetails = await Promise.all(
        campaignsList.map(async (campaign) => {
          // 获取宠物信息
          const petInfos = await PetInfoDB.getList({ limit: 1000 });
          const petInfo = petInfos.find(p => p.id === campaign.petInfoId);

          // 获取作者信息
          const author = await UserDB.getUser(campaign.userId);

          // 计算进度和剩余天数
          const progress = (campaign.currentAmount / campaign.targetAmount) * 100;
          const daysLeft = Math.max(0, Math.ceil((campaign.deadline - Date.now()) / (1000 * 60 * 60 * 24)));

          return {
            ...campaign,
            petInfo: petInfo ? {
              title: petInfo.title,
              images: petInfo.images
            } : undefined,
            author: author ? {
              nickname: author.nickname,
              avatar: author.avatar
            } : undefined,
            progress,
            daysLeft
          };
        })
      );

      // 按进度排序
      campaignsWithDetails.sort((a, b) => b.progress - a.progress);

      setCampaigns(campaignsWithDetails);
    } catch (error) {
      console.error('Error loading crowdfunding campaigns:', error);
      Alert.alert('错误', '加载众筹活动失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCampaigns();
  };

  const handleDonate = (campaign: CampaignWithDetails) => {
    // TODO: 打开捐赠页面或支付弹窗
    Alert.alert('捐赠', `正在为「${campaign.title}」发起捐赠`, [
      { text: '取消', style: 'cancel' },
      { text: '确认', onPress: () => simulateDonation(campaign.id) }
    ]);
  };

  const simulateDonation = async (campaignId: string) => {
    if (!user) return;

    try {
      // 模拟捐赠
      const amount = Math.floor(Math.random() * 100) + 10; // 随机10-110元

      await DonationDB.create({
        campaignId,
        userId: user.id,
        amount,
        message: '希望小动物早日康复！',
        anonymous: 0
      });

      Alert.alert('感谢', `捐赠成功！金额: ¥${amount}`);
      loadCampaigns();
    } catch (error) {
      console.error('Error donating:', error);
      Alert.alert('错误', '捐赠失败，请重试');
    }
  };

  const handleViewDetails = (campaign: CampaignWithDetails) => {
    Alert.alert(
      campaign.title,
      `${campaign.description}\n\n目标金额: ¥${campaign.targetAmount}\n已筹金额: ¥${campaign.currentAmount}\n剩余天数: ${campaign.daysLeft}天`,
      [
        { text: '关闭', style: 'cancel' },
        { text: '立即捐赠', onPress: () => handleDonate(campaign) }
      ]
    );
  };

  const renderCampaign = ({ item }: { item: CampaignWithDetails }) => (
    <View style={styles.campaignCard}>
      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(item.progress, 100)}%` }
            ]}
          />
        </View>
        <ThemedText style={styles.progressText}>
          {item.progress.toFixed(1)}%
        </ThemedText>
      </View>

      {/* 宠物信息 */}
      {item.petInfo && item.petInfo.images.length > 0 && (
        <View style={styles.petImageContainer}>
          <Image
            source={{ uri: item.petInfo.images[0] }}
            style={styles.petImage}
            contentFit="cover"
          />
        </View>
      )}

      {/* 内容 */}
      <View style={styles.contentContainer}>
        <ThemedText style={styles.campaignTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.campaignDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>

        {/* 金额信息 */}
        <View style={styles.amountInfo}>
          <View style={styles.amountItem}>
            <ThemedText style={styles.amountLabel}>已筹</ThemedText>
            <ThemedText style={styles.amountValue}>
              ¥{item.currentAmount.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.amountItem}>
            <ThemedText style={styles.amountLabel}>目标</ThemedText>
            <ThemedText style={styles.amountValue}>
              ¥{item.targetAmount.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.amountItem}>
            <ThemedText style={styles.amountLabel}>剩余</ThemedText>
            <ThemedText style={styles.amountValue}>
              {item.daysLeft}天
            </ThemedText>
          </View>
        </View>

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
                <Ionicons name="person" size={20} color="#999" />
              </View>
            )}
          </View>
          <ThemedText style={styles.authorName}>
            {item.author?.nickname || '匿名用户'}
          </ThemedText>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="information-circle-outline" size={20} color={Colors.light.tint} />
            <ThemedText style={styles.detailButtonText}>详情</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.donateButton}
            onPress={() => handleDonate(item)}
          >
            <Ionicons name="heart-outline" size={20} color="white" />
            <Text style={styles.donateButtonText}>立即捐赠</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          爱心众筹
        </ThemedText>
        <Link href="/publish-campaign" asChild>
          <TouchableOpacity style={styles.publishButton}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* 统计 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#FF6B6B" />
          <ThemedText style={styles.statValue}>{campaigns.length}</ThemedText>
          <ThemedText style={styles.statLabel}>进行中</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="heart-outline" size={24} color="#4ECDC4" />
          <ThemedText style={styles.statValue}>
            ¥{campaigns.reduce((sum, c) => sum + c.currentAmount, 0).toLocaleString()}
          </ThemedText>
          <ThemedText style={styles.statLabel}>已筹金额</ThemedText>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up-outline" size={24} color="#FFD93D" />
          <ThemedText style={styles.statValue}>
            {campaigns.filter(c => c.progress >= 100).length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>已完成</ThemedText>
        </View>
      </View>

      <FlatList
        data={campaigns}
        renderItem={renderCampaign}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={Colors.light.icon} />
            <ThemedText style={styles.emptyText}>暂无众筹活动，发起一个帮助小动物吧！</ThemedText>
            <Link href="/publish-campaign" asChild>
              <TouchableOpacity style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>发起众筹</Text>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  campaignCard: {
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.light.tint,
    minWidth: 40,
    textAlign: 'right',
  },
  petImageContainer: {
    height: 200,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 12,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  campaignDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 12,
  },
  amountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 12,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 8,
    gap: 6,
  },
  detailButtonText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  donateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    gap: 6,
  },
  donateButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
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
