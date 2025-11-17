import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { MapComponent } from '@/components/MapView';
import { ThemedView } from '@/components/themed-view';
import { useLocation } from '@/hooks/use-location';
import { PetInfo, PetInfoDB } from '@/lib/database';
import { Gradients, Colors, PetStatusBadges } from '@/constants/theme';

const STATUS_FILTERS = [
  { key: 'for_adoption', label: '待领养' },
  { key: 'needs_rescue', label: '需救助' },
  { key: 'emergency', label: '紧急' },
];

const DISTANCE_OPTIONS = [5, 10, 20];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { location, error: locationError } = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>('for_adoption');
  const [distance, setDistance] = useState<number>(5);
  const [petInfos, setPetInfos] = useState<PetInfo[]>([]);

  useEffect(() => {
    const loadPets = async () => {
      if (!location) return;
      try {
        const data = await PetInfoDB.getList({
          status: statusFilter as PetInfo['status'],
          latitude: location.latitude,
          longitude: location.longitude,
          maxDistance: distance,
          days: 30,
          limit: 200,
        });
        setPetInfos(data);
      } catch (err) {
        console.error('load pet infos failed', err);
      }
    };
    loadPets();
  }, [location, statusFilter, distance]);

  const cycleDistance = () => {
    const idx = DISTANCE_OPTIONS.indexOf(distance);
    const nextIdx = (idx + 1) % DISTANCE_OPTIONS.length;
    setDistance(DISTANCE_OPTIONS[nextIdx]);
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.blue} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.brand}>PawLink</Text>
            <Text style={styles.locationLabel}>
              我在 {location?.address || '定位中...'}
            </Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="person-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>搜索附近的宠物...</Text>
          <Ionicons name="options-outline" size={18} color="#9CA3AF" />
        </View>

        <View style={styles.statusRow}>
          {STATUS_FILTERS.map((item) => {
            const active = statusFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.statusChip, active && styles.statusChipActive]}
                onPress={() => setStatusFilter(item.key)}
              >
                {item.key === 'for_adoption' && (
                  <Ionicons name="heart-outline" size={12} color={active ? '#3B82F6' : 'rgba(255,255,255,0.9)'} />
                )}
                {item.key === 'needs_rescue' && (
                  <Ionicons name="medkit-outline" size={12} color={active ? '#3B82F6' : 'rgba(255,255,255,0.9)'} />
                )}
                {item.key === 'emergency' && (
                  <Ionicons name="warning-outline" size={12} color={active ? '#3B82F6' : 'rgba(255,255,255,0.9)'} />
                )}
                <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.distanceChip} onPress={cycleDistance}>
            <Ionicons name="location-outline" size={14} color="#fff" />
            <Text style={styles.distanceChipText}>{distance}km内</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapSection}>
          <MapComponent
            onMarkerPress={(petInfo) =>
              router.push({ pathname: '/pet-detail', params: { id: petInfo.id } })
            }
          />
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="add" size={18} color="#1F2A44" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="remove" size={18} color="#1F2A44" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="locate" size={18} color="#1F2A44" />
            </TouchableOpacity>
          </View>

          <View style={styles.legendRow}>
            <LegendDot color="#FF6B6B" label="紧急救助" />
            <LegendDot color="#4ECDC4" label="待领养" />
            <LegendDot color="#2ECC71" label="已救助" />
          </View>
          <View style={styles.mapLocationChip}>
            <Ionicons name="location" size={16} color="#2C6CFF" />
            <Text style={styles.mapLocationText}>
              我在 {location?.address || '正在定位'}
            </Text>
          </View>
        </View>

        <View style={styles.petCarousel}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petCarouselContent}
          >
            {petInfos.slice(0, 5).map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={styles.petCard}
                onPress={() => router.push({ pathname: '/pet-detail', params: { id: pet.id } })}
              >
                <View style={styles.petImageWrapper}>
                  <Image
                    source={{ uri: pet.images?.[0] || 'https://placekitten.com/400/300' }}
                    style={styles.petImage}
                    contentFit="cover"
                  />
                  <View style={[styles.petBadge, getBadgeStyle(pet.status)]}>
                    <Text style={styles.petBadgeText}>{getStatusLabel(pet.status)}</Text>
                  </View>
                </View>
                <Text style={styles.petTitle} numberOfLines={1}>
                  {pet.title}
                </Text>
                <Text style={styles.petMeta} numberOfLines={1}>
                  {pet.description}
                </Text>
                <Text style={styles.petMetaHint}>
                  {pet.address || '未知地点'} · {getTimeLabel(pet.createdAt)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {locationError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color="#FF6B6B" />
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const STATUS_BADGE_STYLES: Record<PetInfo['status'], { backgroundColor: string }> = {
  for_adoption: { backgroundColor: '#4ECDC4' },
  needs_rescue: { backgroundColor: '#FF6B6B' },
  emergency: { backgroundColor: '#FF9F43' },
  adopted: { backgroundColor: '#2ECC71' },
};

const STATUS_LABELS: Record<PetInfo['status'], string> = {
  for_adoption: '待领养',
  needs_rescue: '需救助',
  emergency: '紧急救助',
  adopted: '已救助',
};

function getBadgeStyle(status: PetInfo['status']) {
  return STATUS_BADGE_STYLES[status] || { backgroundColor: '#4B5675' };
}

function getStatusLabel(status: PetInfo['status']) {
  return STATUS_LABELS[status] || '信息';
}

function getTimeLabel(createdAt: number) {
  const hours = Math.max(1, Math.round((Date.now() - createdAt) / (1000 * 60 * 60)));
  if (hours < 24) {
    return `${hours}小时前`;
  }
  const days = Math.round(hours / 24);
  return `${days}天前`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brand: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#6B7280',
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusChipActive: {
    backgroundColor: '#fff',
  },
  statusChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: '#3B82F6',
  },
  distanceChip: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  distanceChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
    marginTop: -8,
  },
  mapSection: {
    height: 400,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendRow: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  mapLocationChip: {
    position: 'absolute',
    left: 16,
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mapLocationText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  petCarousel: {
    marginTop: 0,
  },
  petCarouselContent: {
    gap: 12,
    paddingRight: 16,
    paddingTop: 8,
  },
  petCard: {
    width: 280,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  petImageWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  petBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  petTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  petMeta: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  petMetaHint: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
  },
});
