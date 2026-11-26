/**
 * TOGETHERLY — APP ENTRY GATEWAY & ROUTE GUARD
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';

export default function IndexScreen() {
  const router = useRouter();
  const { user, restoreSession } = useAuthStore();
  const { couple, fetchCouple } = useCoupleStore();
  const { theme } = useThemeStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        let currentUser = user;
        if (!currentUser) {
          currentUser = await restoreSession();
        }

        if (currentUser && currentUser.activeCoupleId && !couple) {
          await fetchCouple(currentUser.activeCoupleId);
        }
      } catch (err) {
        console.warn('[IndexScreen] Initialization error:', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [user, couple, restoreSession, fetchCouple]);

  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      router.replace('/(auth)/login');
    } else if (!couple) {
      router.replace('/(onboarding)/pair');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [isInitializing, user, couple, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image source={require('../../assets/images/togetherly-brand.png')} style={styles.brand} accessibilityLabel="Togetherly" />
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={{ color: theme.colors.textSecondary }}>Connecting your little world…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { width: 156, height: 156, borderRadius: 32, marginBottom: 4 },
  container: {
    flex: 1,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
