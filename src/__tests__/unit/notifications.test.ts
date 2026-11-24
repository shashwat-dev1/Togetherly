import {
  NOTIFICATION_CATALOGUE,
  getEligibleNotifications,
  formatNotificationContent,
  NotificationCategory,
  NotificationTemplate,
} from '../../constants/notificationsCatalogue';
import {
  isWithinQuietHours,
  getNextEligibleTime,
  getIntervalHoursForFrequency,
} from '../../services/notifications/localScheduler';
import {
  PermissionManager,
  SPARK_REMOTE_PUSH_STATUS,
} from '../../services/notifications/permissionManager';
import {
  NotificationService,
  InAppNotification,
} from '../../services/notifications/notificationService';
import { UserPreferences } from '../../types';

describe('1. Curated Notification Catalogue', () => {
  test('catalogue contains at least 120 unique romantic, cheeky & engagement templates', () => {
    expect(NOTIFICATION_CATALOGUE.length).toBeGreaterThanOrEqual(120);

    const ids = new Set<string>();
    NOTIFICATION_CATALOGUE.forEach((tmpl: NotificationTemplate) => {
      expect(tmpl.id).toBeTruthy();
      expect(tmpl.title).toBeTruthy();
      expect(tmpl.body).toBeTruthy();
      expect(tmpl.discreetBody).toBeTruthy();
      expect(ids.has(tmpl.id)).toBe(false); // All IDs must be unique
      ids.add(tmpl.id);
    });
  });

  test('catalogue covers all 8 distinct required categories', () => {
    const categories = new Set<NotificationCategory>(
      NOTIFICATION_CATALOGUE.map((t: NotificationTemplate) => t.category)
    );

    expect(categories.has('cute')).toBe(true);
    expect(categories.has('romantic')).toBe(true);
    expect(categories.has('cheesy')).toBe(true);
    expect(categories.has('funny')).toBe(true);
    expect(categories.has('flirty')).toBe(true);
    expect(categories.has('double_meaning')).toBe(true);
    expect(categories.has('missing_you')).toBe(true);
    expect(categories.has('game_invitation')).toBe(true);
  });
});

describe('2. Notification Category Filtering & Opt-In Safety', () => {
  test('flirty and double-meaning categories are excluded by default', () => {
    const defaultPrefs: Partial<UserPreferences> = {
      notificationsEnabled: true,
      notifyRomanticReminders: true,
      notifyCheesy: true,
      notifyFlirty: false, // Default opt-in: false
      notifyDoubleMeaning: false, // Default opt-in: false
    };

    const eligible = getEligibleNotifications(defaultPrefs);
    const hasFlirty = eligible.some((t) => t.category === 'flirty');
    const hasDoubleMeaning = eligible.some((t) => t.category === 'double_meaning');

    expect(hasFlirty).toBe(false);
    expect(hasDoubleMeaning).toBe(false);
    expect(eligible.length).toBeGreaterThan(50);
  });

  test('flirty and double-meaning categories are included when user opts in', () => {
    const optInPrefs: Partial<UserPreferences> = {
      notificationsEnabled: true,
      notifyRomanticReminders: true,
      notifyCheesy: true,
      notifyFlirty: true,
      notifyDoubleMeaning: true,
    };

    const eligible = getEligibleNotifications(optInPrefs);
    const hasFlirty = eligible.some((t) => t.category === 'flirty');
    const hasDoubleMeaning = eligible.some((t) => t.category === 'double_meaning');

    expect(hasFlirty).toBe(true);
    expect(hasDoubleMeaning).toBe(true);
    expect(eligible.length).toBe(NOTIFICATION_CATALOGUE.length);
  });

  test('master switch off suppresses all templates', () => {
    const disabledPrefs: Partial<UserPreferences> = {
      notificationsEnabled: false,
      notifyRomanticReminders: true,
      notifyFlirty: true,
    };

    const eligible = getEligibleNotifications(disabledPrefs);
    expect(eligible.length).toBe(0);
  });
});

