/**
 * TOGETHERLY — AVATAR COMPONENT
 *
 * Renders charming illustrated animal characters or initials
 * with customizable sizes and online indicators.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';

export interface AvatarProps {
  id?: string;
  name?: string;
  size?: number;
  showOnline?: boolean;
  isOnline?: boolean;
}

const AVATAR_CHARACTERS: Record<string, { emoji: string; bg: string }> = {
  avatar_bear: { emoji: '🐻', bg: '#F2E8DC' },
  avatar_bunny: { emoji: '🐰', bg: '#FDECEF' },
  avatar_fox: { emoji: '🦊', bg: '#FFEADB' },
  avatar_cat: { emoji: '🐱', bg: '#EDE8F5' },
  avatar_penguin: { emoji: '🐧', bg: '#E2F0F9' },
  avatar_panda: { emoji: '🐼', bg: '#EBF4EC' },
  avatar_koala: { emoji: '🐨', bg: '#EDEBF0' },
  avatar_dog: { emoji: '🐶', bg: '#FFF0DE' },
};

export const AVAILABLE_AVATARS = Object.keys(AVATAR_CHARACTERS);

export const Avatar: React.FC<AvatarProps> = ({
  id = 'avatar_bunny',
  name = 'Player',
  size = 48,
  showOnline = false,
  isOnline = false,
}) => {
  const { theme } = useThemeStore();
  const avatarData = AVATAR_CHARACTERS[id] || {
    emoji: name.charAt(0).toUpperCase(),
    bg: theme.colors.primaryLight,
  };

  const fontSize = Math.round(size * 0.52);
  const badgeSize = Math.max(10, Math.round(size * 0.26));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: avatarData.bg,
            borderWidth: 2,
            borderColor: theme.colors.surface,
          },
        ]}
      >
        <Text style={{ fontSize }}>{avatarData.emoji}</Text>
      </View>
      {showOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: isOnline ? theme.colors.success : theme.colors.textMuted,
              borderColor: theme.colors.surface,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});

