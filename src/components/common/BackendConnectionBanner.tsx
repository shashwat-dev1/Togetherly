/**
 * TOGETHERLY — BACKEND CONNECTION STATUS BANNER
 *
 * Shows a clear, non-intrusive badge when running in Development Mock
 * or Local Firebase Emulator mode. Never displayed in Production.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { runtimeMode } from '@/services/firebase/config';
import { useThemeStore } from '@/stores/useThemeStore';
import { Server, Database } from 'lucide-react-native';

export const BackendConnectionBanner: React.FC = () => {
  const { theme } = useThemeStore();

  if (runtimeMode === 'production') {
    return null;
  }

  const isMock = runtimeMode === 'mock';
  const label = isMock ? 'DEV: IN-MEMORY MOCK' : 'DEV: FIREBASE EMULATOR';
  const bg = isMock ? theme.colors.warningSoft : theme.colors.primaryLight;
  const textColor = isMock ? theme.colors.warning : theme.colors.primaryDark;

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: theme.colors.border }]}>
      <View style={styles.content}>
        {isMock ? (
          <Server size={12} color={textColor} />
        ) : (
          <Database size={12} color={textColor} />
        )}
        <Text style={[styles.badgeText, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
