import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { Gradients } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { VerificationDB } from '@/lib/database';

const STEPS = [
  { key: 'identity', label: '身份认证', icon: 'card' },
  { key: 'face', label: '人脸验证', icon: 'person' },
  { key: 'phone', label: '手机验证', icon: 'phone-portrait' },
  { key: 'volunteer', label: '志愿者认证', icon: 'ribbon' },
  { key: 'organization', label: '机构认证', icon: 'business' },
];

type VerificationStep = 'identity' | 'face' | 'phone' | 'volunteer' | 'organization';

export default function VerificationScreen() {
  const { user } = useApp();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('identity');
  const [verificationStatus, setVerificationStatus] = useState<Record<string, 'pending' | 'verified' | 'failed'>>({
    identity: 'pending',
    face: 'pending',
    phone: 'pending',
    volunteer: 'pending',
    organization: 'pending',
  });

  const getStepStatus = (stepKey: string) => {
    return verificationStatus[stepKey as VerificationStep] || 'pending';
  };

  const getStepIcon = (step: typeof STEPS[0]) => {
    const status = getStepStatus(step.key);
    if (status === 'verified') return 'checkmark-circle';
    if (status === 'failed') return 'close-circle';
    return step.icon + '-outline';
  };

  const getStepIconColor = (step: typeof STEPS[0]) => {
    const status = getStepStatus(step.key);
    if (status === 'verified') return '#2ECC71';
    if (status === 'failed') return '#FF6B6B';
    return '#CBD2E3';
  };

  const handleStepPress = (stepKey: VerificationStep) => {
    setCurrentStep(stepKey);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'identity':
        return <IdentityVerificationStep onNext={() => handleStepComplete('identity')} />;
      case 'face':
        return <FaceVerificationStep onNext={() => handleStepComplete('face')} />;
      case 'phone':
        return <PhoneVerificationStep onNext={() => handleStepComplete('phone')} />;
      case 'volunteer':
        return <VolunteerVerificationStep onNext={() => handleStepComplete('volunteer')} />;
      case 'organization':
        return <OrganizationVerificationStep onNext={() => handleStepComplete('organization')} />;
      default:
        return null;
    }
  };

  const handleStepComplete = (stepKey: VerificationStep) => {
    setVerificationStatus(prev => ({ ...prev, [stepKey]: 'verified' }));
    const currentIndex = STEPS.findIndex(s => s.key === stepKey);
    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1].key as VerificationStep;
      setCurrentStep(nextStep);
    } else {
      Alert.alert('认证完成', '恭喜！您已完成所有认证流程', [
        { text: '确定', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient colors={Gradients.purplePink} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>身份认证</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>完成认证，解锁更多功能</Text>
      </LinearGradient>

      <View style={styles.stepsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsScroll}>
          {STEPS.map((step) => {
            const isActive = currentStep === step.key;
            return (
              <TouchableOpacity
                key={step.key}
                style={[styles.stepItem, isActive && styles.stepItemActive]}
                onPress={() => handleStepPress(step.key as VerificationStep)}
              >
                <View style={[styles.stepIcon, { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#F5F7FB' }]}>
                  <Ionicons
                    name={getStepIcon(step) as any}
                    size={20}
                    color={isActive ? '#fff' : getStepIconColor(step)}
                  />
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        {renderStepContent()}
      </View>
    </ThemedView>
  );
}

// 身份认证步骤
function IdentityVerificationStep({ onNext }: { onNext: () => void }) {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (type: 'front' | 'back') => {
    Alert.alert(
      '上传身份证',
      '请选择图片来源',
      [
        { text: '相册', onPress: () => console.log('选择相册', type) },
        { text: '拍照', onPress: () => console.log('拍照', type) },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const handleOCR = async () => {
    if (!frontImage || !backImage) {
      Alert.alert('提示', '请先上传身份证正反面照片');
      return;
    }

    setLoading(true);
    try {
      // TODO: 调用OCR API识别身份证信息
      await new Promise(resolve => setTimeout(resolve, 2000));
      setName('张三');
      setIdNumber('110101199001011234');
      Alert.alert('识别成功', '身份证信息已自动填充，请核对');
    } catch (error) {
      Alert.alert('识别失败', '请重新上传清晰的身份证照片');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!name || !idNumber) {
      Alert.alert('提示', '请填写完整的身份信息');
      return;
    }
    Alert.alert('提交成功', '身份信息审核中，预计1-2个工作日', [
      { text: '确定', onPress: onNext }
    ]);
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>上传身份证照片</Text>
      <Text style={styles.stepDesc}>请上传清晰的身份证正反面照片，系统将自动识别信息</Text>

      <View style={styles.imageUploadContainer}>
        <TouchableOpacity style={styles.imageUploadBox} onPress={() => handleImageUpload('front')}>
          {frontImage ? (
            <View style={styles.imagePreview} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={32} color="#CBD2E3" />
              <Text style={styles.imageUploadText}>身份证正面</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.imageUploadBox} onPress={() => handleImageUpload('back')}>
          {backImage ? (
            <View style={styles.imagePreview} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={32} color="#CBD2E3" />
              <Text style={styles.imageUploadText}>身份证反面</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.ocrButton} onPress={handleOCR} disabled={loading}>
        <Text style={styles.ocrButtonText}>{loading ? '识别中...' : '开始识别'}</Text>
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>姓名</Text>
          <Text style={styles.formValue}>{name || '未填写'}</Text>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>身份证号</Text>
          <Text style={styles.formValue}>{idNumber || '未填写'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>提交审核</Text>
      </TouchableOpacity>
    </View>
  );
}

// 人脸验证步骤
function FaceVerificationStep({ onNext }: { onNext: () => void }) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [step, setStep] = useState<'instruction' | 'capture' | 'verify'>('instruction');

  const handleStartCapture = () => {
    setStep('capture');
    Alert.alert('人脸验证', '请正对手机摄像头，保持面部清晰', [
      { text: '开始验证', onPress: () => console.log('开始人脸捕获') }
    ]);
  };

  const handleCapture = () => {
    // TODO: 实际的人脸捕获逻辑
    setCapturedImage('mock-image-path');
    setStep('verify');
    Alert.alert('人脸验证', '正在验证中...', [
      { text: '确定', onPress: () => console.log('人脸验证中') }
    ]);
  };

  if (step === 'instruction') {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>人脸验证</Text>
        <Text style={styles.stepDesc}>为了确保账号安全，需要进行人脸验证</Text>

        <View style={styles.instructionCard}>
          <Ionicons name="shield-checkmark" size={48} color="#3A7AFE" />
          <Text style={styles.instructionTitle}>安全提示</Text>
          <Text style={styles.instructionText}>
            • 请在光线充足的环境下进行验证{'\n'}
            • 请保持面部清晰，避免佩戴口罩或墨镜{'\n'}
            • 请按照提示完成指定动作
          </Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleStartCapture}>
          <Text style={styles.submitButtonText}>开始验证</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>人脸验证</Text>
      <Text style={styles.stepDesc}>
        {step === 'capture' ? '请保持面部在框内' : '验证成功'}
      </Text>

      <View style={styles.faceCaptureBox}>
        {capturedImage ? (
          <View style={styles.captureSuccess}>
            <Ionicons name="checkmark-circle" size={48} color="#2ECC71" />
            <Text style={styles.captureSuccessText}>验证通过</Text>
          </View>
        ) : (
          <>
            <Ionicons name="person-circle-outline" size={80} color="#CBD2E3" />
            <Text style={styles.captureHint}>人脸识别中...</Text>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={onNext}>
        <Text style={styles.submitButtonText}>下一步</Text>
      </TouchableOpacity>
    </View>
  );
}

// 手机验证步骤
function PhoneVerificationStep({ onNext }: { onNext: () => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState<'input' | 'verify'>('input');

  const handleSendCode = () => {
    if (!phone) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    // TODO: 发送短信验证码
    Alert.alert('发送成功', '验证码已发送至手机，请查收');
    setStep('verify');
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = () => {
    if (!code) {
      Alert.alert('提示', '请输入验证码');
      return;
    }
    // TODO: 验证短信验证码
    Alert.alert('验证成功', '手机号验证完成', [
      { text: '确定', onPress: onNext }
    ]);
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>手机号验证</Text>
      <Text style={styles.stepDesc}>验证手机号用于找回密码和接收重要通知</Text>

      <View style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>手机号</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.phonePrefix}>+86</Text>
            <Text style={styles.phoneInput}>{phone || '请输入手机号'}</Text>
          </View>
        </View>

        {step === 'verify' && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>验证码</Text>
            <View style={styles.codeInputContainer}>
              <Text style={styles.codeInput}>{code || '请输入验证码'}</Text>
              <TouchableOpacity
                style={styles.sendCodeButton}
                onPress={handleSendCode}
                disabled={countdown > 0}
              >
                <Text style={styles.sendCodeText}>
                  {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {step === 'input' ? (
        <TouchableOpacity style={styles.submitButton} onPress={handleSendCode}>
          <Text style={styles.submitButtonText}>获取验证码</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.submitButton} onPress={handleVerify}>
          <Text style={styles.submitButtonText}>验证</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// 志愿者认证步骤
function VolunteerVerificationStep({ onNext }: { onNext: () => void }) {
  const [certificate, setCertificate] = useState<string | null>(null);
  const [experience, setExperience] = useState('');

  const handleSubmit = () => {
    Alert.alert('提交成功', '志愿者认证审核中，预计3-5个工作日', [
      { text: '确定', onPress: onNext }
    ]);
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>志愿者认证</Text>
      <Text style={styles.stepDesc}>上传志愿者证书或相关资质证明</Text>

      <TouchableOpacity style={styles.certificateUploadBox}>
        <Ionicons name="document-text-outline" size={48} color="#CBD2E3" />
        <Text style={styles.certificateUploadText}>上传证书</Text>
        <Text style={styles.certificateHint}>支持 JPG/PNG 格式</Text>
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>相关经历</Text>
          <Text style={styles.formValue}>{experience || '请描述您的志愿者经历'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>提交审核</Text>
      </TouchableOpacity>
    </View>
  );
}

// 机构认证步骤
function OrganizationVerificationStep({ onNext }: { onNext: () => void }) {
  const [license, setLicense] = useState<string | null>(null);
  const [legalPerson, setLegalPerson] = useState('');

  const handleSubmit = () => {
    Alert.alert('提交成功', '机构认证审核中，预计5-7个工作日', [
      { text: '确定', onPress: onNext }
    ]);
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>救助机构认证</Text>
      <Text style={styles.stepDesc}>上传营业执照和法人身份证明</Text>

      <TouchableOpacity style={styles.certificateUploadBox}>
        <Ionicons name="business-outline" size={48} color="#CBD2E3" />
        <Text style={styles.certificateUploadText}>上传营业执照</Text>
        <Text style={styles.certificateHint}>支持 JPG/PNG 格式</Text>
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>法人姓名</Text>
          <Text style={styles.formValue}>{legalPerson || '请填写法人姓名'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>提交审核</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  placeholder: {
    width: 40,
  },
  stepsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F7',
  },
  stepsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 11,
    color: '#8A94A6',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#1F2A44',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 13,
    color: '#4B5675',
    marginBottom: 24,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  imageUploadBox: {
    flex: 1,
    aspectRatio: 1.6,
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E9F2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#E5E9F2',
  },
  imageUploadText: {
    fontSize: 13,
    color: '#8A94A6',
    fontWeight: '600',
  },
  ocrButton: {
    backgroundColor: '#3A7AFE',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  ocrButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 12,
    color: '#8A94A6',
  },
  formValue: {
    fontSize: 15,
    color: '#1F2A44',
  },
  submitButton: {
    backgroundColor: '#FF4D8D',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
  },
  instructionText: {
    fontSize: 13,
    color: '#4B5675',
    lineHeight: 20,
    textAlign: 'center',
  },
  faceCaptureBox: {
    aspectRatio: 1,
    backgroundColor: '#F5F7FB',
    borderRadius: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  captureSuccess: {
    alignItems: 'center',
    gap: 12,
  },
  captureSuccessText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ECC71',
  },
  captureHint: {
    fontSize: 13,
    color: '#8A94A6',
    marginTop: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phonePrefix: {
    fontSize: 15,
    color: '#1F2A44',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2A44',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  codeInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2A44',
  },
  sendCodeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#3A7AFE',
  },
  sendCodeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  certificateUploadBox: {
    backgroundColor: '#F5F7FB',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  certificateUploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2A44',
  },
  certificateHint: {
    fontSize: 12,
    color: '#8A94A6',
  },
});
