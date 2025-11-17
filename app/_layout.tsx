import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { MessageProvider } from '@/contexts/MessageContext';
import { LocationProvider } from '@/contexts/LocationContext';
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
    <LocationProvider>
      <MessageProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="chat" options={{ headerShown: false }} />
          <Stack.Screen name="publish" options={{ headerShown: false }} />
          <Stack.Screen name="select-location" options={{ headerShown: false }} />
          <Stack.Screen name="verification" options={{ headerShown: false }} />
          <Stack.Screen name="my-posts" options={{ headerShown: false }} />
          <Stack.Screen name="my-adoptions" options={{ headerShown: false }} />
          <Stack.Screen name="my-favorites" options={{ headerShown: false }} />
          <Stack.Screen name="volunteer-activities" options={{ headerShown: false }} />
          <Stack.Screen name="community" options={{ headerShown: false }} />
          <Stack.Screen name="volunteer" options={{ headerShown: false }} />
          <Stack.Screen name="pet-detail" options={{ headerShown: false }} />
        </Stack>
      </MessageProvider>
    </LocationProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1 }}>
          <RootLayoutContent />
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProvider>
  );
}
