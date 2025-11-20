import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAmap } from '@/hooks/use-amap';
import { RegeoResult } from '@/lib/amap-service';

export interface SearchFilters {
  type?: 'cat' | 'dog' | 'other';
  status?: 'needs_rescue' | 'for_adoption' | 'emergency';
  distance?: number;
  days?: number;
  location?: {
    longitude: number;
    latitude: number;
    address?: string;
  };
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  userLocation?: {
    longitude: number;
    latitude: number;
  };
  onLocationSelect?: (location: { longitude: number; latitude: number; address: string }) => void;
}

const PET_TYPES = [
  { label: '全部', value: undefined },
  { label: '猫咪', value: 'cat' },
  { label: '狗狗', value: 'dog' },
  { label: '其他', value: 'other' },
];

const PET_STATUSES = [
  { label: '全部', value: undefined },
  { label: '需救助', value: 'needs_rescue' },
  { label: '待领养', value: 'for_adoption' },
  { label: '紧急', value: 'emergency' },
];

const DISTANCES = [
  { label: '全部', value: undefined },
  { label: '1km', value: 1 },
  { label: '3km', value: 3 },
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
];

const TIME_RANGES = [
  { label: '全部', value: undefined },
  { label: '今天', value: 1 },
  { label: '本周', value: 7 },
  { label: '本月', value: 30 },
];

export const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  userLocation,
  onLocationSelect
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<RegeoResult[]>([]);
  const { searchPOI, inputTips, loading } = useAmap();

  const hasActiveFilters = !!(filters.type || filters.status || filters.distance || filters.days || filters.location);

  // 处理搜索
  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // 先尝试输入提示
      const tips = await inputTips({
        keyword: keyword.trim(),
        location: userLocation,
        datatype: 'poi'
      });

      setSearchResults(tips);
      setShowSearchResults(true);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    }
  };

  // 选择搜索结果
  const handleSelectLocation = (result: RegeoResult) => {
    if (result.location && onLocationSelect) {
      onLocationSelect({
        longitude: result.location.longitude,
        latitude: result.location.latitude,
        address: result.address || result.name || ''
      });

      // 更新筛选条件
      onFiltersChange({
        ...filters,
        location: {
          longitude: result.location.longitude,
          latitude: result.location.latitude,
          address: result.address || result.name || ''
        }
      });

      setSearchKeyword(result.name || result.address || '');
      setShowSearchResults(false);
    }
  };

  // 清除位置
  const handleClearLocation = () => {
    onFiltersChange({
      ...filters,
      location: undefined
    });
    setSearchKeyword('');
    setShowSearchResults(false);
  };

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchKeyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword, userLocation]);

  return (
    <ThemedView style={styles.container}>
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.light.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索地点、POI..."
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={() => setSearchKeyword('')}>
              <Ionicons name="close-circle" size={16} color={Colors.light.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 搜索结果列表 */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <ScrollView style={styles.searchResultsList}>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={result.id || index}
                style={styles.searchResultItem}
                onPress={() => handleSelectLocation(result)}
              >
                <Ionicons name="location-outline" size={16} color={Colors.light.tint} />
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultName}>
                    {result.name || '未知地点'}
                  </Text>
                  <Text style={styles.searchResultAddress} numberOfLines={1}>
                    {result.address || ''}
                  </Text>
                </View>
                {result.distance && (
                  <Text style={styles.searchResultDistance}>
                    {(result.distance / 1000).toFixed(1)}km
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 位置信息显示 */}
      {filters.location && (
        <View style={styles.selectedLocationContainer}>
          <View style={styles.selectedLocationInfo}>
            <Ionicons name="location" size={16} color={Colors.light.tint} />
            <Text style={styles.selectedLocationText} numberOfLines={1}>
              {filters.location.address || '已选择位置'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClearLocation}>
            <Ionicons name="close" size={20} color={Colors.light.icon} />
          </TouchableOpacity>
        </View>
      )}

      {/* 筛选按钮 */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <View style={styles.filterHeader}>
          <Ionicons name="filter-outline" size={20} color={Colors.light.icon} />
          <ThemedText style={styles.filterButtonText}>筛选</ThemedText>
          {hasActiveFilters && (
            <View style={styles.activeFilterDot} />
          )}
        </View>
        <Ionicons
          name={showFilters ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.light.icon}
        />
      </TouchableOpacity>

      {showFilters && (
        <ThemedView style={styles.filtersContent}>
          {/* 动物类型 */}
          <View style={styles.filterSection}>
            <ThemedText style={styles.filterSectionTitle}>动物类型</ThemedText>
            <View style={styles.optionContainer}>
              {PET_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.label}
                  style={[
                    styles.optionButton,
                    filters.type === type.value && styles.optionButtonActive
                  ]}
                  onPress={() => onFiltersChange({ ...filters, type: type.value as any })}
                >
                  <ThemedText style={[
                    styles.optionText,
                    filters.type === type.value && styles.optionTextActive
                  ]}>
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 状态 */}
          <View style={styles.filterSection}>
            <ThemedText style={styles.filterSectionTitle}>状态</ThemedText>
            <View style={styles.optionContainer}>
              {PET_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.label}
                  style={[
                    styles.optionButton,
                    filters.status === status.value && styles.optionButtonActive
                  ]}
                  onPress={() => onFiltersChange({ ...filters, status: status.value as any })}
                >
                  <ThemedText style={[
                    styles.optionText,
                    filters.status === status.value && styles.optionTextActive
                  ]}>
                    {status.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 距离 */}
          <View style={styles.filterSection}>
            <ThemedText style={styles.filterSectionTitle}>距离</ThemedText>
            <View style={styles.optionContainer}>
              {DISTANCES.map((distance) => (
                <TouchableOpacity
                  key={distance.label}
                  style={[
                    styles.optionButton,
                    filters.distance === distance.value && styles.optionButtonActive
                  ]}
                  onPress={() => onFiltersChange({ ...filters, distance: distance.value })}
                >
                  <ThemedText style={[
                    styles.optionText,
                    filters.distance === distance.value && styles.optionTextActive
                  ]}>
                    {distance.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 时间 */}
          <View style={styles.filterSection}>
            <ThemedText style={styles.filterSectionTitle}>时间</ThemedText>
            <View style={styles.optionContainer}>
              {TIME_RANGES.map((time) => (
                <TouchableOpacity
                  key={time.label}
                  style={[
                    styles.optionButton,
                    filters.days === time.value && styles.optionButtonActive
                  ]}
                  onPress={() => onFiltersChange({ ...filters, days: time.value })}
                >
                  <ThemedText style={[
                    styles.optionText,
                    filters.days === time.value && styles.optionTextActive
                  ]}>
                    {time.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 清除按钮 */}
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClearFilters}
            >
              <Ionicons name="refresh-outline" size={16} color={Colors.light.icon} />
              <ThemedText style={styles.clearButtonText}>清除筛选</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.icon,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    padding: 0,
  },
  searchResultsContainer: {
    maxHeight: 200,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.icon,
    marginBottom: 8,
    overflow: 'hidden',
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon,
    gap: 10,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  searchResultDistance: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
  },
  activeFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.tint,
  },
  filtersContent: {
    marginTop: 8,
    padding: 12,
    gap: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  filterSection: {
    gap: 8,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  optionButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  optionText: {
    fontSize: 14,
  },
  optionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.icon,
  },
  clearButtonText: {
    fontSize: 14,
  },
});
