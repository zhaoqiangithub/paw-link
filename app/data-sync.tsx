import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { Gradients } from '@/constants/theme';

const SYNC_SERVICES = [
  {
    id: 'government',
    name: '政府流浪动物管理系统',
    desc: '对接城管局、农业农村局数据',
    icon: 'business-outline',
    color: '#3A7AFE',
    connected: true,
    lastSync: '2小时前',
    syncFrequency: '每日自动',
    dataTypes: ['救助记录', '领养统计', '疫苗注射'],
  },
  {
    id: 'hospital',
    name: '宠物医院系统',
    desc: '对接全市宠物医院数据库',
    icon: 'medkit-outline',
    color: '#2ECC71',
    connected: true,
    lastSync: '1天前',
    syncFrequency: '每周自动',
    dataTypes: ['医疗记录', '疫苗信息', '体检数据'],
  },
  {
    id: 'ecommerce',
    name: '宠物用品电商平台',
    desc: '对接主流宠物电商平台',
    icon: 'storefront-outline',
    color: '#FF9F43',
    connected: false,
    lastSync: '从未',
    syncFrequency: '未连接',
    dataTypes: ['用品购买', '消费记录', '积分'],
  },
  {
    id: 'social',
    name: '社交媒体平台',
    desc: '对接微博、微信等社交平台',
    icon: 'chatbubbles-outline',
    color: '#7B3FE4',
    connected: false,
    lastSync: '从未',
    syncFrequency: '未连接',
    dataTypes: ['分享内容', '关注列表', '动态'],
  },
];

const SYNC_HISTORY = [
  { id: 1, service: '政府系统', type: '救助记录', time: '10分钟前', status: 'success', count: 12 },
  { id: 2, service: '宠物医院', type: '医疗数据', time: '1天前', status: 'success', count: 8 },
  { id: 3, service: '政府系统', type: '疫苗记录', time: '2天前', status: 'success', count: 15 },
  { id: 4, service: '电商平台', type: '购买记录', time: '3天前', status: 'failed', count: 0 },
  { id: 5, service: '政府系统', type: '领养统计', time: '1周前', status: 'success', count: 6 },
];

const DATA_ANALYTICS = [
  {
    title: '数据完整性',
    value: '94.2%',
    change: '+2.3%',
    trend: 'up',
    color: '#2ECC71',
  },
  {
    title: '同步成功率',
    value: '98.5%',
    change: '+0.5%',
    trend: 'up',
    color: '#3A7AFE',
  },
  {
    title: '平均延迟',
    value: '1.2秒',
    change: '-0.3秒',
    trend: 'down',
    color: '#7B3FE4',
  },
  {
    title: '数据冲突',
    value: '3个',
    change: '-5个',
    trend: 'down',
    color: '#FF6B6B',
  },
];

