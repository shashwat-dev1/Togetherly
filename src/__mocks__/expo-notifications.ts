/**
 * Jest mock for expo-notifications
 */
export const AndroidImportance = {
  UNKNOWN: 0,
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
};

export const PermissionStatus = {
  UNDETERMINED: 'undetermined',
  GRANTED: 'granted',
  DENIED: 'denied',
};

export const setNotificationHandler = jest.fn();
export const setNotificationChannelAsync = jest.fn().mockResolvedValue(null);
export const getPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: true,
  expires: 'never',
});
export const requestPermissionsAsync = jest.fn().mockResolvedValue({
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: true,
  expires: 'never',
});
export const getExpoPushTokenAsync = jest.fn().mockResolvedValue({
  data: 'ExponentPushToken[mock_token_12345]',
});
export const getDevicePushTokenAsync = jest.fn().mockResolvedValue({
  data: 'fcm_mock_device_token_abcde',
});
export const getAllScheduledNotificationsAsync = jest.fn().mockResolvedValue([]);
export const cancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined);
export const scheduleNotificationAsync = jest.fn().mockResolvedValue('mock_scheduled_id');
export const addNotificationResponseReceivedListener = jest.fn().mockReturnValue({
  remove: jest.fn(),
});
export const addNotificationReceivedListener = jest.fn().mockReturnValue({
  remove: jest.fn(),
});
