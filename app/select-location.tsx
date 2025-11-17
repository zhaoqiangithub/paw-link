import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SelectLocationScreen() {
  const router = useRouter();

  const handleConfirm = () => {
    // 直接返回，不验证位置选择
    router.back();
  };

  const handleSkip = () => {
    Alert.alert(
      '跳过定位',
      '未设置位置可能影响信息展示，是否确认跳过？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '跳过',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>选择位置</Text>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>跳过</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color="#CBD2E3" />
          <Text style={styles.mapText}>地图功能开发中</Text>
          <Text style={styles.mapHint}>请使用浏览器定位或手动输入位置</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>
            确认位置
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FF',
  },
  header: {
    backgroundColor: '#3A7AFE',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F5F7FB',
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2A44',
  },
  mapHint: {
    fontSize: 14,
    color: '#8A94A6',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E7F3',
  },
  confirmButton: {
    borderRadius: 28,
    paddingVertical: 16,
    backgroundColor: '#3477FF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
