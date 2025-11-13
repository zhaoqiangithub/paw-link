import React from 'react';
import { TouchableOpacity, StyleSheet, Image, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { PetInfo } from '@/lib/database';
import { Colors } from '@/constants/theme';

interface PetInfoCardProps {
  petInfo: PetInfo;
  onPress: () => void;
}

export const PetInfoCard: React.FC<PetInfoCardProps> = ({ petInfo, onPress }) => {
  const getStatusColor = (status: string) => {
    if (status === 'emergency') return '#FF4444';
    if (status === 'needs_rescue') return '#FF9800';
    if (status === 'for_adoption') return '#4CAF50';
    if (status === 'adopted') return '#9E9E9E';
    return '#2196F3';
  };

  const getStatusText = (status: string) => {
    if (status === 'needs_rescue') return '需救助';
    if (status === 'for_adoption') return '待领养';
    if (status === 'adopted') return '已领养';
    if (status === 'emergency') return '紧急';
    return status;
  };

  const getTypeText = (type: string) => {
    if (type === 'cat') return '🐱 猫咪';
    if (type === 'dog') return '🐶 狗狗';
    return '🐾 其他';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return `${Math.floor(days / 30)}个月前`;
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView style={styles.card}>
        {petInfo.images && petInfo.images.length > 0 && (
          <Image source={{ uri: petInfo.images[0] }} style={styles.image} />
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.title} numberOfLines={1}>
              {petInfo.title}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(petInfo.status) }]}>
              <ThemedText style={styles.statusText}>
                {getStatusText(petInfo.status)}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.description} numberOfLines={2}>
            {petInfo.description}
          </ThemedText>
          <View style={styles.footer}>
            <ThemedText style={styles.type}>{getTypeText(petInfo.type)}</ThemedText>
            <View style={styles.location}>
              <Ionicons name="location-outline" size={14} color={Colors.light.icon} />
              <ThemedText style={styles.locationText} numberOfLines={1}>
                {petInfo.address}
              </ThemedText>
            </View>
            <ThemedText style={styles.date}>
              {formatDate(petInfo.createdAt)}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  type: {
    fontSize: 12,
  },
  location: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.7,
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
});
