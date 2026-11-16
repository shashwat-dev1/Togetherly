/**
 * TOGETHERLY — PROFILE & SETTINGS
 *
 * User profile, partner status, theme switcher,
 * subscription tier details, partner disconnect, and sign out.
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
import { AppButton } from '@/components/common/AppButton';
import { Modal } from '@/components/common/Modal';
import {
  Moon,
  Sun,
  Crown,
  Bell,
  Volume2,
  Shield,
  LogOut,
  ChevronRight,
  Heart,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { couple, disconnect } = useCoupleStore();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

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
                {user?.displayName}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                {user?.email}
              </Text>
              <Badge
                label={couple?.subscriptionSummary.isPlus ? 'PLUS MEMBER' : 'FREE PLAN'}
                variant={couple?.subscriptionSummary.isPlus ? 'secondary' : 'neutral'}
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

        {/* Subscription Tier Management */}
        <AppCard style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconCol}>
              <Crown size={20} color={theme.colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Togetherly Plus
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                Unlock all 10 games, no ads & premium decks for both.
              </Text>
            </View>
            <AppButton
              title="Manage"
              onPress={() => setShowSubscriptionModal(true)}
              variant="outline"
              size="sm"
            />
          </View>
        </AppCard>

        {/* Appearance & Sound Settings */}
        <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
          PREFERENCES
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
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          {/* Haptics */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconCol}>
              <Bell size={20} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
              Haptic Feedback
            </Text>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconCol}>
              <Bell size={20} color={theme.colors.textSecondary} />
            </View>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary, flex: 1 }]}>
              Turn Notifications
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D4CEE0', true: theme.colors.primary }}
            />
          </View>
        </AppCard>

        {/* Account & Safety Actions */}
        <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>
          ACCOUNT
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

      {/* Subscription Plans Modal */}
      <Modal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title="Togetherly Plus"
      >
        <View>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16 }}>
            One single plan upgrades both of you! No ads, unlimited premium decks, and all 10 multiplayer games.
          </Text>

          <View style={[styles.planBox, { borderColor: theme.colors.primary }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary }}>
              Monthly Subscription
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.primary, marginVertical: 4 }}>
              ₹99 / month
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              Billed monthly via Google Play Billing. Cancel anytime.
            </Text>
          </View>

          <View style={[styles.planBox, { borderColor: theme.colors.border, marginTop: 10 }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary }}>
              Annual Subscription (Save 58%)
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.secondary, marginVertical: 4 }}>
              ₹499 / year
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              Includes 1 year of all upcoming games and virtual world assets.
            </Text>
          </View>

          <AppButton
            title="Subscribe via Google Play"
            onPress={() => {
              setShowSubscriptionModal(false);
              Alert.alert('Google Play Billing', 'Subscription architecture initialized! Ready to connect with live Play Console products.');
            }}
            size="lg"
            style={{ marginTop: 20 }}
          />
        </View>
      </Modal>
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
  divider: { height: 1, marginVertical: 10 },
  planBox: { padding: 14, borderRadius: 12, borderWidth: 2 },
});

