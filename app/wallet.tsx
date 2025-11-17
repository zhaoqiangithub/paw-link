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
import { Gradients, Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { PaymentDB, DonationDB } from '@/lib/database';

const TRANSACTION_TYPES = [
  { key: 'all', label: '全部' },
  { key: 'donation', label: '捐赠' },
  { key: 'recharge', label: '充值' },
  { key: 'withdraw', label: '提现' },
  { key: 'reward', label: '奖励' },
];

export default function WalletScreen() {
  const { user } = useApp();
  const [balance, setBalance] = useState(128.50);
  const [frozenAmount, setFrozenAmount] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      // 加载交易记录
      const payments = await PaymentDB.getByUserId(user!.id, 50);
      setTransactions(payments);

      // 计算总捐赠金额
      const donations = await DonationDB.getByUserId(user!.id, 100);
      const total = donations.reduce((sum, d) => sum + d.amount, 0);
      setTotalDonations(total);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const handleRecharge = () => {
    Alert.alert(
      '充值',
      '请选择充值金额',
      [
        { text: '¥50', onPress: () => processRecharge(50) },
        { text: '¥100', onPress: () => processRecharge(100) },
        { text: '¥200', onPress: () => processRecharge(200) },
        { text: '¥500', onPress: () => processRecharge(500) },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const processRecharge = (amount: number) => {
    // TODO: 集成支付
    setBalance(prev => prev + amount);
    Alert.alert('充值成功', `成功充值 ¥${amount}`);
  };

  const handleWithdraw = () => {
    Alert.prompt(
      '提现',
      '请输入提现金额',
      [
        { text: '取消', style: 'cancel' },
        { text: '确认', onPress: (amount) => processWithdraw(parseFloat(amount || '0')) },
      ],
      'plain-text',
      ''
    );
  };

  const processWithdraw = (amount: number) => {
    if (amount > balance) {
      Alert.alert('余额不足');
      return;
    }
    // TODO: 集成提现
    setBalance(prev => prev - amount);
    Alert.alert('提现申请已提交', '预计1-3个工作日到账');
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.greenTeal} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>我的钱包</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>账户余额</Text>
          <Text style={styles.balanceValue}>¥{balance.toFixed(2)}</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleRecharge}>
              <Text style={styles.actionButtonText}>充值</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonOutline} onPress={handleWithdraw}>
              <Text style={styles.actionButtonOutlineText}>提现</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="gift-outline" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statText}>已捐赠 ¥{totalDonations.toFixed(2)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="snow-outline" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statText}>冻结金额 ¥{frozenAmount.toFixed(2)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.featuresRow}>
        <TouchableOpacity style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: '#FFE8E8' }]}>
            <Ionicons name="heart-outline" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.featureLabel}>慈善捐赠</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: '#E8F8EE' }]}>
            <Ionicons name="receipt-outline" size={24} color="#2ECC71" />
          </View>
          <Text style={styles.featureLabel}>账单明细</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: '#E7E4FF' }]}>
            <Ionicons name="shield-outline" size={24} color="#7B3FE4" />
          </View>
          <Text style={styles.featureLabel}>安全保障</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>交易明细</Text>
          <TouchableOpacity onPress={() => router.push('/transaction-history')}>
            <Text style={styles.sectionAction}>查看全部</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {TRANSACTION_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.filterChip, activeTab === type.key && styles.filterChipActive]}
              onPress={() => setActiveTab(type.key)}
            >
              <Text style={[styles.filterText, activeTab === type.key && styles.filterTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.transactionsList}>
          {transactions
            .filter(t => activeTab === 'all' || t.type === activeTab)
            .map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
        </ScrollView>
      </View>
    </ThemedView>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'donation': return { name: 'heart-outline', color: '#FF6B6B' };
      case 'recharge': return { name: 'add-circle-outline', color: '#3A7AFE' };
      case 'withdraw': return { name: 'remove-circle-outline', color: '#FF9F43' };
      case 'reward': return { name: 'gift-outline', color: '#2ECC71' };
      default: return { name: 'card-outline', color: '#4B5675' };
    }
  };

  const getAmountStyle = (type: string) => {
    return type === 'withdraw'
      ? { color: '#FF6B6B' }
      : { color: '#2ECC71' };
  };

  const icon = getIcon(transaction.type);

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: icon.color + '22' }]}>
        <Ionicons name={icon.name as any} size={20} color={icon.color} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>
          {transaction.type === 'donation' && '爱心捐赠'}
          {transaction.type === 'recharge' && '账户充值'}
          {transaction.type === 'withdraw' && '余额提现'}
          {transaction.type === 'reward' && '获得奖励'}
        </Text>
        <Text style={styles.transactionTime}>
          {new Date(transaction.createdAt).toLocaleString()}
        </Text>
      </View>
      <Text style={[styles.transactionAmount, getAmountStyle(transaction.type)]}>
        {transaction.type === 'withdraw' || transaction.type === 'donation' ? '-' : '+'}¥{transaction.amount.toFixed(2)}
      </Text>
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
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: '#1FBA84',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonOutline: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  actionButtonOutlineText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  featuresRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: -30,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 12,
    color: '#4B5675',
    fontWeight: '600',
  },
  transactionsSection: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
  },
  sectionAction: {
    fontSize: 13,
    color: '#3A7AFE',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F7FB',
  },
  filterChipActive: {
    backgroundColor: '#FF4D8D',
  },
  filterText: {
    fontSize: 12,
    color: '#4B5675',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
  },
  transactionTime: {
    fontSize: 11,
    color: '#8A94A6',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
