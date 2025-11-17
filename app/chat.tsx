import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/contexts/AppContext';
import { MessageDB, type Message } from '@/lib/database';

interface ChatScreenProps {
  route: {
    params: {
      userId: string;
      petInfoId: string;
    };
  };
}

export default function ChatScreen({ route }: ChatScreenProps) {
  const { user } = useApp();
  const { userId, petInfoId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!user) return;

    try {
      const data = await MessageDB.getConversation(user.id, userId, petInfoId);
      setMessages(data);

      // 标记收到的消息为已读
      const unreadMessages = data.filter(
        msg => msg.toUserId === user.id && msg.isRead === 0
      );

      // 异步标记为已读（不阻塞 UI）
      unreadMessages.forEach(msg => {
        MessageDB.markAsRead(msg.id).catch(console.error);
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [user, userId, petInfoId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user || sending) return;

    try {
      setSending(true);
      await MessageDB.create({
        fromUserId: user.id,
        toUserId: userId,
        petInfoId,
        content: inputText.trim()
      });
      setInputText('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.fromUserId === user?.id;

    return (
      <View style={[
        styles.messageContainer,
        isOwn ? styles.ownMessage : styles.otherMessage
      ]}>
        <ThemedText style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {item.content}
        </ThemedText>

        {/* 已读/未读状态（仅自己的消息显示） */}
        {isOwn && (
          <View style={styles.messageStatus}>
            <Ionicons
              name={item.isRead ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={item.isRead ? '#4CAF50' : '#999'}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />

      {/* 输入框 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="输入消息..."
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    gap: 8,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    flex: 1,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageStatus: {
    marginLeft: 6,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
