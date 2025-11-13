import React, { useState, useEffect } from 'react';
import { FlatList, RefreshControl, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PetInfoCard } from '@/components/PetInfoCard';
import { SearchFiltersComponent, type SearchFilters } from '@/components/SearchFilters';
import { useLocation } from '@/hooks/use-location';
import { useApp } from '@/contexts/AppContext';
import { PetInfo, PetInfoDB } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';

export default function ExploreScreen() {
  const { user } = useApp();
  const { location } = useLocation();
  const [petInfos, setPetInfos] = useState<PetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const loadPetInfos = async (applyFilters: SearchFilters = filters) => {
    if (!location) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await PetInfoDB.getList({
        type: applyFilters.type,
        status: applyFilters.status,
        latitude: location.latitude,
        longitude: location.longitude,
        maxDistance: applyFilters.distance || 10,
        days: applyFilters.days || 30,
        limit: 100
      });
      setPetInfos(data);
    } catch (error) {
      console.error('Error loading pet infos:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPetInfos();
  }, [location]);

  useEffect(() => {
    loadPetInfos(filters);
  }, [filters]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPetInfos();
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handlePetInfoPress = (petInfo: PetInfo) => {
    // TODO: 导航到详情页或显示详情模态框
    Alert.alert(
      petInfo.title,
      `${petInfo.description}\n\n类型: ${petInfo.type === 'cat' ? '猫咪' : petInfo.type === 'dog' ? '狗狗' : '其他'}\n状态: ${petInfo.status === 'needs_rescue' ? '需救助' : petInfo.status === 'for_adoption' ? '待领养' : petInfo.status === 'adopted' ? '已领养' : '紧急'}\n位置: ${petInfo.address}`,
      [
        {
          text: '联系主人',
          onPress: () => {
            // TODO: 打开联系选项
            if (petInfo.contactPhone) {
              Alert.alert('联系方式', `手机号: ${petInfo.contactPhone}`);
            } else {
              Alert.alert('提示', '主人未提供联系方式');
            }
          }
        },
        { text: '关闭', style: 'cancel' }
      ]
    );
  };

  if (!location) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="location-outline" size={64} color="gray" />
        <ThemedText style={{ marginTop: 16 }}>请先获取位置信息</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SearchFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      <FlatList
        data={petInfos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PetInfoCard petInfo={item} onPress={() => handlePetInfoPress(item)} />
        )}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
            <Ionicons name="search-outline" size={64} color="gray" />
            <ThemedText style={{ marginTop: 16, fontSize: 16 }}>
              {Object.keys(filters).length > 0 ? '没有符合条件的信息' : '暂无信息'}
            </ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}
