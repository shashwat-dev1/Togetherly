/**
 * TOGETHERLY — DEDICATED NOTIFICATION SETTINGS SCREEN
 *
 * Granular control over all couple notifications:
 * - Master toggle & 8 category toggles (with flirty & double-meaning strictly opt-in).
 * - Reminder frequency selector (Off, Light, Normal, Frequent).
 * - Quiet hours schedule (start/end time).
 * - Lock-screen discreet preview toggle.
 * - Multi-tier notification architecture status (Real-Time In-App, Local Channels, Spark FCM).
 * - Instant sample notification preview.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppCard, Badge } from '@/components/common/AppCard';
import { AppButton } from '@/components/common/AppButton';
import { ReminderFrequency } from '@/types';
import { scheduleRomanticReminders } from '@/services/notifications/localScheduler';
import {
  getEligibleNotifications,
  formatNotificationContent,
} from '@/constants/notificationsCatalogue';
import {
  ArrowLeft,
  Bell,
  Heart,
  Gamepad2,
  Target,
  Trophy,
  Moon,
  EyeOff,
  Flame,
  Sparkles,
  Smile,
  ShieldCheck,
} from 'lucide-react-native';

const FREQUENCY_OPTIONS: { id: ReminderFrequency; label: string; desc: string }[] = [
  { id: 'off', label: 'Off', desc: 'No scheduled reminders' },
  { id: 'light', label: 'Light', desc: 'Every 2–3 days' },
  { id: 'normal', label: 'Normal', desc: '1 reminder / day' },
  { id: 'frequent', label: 'Frequent', desc: '2 reminders / day' },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user, updatePreferences } = useAuthStore();
  const { couple } = useCoupleStore();

  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partnerName = partnerId && couple?.members[partnerId] ? couple.members[partnerId].displayName : 'your partner';

  const prefs = user?.preferences;
  const notificationsEnabled = prefs?.notificationsEnabled ?? true;
  const notifyCoupleActivity = prefs?.notifyCoupleActivity ?? true;
  const notifyGameInvitations = prefs?.notifyGameInvitations ?? true;
  const notifyDailyChallenge = prefs?.notifyDailyChallenge ?? true;
  const notifyAchievements = prefs?.notifyAchievements ?? true;
  const notifyRomanticReminders = prefs?.notifyRomanticReminders ?? true;
  const notifyCheesy = prefs?.notifyCheesy ?? true;
  const notifyFlirty = prefs?.notifyFlirty ?? false;
  const notifyDoubleMeaning = prefs?.notifyDoubleMeaning ?? false;

  const reminderFrequency: ReminderFrequency = prefs?.reminderFrequency || 'normal';
  const quietHoursEnabled = prefs?.quietHoursEnabled ?? true;
  const quietHoursStart = prefs?.quietHoursStart || '22:00';
  const quietHoursEnd = prefs?.quietHoursEnd || '09:00';
  const discreetPreviews = prefs?.discreetPreviews ?? false;

  const handleUpdate = async (patch: Partial<typeof prefs>) => {
    try {
      await updatePreferences(patch as any);

      // Re-schedule reminders with new preferences
      const updatedPrefs = { ...prefs, ...patch } as any;
      await scheduleRomanticReminders(updatedPrefs, partnerName);
    } catch (err) {
      console.warn('[NotificationSettings] Failed to update preferences:', err);
    }
  };

  const handleSendSampleNotification = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Notice', 'Sample notifications are only available on mobile devices.');
      return;
    }

    try {
      const eligible = getEligibleNotifications({
        notificationsEnabled: true,
        notifyRomanticReminders: true,
        notifyCheesy,
        notifyFlirty,
        notifyDoubleMeaning,
      });

      if (eligible.length === 0) {
        Alert.alert('No Templates', 'Enable at least one romantic category to preview notifications.');
        return;
      }

      const randomTemplate = eligible[Math.floor(Math.random() * eligible.length)];
      const formatted = formatNotificationContent(randomTemplate, partnerName, discreetPreviews);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: formatted.title,
          body: formatted.body,
          data: { type: 'romantic_reminder', preview: 'true' },
        },
        trigger: null, // Send immediately
      });

      Alert.alert('Sample Sent! 💕', `Scheduled notification banner: "${formatted.title}"`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not trigger sample notification');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Notification Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Two people. One little world.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Spark Plan Delivery Status Card */}
        <AppCard elevated style={[styles.statusCard, { borderColor: theme.colors.border }]}>
          <View style={styles.statusHeaderRow}>
            <ShieldCheck size={20} color={theme.colors.primary} />
            <Text style={[styles.statusHeaderTitle, { color: theme.colors.textPrimary }]}>
              Notification Delivery Pipeline
            </Text>
            <Badge label="SPARK FREE TIER" variant="primary" />
          </View>

          <View style={styles.statusItemRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
            <Text style={[styles.statusItemText, { color: theme.colors.textPrimary }]}>
              <Text style={{ fontWeight: '700' }}>Real-time In-App Alerts:</Text> Active (Firestore live sync)
            </Text>
          </View>

          <View style={styles.statusItemRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
            <Text style={[styles.statusItemText, { color: theme.colors.textPrimary }]}>
              <Text style={{ fontWeight: '700' }}>Local Romantic Reminders:</Text> Active (Android channels)
            </Text>
          </View>

          <View style={styles.statusItemRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.warning }]} />
            <Text style={[styles.statusItemText, { color: theme.colors.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>Remote Push (FCM):</Text> Token securely registered. Server runner requires Blaze upgrade.
            </Text>
          </View>
        </AppCard>

        {/* Master Toggle */}
        <AppCard style={styles.sectionCard}>
          <View style={styles.toggleRow}>
            <View style={[styles.iconBubble, { backgroundColor: theme.colors.primaryLight }]}>
              <Bell size={20} color={theme.colors.primaryDark} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                Allow Notifications
              </Text>
              <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                Turn on to receive invitations, turns, and love reminders
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => handleUpdate({ notificationsEnabled: val })}
              trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
            />
          </View>
        </AppCard>

        {notificationsEnabled && (
          <>
            {/* Category Preferences */}
            <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
              NOTIFICATION CATEGORIES
            </Text>
            <AppCard style={styles.sectionCard}>
              {/* Couple Activity */}
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <Heart size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Important Couple Activity
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    Pairing, connection, and relationship milestones
                  </Text>
                </View>
                <Switch
                  value={notifyCoupleActivity}
                  onValueChange={(val) => handleUpdate({ notifyCoupleActivity: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Game Invitations & Turns */}
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <Gamepad2 size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Game Invitations & Turns
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    When partner invites you or makes a move
                  </Text>
                </View>
                <Switch
                  value={notifyGameInvitations}
                  onValueChange={(val) => handleUpdate({ notifyGameInvitations: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Daily Challenges */}
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <Target size={18} color={theme.colors.secondary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Daily Couple Challenges
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    New daily relationship challenge alerts
                  </Text>
                </View>
                <Switch
                  value={notifyDailyChallenge}
                  onValueChange={(val) => handleUpdate({ notifyDailyChallenge: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Achievements */}
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <Trophy size={18} color={theme.colors.warning} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Couple Milestones & XP
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    When you level up or unlock couple badges
                  </Text>
                </View>
                <Switch
                  value={notifyAchievements}
                  onValueChange={(val) => handleUpdate({ notifyAchievements: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Romantic Reminders */}
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <Sparkles size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Romantic Reminders
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    Sweet reminders of your love throughout the week
                  </Text>
                </View>
                <Switch
                  value={notifyRomanticReminders}
                  onValueChange={(val) => handleUpdate({ notifyRomanticReminders: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Cheesy Notes */}
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <Smile size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Cheesy Love Notes
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    Cheesy, sweet & funny romantic lines
                  </Text>
                </View>
                <Switch
                  value={notifyCheesy}
                  onValueChange={(val) => handleUpdate({ notifyCheesy: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>
            </AppCard>

            {/* Opt-In Intimate & Cheeky Categories */}
            <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
              OPT-IN & PLAYFUL (DISABLED BY DEFAULT)
            </Text>
            <AppCard style={styles.sectionCard}>
              {/* Flirty */}
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <Flame size={18} color={theme.colors.secondary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                      Flirty Notes
                    </Text>
                    <Badge label="OPT-IN" variant="secondary" />
                  </View>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    Playful romantic teasers for your eyes only
                  </Text>
                </View>
                <Switch
                  value={notifyFlirty}
                  onValueChange={(val) => handleUpdate({ notifyFlirty: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Playful Double-Meaning */}
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <Flame size={18} color="#E8618C" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                      Playful Double-Meaning
                    </Text>
                    <Badge label="CHEEKY" variant="secondary" />
                  </View>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    Cheeky double-entendres and humorous banter
                  </Text>
                </View>
                <Switch
                  value={notifyDoubleMeaning}
                  onValueChange={(val) => handleUpdate({ notifyDoubleMeaning: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>
            </AppCard>

            {/* Frequency Selector */}
            <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
              ROMANTIC REMINDER FREQUENCY
            </Text>
            <AppCard style={styles.sectionCard}>
              <View style={styles.frequencyGrid}>
                {FREQUENCY_OPTIONS.map((opt) => {
                  const isSelected = reminderFrequency === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => handleUpdate({ reminderFrequency: opt.id })}
                      style={[
                        styles.frequencyItem,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primaryLight
                            : theme.isDark ? '#27223B' : '#F6F2FC',
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.frequencyLabel,
                          {
                            color: isSelected
                              ? theme.colors.primaryDark
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.frequencyDesc,
                          {
                            color: isSelected
                              ? theme.colors.primaryDark
                              : theme.colors.textMuted,
                          },
                        ]}
                      >
                        {opt.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </AppCard>

            {/* Quiet Hours */}
            <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
              QUIET HOURS
            </Text>
            <AppCard style={styles.sectionCard}>
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <Moon size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Enable Quiet Hours
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    No romantic reminders while you sleep
                  </Text>
                </View>
                <Switch
                  value={quietHoursEnabled}
                  onValueChange={(val) => handleUpdate({ quietHoursEnabled: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              {quietHoursEnabled && (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
                  <View style={styles.quietHoursRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                        Quiet From (Start)
                      </Text>
                      <View style={styles.timePresetRow}>
                        {['21:00', '22:00', '23:00'].map((time) => (
                          <TouchableOpacity
                            key={time}
                            onPress={() => handleUpdate({ quietHoursStart: time })}
                            style={[
                              styles.timeBadge,
                              quietHoursStart === time && {
                                backgroundColor: theme.colors.primary,
                                borderColor: theme.colors.primary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.timeBadgeText,
                                {
                                  color: quietHoursStart === time
                                    ? '#FFFFFF'
                                    : theme.colors.textPrimary,
                                },
                              ]}
                            >
                              {time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                        Quiet Until (End)
                      </Text>
                      <View style={styles.timePresetRow}>
                        {['07:00', '08:00', '09:00'].map((time) => (
                          <TouchableOpacity
                            key={time}
                            onPress={() => handleUpdate({ quietHoursEnd: time })}
                            style={[
                              styles.timeBadge,
                              quietHoursEnd === time && {
                                backgroundColor: theme.colors.primary,
                                borderColor: theme.colors.primary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.timeBadgeText,
                                {
                                  color: quietHoursEnd === time
                                    ? '#FFFFFF'
                                    : theme.colors.textPrimary,
                                },
                              ]}
                            >
                              {time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </>
              )}
            </AppCard>

            {/* Lock-Screen Privacy (Discreet Previews) */}
            <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
              PRIVACY & LOCK-SCREEN
            </Text>
            <AppCard style={styles.sectionCard}>
              <View style={styles.toggleRow}>
                <View style={styles.subIcon}>
                  <EyeOff size={18} color={theme.colors.secondary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.toggleTitle, { color: theme.colors.textPrimary }]}>
                    Discreet Notification Previews
                  </Text>
                  <Text style={[styles.toggleSubtitle, { color: theme.colors.textSecondary }]}>
                    Replaces cheeky text with &quot;You have a message on Togetherly&quot; on lock screen
                  </Text>
                </View>
                <Switch
                  value={discreetPreviews}
                  onValueChange={(val) => handleUpdate({ discreetPreviews: val })}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>
            </AppCard>

            {/* Preview Button */}
            <AppButton
              title="Test Sample Romantic Reminder"
              onPress={handleSendSampleNotification}
              variant="outline"
              size="md"
              icon={<Sparkles size={16} color={theme.colors.primary} />}
              style={{ marginTop: 8, marginBottom: 20 }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    padding: 14,
    marginBottom: 16,
    borderRadius: 14,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statusHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  statusItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusItemText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    padding: 14,
    marginBottom: 4,
    borderRadius: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyItem: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  frequencyLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  frequencyDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  quietHoursRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  timePresetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4CEE0',
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
