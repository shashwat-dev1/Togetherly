/**
 * TOGETHERLY — PROFILE & SETTINGS (CLOSED PILOT)
 *
 * User profile, partner status, theme switcher,
 * granular notification preferences, in-app feedback modal,
 * partner disconnect, and sign out.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { Avatar } from '@/components/common/Avatar';
import { AppCard, Badge } from '@/components/common/AppCard';
import { FeedbackModal } from '@/components/common/FeedbackModal';
import {
  Moon,
  Sun,
  Bell,
  Volume2,
  Shield,
  LogOut,
  ChevronRight,
  Heart,
  Vibrate,
  Play,
  Target,
  Trophy,
  Flame,
  MessageSquare,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useThemeStore();
  const { user, logout, updatePreferences } = useAuthStore();
  const { couple, disconnect } = useCoupleStore();

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const prefs = user?.preferences;
  const soundEnabled = prefs?.soundEnabled ?? true;
  const hapticsEnabled = prefs?.hapticsEnabled ?? true;
  const notificationsEnabled = prefs?.notificationsEnabled ?? true;
  const notifyTurnReady = prefs?.notifyTurnReady ?? true;
  const notifyDailyChallenge = prefs?.notifyDailyChallenge ?? true;
  const notifyAchievements = prefs?.notifyAchievements ?? true;
  const notifyStreakReminder = prefs?.notifyStreakReminder ?? true;

  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

  const handleTogglePreference = async (key: string, val: boolean) => {
    try {
      await updatePreferences({ [key]: val });
    } catch (err) {
      console.warn('Failed to update preference:', err);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Partner?',
      'Are you sure you want to unlink? Your shared XP and streak will be preserved, but you will not be able to play together until you re-link.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnect();
            router.replace('/(onboarding)/pair');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User & Partner Profile Card */}
        <AppCard elevated style={styles.profileHeaderCard}>
          <View style={styles.userRow}>
            <Avatar id={user?.avatarId} name={user?.displayName} size={60} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                {user?.displayName || 'Player'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                {user?.email}
              </Text>
              <Badge
                label="CLOSED PILOT TESTER"
                variant="primary"
                style={{ marginTop: 6 }}
              />
            </View>
          </View>

          {/* Connected Partner Sub-bar */}
          <View
            style={[
              styles.partnerBar,
              {
                backgroundColor: theme.isDark ? '#27223B' : '#F6F2FC',
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Heart size={16} color={theme.colors.secondary} fill={theme.colors.secondary} />
              <Text style={[styles.partnerLabel, { color: theme.colors.textPrimary }]}>
                Paired with {partner?.displayName || 'Partner'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleDisconnect}>
              <Text style={[styles.disconnectText, { color: theme.colors.error }]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Pilot Feedback Section */}
        <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
          PILOT TESTER FEEDBACK
        </Text>
        <AppCard style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowFeedbackModal(true)}
          >
            <View style={styles.settingIconCol}>
              <MessageSquare size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Send Feedback or Report Issue
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                Report a bug, sync problem, or suggest improvements
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </AppCard>

        {/* Appearance & Sound Settings */}
        <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
          EXPERIENCE & THEME
        </Text>
        <AppCard style={styles.sectionCard}>
          {/* Dark Mode Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconCol}>
              {isDark ? (
                <Moon size={20} color={theme.colors.primary} />
              ) : (
                <Sun size={20} color={theme.colors.warning} />
              )}
            </View>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
              Romantic Night Theme
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          {/* Sound */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconCol}>
              <Volume2 size={20} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
              Game Sound Effects
            </Text>
            <Switch
              value={soundEnabled}
              onValueChange={(val) => handleTogglePreference('soundEnabled', val)}
              trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          {/* Haptics */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconCol}>
              <Vibrate size={20} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
              Haptic Feedback
            </Text>
            <Switch
              value={hapticsEnabled}
              onValueChange={(val) => handleTogglePreference('hapticsEnabled', val)}
              trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
            />
          </View>
        </AppCard>

        {/* Notification Preferences */}
        <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
          NOTIFICATIONS
        </Text>
        <AppCard style={styles.sectionCard}>
          {/* Master Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconCol}>
              <Bell size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Allow Notifications
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                Turn alerts, challenges & reminders
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(val) => handleTogglePreference('notificationsEnabled', val)}
              trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
            />
          </View>

          {notificationsEnabled ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Turn Notifications */}
              <View style={styles.subSettingRow}>
                <View style={styles.subIconCol}>
                  <Play size={16} color={theme.colors.textSecondary} />
                </View>
                <Text style={[styles.subSettingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
                  Your Turn Alerts
                </Text>
                <Switch
                  value={notifyTurnReady}
                  onValueChange={(val) => handleTogglePreference('notifyTurnReady', val)}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Daily Challenge */}
              <View style={styles.subSettingRow}>
                <View style={styles.subIconCol}>
                  <Target size={16} color={theme.colors.textSecondary} />
                </View>
                <Text style={[styles.subSettingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
                  Daily Challenge Alerts
                </Text>
                <Switch
                  value={notifyDailyChallenge}
                  onValueChange={(val) => handleTogglePreference('notifyDailyChallenge', val)}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Achievements & Level Ups */}
              <View style={styles.subSettingRow}>
                <View style={styles.subIconCol}>
                  <Trophy size={16} color={theme.colors.textSecondary} />
                </View>
                <Text style={[styles.subSettingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
                  Achievements & Level Ups
                </Text>
                <Switch
                  value={notifyAchievements}
                  onValueChange={(val) => handleTogglePreference('notifyAchievements', val)}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

              {/* Streak Reminders */}
              <View style={styles.subSettingRow}>
                <View style={styles.subIconCol}>
                  <Flame size={16} color={theme.colors.textSecondary} />
                </View>
                <Text style={[styles.subSettingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
                  Streak Reminders
                </Text>
                <Switch
                  value={notifyStreakReminder}
                  onValueChange={(val) => handleTogglePreference('notifyStreakReminder', val)}
                  trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
                />
              </View>
            </>
          ) : null}
        </AppCard>

        {/* Account & Safety Actions */}
        <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
          ACCOUNT & SECURITY
        </Text>
        <AppCard style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('Privacy Policy', 'Togetherly does not sell or share private couple answers or data.')}
          >
            <View style={styles.settingIconCol}>
              <Shield size={20} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
              Privacy & Relationship Security
            </Text>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
            <View style={styles.settingIconCol}>
              <LogOut size={20} color={theme.colors.error} />
            </View>
            <Text style={[styles.settingTitle, { color: theme.colors.error, flex: 1 }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </AppCard>
      </ScrollView>

      {/* In-App Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  profileHeaderCard: { padding: 18, marginBottom: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontSize: 20, fontWeight: '800' },
  userEmail: { fontSize: 13, marginTop: 2 },
  partnerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  partnerLabel: { fontSize: 13, fontWeight: '600', marginLeft: 6 },
  disconnectText: { fontSize: 13, fontWeight: '600' },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 12, marginLeft: 4 },
  sectionCard: { padding: 14, marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  settingIconCol: { width: 32, alignItems: 'center', marginRight: 8 },
  settingTitle: { fontSize: 14, fontWeight: '600' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  subSettingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingLeft: 8 },
  subIconCol: { width: 28, alignItems: 'center', marginRight: 6 },
  subSettingTitle: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, marginVertical: 10 },
});
