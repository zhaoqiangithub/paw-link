import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, FlatList } from 'react-native';
import MapComponent from '@/components/MapView';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocation } from '@/hooks/use-location';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { PetInfo, RecommendationEngine } from '@/lib/database';
import { RecommendationEngine as RecEngine } from '@/lib/recommendation';

export default function HomeScreen() {
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const { user } = useApp();
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleMarkerPress = (petInfo: PetInfo) => {
    Alert.alert(
      petInfo.title,
      `${petInfo.description}\n\n状态: ${petInfo.status === 'needs_rescue' ? '需救助' : petInfo.status === 'for_adoption' ? '待领养' : petInfo.status === 'adopted' ? '已领养' : '紧急'}\n位置: ${petInfo.address}`,
      [
        {
          text: '查看详情',
          onPress: () => {
            // TODO: 导航到详情页
          }
        },
        {
          text: '联系主人',
          onPress: () => {
            // TODO: 打开联系选项
          }
        },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  const handleShowRecommendations = () => {
    setShowRecommendations(!showRecommendations);
  };

  if (locationError) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={64} color={Colors.light.icon} />
          <ThemedText type="title" style={styles.errorTitle}>无法获取位置</ThemedText>
          <ThemedText style={styles.errorText}>{locationError}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <MapComponent onMarkerPress={handleMarkerPress} />
      <View style={styles.fabContainer}>
        <Link href="/publish" asChild>
          <TouchableOpacity style={styles.fab}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          style={[styles.recommendationButton, showRecommendations && styles.recommendationButtonActive]}
          onPress={handleShowRecommendations}
        >
          <Ionicons name="bulb" size={24} color={showRecommendations ? 'white' : Colors.light.tint} />
        </TouchableOpacity>
      </View>

      {/* 智能推荐面板 */}
      {showRecommendations && location && (
        <View style={styles.recommendationPanel}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="star" size={20} color={Colors.light.tint} />
            <ThemedText style={styles.recommendationTitle}>智能推荐</ThemedText>
            <TouchableOpacity onPress={() => setShowRecommendations(false)}>
              <Ionicons name="close" size={24} color={Colors.light.icon} />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.recommendationHint}>
            基于您的位置和行为偏好，为您推荐附近的宠物信息
          </ThemedText>
          <TouchableOpacity style={styles.recommendationAction}>
            <Text style={styles.recommendationActionText}>查看推荐</Text>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recommendationButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  recommendationButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  recommendationPanel: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4.65,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationHint: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 18,
  },
  recommendationAction: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendationActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
