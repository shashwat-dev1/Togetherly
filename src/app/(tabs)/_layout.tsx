/**
 * TOGETHERLY — 5-TAB NAVIGATION LAYOUT
 *
 * Bottom navigation featuring Home, Games, Our World, Activity, Profile
 * styled with the Togetherly romantic-mature token palette.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { useThemeStore } from '@/stores/useThemeStore';
import { Heart, Grid, Globe, Bell, User } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const { theme } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Heart size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ color, size }) => (
            <Grid size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="our-world"
        options={{
          title: 'Our World',
          tabBarIcon: ({ color, size }) => (
            <Globe size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Bell size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