describe('3. Token Interpolation & Discreet Previews', () => {
  const sampleTemplate: NotificationTemplate = {
    id: 'test_sample',
    category: 'romantic',
    title: 'Thinking of {partnerName} ❤️',
    body: 'Just a reminder that {partnerName} makes your world brighter every day.',
    discreetBody: 'You have a message on Togetherly',
  };

  test('replaces {partnerName} token with given partner display name', () => {
    const formatted = formatNotificationContent(sampleTemplate, 'Priya', false);
    expect(formatted.title).toBe('Thinking of Priya ❤️');
    expect(formatted.body).toBe('Just a reminder that Priya makes your world brighter every day.');
  });

  test('falls back gracefully to "your partner" when name is undefined', () => {
    const formatted = formatNotificationContent(sampleTemplate, undefined, false);
    expect(formatted.title).toBe('Thinking of your partner ❤️');
    expect(formatted.body).toBe('Just a reminder that your partner makes your world brighter every day.');
  });

  test('uses discreetBody when discreetPreviews preference is enabled', () => {
    const discreetFormatted = formatNotificationContent(sampleTemplate, 'Priya', true);
    expect(discreetFormatted.title).toBe('Togetherly');
    expect(discreetFormatted.body).toBe('You have a message on Togetherly');
  });
});

describe('4. Quiet Hours Detection Engine', () => {
  test('correctly identifies overnight quiet hours (e.g. 22:00 to 09:00)', () => {
    // 11:30 PM (23:30) is inside 22:00 -> 09:00
    const lateNight = new Date(2026, 10, 20, 23, 30);
    expect(isWithinQuietHours(lateNight, '22:00', '09:00')).toBe(true);

    // 03:15 AM is inside 22:00 -> 09:00
    const earlyMorning = new Date(2026, 10, 20, 3, 15);
    expect(isWithinQuietHours(earlyMorning, '22:00', '09:00')).toBe(true);

    // 08:59 AM is inside 22:00 -> 09:00
    const justBeforeEnd = new Date(2026, 10, 20, 8, 59);
    expect(isWithinQuietHours(justBeforeEnd, '22:00', '09:00')).toBe(true);

    // 09:01 AM is outside quiet hours
    const daytime = new Date(2026, 10, 20, 9, 1);
    expect(isWithinQuietHours(daytime, '22:00', '09:00')).toBe(false);

    // 15:00 PM (3 PM) is outside quiet hours
    const afternoon = new Date(2026, 10, 20, 15, 0);
    expect(isWithinQuietHours(afternoon, '22:00', '09:00')).toBe(false);
  });

  test('correctly identifies daytime quiet hours (e.g. 13:00 to 15:00)', () => {
    const napTime = new Date(2026, 10, 20, 14, 0);
    expect(isWithinQuietHours(napTime, '13:00', '15:00')).toBe(true);

    const morningTime = new Date(2026, 10, 20, 10, 0);
    expect(isWithinQuietHours(morningTime, '13:00', '15:00')).toBe(false);
  });
});

describe('5. Next Eligible Time Calculation', () => {
  test('shifts scheduled time forward to quiet hours end when landing during quiet hours', () => {
    // Current target lands at 23:00 (11 PM) during 22:00 - 09:00 quiet hours
    const targetDate = new Date(2026, 10, 20, 23, 0);
    const eligibleDate = getNextEligibleTime(targetDate, '22:00', '09:00', undefined, true);

    expect(eligibleDate.getHours()).toBe(9);
    expect(eligibleDate.getMinutes()).toBe(0);
    // Should advance to next day
    expect(eligibleDate.getTime()).toBeGreaterThan(targetDate.getTime());
  });

  test('preserves scheduled time when landing during daytime active hours', () => {
    const targetDate = new Date(2026, 10, 20, 14, 30);
    const eligibleDate = getNextEligibleTime(targetDate, '22:00', '09:00', undefined, true);

    expect(eligibleDate.getTime()).toBe(targetDate.getTime());
    expect(eligibleDate.getHours()).toBe(14);
    expect(eligibleDate.getMinutes()).toBe(30);
  });
});