export default function DataSyncScreen() {
  const [autoSync, setAutoSync] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [services, setServices] = useState(SYNC_SERVICES);
  const [syncHistory, setSyncHistory] = useState(SYNC_HISTORY);

  const handleConnectService = (serviceId: string) => {
    Alert.alert(
      '连接服务',
      '确认连接此数据服务？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '连接',
          onPress: () => {
            setServices(prev => prev.map(s =>
              s.id === serviceId
                ? { ...s, connected: true, lastSync: '刚刚' }
                : s
            ));
            Alert.alert('连接成功', '已开始同步数据');
          }
        },
      ]
    );
  };

  const handleDisconnectService = (serviceId: string) => {
    Alert.alert(
      '断开连接',
      '确认断开与此服务的连接？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '断开',
          onPress: () => {
            setServices(prev => prev.map(s =>
              s.id === serviceId
                ? { ...s, connected: false, lastSync: '从未' }
                : s
            ));
            Alert.alert('已断开', '连接已断开');
          }
        },
      ]
    );
  };

  const handleManualSync = () => {
    Alert.alert('同步开始', '正在进行全量数据同步...');
  };

  const handleResolveConflict = (conflictId: number) => {
    Alert.alert(
      '解决冲突',
      '选择保留哪个版本？',
      [
        { text: '本地版本', onPress: () => console.log('保留本地') },
        { text: '云端版本', onPress: () => console.log('保留云端') },
        { text: '手动合并', onPress: () => router.push('/merge-data') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const connectedServices = services.filter(s => s.connected);

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.greenTeal} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>数据同步</Text>
          <TouchableOpacity style={styles.syncButton} onPress={handleManualSync}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.syncStatusCard}>
          <View style={styles.syncStatusHeader}>
            <Ionicons name="cloud-outline" size={24} color="#fff" />
            <Text style={styles.syncStatusTitle}>云端同步</Text>
            <View style={styles.syncStatusDot} />
          </View>
          <Text style={styles.syncStatusDesc}>
            已连接 {connectedServices.length} 个服务 · 最近同步: 2小时前
          </Text>
        </View>

        <View style={styles.statsRow}>
          {DATA_ANALYTICS.map((item, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.title}</Text>
              <View style={styles.trendRow}>
                <Ionicons
                  name={item.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={item.color}
                />
                <Text style={[styles.trendText, { color: item.color }]}>{item.change}</Text>
              </View>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>同步设置</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="refresh-circle-outline" size={20} color="#4B5675" />
            <View>
              <Text style={styles.settingLabel}>自动同步</Text>
              <Text style={styles.settingHint}>在后台自动同步数据</Text>
            </View>
          </View>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: '#CBD2E3', true: '#1FBA84' }}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="wifi-outline" size={20} color="#4B5675" />
            <View>
              <Text style={styles.settingLabel}>仅在WiFi下同步</Text>
              <Text style={styles.settingHint}>节省移动数据</Text>
            </View>
          </View>
          <Switch
            value={wifiOnly}
            onValueChange={setWifiOnly}
            trackColor={{ false: '#CBD2E3', true: '#1FBA84' }}
          />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 连接的第三方服务 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第三方服务</Text>
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={[styles.serviceIcon, { backgroundColor: service.color + '22' }]}>
                  <Ionicons name={service.icon as any} size={24} color={service.color} />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDesc}>{service.desc}</Text>
                  <View style={styles.serviceMetaRow}>
                    <Text style={styles.serviceMeta}>
                      最近同步: {service.lastSync}
                    </Text>
                    <Text style={styles.serviceMeta}>
                      频率: {service.syncFrequency}
                    </Text>
                  </View>
                </View>
                {service.connected ? (
                  <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={() => handleDisconnectService(service.id)}
                  >
                    <Ionicons name="link-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => handleConnectService(service.id)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#1FBA84" />
                  </TouchableOpacity>
                )}
              </View>

              {service.connected && (
                <View style={styles.dataTypesRow}>
                  <Text style={styles.dataTypesLabel}>数据类型:</Text>
                  <View style={styles.dataTypesList}>
                    {service.dataTypes.map((type, index) => (
                      <View key={index} style={styles.dataTypeTag}>
                        <Text style={styles.dataTypeText}>{type}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 同步历史 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>同步历史</Text>
            <TouchableOpacity onPress={() => router.push('/sync-history')}>
              <Text style={styles.seeAllButton}>查看全部</Text>
            </TouchableOpacity>
          </View>
          {syncHistory.map((record) => (
            <View key={record.id} style={styles.historyItem}>
              <View style={[
                styles.historyIcon,
                { backgroundColor: record.status === 'success' ? '#E8F8EE' : '#FFE8E8' }
              ]}>
                <Ionicons
                  name={record.status === 'success' ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={record.status === 'success' ? '#2ECC71' : '#FF6B6B'}
                />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>
                  {record.service} - {record.type}
                </Text>
                <Text style={styles.historyTime}>{record.time}</Text>
              </View>
              <View style={styles.historyStats}>
                <Text style={styles.historyCount}>{record.count} 条</Text>
                <Text style={[
                  styles.historyStatus,
                  { color: record.status === 'success' ? '#2ECC71' : '#FF6B6B' }
                ]}>
                  {record.status === 'success' ? '成功' : '失败'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 数据冲突 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>待解决冲突</Text>
          <TouchableOpacity style={styles.conflictCard} onPress={() => handleResolveConflict(1)}>
            <View style={styles.conflictHeader}>
              <Ionicons name="alert-circle-outline" size={20} color="#FF9F43" />
              <Text style={styles.conflictTitle}>数据版本冲突</Text>
            </View>
            <Text style={styles.conflictDesc}>
              检测到 3 个数据冲突，需要手动处理
            </Text>
            <Text style={styles.conflictHint}>点击查看详情</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
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
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncStatusCard: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  syncStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  syncStatusTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  syncStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ECC71',
  },
  syncStatusDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FB',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
  },
  settingHint: {
    fontSize: 12,
    color: '#8A94A6',
    marginTop: 2,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
  },
  seeAllButton: {
    fontSize: 13,
    color: '#3A7AFE',
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#4B5675',
    marginBottom: 6,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceMeta: {
    fontSize: 11,
    color: '#8A94A6',
  },
  connectButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataTypesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E9F2',
  },
  dataTypesLabel: {
    fontSize: 12,
    color: '#8A94A6',
  },
  dataTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  dataTypeTag: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dataTypeText: {
    fontSize: 10,
    color: '#4B5675',
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FB',
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    color: '#1F2A44',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 11,
    color: '#8A94A6',
  },
  historyStats: {
    alignItems: 'flex-end',
  },
  historyCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2A44',
  },
  historyStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  conflictCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  conflictTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A44',
  },
  conflictDesc: {
    fontSize: 12,
    color: '#4B5675',
    marginBottom: 4,
  },
  conflictHint: {
    fontSize: 11,
    color: '#FF9F43',
    fontWeight: '600',
  },
});
