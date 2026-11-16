/**
 * TOGETHERLY — REUSABLE CARD & BADGE COMPONENTS
 */
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({ children, style, elevated = false }) => {
  const { theme } = useThemeStore();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
        },
        elevated ? theme.shadows.medium : theme.shadows.soft,
        style,
      ]}
    >
      {children}
    </View>
  );
};

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const { theme } = useThemeStore();

  let bg = theme.colors.primaryLight;
  let text = theme.colors.primaryDark;

  if (variant === 'secondary') {
    bg = theme.colors.accent;
    text = theme.colors.secondary;
  } else if (variant === 'success') {
    bg = theme.colors.successSoft;
    text = theme.colors.success;
  } else if (variant === 'warning') {
    bg = theme.colors.warningSoft;
    text = theme.colors.warning;
  } else if (variant === 'neutral') {
    bg = theme.isDark ? '#2D2840' : '#EFEBF5';
    text = theme.colors.textSecondary;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: theme.radii.pill,
        },
        style,
      ]}
    >
      <Text style={[styles.badgeText, { color: text }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
