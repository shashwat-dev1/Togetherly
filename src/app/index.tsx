/**
 * TOGETHERLY — APP ENTRY GATEWAY & ROUTE GUARD
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';

export default function IndexScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { couple } = useCoupleStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/login');
      } else if (!couple) {
        router.replace('/(onboarding)/pair');
      } else {
        router.replace('/(tabs)/home');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [user, couple, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
