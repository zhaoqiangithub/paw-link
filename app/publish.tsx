import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  View,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useImagePicker, type ImageAsset } from '@/hooks/use-image-picker';
import { useLocation } from '@/hooks/use-location';
import { useApp } from '@/contexts/AppContext';
import { PetInfoDB } from '@/lib/database';
import { Colors } from '@/constants/theme';

const PET_TYPES = [
  { label: '猫咪', value: 'cat', icon: '🐱' },
  { label: '狗狗', value: 'dog', icon: '🐶' },
  { label: '其他', value: 'other', icon: '🐾' },
];

const PET_STATUSES = [
  { label: '需救助', value: 'needs_rescue', color: '#FF9800' },
  { label: '待领养', value: 'for_adoption', color: '#4CAF50' },
  { label: '紧急', value: 'emergency', color: '#FF4444' },
];

export default function PublishScreen() {
  const { user } = useApp();
  const { location, getCurrentLocation } = useLocation();
  const {
    images,
    loading: imageLoading,
    pickMultipleImages,
    takePhoto,
    removeImage,
    clearImages
  } = useImagePicker();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'cat' as 'cat' | 'dog' | 'other',
    status: 'needs_rescue' as 'needs_rescue' | 'for_adoption' | 'emergency',
    contactPhone: '',
    contactWechat: '',
    contactQQ: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('错误', '用户未登录');
      return;
    }

    if (!location) {
      Alert.alert('错误', '请先获取位置信息');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('错误', '请输入标题');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('错误', '请输入描述');
      return;
    }

    try {
      setSubmitting(true);

      const imageUris = images.map(img => img.uri);

      await PetInfoDB.create({
        userId: user.id,
        type: formData.type,
        status: formData.status,
        title: formData.title.trim(),
        description: formData.description.trim(),
        images: imageUris,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '未知地址',
        contactPhone: formData.contactPhone.trim() || undefined,
        contactWechat: formData.contactWechat.trim() || undefined,
        contactQQ: formData.contactQQ.trim() || undefined,
        isActive: 1,
      });

      Alert.alert(
        '成功',
        '信息发布成功！',
        [
          {
            text: '确定',
            onPress: () => {
              clearImages();
              setFormData({
                title: '',
                description: '',
                type: 'cat',
                status: 'needs_rescue',
                contactPhone: '',
                contactWechat: '',
                contactQQ: '',
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error publishing pet info:', error);
      Alert.alert('错误', '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const renderImagePicker = () => (
    <View style={styles.imagePickerContainer}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        图片 ({images.length}/9)
      </ThemedText>
      <View style={styles.imageGrid}>
        {images.map((image, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 9 && (
          <>
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={() => pickMultipleImages(9)}
              disabled={imageLoading}
            >
              <Ionicons name="images-outline" size={32} color={Colors.light.icon} />
              <ThemedText style={styles.addImageText}>相册选择</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={takePhoto}
              disabled={imageLoading}
            >
              <Ionicons name="camera-outline" size={32} color={Colors.light.icon} />
              <ThemedText style={styles.addImageText}>拍照</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.content}>
          {/* 位置信息 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>位置信息</ThemedText>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={!!location}
            >
              <Ionicons name="location-outline" size={20} color={Colors.light.icon} />
              <ThemedText style={styles.locationText}>
                {location ? location.address : '点击获取当前位置'}
              </ThemedText>
              {location && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
            </TouchableOpacity>
          </View>

          {/* 动物类型 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>动物类型</ThemedText>
            <View style={styles.petTypeContainer}>
              {PET_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.petTypeButton,
                    formData.type === type.value && styles.petTypeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, type: type.value as any })}
                >
                  <Text style={styles.petTypeIcon}>{type.icon}</Text>
                  <ThemedText style={[
                    styles.petTypeLabel,
                    formData.type === type.value && styles.petTypeLabelActive
                  ]}>
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 状态 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>状态</ThemedText>
            <View style={styles.statusContainer}>
              {PET_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusButton,
                    formData.status === status.value && { backgroundColor: status.color }
                  ]}
                  onPress={() => setFormData({ ...formData, status: status.value as any })}
                >
                  <ThemedText style={[
                    styles.statusLabel,
                    formData.status === status.value && styles.statusLabelActive
                  ]}>
                    {status.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 图片上传 */}
          {renderImagePicker()}

          {/* 标题 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>标题 *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="输入标题"
              maxLength={50}
            />
          </View>

          {/* 描述 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>详细描述 *</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="详细描述宠物的情况..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* 联系方式 */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>联系方式（可选）</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.contactPhone}
              onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
              placeholder="手机号"
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              value={formData.contactWechat}
              onChangeText={(text) => setFormData({ ...formData, contactWechat: text })}
              placeholder="微信号"
            />
            <TextInput
              style={styles.input}
              value={formData.contactQQ}
              onChangeText={(text) => setFormData({ ...formData, contactQQ: text })}
              placeholder="QQ号"
              keyboardType="number-pad"
            />
          </View>

          {/* 提交按钮 */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <ThemedText style={styles.submitButtonText}>
              {submitting ? '发布中...' : '发布信息'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
  },
  petTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  petTypeButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.icon,
  },
  petTypeButtonActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tint + '20',
  },
  petTypeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  petTypeLabel: {
    fontSize: 14,
  },
  petTypeLabelActive: {
    fontWeight: '600',
    color: Colors.light.tint,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.icon,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusLabelActive: {
    fontWeight: '600',
    color: 'white',
  },
  imagePickerContainer: {
    gap: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageWrapper: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.icon,
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.icon,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
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
