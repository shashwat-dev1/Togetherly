/**
 * TOGETHERLY — BACKEND CONNECTION STATUS BANNER
 *
 * Shows:
 * 1. Severe alert if pilot build is misconfigured (missing production keys)
 * 2. Non-intrusive badge in local mock / emulator mode
 * 3. Hidden in valid production
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { runtimeMode, isPilotMisconfigured } from '@/services/firebase/config';
import { useThemeStore } from '@/stores/useThemeStore';
import { Server, Database, AlertTriangle } from 'lucide-react-native';

export const BackendConnectionBanner: React.FC = () => {
  const { theme } = useThemeStore();

  // If pilot build was deployed without live Firebase credentials
  if (isPilotMisconfigured) {
    return (
      <View style={[styles.container, { backgroundColor: '#FF3B30', borderColor: '#D32F2F' }]}>
        <View style={styles.content}>
          <AlertTriangle size={14} color="#FFFFFF" />
          <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
            PILOT SETUP REQUIRED: Live Firebase Backend Not Connected
          </Text>
        </View>
      </View>
    );
  }

  // Live production - clean view for users
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
