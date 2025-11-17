import React, { useState, useEffect } from 'react';
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

const NOTIFICATION_CATEGORIES = [
  {
    id: 'emergency',
    title: '紧急救助',
    desc: '附近的紧急救助信息',
    icon: 'warning-outline',
    color: '#FF6B6B',
    enabled: true,
    subItems: [
      { id: 'emergency_nearby', title: '附近500米内', enabled: true },
      { id: 'emergency_urgent', title: '紧急程度高', enabled: true },
    ],
  },
  {
    id: 'adoption',
    title: '领养信息',
    desc: '符合您偏好的宠物',
    icon: 'heart-outline',
    color: '#FF4D8D',
    enabled: true,
    subItems: [
      { id: 'adoption_cat', title: '猫咪', enabled: true },
      { id: 'adoption_dog', title: '狗狗', enabled: true },
      { id: 'adoption_other', title: '其他', enabled: false },
    ],
  },
  {
    id: 'volunteer',
    title: '志愿活动',
    desc: '可报名的志愿活动',
    icon: 'people-outline',
    color: '#3A7AFE',
    enabled: true,
    subItems: [
      { id: 'volunteer_tnr', title: 'TNR活动', enabled: true },
      { id: 'volunteer_medical', title: '医疗活动', enabled: true },
      { id: 'volunteer_donation', title: '捐赠活动', enabled: false },
    ],
  },
  {
    id: 'system',
    title: '系统通知',
    desc: '账户安全和重要更新',
    icon: 'notifications-outline',
    color: '#7B3FE4',
    enabled: true,
    subItems: [
      { id: 'system_security', title: '安全提醒', enabled: true },
      { id: 'system_update', title: '版本更新', enabled: true },
      { id: 'system_activity', title: '活动通知', enabled: true },
    ],
  },
  {
    id: 'social',
    title: '社交互动',
    desc: '点赞、评论、关注',
    icon: 'chatbubble-outline',
    color: '#2ECC71',
    enabled: false,
    subItems: [
      { id: 'social_like', title: '获得点赞', enabled: false },
      { id: 'social_comment', title: '收到评论', enabled: false },
      { id: 'social_follow', title: '新粉丝', enabled: false },
    ],
  },
];

export default function NotificationsSettingsScreen() {
  const [categories, setCategories] = useState(NOTIFICATION_CATEGORIES);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState({ enabled: true, start: '22:00', end: '08:00' });
  const [locationBased, setLocationBased] = useState(true);
  const [notificationHistory, setNotificationHistory] = useState([
    { id: 1, title: '附近发现需要救助的猫咪', time: '10分钟前', type: 'emergency' },
    { id: 2, title: '您的积分已到账', time: '1小时前', type: 'system' },
    { id: 3, title: '您关注的小狗找到了新家', time: '2小时前', type: 'adoption' },
    { id: 4, title: '三里屯TNR活动开始报名', time: '3小时前', type: 'volunteer' },
  ]);

  const handleToggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, enabled: !cat.enabled }
        : cat
    ));
  };

  const handleToggleSubItem = (categoryId: string, subItemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subItems: cat.subItems.map(item =>
            item.id === subItemId ? { ...item, enabled: !item.enabled } : item
          )
        };
      }
      return cat;
    }));
  };

  const handleClearHistory = () => {
    Alert.alert(
      '清空通知',
      '确定要清空所有通知记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          onPress: () => setNotificationHistory([]),
          style: 'destructive',
        },
      ]
    );
  };

  const handleTestNotification = (type: string) => {
    Alert.alert('测试通知', `已发送${type}类型的测试通知`);
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.purplePink} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>通知设置</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>个性化您的通知体验</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 推送总开关 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>推送通知</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#CBD2E3', true: '#A855F7' }}
            />
          </View>
        </View>

        {/* 通知分类 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知类型</Text>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '22' }]}>
                    <Ionicons name={category.icon as any} size={20} color={category.color} />
                  </View>
                  <View>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDesc}>{category.desc}</Text>
                  </View>
                </View>
                <Switch
                  value={category.enabled}
                  onValueChange={() => handleToggleCategory(category.id)}
                  trackColor={{ false: '#CBD2E3', true: category.color }}
                />
              </View>

              {category.enabled && category.subItems && (
                <View style={styles.subItems}>
                  {category.subItems.map((subItem) => (
                    <TouchableOpacity
                      key={subItem.id}
                      style={styles.subItem}
                      onPress={() => handleToggleSubItem(category.id, subItem.id)}
                    >
                      <Text style={styles.subItemText}>{subItem.title}</Text>
                      <Ionicons
                        name={subItem.enabled ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={subItem.enabled ? category.color : '#CBD2E3'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 高级设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>高级设置</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={20} color="#4B5675" />
                <Text style={styles.settingTitle}>免打扰时段</Text>
              </View>
              <Switch
                value={quietHours.enabled}
                onValueChange={(val) => setQuietHours(prev => ({ ...prev, enabled: val }))}
                trackColor={{ false: '#CBD2E3', true: '#6366F1' }}
              />
            </View>
            {quietHours.enabled && (
              <View style={styles.quietHoursRow}>
                <TouchableOpacity style={styles.timePicker}>
                  <Text style={styles.timeText}>{quietHours.start}</Text>
                </TouchableOpacity>
                <Text style={styles.timeDivider}>至</Text>
                <TouchableOpacity style={styles.timePicker}>
                  <Text style={styles.timeText}>{quietHours.end}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Ionicons name="location-outline" size={20} color="#4B5675" />
                <View>
                  <Text style={styles.settingTitle}>基于位置</Text>
                  <Text style={styles.settingDesc}>仅接收附近的相关通知</Text>
                </View>
              </View>
              <Switch
                value={locationBased}
                onValueChange={setLocationBased}
                trackColor={{ false: '#CBD2E3', true: '#6366F1' }}
              />
            </View>
          </View>
        </View>

        {/* 测试通知 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>测试通知</Text>
          <View style={styles.testButtonsRow}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.testButton, { backgroundColor: category.color + '22' }]}
                onPress={() => handleTestNotification(category.title)}
              >
                <Ionicons name={category.icon as any} size={16} color={category.color} />
                <Text style={[styles.testButtonText, { color: category.color }]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 通知历史 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近通知</Text>
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearButton}>清空</Text>
            </TouchableOpacity>
          </View>

          {notificationHistory.map((notification) => (
            <View key={notification.id} style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: '#F5F7FB' }]}>
                <Ionicons name="notifications-outline" size={16} color="#4B5675" />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyTitle}>{notification.title}</Text>
                <Text style={styles.historyTime}>{notification.time}</Text>
              </View>
            </View>
          ))}
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
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
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
  clearButton: {
    fontSize: 13,
    color: '#3A7AFE',
    fontWeight: '600',
  },
  categoryCard: {
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
  },
  categoryDesc: {
    fontSize: 12,
    color: '#4B5675',
    marginTop: 2,
  },
  subItems: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E9F2',
    gap: 10,
  },
  subItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subItemText: {
    fontSize: 13,
    color: '#4B5675',
  },
  settingCard: {
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
  },
  settingDesc: {
    fontSize: 12,
    color: '#4B5675',
    marginTop: 2,
  },
  quietHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  timePicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A44',
  },
  timeDivider: {
    fontSize: 14,
    color: '#8A94A6',
  },
  testButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
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
  historyContent: {
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
});
