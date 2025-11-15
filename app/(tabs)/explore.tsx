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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { useLocation } from '@/hooks/use-location';
import { PetInfo, PetInfoDB } from '@/lib/database';

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
        : '紧急';

    const badgeColor =
      item.status === 'needs_rescue'
        ? '#FF6B6B'
        : item.status === 'for_adoption'
        ? '#4ECDC4'
        : item.status === 'adopted'
        ? '#2ECC71'
        : '#FF9F43';

    const typeAccent =
      item.type === 'cat'
        ? { backgroundColor: 'rgba(255,143,177,0.18)', color: '#FF8FB1' }
        : item.type === 'dog'
        ? { backgroundColor: 'rgba(123,63,228,0.18)', color: '#7B3FE4' }
        : { backgroundColor: 'rgba(58,122,254,0.18)', color: '#3A7AFE' };

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

    const timeLabel = `${Math.max(
      1,
      Math.round((Date.now() - item.createdAt) / (1000 * 60 * 60)),
    )}小时前`;

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
          <View style={styles.photoBadge}>
            <Ionicons name="camera-outline" size={12} color="#fff" />
            <Text style={styles.photoBadgeText}>{photoCount}</Text>
          </View>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.petCardBody}>
          <Text style={styles.petCardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.petCardSubtitle} numberOfLines={2}>
            {item.address || '未知地区'}
          </Text>

          <View style={styles.petTagRow}>
            <View
              style={[
                styles.petTag,
                { backgroundColor: typeAccent.backgroundColor },
              ]}
            >
              <Text style={[styles.petTagText, { color: typeAccent.color }]}>
                {item.type === 'cat' ? '猫咪' : item.type === 'dog' ? '狗狗' : '其它'}
              </Text>
            </View>
            <View style={[styles.petTag, styles.petTagSecondary]}>
              <Text style={[styles.petTagText, styles.petTagSecondaryText]}>
                {item.contactWechat ? '可微信联系' : '留言联系'}
              </Text>
            </View>
          </View>

          <View style={styles.petMetaRow}>
            <View style={styles.petMetaItem}>
              <Ionicons name="location-outline" size={14} color="#8A94A6" />
              <Text style={styles.petMetaText}>{distanceLabel}</Text>
            </View>
            <View style={styles.petMetaItem}>
              <Ionicons name="time-outline" size={14} color="#8A94A6" />
              <Text style={styles.petMetaText}>{timeLabel}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <Ionicons name="compass-outline" size={18} color="#fff" />
          <Text style={styles.heroTitle}>探索更多</Text>
        </View>
        <Text style={styles.heroSubtitle}>搜索宠物、品种、地点，快速找到它们</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#8A94A6" />
            <TextInput
              placeholder="搜索宠物、品种、地点…"
              style={styles.searchInput}
              placeholderTextColor="#8A94A6"
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
                <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={active ? '#fff' : '#6B7CFE'}
                  />
                </View>
                <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
    backgroundColor: '#F5F7FD',
  },
  hero: {
    backgroundColor: '#FF8CB8',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#FF8CB8',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    shadowColor: '#CFD4E8',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    color: '#1F2A44',
    fontSize: 14,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#7B3FE4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B3FE4',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  quickFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  quickFilterActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  quickFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  categoryTab: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: '#fff',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: {
    backgroundColor: '#6B7CFE',
  },
  categoryTabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  categoryTabTextActive: {
    color: '#1F2A44',
  },
  resultsBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultText: {
    color: '#4B5675',
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
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E1E6F5',
  },
  sortSelectorText: {
    color: '#3A7AFE',
    fontWeight: '600',
  },
  sortMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#233042',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    zIndex: 10,
  },
  sortMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortMenuItemText: {
    color: '#4B5675',
    fontSize: 13,
  },
  sortMenuItemTextActive: {
    color: '#3A7AFE',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 160,
  },
  listFooterSpacing: {
    height: 40,
  },
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  petCard: {
    width: '48%',
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#1F2A44',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    overflow: 'hidden',
  },
  petImageWrapper: {
    height: 150,
    backgroundColor: '#DDE5FF',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A16BFE',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  photoBadgeText: {
    color: '#fff',
    fontSize: 11,
  },
  petCardBody: {
    padding: 12,
    gap: 8,
  },
  petCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2A44',
  },
  petCardSubtitle: {
    fontSize: 12,
    color: '#8A94A6',
    minHeight: 30,
  },
  petTagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  petTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  petTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  petTagSecondary: {
    backgroundColor: '#FDECEF',
  },
  petTagSecondaryText: {
    color: '#E65F88',
  },
  petMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  petMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  petMetaText: {
    fontSize: 12,
    color: '#4B5675',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    marginTop: 12,
    color: '#8A94A6',
  },
});
