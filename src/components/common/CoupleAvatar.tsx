/**
 * TOGETHERLY — COUPLE AVATAR COMPONENT
 *
 * Visually locks two partner avatars together with an interlocking
 * relationship badge and connection indicator.
 */
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Avatar } from './Avatar';
import { useThemeStore } from '@/stores/useThemeStore';

interface CoupleAvatarProps {
  userAvatarId?: string;
  userName?: string;
  partnerAvatarId?: string;
  partnerName?: string;
  isPartnerOnline?: boolean;
  size?: number;
}

export const CoupleAvatar: React.FC<CoupleAvatarProps> = ({
  userAvatarId = 'avatar_bear',
  userName = 'You',
  partnerAvatarId = 'avatar_fox',
  partnerName = 'Partner',
  isPartnerOnline = true,
  size = 52,
}) => {
  const { theme } = useThemeStore();
  const overlapOffset = Math.round(size * 0.28);
  const badgeSize = Math.round(size * 0.42);

  return (
    <View style={styles.container}>
      <View style={{ zIndex: 2 }}>
        <Avatar
          id={userAvatarId}
          name={userName}
          size={size}
          showOnline={true}
          isOnline={true}
        />
      </View>
      <View style={{ marginLeft: -overlapOffset, zIndex: 1 }}>
        <Avatar
          id={partnerAvatarId}
          name={partnerName}
          size={size}
          showOnline={true}
          isOnline={isPartnerOnline}
        />
      </View>
      {/* Interlocking heart center pin */}
      <View
        style={[
          styles.heartPin,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <Text style={{ fontSize: Math.round(badgeSize * 0.55) }}>💖</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  heartPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    elevation: 3,
  },
});

