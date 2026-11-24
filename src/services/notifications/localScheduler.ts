/**
 * TOGETHERLY — LOCAL NOTIFICATION SCHEDULER & QUIET HOURS ENGINE
 *
 * Implements Android notification channels, quiet hours logic (default 10:00 PM - 9:00 AM),
 * frequency-based romantic reminder scheduling, discreet lock-screen previews,
 * and deduplication.
 */
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { UserPreferences, ReminderFrequency } from '@/types';
import {
  getEligibleNotifications,
  formatNotificationContent,
} from '@/constants/notificationsCatalogue';

export const CHANNELS = {
  COUPLE_ACTIVITY: 'couple-activity',
  GAMES: 'games',
  ROMANTIC_REMINDERS: 'romantic-reminders',
} as const;

/**
 * Configure Android notification channels with appropriate priorities and sounds
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // 1. Couple Activity (High Importance - pairing, milestones)
    await Notifications.setNotificationChannelAsync(CHANNELS.COUPLE_ACTIVITY, {
      name: 'Couple Activity',
      description: 'Important pairing events and relationship milestones',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9275E8',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // 2. Games & Turns (High Importance - turn alerts, invitations, game results)
    await Notifications.setNotificationChannelAsync(CHANNELS.GAMES, {
      name: 'Games & Turns',
      description: 'Turn reminders, game invitations, and match reveals',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#E0533C',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // 3. Romantic Reminders (Default Importance - peaceful reminders during awake hours)
    await Notifications.setNotificationChannelAsync(CHANNELS.ROMANTIC_REMINDERS, {
      name: 'Romantic & Cheesy Reminders',
      description: 'Sweet, cheesy, and playful reminders throughout the week',
      importance: AndroidImportance.DEFAULT,
      enableLights: false,
      enableVibrate: false,
      showBadge: false,
    });
  } catch (err) {
    console.warn('[Notifications] Failed to setup Android channels:', err);
  }
}

/**
 * Parses 'HH:mm' into minutes from midnight (0 to 1439)
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map((x) => parseInt(x, 10) || 0);
  return hours * 60 + minutes;
}

/**
 * Checks if a given Date falls within quiet hours.
 * Handles overnight intervals (e.g. 22:00 to 09:00).
 */
export function isWithinQuietHours(
  date: Date,
  startStr = '22:00',
  endStr = '09:00'
): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = parseTimeToMinutes(startStr);
  const endMinutes = parseTimeToMinutes(endStr);

  if (startMinutes > endMinutes) {
    // Overnight window (e.g. 22:00 to 09:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  // Same-day window (e.g. 13:00 to 15:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Returns interval hours for a given reminder frequency setting
 */
export function getIntervalHoursForFrequency(frequency: ReminderFrequency): number {
  switch (frequency) {
    case 'off':
      return 0;
    case 'light':
      return 48; // Every 2 days
    case 'normal':
      return 24; // 1 per day
    case 'frequent':
      return 12; // 2 per day
    default:
      return 24;
  }
}

/**
 * Calculates the next eligible timestamp outside quiet hours.
 * If target falls in quiet hours, shifts to `quietHoursEnd` + jitter.
 */
export function getNextEligibleTime(
  targetDate: Date,
  quietHoursEnabled: boolean | string = true,
  startStr = '22:00',
  endStr = '09:00',
  deterministic = false
): Date {
  let isEnabled = true;
  let sStr = startStr;
  let eStr = endStr;

  if (typeof quietHoursEnabled === 'string') {
    // Overload: getNextEligibleTime(targetDate, startStr, endStr)
    isEnabled = true;
    sStr = quietHoursEnabled;
    eStr = startStr || '09:00';
  } else {
    isEnabled = quietHoursEnabled;
  }

  if (!isEnabled) {
    return targetDate;
  }

  const result = new Date(targetDate.getTime());

  if (isWithinQuietHours(result, sStr, eStr)) {
    const [endH, endM] = eStr.split(':').map((x) => parseInt(x, 10) || 0);
    // Move to end hour on same day or next morning
    if (result.getHours() >= 12) {
      // It's late evening, move to next morning
      result.setDate(result.getDate() + 1);
    }
    const jitter = deterministic ? 0 : Math.floor(Math.random() * 30);
    result.setHours(endH, endM + jitter, 0, 0); // e.g. 9:00 - 9:30 AM
  }

  return result;
}

/**
 * Cancels all previously scheduled romantic reminders.
 */
export async function cancelRomanticReminders(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.isRomanticReminder) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (err) {
    console.warn('[Notifications] Failed to cancel scheduled reminders:', err);
  }
}

