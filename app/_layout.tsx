import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { MessageProvider } from '@/contexts/MessageContext';
import { ActivityIndicator, View, Text } from 'react-native';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function InitializingScreen() {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.light.background
    }}>
      <ActivityIndicator size="large" color={Colors.light.tint} />
      <Text style={{
        marginTop: 16,
        fontSize: 16,
        color: Colors.light.text
      }}>
        正在初始化...
      </Text>
    </View>
  );
}

function RootLayoutContent() {
  const { isLoading, isDatabaseReady } = useApp();

  if (isLoading || !isDatabaseReady) {
    return <InitializingScreen />;
  }

  return (
    <MessageProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="publish" options={{ headerShown: false }} />
        <Stack.Screen name="stories" options={{ headerShown: false }} />
        <Stack.Screen name="success-cases" options={{ headerShown: false }} />
        <Stack.Screen name="crowdfunding" options={{ headerShown: false }} />
        <Stack.Screen name="statistics" options={{ headerShown: false }} />
      </Stack>
    </MessageProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutContent />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProvider>
  );
}
