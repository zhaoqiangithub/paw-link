import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/contexts/AppContext';
import { useImagePicker } from '@/hooks/use-image-picker';
import { useLocation } from '@/hooks/use-location';
import { PetInfoDB } from '@/lib/database';
import { AIModerationService } from '@/lib/services/ai-moderation';
import { Gradients } from '@/constants/theme';

const PET_TYPES = [
  { label: '猫咪', value: 'cat', icon: '🐱' },
  { label: '狗狗', value: 'dog', icon: '🐶' },
  { label: '其他', value: 'other', icon: '🐾' },
] as const;

const FORM_STEPS = ['选择类型', '基本信息', '位置', '完成'] as const;

const PUBLISH_TYPE_OPTIONS = [
  {
    label: '紧急救助',
    value: 'emergency',
    description: '发现受伤或需要帮助的动物',
    icon: 'medkit-outline',
    tint: '#FFF5F5',
    iconColor: '#FF6B6B',
  },
  {
    label: '待领养',
    value: 'for_adoption',
    description: '为流浪动物寻找领养家庭',
    icon: 'heart-outline',
    tint: '#F5F8FF',
    iconColor: '#3A7AFE',
  },
  {
    label: '临时寄养',
    value: 'needs_rescue',
    description: '为动物提供临时住所',
    icon: 'home-outline',
    tint: '#F3FFF7',
    iconColor: '#38C172',
  },
] as const;

const GENDER_OPTIONS = [
  { label: '雄性', value: 'male', icon: 'male' },
  { label: '雌性', value: 'female', icon: 'female' },
] as const;

const AGE_OPTIONS = [
  { label: '幼年', value: 'young' },
  { label: '成年', value: 'adult' },
  { label: '老年', value: 'senior' },
] as const;

const HEALTH_OPTIONS = [
  { label: '受伤', value: 'injured', color: '#FF6B6B' },
  { label: '生病', value: 'sick', color: '#FF9F43' },
  { label: '已疫苗', value: 'vaccinated', color: '#3A7AFE' },
  { label: '已绝育', value: 'sterilized', color: '#7B3FE4' },
  { label: '健康', value: 'healthy', color: '#2ECC71' },
] as const;

