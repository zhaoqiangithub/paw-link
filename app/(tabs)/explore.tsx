import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { useLocation } from '@/hooks/use-location';
import { PetInfo, PetInfoDB } from '@/lib/database';
import { Gradients, Colors, PetTypeColors } from '@/constants/theme';

type StatusFilterKey = 'all' | 'needs_rescue' | 'emergency' | 'for_adoption';
type CategoryFilterKey = 'all' | 'cat' | 'dog' | 'other';
type SortKey = 'smart' | 'distance' | 'latest';

const CATEGORY_TABS = [
  { key: 'all', label: '全部', icon: 'apps-outline' },
  { key: 'cat', label: '猫咪', icon: 'fish-outline' },
  { key: 'dog', label: '狗狗', icon: 'paw-outline' },
  { key: 'other', label: '其它', icon: 'leaf-outline' },
] as const;

const SORT_OPTIONS = [
  { key: 'smart', label: '智能排序' },
  { key: 'distance', label: '距离最近' },
  { key: 'latest', label: '最新发布' },
] as const;

const QUICK_FILTERS = [
  {
    key: 'for_adoption',
    label: '待领养',
    icon: 'heart-outline',
    accent: '#FF8FB1',
    type: 'status' as const,
    value: 'for_adoption',
  },
  {
    key: 'emergency',
    label: '热门',
    icon: 'flame-outline',
    accent: '#FFB347',
    type: 'status' as const,
    value: 'emergency',
  },
  {
    key: 'latest',
    label: '最新发布',
    icon: 'flash-outline',
    accent: '#A16BFE',
    type: 'sort' as const,
    value: 'latest',
  },
  {
    key: 'needs_help',
    label: '需要帮助',
    icon: 'medkit-outline',
    accent: '#FF6B6B',
    type: 'status' as const,
    value: 'needs_rescue',
  },
] as const;

