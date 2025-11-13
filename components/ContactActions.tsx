import React from 'react';
import { View, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { PetInfo, User } from '@/lib/database';
import { Colors } from '@/constants/theme';

interface ContactActionsProps {
  petInfo: PetInfo;
  currentUser: User;
  petOwner: User;
  onSendMessage: () => void;
  onReport: () => void;
}

export const ContactActions: React.FC<ContactActionsProps> = ({
  petInfo,
  currentUser,
  petOwner,
  onSendMessage,
  onReport
}) => {
  const handlePhoneCall = () => {
    if (!petInfo.contactPhone) {
      Alert.alert('提示', '主人未提供手机号');
      return;
    }

    Alert.alert(
      '拨打电话',
      `是否拨打 ${petInfo.contactPhone}？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '拨打',
          onPress: () => {
            Linking.openURL(`tel:${petInfo.contactPhone}`);
          }
        }
      ]
    );
  };

  const handleCopyWechat = () => {
    if (!petInfo.contactWechat) {
      Alert.alert('提示', '主人未提供微信号');
      return;
    }

    // 在实际应用中，这里会使用剪贴板API
    Alert.alert(
      '微信号',
      `微信号: ${petInfo.contactWechat}\n\n请复制微信号并添加到微信好友`,
      [
        { text: '知道了' }
      ]
    );
  };

  const handleCopyQQ = () => {
    if (!petInfo.contactQQ) {
      Alert.alert('提示', '主人未提供QQ号');
      return;
    }

    Alert.alert(
      'QQ号',
      `QQ号: ${petInfo.contactQQ}\n\n请复制QQ号并添加为好友`,
      [
        { text: '知道了' }
      ]
    );
  };

  const handleOpenQQ = () => {
    if (!petInfo.contactQQ) {
      Alert.alert('提示', '主人未提供QQ号');
      return;
    }

    // 尝试打开QQ
    const qqUrl = `mqqwpa://im/chat?chat_type=wpa&version=1&src_type=web&web_src=${encodeURIComponent(petInfo.contactQQ)}`;
    Linking.canOpenURL(qqUrl).then(supported => {
      if (supported) {
        Linking.openURL(qqUrl);
      } else {
        handleCopyQQ();
      }
    }).catch(() => {
      handleCopyQQ();
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>联系方式</ThemedText>

      {/* 站内私信 */}
      <TouchableOpacity style={styles.actionButton} onPress={onSendMessage}>
        <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="chatbubble-outline" size={24} color="white" />
        </View>
        <View style={styles.actionContent}>
          <ThemedText style={styles.actionTitle}>站内私信</ThemedText>
          <ThemedText style={styles.actionSubtitle}>通过平台私信联系</ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
      </TouchableOpacity>

      {/* 手机号 */}
      {petInfo.contactPhone && (
        <TouchableOpacity style={styles.actionButton} onPress={handlePhoneCall}>
          <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="call-outline" size={24} color="white" />
          </View>
          <View style={styles.actionContent}>
            <ThemedText style={styles.actionTitle}>电话联系</ThemedText>
            <ThemedText style={styles.actionSubtitle}>{petInfo.contactPhone}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
        </TouchableOpacity>
      )}

      {/* 微信号 */}
      {petInfo.contactWechat && (
        <TouchableOpacity style={styles.actionButton} onPress={handleCopyWechat}>
          <View style={[styles.iconContainer, { backgroundColor: '#07C160' }]}>
            <Ionicons name="logo-wechat" size={24} color="white" />
          </View>
          <View style={styles.actionContent}>
            <ThemedText style={styles.actionTitle}>微信联系</ThemedText>
            <ThemedText style={styles.actionSubtitle}>点击复制微信号</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
        </TouchableOpacity>
      )}

      {/* QQ号 */}
      {petInfo.contactQQ && (
        <TouchableOpacity style={styles.actionButton} onPress={handleOpenQQ}>
          <View style={[styles.iconContainer, { backgroundColor: '#1296db' }]}>
            <Ionicons name="logo-octocat" size={24} color="white" />
          </View>
          <View style={styles.actionContent}>
            <ThemedText style={styles.actionTitle}>QQ联系</ThemedText>
            <ThemedText style={styles.actionSubtitle}>{petInfo.contactQQ}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
        </TouchableOpacity>
      )}

      {/* 举报按钮 */}
      <TouchableOpacity style={styles.reportButton} onPress={onReport}>
        <Ionicons name="flag-outline" size={20} color="#FF4444" />
        <ThemedText style={styles.reportText}>举报此信息</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  reportText: {
    fontSize: 14,
    color: '#FF4444',
  },
});
