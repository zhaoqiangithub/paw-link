import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedView } from '@/components/themed-view';
import { Gradients } from '@/constants/theme';

const TABS = ['可报名', '我的活动', '成就'] as const;

const EVENTS = [
  {
    id: 'event-1',
    title: '三里屯地区流浪猫救助行动',
    time: '明天 14:00-18:00',
    location: '朝阳区三里屯',
    need: 5,
    signed: 2,
    reward: 50,
    tags: ['捕捉转运', '医疗协助', '合作营救'],
    description:
      '需要志愿者协助捕捉和救助该区域的流浪猫，预计需要4.5小时，请有经验的志愿者报名参加。',
    organizer: '小动物保护协会',
    urgent: true,
  },
  {
    id: 'event-2',
    title: '温榆河沿岸流浪狗巡护',
    time: '周六 09:00-12:00',
    location: '顺义区温榆河公园',
    need: 4,
    signed: 3,
    reward: 30,
    tags: ['巡护', '投喂', '环境清理'],
    description: '联合当地志愿者进行沿岸巡护，投喂并记录流浪动物情况。',
    organizer: '城市流浪动物关怀计划',
    urgent: false,
  },
];

export default function VolunteerScreen() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('可报名');

  const stats = useMemo(
    () => ({
      hours: 68,
      times: 23,
      level: 3,
    }),
    [],
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={Gradients.orangeAmber} style={styles.hero}>
          <View>
            <Text style={styles.heroTitle}>志愿者活动</Text>
            <Text style={styles.heroSubtitle}>坚持每一次出发，守护每一个生命</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>P1 · 榜样</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard label="服务时长(h)" value={stats.hours} />
          <StatCard label="参与次数" value={stats.times} />
          <StatCard label="当前等级" value={`Lv.${stats.level}`} />
        </View>

        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === '可报名' && (
          <View style={styles.eventList}>
            {EVENTS.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                {event.urgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>紧急招募</Text>
                  </View>
                )}
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription}>{event.description}</Text>
                <View style={styles.eventMetaRow}>
                  <EventMeta icon="time-outline" label={event.time} />
                  <EventMeta icon="location-outline" label={event.location} />
                </View>
                <View style={styles.eventMetaRow}>
                  <EventMeta icon="people-outline" label={`已报名 ${event.signed}/${event.need}`} />
                  <EventMeta icon="gift-outline" label={`奖励 ${event.reward} 积分`} />
                </View>
                <View style={styles.tagRow}>
                  {event.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.organizerRow}>
                  <View>
                    <Text style={styles.organizerLabel}>主办方</Text>
                    <Text style={styles.organizerName}>{event.organizer}</Text>
                  </View>
                  <TouchableOpacity style={styles.detailButton}>
                    <Text style={styles.detailButtonText}>查看详情</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.applyButton}>
                  <Text style={styles.applyButtonText}>立即报名</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab !== '可报名' && (
          <View style={styles.placeholder}>
            <Ionicons name="sparkles" size={48} color="#FFC46C" />
            <Text style={styles.placeholderText}>模块开发中，敬请期待</Text>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EventMeta({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.eventMeta}>
      <Ionicons name={icon} size={16} color="#FFB347" />
      <Text style={styles.eventMetaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 6,
  },
  levelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  levelBadgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: -32,
  },
  statCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF8A34',
  },
  statLabel: {
    fontSize: 12,
    color: '#8A94A6',
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#FFE2C7',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FF9F43',
  },
  tabText: {
    color: '#FF9F43',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  eventList: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE5E0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgentText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
  },
  eventDescription: {
    fontSize: 13,
    color: '#4B5675',
    lineHeight: 20,
  },
  eventMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: '#4B5675',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF4E6',
  },
  tagText: {
    fontSize: 12,
    color: '#FF9F43',
    fontWeight: '600',
  },
  organizerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizerLabel: {
    fontSize: 12,
    color: '#8A94A6',
  },
  organizerName: {
    fontSize: 14,
    color: '#1F2A44',
    fontWeight: '600',
    marginTop: 4,
  },
  detailButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FF9F43',
  },
  detailButtonText: {
    color: '#FF9F43',
    fontWeight: '600',
  },
  applyButton: {
    marginTop: 8,
    backgroundColor: '#FF9F43',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  placeholder: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  placeholderText: {
    color: '#8A94A6',
  },
});