export default function ExploreScreen() {
  const { location, calculateDistance } = useLocation();
  const [petInfos, setPetInfos] = useState<PetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>('all');
  const [sortOption, setSortOption] = useState<SortKey>('smart');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const currentSortLabel = useMemo(
    () => SORT_OPTIONS.find((option) => option.key === sortOption)?.label ?? '智能排序',
    [sortOption],
  );

  const handleQuickFilterPress = (filter: (typeof QUICK_FILTERS)[number]) => {
    if (filter.type === 'status') {
      setStatusFilter((prev) =>
        prev === filter.value ? 'all' : (filter.value as StatusFilterKey),
      );
    } else {
      setSortOption((prev) => (prev === filter.value ? 'smart' : (filter.value as SortKey)));
    }
  };

  const loadPetInfos = useCallback(async () => {
    if (!location) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await PetInfoDB.getList({
        latitude: location.latitude,
        longitude: location.longitude,
        maxDistance: 50,
        days: 60,
        limit: 200,
      });
      setPetInfos(data);
    } catch (error) {
      console.error('Failed to load pet infos', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location]);

  useEffect(() => {
    loadPetInfos();
  }, [loadPetInfos]);

  const filteredPets = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return petInfos
      .filter((pet) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'needs_rescue') {
          return pet.status === 'needs_rescue';
        }
        if (statusFilter === 'emergency') {
          return pet.status === 'emergency';
        }
        if (statusFilter === 'for_adoption') {
          return pet.status === 'for_adoption';
        }
        return true;
      })
      .filter((pet) => {
        if (categoryFilter === 'all') return true;
        return pet.type === categoryFilter;
      })
      .filter((pet) => {
        if (!keyword) return true;
        const title = pet.title.toLowerCase();
        const description = pet.description.toLowerCase();
        const address = pet.address?.toLowerCase() ?? '';
        return (
          title.includes(keyword) ||
          description.includes(keyword) ||
          address.includes(keyword)
        );
      })
      .sort((a, b) => {
        if (sortOption === 'latest') {
          return b.createdAt - a.createdAt;
        }
        if (sortOption === 'distance' && location) {
          const distanceA = calculateDistance(
            location.latitude,
            location.longitude,
            a.latitude,
            a.longitude,
          );
          const distanceB = calculateDistance(
            location.latitude,
            location.longitude,
            b.latitude,
            b.longitude,
          );
          return distanceA - distanceB;
        }
        return b.updatedAt - a.updatedAt;
      });
  }, [
    petInfos,
    statusFilter,
    categoryFilter,
    sortOption,
    searchKeyword,
    location,
    calculateDistance,
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPetInfos();
  };

  const renderPetCard = ({ item }: { item: PetInfo }) => {
    const statusLabel =
      item.status === 'needs_rescue'
        ? '需救助'
        : item.status === 'for_adoption'
        ? '待领养'
        : item.status === 'adopted'
        ? '已救助'
        : item.status === 'emergency'
        ? '紧急'
        : '未知';

    const badgeColor =
      item.status === 'needs_rescue'
        ? '#EF4444'
        : item.status === 'for_adoption'
        ? '#3B82F6'
        : item.status === 'adopted'
        ? '#22C55E'
        : item.status === 'emergency'
        ? '#F59E0B'
        : '#6B7280';

    const typeColors = PetTypeColors[item.type as keyof typeof PetTypeColors] || PetTypeColors.other;

    const distanceLabel = location
      ? `${Math.round(
          calculateDistance(
            location.latitude,
            location.longitude,
            item.latitude,
            item.longitude,
          ) * 10,
        ) / 10}km`
      : '未知';

    const hours = Math.max(1, Math.round((Date.now() - item.createdAt) / (1000 * 60 * 60)));
    const timeLabel = hours < 24 ? `${hours}小时前` : `${Math.round(hours / 24)}天前`;

    const photoCount = item.images?.length ?? 0;

    return (
      <TouchableOpacity
        style={styles.petCard}
        onPress={() =>
          router.push({ pathname: '/pet-detail', params: { id: item.id } })
        }
      >
        <View style={styles.petImageWrapper}>
          {item.images?.[0] ? (
            <Image
              source={{ uri: item.images[0] }}
              style={styles.petImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.petImagePlaceholder}>
              <Ionicons name="paw" size={28} color="#fff" />
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={16} color="#fff" />
          </TouchableOpacity>
          {photoCount > 0 && (
            <View style={styles.photoBadge}>
              <Ionicons name="camera" size={10} color="#fff" />
              <Text style={styles.photoBadgeText}>{photoCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.petCardBody}>
          <Text style={styles.petCardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.petCardSubtitle} numberOfLines={1}>
            {item.description || '暂无描述'}
          </Text>

          <View style={styles.petTagRow}>
            <View style={[styles.petTag, { backgroundColor: typeColors.bg }]}>
              <Text style={[styles.petTagText, { color: typeColors.text }]}>
                {item.type === 'cat' ? '雌性' : item.type === 'dog' ? '雄性' : '成年'}
              </Text>
            </View>
            <View style={[styles.petTag, styles.petTagSecondary]}>
              <Text style={[styles.petTagText, styles.petTagSecondaryText]}>
                {item.type === 'cat' ? '成年' : item.type === 'dog' ? '幼年' : '成年'}
              </Text>
            </View>
          </View>

          <View style={styles.petMetaRow}>
            <View style={styles.petMetaItem}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              <Text style={styles.petMetaText}>{distanceLabel}</Text>
            </View>
            <Text style={styles.petMetaText}>{timeLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.purplePink} style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.heroTitle}>探索更多</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="搜索宠物、品种、地点..."
              style={styles.searchInput}
              placeholderTextColor="#9CA3AF"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickFilters}>
          {QUICK_FILTERS.map((filter) => {
            const active =
              filter.type === 'status'
                ? statusFilter === filter.value
                : sortOption === filter.value;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.quickFilter, active && styles.quickFilterActive]}
                onPress={() => handleQuickFilterPress(filter)}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={14}
                  color={active ? filter.accent : '#fff'}
                />
                <Text
                  style={[
                    styles.quickFilterText,
                    active && { color: filter.accent },
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        {CATEGORY_TABS.map((tab) => {
          const active = categoryFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.categoryTab, active && styles.categoryTabActive]}
              onPress={() => {
                if (tab.key === 'all') {
                  setCategoryFilter('all');
                } else {
                  setCategoryFilter((prev) =>
                    prev === tab.key ? 'all' : tab.key,
                  );
                }
              }}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={active ? '#fff' : '#6B7280'}
              />
              <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.resultsBar}>
        <Text style={styles.resultText}>共找到 {filteredPets.length} 只宠物</Text>
        <View style={styles.sortSelectorWrapper}>
          <TouchableOpacity
            style={styles.sortSelector}
            onPress={() => setSortMenuVisible((prev) => !prev)}
          >
            <Ionicons name="swap-vertical-outline" size={16} color="#3A7AFE" />
            <Text style={styles.sortSelectorText}>{currentSortLabel}</Text>
            <Ionicons
              name={sortMenuVisible ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#3A7AFE"
            />
          </TouchableOpacity>
          {sortMenuVisible && (
            <View style={styles.sortMenu}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.sortMenuItem}
                  onPress={() => {
                    setSortOption(option.key);
                    setSortMenuVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortMenuItemText,
                      option.key === sortOption && styles.sortMenuItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredPets}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.cardRow}
        contentContainerStyle={styles.listContent}
        renderItem={renderPetCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollBeginDrag={() => setSortMenuVisible(false)}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="paw-outline" size={32} color="#8A94A6" />
            <Text style={styles.emptyText}>
              {loading ? '正在加载…' : '暂无符合条件的记录'}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={styles.listFooterSpacing} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#374151',
    fontSize: 14,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
    overflow: 'scroll',
  },
  quickFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quickFilterActive: {
    backgroundColor: '#fff',
  },
  quickFilterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryTabActive: {
    backgroundColor: '#A855F7',
  },
  categoryTabText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  resultsBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  resultText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  sortSelectorWrapper: {
    position: 'relative',
  },
  sortSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sortSelectorText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  sortMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  sortMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortMenuItemText: {
    color: '#374151',
    fontSize: 13,
  },
  sortMenuItemTextActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  listFooterSpacing: {
    height: 40,
  },
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  petCard: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  petImageWrapper: {
    aspectRatio: 1,
    backgroundColor: '#E5E7EB',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9CA3AF',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  photoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  petCardBody: {
    padding: 10,
    gap: 6,
  },
  petCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  petCardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  petTagRow: {
    flexDirection: 'row',
    gap: 4,
  },
  petTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  petTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  petTagSecondary: {
    backgroundColor: '#F3F4F6',
  },
  petTagSecondaryText: {
    color: '#6B7280',
  },
  petMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  petMetaText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    marginTop: 12,
    color: '#9CA3AF',
  },
});
