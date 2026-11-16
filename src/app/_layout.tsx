/**
 * TOGETHERLY — ROOT APPLICATION LAYOUT
 */
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '@/stores/useThemeStore';
import * as SplashScreen from 'expo-splash-screen';
import { BackendConnectionBanner } from '@/components/common/BackendConnectionBanner';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const hide = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // splash hide fallback
      }
    };
    hide();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BackendConnectionBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="game" 
            options={{ 
              headerShown: false,
              presentation: 'card',
            }} 
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