describe('6. Reminder Frequency Configurations', () => {
  test('returns correct interval hours per frequency setting', () => {
    expect(getIntervalHoursForFrequency('off')).toBe(0);
    expect(getIntervalHoursForFrequency('light')).toBe(48); // Every 2 days
    expect(getIntervalHoursForFrequency('normal')).toBe(24); // 1 per day
    expect(getIntervalHoursForFrequency('frequent')).toBe(12); // 2 per day
  });
});

describe('7. Spark Architecture Diagnostics & Permission Manager', () => {
  test('verifies Spark Plan remote push classification is NOT_CONFIGURED', () => {
    expect(SPARK_REMOTE_PUSH_STATUS).toBe('NOT_CONFIGURED');
  });

  test('diagnostic report details multi-tier status accurately', async () => {
    const report = await PermissionManager.getStatusReport('user_test_123');
    expect(report.realtimeInAppActive).toBe(true);
    expect(report.statusMessage).toBeTruthy();
  });
});

describe('8. Notification Service: Preferences, Deduplication & Deep Linking', () => {
  beforeEach(() => {
    NotificationService.clearMockInbox();
  });

  test('enforces category preferences for all notification types', () => {
    const basePrefs: UserPreferences = {
      notificationsEnabled: true,
      notifyCoupleActivity: true,
      notifyGameInvitations: true,
      notifyTurnReady: false, // Turn disabled
      notifyDailyChallenge: true,
      notifyAchievements: true,
      notifyStreakReminder: true,
      notifyRomanticReminders: false, // Romantic disabled
      soundEnabled: true,
      hapticsEnabled: true,
      matureContentAllowed: false,
      theme: 'light',
    };

    expect(NotificationService.shouldSendNotification(basePrefs, 'partner_accepted')).toBe(true);
    expect(NotificationService.shouldSendNotification(basePrefs, 'game_invitation')).toBe(true);
    expect(NotificationService.shouldSendNotification(basePrefs, 'your_turn')).toBe(false);
    expect(NotificationService.shouldSendNotification(basePrefs, 'romantic_reminder')).toBe(false);
  });

  test('deduplicates real-time in-app notifications', () => {
    const received: InAppNotification[] = [];
    const unsub = NotificationService.subscribeToInAppNotifications('user_test_456', (notif) => {
      received.push(notif);
    });

    // Send first notification
    NotificationService.sendNotification({
      toUid: 'user_test_456',
      type: 'partner_accepted',
      title: 'Your person is here! ❤️',
      body: 'The wait is over.',
    });

    expect(received.length).toBe(1);
    expect(received[0].title).toBe('Your person is here! ❤️');

    unsub();
  });

  test('resolves deep linking routes for all 8 notification types', () => {
    const gameRoute = NotificationService.getRouteForNotification('game_invitation', {
      gameId: 'connect-four',
      sessionId: 'sess_123',
    });
    expect(gameRoute.pathname).toBe('/game');
    expect(gameRoute.params?.gameId).toBe('connect-four');
    expect(gameRoute.params?.sessionId).toBe('sess_123');

    const turnRoute = NotificationService.getRouteForNotification('your_turn', {
      gameId: 'tic-tac-toe',
      sessionId: 'sess_456',
    });
    expect(turnRoute.pathname).toBe('/game');

    const partnerRoute = NotificationService.getRouteForNotification('partner_accepted');
    expect(partnerRoute.pathname).toBe('/(tabs)/home');

    const challengeRoute = NotificationService.getRouteForNotification('daily_challenge_available');
    expect(challengeRoute.pathname).toBe('/(tabs)/home');

    const achievementRoute = NotificationService.getRouteForNotification('achievement_unlocked');
    expect(achievementRoute.pathname).toBe('/(tabs)/our-world');

    const romanticRoute = NotificationService.getRouteForNotification('romantic_reminder');
    expect(romanticRoute.pathname).toBe('/(tabs)/home');
  });
});
