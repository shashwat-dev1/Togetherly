/**
 * TOGETHERLY — REUSABLE BUTTON COMPONENT
 *
 * Supports Primary, Secondary, Outline, and Ghost styles
 * with subtle haptic touch feedback and loading spinners.
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores/useThemeStore';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { theme } = useThemeStore();

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics fallback
      }
    }
    onPress();
  };

  // Dimensions by size
  const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number; height: number }> = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, height: 36 },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15, height: 48 },
    lg: { paddingVertical: 16, paddingHorizontal: 26, fontSize: 17, height: 56 },
  };

  const currentSize = sizeStyles[size];

  // Colors by variant
  let bg = theme.colors.primary;
  let textColor = '#FFFFFF';
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (variant === 'secondary') {
    bg = theme.colors.secondary;
    textColor = '#FFFFFF';
  } else if (variant === 'outline') {
    bg = 'transparent';
    textColor = theme.colors.primary;
    borderColor = theme.colors.primary;
    borderWidth = 1.5;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textColor = theme.colors.textPrimary;
  } else if (variant === 'danger') {
    bg = theme.colors.error;
    textColor = '#FFFFFF';
  }

  const isInteractiveDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={isInteractiveDisabled}
      style={[
        styles.baseButton,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth,
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: theme.radii.lg,
          opacity: isInteractiveDisabled ? 0.5 : 1,
        },
        variant === 'primary' && !isInteractiveDisabled && theme.shadows.soft,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.buttonText,
              {
                color: textColor,
                fontSize: currentSize.fontSize,
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
