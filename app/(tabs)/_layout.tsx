import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '探索',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: '故事',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="bookmark" color={color} />,
        }}
      />
      <Tabs.Screen
        name="crowdfunding"
        options={{
          title: '众筹',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="heart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: '统计',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="bar-chart" color={color} />,
        }}
      />
    </Tabs>
  );
}
