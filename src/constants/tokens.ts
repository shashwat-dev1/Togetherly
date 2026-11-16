/**
 * TOGETHERLY DESIGN SYSTEM — CENTRAL TOKENS
 * "Two people. One little world."
 *
 * Warm, romantic, playful, mature design token architecture.
 * Strictly designed without childish over-decorations.
 */

export const Palette = {
  // Brand Primaries & Accents
  lavenderLight: '#B8A4F4',
  lavender: '#9275E8',
  lavenderDark: '#7152C5',
  violetDeep: '#493282',
  
  coralSoft: '#FFB5A7',
  coral: '#F5A6B8',
  coralDeep: '#E07A5F',

  // Neutrals (Light Theme)
  creamBg: '#FFF9F5',
  surfaceLight: '#FFFFFF',
  surfaceCard: '#FDFCFC',
  borderLight: '#EDE8E3',
  dividerLight: '#F3EFEA',

  // Typography (Light Theme)
  charcoalPrimary: '#252238',
  charcoalSecondary: '#6B667B',
  charcoalMuted: '#9B96A8',

  // Status & Feedback
  success: '#48B07F',
  successSoft: '#E8F7F0',
  warning: '#F39C12',
  warningSoft: '#FEF6E9',
  error: '#E76F51',
  errorSoft: '#FDF0ED',
  info: '#4A90E2',
  infoSoft: '#EEF5FC',

  // Dark Theme Tokens (OLED-friendly, cozy romantic night mode)
  darkBg: '#13111C',
  darkSurface: '#1D1A29',
  darkCard: '#252136',
  darkBorder: '#35304C',
  darkTextPrimary: '#F4F1FA',
  darkTextSecondary: '#A9A4B8',
  darkTextMuted: '#716C82',
} as const;

export const Typography = {
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  sizes: {
    hero: 32,
    h1: 26,
    h2: 22,
    h3: 18,
    bodyLarge: 16,
    body: 14,
    small: 12,
    tiny: 10,
  },
  lineHeights: {
    hero: 40,
    h1: 34,
    h2: 28,
    h3: 24,
    bodyLarge: 24,
    body: 20,
    small: 16,
    tiny: 14,
  },
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
} as const;

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 9999,
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: '#252238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#252238',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#9275E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export interface AppTheme {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceCard: string;
    border: string;
    divider: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    error: string;
    errorSoft: string;
  };
  spacing: typeof Spacing;
  radii: typeof Radii;
  typography: typeof Typography;
  shadows: typeof Shadows;
}

export const LightTheme: AppTheme = {
  isDark: false,
  colors: {
    background: Palette.creamBg,
    surface: Palette.surfaceLight,
    surfaceCard: Palette.surfaceCard,
    border: Palette.borderLight,
    divider: Palette.dividerLight,
    textPrimary: Palette.charcoalPrimary,
    textSecondary: Palette.charcoalSecondary,
    textMuted: Palette.charcoalMuted,
    primary: Palette.lavender,
    primaryDark: Palette.lavenderDark,
    primaryLight: Palette.lavenderLight,
    secondary: Palette.coral,
    accent: Palette.coralSoft,
    success: Palette.success,
    successSoft: Palette.successSoft,
    warning: Palette.warning,
    warningSoft: Palette.warningSoft,
    error: Palette.error,
    errorSoft: Palette.errorSoft,
  },
  spacing: Spacing,
  radii: Radii,
  typography: Typography,
  shadows: Shadows,
};

export const DarkTheme: AppTheme = {
  isDark: true,
  colors: {
    background: Palette.darkBg,
    surface: Palette.darkSurface,
    surfaceCard: Palette.darkCard,
    border: Palette.darkBorder,
    divider: Palette.darkBorder,
    textPrimary: Palette.darkTextPrimary,
    textSecondary: Palette.darkTextSecondary,
    textMuted: Palette.darkTextMuted,
    primary: Palette.lavender,
    primaryDark: Palette.lavenderLight,
    primaryLight: Palette.violetDeep,
    secondary: Palette.coral,
    accent: Palette.coralSoft,
    success: Palette.success,
    successSoft: '#173326',
    warning: Palette.warning,
    warningSoft: '#382B14',
    error: Palette.error,
    errorSoft: '#3D1C16',
  },
  spacing: Spacing,
  radii: Radii,
  typography: Typography,
  shadows: Shadows,
};