/**
 * Schedules upcoming romantic reminders based on user frequency, quiet hours, and category preferences.
 */
export async function scheduleRomanticReminders(
  preferences: UserPreferences,
  partnerName?: string
): Promise<number> {
  // If master toggle is off or frequency is 'off', cancel everything
  if (!preferences.notificationsEnabled || preferences.reminderFrequency === 'off') {
    await cancelRomanticReminders();
    return 0;
  }

  const frequency = preferences.reminderFrequency || 'normal';
  const quietEnabled = preferences.quietHoursEnabled !== false;
  const quietStart = preferences.quietHoursStart || '22:00';
  const quietEnd = preferences.quietHoursEnd || '09:00';
  const isDiscreet = preferences.discreetPreviews === true;

  // 1. Cancel previous romantic reminders to avoid duplicate overlapping schedules
  await cancelRomanticReminders();

  // 2. Fetch eligible templates matching user preferences
  const eligibleTemplates = getEligibleNotifications({
    allowCute: true,
    allowRomantic: preferences.notifyRomanticReminders !== false,
    allowCheesy: preferences.notifyCheesy !== false,
    allowFunny: true,
    allowFlirty: preferences.notifyFlirty === true, // Default off
    allowDoubleMeaning: preferences.notifyDoubleMeaning === true, // Default off
    allowMissingYou: true,
    allowGameInvitations: preferences.notifyGameInvitations !== false,
  });

  if (eligibleTemplates.length === 0) return 0;

  // Shuffle templates for variety
  const shuffled = [...eligibleTemplates].sort(() => Math.random() - 0.5);

  // 3. Determine schedule offsets based on frequency:
  // - light: 1 reminder in ~48 hours
  // - normal: 1 reminder in ~24 hours
  // - frequent: 2 reminders per day (e.g. ~10 hours and ~22 hours)
  const scheduledOffsetsHours: number[] = [];
  if (frequency === 'light') {
    scheduledOffsetsHours.push(48 + Math.floor(Math.random() * 12));
  } else if (frequency === 'normal') {
    scheduledOffsetsHours.push(20 + Math.floor(Math.random() * 8));
  } else if (frequency === 'frequent') {
    scheduledOffsetsHours.push(8 + Math.floor(Math.random() * 4));
    scheduledOffsetsHours.push(20 + Math.floor(Math.random() * 4));
  }

  let scheduledCount = 0;
  const now = new Date();

  for (let i = 0; i < scheduledOffsetsHours.length; i++) {
    const template = shuffled[i % shuffled.length];
    const offsetHours = scheduledOffsetsHours[i];

    const targetDate = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
    const eligibleDate = getNextEligibleTime(targetDate, quietEnabled, quietStart, quietEnd);

    const { title, body } = formatNotificationContent(template, partnerName, isDiscreet);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            isRomanticReminder: true,
            templateId: template.id,
            category: template.category,
            targetRoute: '/(tabs)/home',
          },
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: eligibleDate,
          channelId: CHANNELS.ROMANTIC_REMINDERS,
        },
      });
      scheduledCount++;
    } catch (err) {
      console.warn('[Notifications] Failed to schedule reminder notification:', err);
    }
  }

  return scheduledCount;
}
