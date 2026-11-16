/**
 * TOGETHERLY — EMPTY & LOADING STATES
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji = '✨',
  title,
  description,
  actionTitle,
  onAction,
}) => {
  const { theme } = useThemeStore();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>
      {actionTitle && onAction ? (
        <AppButton
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionBtn}
        />
      ) : null}
    </View>
  );
};

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading your shared world...',
}) => {
  const { theme } = useThemeStore();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: 16,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
  },
});