export default function PublishScreen() {
  const router = useRouter();
  const { user } = useApp();
  const { location, getCurrentLocation } = useLocation();
  const {
    images,
    loading: imageLoading,
    pickMultipleImages,
    takePhoto,
    removeImage,
    clearImages,
  } = useImagePicker();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'cat' as 'cat' | 'dog' | 'other',
    status: 'needs_rescue' as 'needs_rescue' | 'for_adoption' | 'emergency',
    gender: 'male' as 'male' | 'female',
    age: 'adult' as 'young' | 'adult' | 'senior',
    health: 'injured' as (typeof HEALTH_OPTIONS)[number]['value'],
    contactPhone: '',
    contactWechat: '',
    contactQQ: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0: 发布类型, 1: 基本信息, 2: 选择位置, 3: 完成

  // 创建refs
  const scrollViewRef = useRef<ScrollView>(null);

  // 计算进度
  const progressWidth = `${((currentStepIndex + 1) / FORM_STEPS.length) * 100}%`;
  const currentStepLabel = FORM_STEPS[currentStepIndex];

  // 获取按钮文本
  const getActionButtonText = () => {
    if (currentStepIndex === 0) return '下一步 · 基本信息';
    if (currentStepIndex === 1) return '下一步 · 选择位置';
    if (currentStepIndex === 2) {
      return location ? '发布信息' : '选择位置';
    }
    return '下一步';
  };

  // 滚动监听来确定当前步骤
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;

    // 计算滚动位置百分比
    const scrollPercent = offsetY / Math.max(contentHeight - scrollViewHeight, 1);

    // 根据滚动位置更新步骤（仅在未选择位置时）
    if (currentStepIndex < 2) {
      if (scrollPercent < 0.3) {
        setCurrentStepIndex(0); // 发布类型
      } else if (scrollPercent < 0.7) {
        setCurrentStepIndex(1); // 基本信息
      } else {
        setCurrentStepIndex(2); // 选择位置
      }
    }
  };

  // 监听路由返回，更新步骤状态
  useEffect(() => {
    const unsubscribe = router.addListener?.('focus', () => {
      // 当从位置选择页面返回时，如果已有位置，则进入"完成"步骤
      if (location) {
        setCurrentStepIndex(3); // 完成步骤
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [location]);

  const genderLabel = useMemo(
    () => GENDER_OPTIONS.find((g) => g.value === formData.gender)?.label ?? '',
    [formData.gender],
  );
  const ageLabel = useMemo(
    () => AGE_OPTIONS.find((a) => a.value === formData.age)?.label ?? '',
    [formData.age],
  );
  const healthLabel = useMemo(
    () => HEALTH_OPTIONS.find((h) => h.value === formData.health)?.label ?? '',
    [formData.health],
  );

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('错误', '用户未登录');
      return;
    }
    if (!location) {
      Alert.alert('提示', '请先完成定位，方便附近的志愿者找到它');
      return;
    }
    if (!formData.title.trim()) {
      Alert.alert('提示', '给它起个名字吧');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('提示', '请描述动物的情况');
    }
    if (images.length < 1) {
      Alert.alert('提示', '请至少上传1张照片');
      return;
    }

    try {
      setSubmitting(true);
      const imageUris = images.map((img) => img.uri);
      const description = `${formData.description.trim()}\n\n【性别】${genderLabel}\n【年龄】${ageLabel}\n【健康状况】${healthLabel}`;

      // AI 审核
      const moderationResult = await AIModerationService.moderate({
        images: imageUris,
        description,
        title: formData.title.trim(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || '未知地址'
        },
        userId: user.id
      });

      // 审核不通过
      if (!moderationResult.passed) {
        const message = `内容审核未通过：\n\n${moderationResult.reasons.join('\n')}${
          moderationResult.suggestions && moderationResult.suggestions.length > 0
            ? `\n\n建议：\n${moderationResult.suggestions.join('\n')}`
            : ''
        }`;
        Alert.alert('审核提示', message);
        return;
      }

      // 保存到数据库
      await PetInfoDB.create({
        userId: user.id,
        type: formData.type,
        status: formData.status,
        title: formData.title.trim(),
        description,
        images: imageUris,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '未知地址',
        contactPhone: formData.contactPhone.trim() || undefined,
        contactWechat: formData.contactWechat.trim() || undefined,
        contactQQ: formData.contactQQ.trim() || undefined,
        isActive: 1,
      });

      Alert.alert('提交成功', '信息已发布，感谢您为它发声！', [
        {
          text: '好的',
          onPress: () => {
            clearImages();
            setFormData({
              title: '',
              description: '',
              type: 'cat',
              status: 'needs_rescue',
              gender: 'male',
              age: 'adult',
              health: 'injured',
              contactPhone: '',
              contactWechat: '',
              contactQQ: '',
            });
          },
        },
      ]);
    } catch (error) {
      console.error('publish failed', error);
      Alert.alert('错误', '发布失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrimaryAction = () => {
    if (currentStepIndex === 0) {
      // 当前在发布类型步骤，滚动到基本信息
      setCurrentStepIndex(1);
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    } else if (currentStepIndex === 1) {
      // 当前在基本信息步骤，进入位置选择
      setCurrentStepIndex(2);
      router.push('/select-location');
    } else if (currentStepIndex === 2) {
      // 如果已有位置，直接提交
      if (location) {
        handleSubmit();
      } else {
        router.push('/select-location');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSaveDraft = () => {
    Alert.alert('提示', '草稿功能即将上线，敬请期待。');
  };

  const renderImagePicker = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIcon}>
          <Ionicons name="images-outline" size={16} color="#3A7AFE" />
        </View>
        <Text style={styles.sectionTitle}>照片上传</Text>
        <Text style={styles.sectionHint}>(最多9张)</Text>
      </View>
      <Text style={styles.sectionDescription}>清晰的照片能帮助志愿者快速判断状况</Text>
      <View style={styles.photoList}>
        {images.map((image, index) => (
          <View key={index} style={styles.photoThumb}>
            <Image source={{ uri: image.uri }} style={styles.photoImage} />
            <TouchableOpacity style={styles.photoRemove} onPress={() => removeImage(index)}>
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {images.length < 9 && (
          <TouchableOpacity
            style={styles.addPhotoTile}
            onPress={() => pickMultipleImages(9)}
            disabled={imageLoading}
          >
            <Ionicons name="image-outline" size={26} color="#8A94A6" />
            <Text style={styles.addPhotoLabel}>相册选择</Text>
          </TouchableOpacity>
        )}

        {images.length < 9 && (
          <TouchableOpacity style={styles.addPhotoTile} onPress={takePhoto} disabled={imageLoading}>
            <Ionicons name="camera-outline" size={26} color="#8A94A6" />
            <Text style={styles.addPhotoLabel}>拍照</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.fixedHeader}>
          <LinearGradient colors={Gradients.blue} style={styles.headerGradient}>
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.navButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>发布救助信息</Text>
              <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
                <Text style={styles.draftText}>保存草稿</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>{currentStepLabel}</Text>
              <Text style={styles.progressCount}>
                {currentStepIndex + 1}/{FORM_STEPS.length}
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>
          </LinearGradient>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <ThemedView style={styles.body}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>选择发布类型</Text>
                <Text style={styles.sectionDescription}>为它选择最符合的分类</Text>
              </View>
              <View style={styles.typeGrid}>
                {PUBLISH_TYPE_OPTIONS.map((option) => {
                  const active = formData.status === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.typeOption, active && styles.typeOptionActive]}
                      onPress={() => setFormData({ ...formData, status: option.value })}
                    >
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: active ? '#3A7AFE' : option.tint },
                        ]}
                      >
                        <Ionicons
                          name={option.icon as any}
                          size={22}
                          color={active ? '#fff' : option.iconColor}
                        />
                      </View>
                      <Text style={styles.typeOptionTitle}>{option.label}</Text>
                      <Text style={styles.typeOptionDesc}>{option.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="paw-outline" size={16} color="#3A7AFE" />
                </View>
                <Text style={styles.sectionTitle}>基本信息</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>宠物昵称 *</Text>
                <TextInput
                  placeholder="给它起一个名字吧"
                  placeholderTextColor="#A7AEC1"
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>动物类型 *</Text>
                <View style={styles.petTypeRow}>
                  {PET_TYPES.map((type) => {
                    const active = formData.type === type.value;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        style={[styles.typeButton, active && styles.typeButtonActive]}
                        onPress={() => setFormData({ ...formData, type: type.value })}
                      >
                        <Text style={styles.typeIcon}>{type.icon}</Text>
                        <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>性别 *</Text>
                <View style={styles.genderRow}>
                  {GENDER_OPTIONS.map((option) => {
                    const active = formData.gender === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.genderButton, active && styles.genderButtonActive]}
                        onPress={() => setFormData({ ...formData, gender: option.value })}
                      >
                        <Ionicons
                          name={option.icon as any}
                          size={18}
                          color={active ? '#3A7AFE' : '#8A94A6'}
                        />
                        <Text style={[styles.genderText, active && styles.genderTextActive]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>年龄阶段 *</Text>
                <View style={styles.ageRow}>
                  {AGE_OPTIONS.map((option) => {
                    const active = formData.age === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.ageChip, active && styles.ageChipActive]}
                        onPress={() => setFormData({ ...formData, age: option.value })}
                      >
                        <Text style={[styles.ageChipText, active && styles.ageChipTextActive]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>详细描述 *</Text>
                <TextInput
                  placeholder="描述动物的外观、性格、健康状况、发现经过等..."
                  placeholderTextColor="#A7AEC1"
                  style={styles.textArea}
                  multiline
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                />
              </View>

              <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
                <Text style={styles.fieldLabel}>健康状况 *</Text>
                <View style={styles.healthRow}>
                  {HEALTH_OPTIONS.map((option) => {
                    const active = formData.health === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.healthChip, active && styles.healthChipActive]}
                        onPress={() => setFormData({ ...formData, health: option.value })}
                      >
                        <Text
                          style={[styles.healthChipText, active && styles.healthChipTextActive]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {renderImagePicker()}

            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="call-outline" size={16} color="#3A7AFE" />
                </View>
                <Text style={styles.sectionTitle}>联系方式（可选）</Text>
              </View>
              <Text style={styles.sectionDescription}>
                留下联系方式便于志愿者与您取得联系
              </Text>
              <TextInput
                style={styles.input}
                placeholder="手机号"
                keyboardType="phone-pad"
                placeholderTextColor="#A7AEC1"
                value={formData.contactPhone}
                onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="微信号"
                placeholderTextColor="#A7AEC1"
                value={formData.contactWechat}
                onChangeText={(text) => setFormData({ ...formData, contactWechat: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="QQ号"
                placeholderTextColor="#A7AEC1"
                keyboardType="number-pad"
                value={formData.contactQQ}
                onChangeText={(text) => setFormData({ ...formData, contactQQ: text })}
              />
            </View>
          </ThemedView>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryAction, submitting && styles.primaryActionDisabled]}
            onPress={handlePrimaryAction}
            disabled={submitting}
          >
            <Text style={styles.primaryActionText}>
              {submitting ? '发布中...' : getActionButtonText()}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F7FF',
  },
  scrollContent: {
    paddingTop: 180,
    paddingBottom: 180,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
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
  draftButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  draftText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  progressInfo: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  progressCount: {
    color: '#fff',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  body: {
    marginTop: -32,
    paddingHorizontal: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#1F2A44',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#8A94A6',
    lineHeight: 18,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  typeOption: {
    width: '47%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EAF5',
    padding: 16,
    backgroundColor: '#F8F9FF',
  },
  typeOptionActive: {
    borderColor: '#3A7AFE',
    backgroundColor: '#EEF3FF',
    shadowColor: '#3A7AFE',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  typeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2A44',
  },
  typeOptionDesc: {
    fontSize: 12,
    color: '#8A94A6',
    marginTop: 6,
    lineHeight: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
  },
  sectionHint: {
    marginLeft: 8,
    color: '#8A94A6',
    fontSize: 12,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#4B5675',
    fontWeight: '600',
    marginBottom: 10,
  },
  petTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E7F3',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F9FAFF',
  },
  typeButtonActive: {
    borderColor: '#3A7AFE',
    backgroundColor: '#EEF3FF',
  },
  typeIcon: {
    fontSize: 24,
  },
  typeLabel: {
    marginTop: 6,
    fontWeight: '600',
    color: '#4B5675',
  },
  typeLabelActive: {
    color: '#3A7AFE',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E7F3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFF',
  },
  genderButtonActive: {
    borderColor: '#3A7AFE',
    backgroundColor: '#EAF1FF',
  },
  genderText: {
    color: '#4B5675',
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#3A7AFE',
  },
  ageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ageChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E7F3',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F9FAFF',
  },
  ageChipActive: {
    borderColor: '#3A7AFE',
    backgroundColor: '#EAF1FF',
  },
  ageChipText: {
    color: '#4B5675',
    fontWeight: '600',
  },
  ageChipTextActive: {
    color: '#3A7AFE',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E7F3',
    backgroundColor: '#F9FAFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1F2A44',
  },
  textArea: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E7F3',
    backgroundColor: '#F9FAFF',
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#1F2A44',
  },
  healthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  healthChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E7F3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F9FAFF',
  },
  healthChipActive: {
    borderColor: '#3A7AFE',
    backgroundColor: '#EAF1FF',
  },
  healthChipText: {
    fontSize: 12,
    color: '#4B5675',
    fontWeight: '600',
  },
  healthChipTextActive: {
    color: '#3A7AFE',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  photoThumb: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoTile: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7DEED',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFF',
    gap: 6,
  },
  addPhotoLabel: {
    fontSize: 12,
    color: '#8A94A6',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E2E7F3',
  },
  primaryAction: {
    borderRadius: 28,
    paddingVertical: 16,
    backgroundColor: '#3477FF',
    alignItems: 'center',
    shadowColor: '#3477FF',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryActionDisabled: {
    opacity: 0.6,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
