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
import { CrowdfundingDB, DonationDB, PetInfoDB } from '@/lib/database';

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'medical', label: '医疗救助' },
  { key: 'rescue', label: '紧急救援' },
  { key: 'daily_care', label: '日常照护' },
];

export default function CrowdfundingScreen() {
  const { user } = useApp();
  const [activeCategory, setActiveCategory] = useState('all');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myDonations, setMyDonations] = useState<any[]>([]);

  useEffect(() => {
    loadCampaigns();
    if (user) {
      loadMyDonations();
    }
  }, [user, activeCategory]);

  const loadCampaigns = async () => {
    try {
      const data = await CrowdfundingDB.getList(100, 0);
      const filtered = activeCategory === 'all'
        ? data
        : data.filter(c => c.type === activeCategory);
      setCampaigns(filtered);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadMyDonations = async () => {
    if (!user) return;
    try {
      const data = await DonationDB.getByUserId(user.id, 10);
      setMyDonations(data);
    } catch (error) {
      console.error('Failed to load donations:', error);
    }
  };

  const handleCreateCampaign = () => {
    router.push('/create-campaign');
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.pinkRose} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>医疗众筹</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateCampaign}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>汇聚爱心，守护每一个生命</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>¥24,580</Text>
          <Text style={styles.statLabel}>累计筹款</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>186</Text>
          <Text style={styles.statLabel}>参与人次</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>23</Text>
          <Text style={styles.statLabel}>成功项目</Text>
        </View>
      </View>

      <View style={styles.categoryRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryChip, activeCategory === cat.key && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Text style={[styles.categoryText, activeCategory === cat.key && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} user={user} />
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreateCampaign}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

function CampaignCard({ campaign, user }: { campaign: any; user: any }) {
  const progress = (campaign.currentAmount / campaign.targetAmount) * 100;
  const daysLeft = Math.ceil((campaign.deadline - Date.now()) / (1000 * 60 * 60 * 24));

  const handlePress = () => {
    router.push({
      pathname: '/campaign-detail',
      params: { id: campaign.id }
    });
  };

  const handleDonate = () => {
    router.push({
      pathname: '/donate',
      params: { id: campaign.id }
    });
  };

  return (
    <TouchableOpacity style={styles.campaignCard} onPress={handlePress}>
      <View style={styles.campaignHeader}>
        <Image source={{ uri: campaign.images?.[0] || '' }} style={styles.campaignImage} />
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>紧急</Text>
        </View>
      </View>

      <View style={styles.campaignBody}>
        <Text style={styles.campaignTitle}>{campaign.title}</Text>
        <Text style={styles.campaignDesc} numberOfLines={2}>
          {campaign.description}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
        </View>

        <View style={styles.amountRow}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>已筹集</Text>
            <Text style={styles.amountValue}>¥{campaign.currentAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>目标</Text>
            <Text style={styles.amountTarget}>¥{campaign.targetAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>剩余</Text>
            <Text style={styles.amountDays}>{daysLeft}天</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.donateButton} onPress={handleDonate}>
          <Ionicons name="heart-outline" size={16} color="#fff" />
          <Text style={styles.donateButtonText}>立即捐助</Text>
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
    marginBottom: 12,
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
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF4D8D',
  },
  statLabel: {
    fontSize: 11,
    color: '#8A94A6',
    marginTop: 4,
  },
  categoryRow: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F7',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F7FB',
  },
  categoryChipActive: {
    backgroundColor: '#FF4D8D',
  },
  categoryText: {
    fontSize: 13,
    color: '#4B5675',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  campaignHeader: {
    position: 'relative',
    aspectRatio: 2,
  },
  campaignImage: {
    width: '100%',
    height: '100%',
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgentText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  campaignBody: {
    padding: 16,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 8,
  },
  campaignDesc: {
    fontSize: 13,
    color: '#4B5675',
    lineHeight: 18,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF4D8D',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF4D8D',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    color: '#8A94A6',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
  },
  amountTarget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5675',
  },
  amountDays: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9F43',
  },
  donateButton: {
    backgroundColor: '#FF4D8D',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  donateButtonText: {
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
    backgroundColor: '#FF4D8D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
