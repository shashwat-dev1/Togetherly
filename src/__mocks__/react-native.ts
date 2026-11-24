/**
 * Jest mock for react-native
 */
export const Platform = {
  OS: 'android',
  select: (obj: Record<string, any>) => obj.android || obj.default,
};

export const StyleSheet = {
  create: (styles: any) => styles,
};

export const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
};

export const Alert = {
  alert: jest.fn(),
};

export default {
  Platform,
  StyleSheet,
  Dimensions,
  Alert,
};
