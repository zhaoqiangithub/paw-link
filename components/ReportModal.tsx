import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { ReportDB, PetInfo } from '@/lib/database';
import { useApp } from '@/contexts/AppContext';
import { Colors } from '@/constants/theme';

interface ReportModalProps {
  petInfo: PetInfo;
  onClose: () => void;
}

const REPORT_REASONS = [
  { label: '虚假信息', value: '虚假信息' },
  { label: '恶意诈骗', value: '恶意诈骗' },
  { label: '恶意骚扰', value: '恶意骚扰' },
  { label: '不当内容', value: '不当内容' },
  { label: '重复发布', value: '重复发布' },
  { label: '其他', value: '其他' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ petInfo, onClose }) => {
  const { user } = useApp();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('错误', '请选择举报原因');
      return;
    }

    if (!user) {
      Alert.alert('错误', '用户未登录');
      return;
    }

    try {
      setSubmitting(true);

      await ReportDB.create({
        reporterId: user.id,
        petInfoId: petInfo.id,
        reason: selectedReason,
        description: description.trim() || undefined
      });

      Alert.alert(
        '举报成功',
        '感谢您的举报，我们将尽快处理',
        [{ text: '确定', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('错误', '举报失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">举报信息</ThemedText>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.light.icon} />
        </TouchableOpacity>
      </View>

      <ThemedText style={styles.petInfoTitle}>{petInfo.title}</ThemedText>

      <ThemedText style={styles.label}>举报原因 *</ThemedText>
      <View style={styles.reasonsContainer}>
        {REPORT_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.value}
            style={[
              styles.reasonButton,
              selectedReason === reason.value && styles.reasonButtonActive
            ]}
            onPress={() => setSelectedReason(reason.value)}
          >
            <ThemedText style={[
              styles.reasonText,
              selectedReason === reason.value && styles.reasonTextActive
            ]}>
              {reason.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedText style={styles.label}>详细描述（可选）</ThemedText>
      <TextInput
        style={styles.descriptionInput}
        value={description}
        onChangeText={setDescription}
        placeholder="请详细描述举报原因..."
        multiline
        numberOfLines={4}
        maxLength={200}
      />

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <ThemedText style={styles.submitButtonText}>
          {submitting ? '提交中...' : '提交举报'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  petInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    opacity: 0.8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reasonButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  reasonButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  reasonText: {
    fontSize: 14,
  },
  reasonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  descriptionInput: {
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.icon,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    padding: 16,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
