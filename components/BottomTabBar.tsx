import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ICON_MAP: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  index: 'home',
  explore: 'search',
  messages: 'chatbubble',
  profile: 'person',
};

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2);

  const renderItem = (route: typeof state.routes[number], index: number) => {
    const isFocused = state.index === state.routes.indexOf(route);
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        onPress={onPress}
        style={styles.tabButton}
      >
        <Ionicons
          name={ICON_MAP[route.name] ?? 'ellipse'}
          size={22}
          color={isFocused ? theme.tint : theme.icon}
        />
        <Text style={[styles.tabLabel, { color: isFocused ? theme.tint : theme.icon }]}>
          {label as string}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 14) || 14 }]}>
      <View style={styles.container}>
        <View style={styles.sideGroup}>
          {leftRoutes.map(renderItem)}
        </View>

        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => router.push('/publish')}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

        <View style={styles.sideGroup}>
          {rightRoutes.map(renderItem)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  container: {
    height: 78,
    borderRadius: 32,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  sideGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    gap: 24,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  plusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3A7AFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#3A7AFE',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});
