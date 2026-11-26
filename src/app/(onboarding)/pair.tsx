/**
 * TOGETHERLY — COUPLE PAIRING SCREEN
 *
 * Implements code generation, clipboard sharing,
 * clipboard copy, and reciprocal code redemption.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { CoupleService } from '@/services/firebase/coupleService';
import { INVITATION_CODE_LENGTH, InvitationCodeSchema } from '@/types';
import { AuthService } from '@/services/firebase/authService';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { Heart, Share2, Copy, Check, Users } from 'lucide-react-native';

export default function PairScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { createInvite, cancelInvite, checkActiveInvite, pairWithCode, fetchCouple, isLoading, error, clearError } = useCoupleStore();

  const [activeTab, setActiveTab] = useState<'invite' | 'join'>('invite');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [partnerCode, setPartnerCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check for existing pending invitation on mount
  useEffect(() => {
    if (!user) return;
    checkActiveInvite(user.uid).then((inv) => {
      if (inv) {
        setGeneratedCode(inv.code);
      }
    });
  }, [user, checkActiveInvite]);

  // Real-time listener: detect when partner accepts the invitation code (Event 2)
  useEffect(() => {
    if (!generatedCode || !user) return;
    const unsub = CoupleService.subscribeToInvitation(generatedCode, async () => {
      try {
        const updatedUser = await AuthService.restoreSession();
        if (updatedUser?.activeCoupleId) {
          await fetchCouple(updatedUser.activeCoupleId);
        }
        Alert.alert(
          'Your person is here! ❤️',
          'The wait is over. Your little world is officially connected.',
          [{ text: 'Enter Togetherly', onPress: () => router.replace('/(tabs)/home') }]
        );
      } catch (err) {
        console.warn('[PairScreen] Partner acceptance callback error:', err);
      }
    });

    return () => unsub();
  }, [generatedCode, user, fetchCouple, router]);

  const handleGenerateCode = async () => {
    if (!user) return;
    clearError();
    try {
      const invite = await createInvite(user);
      setGeneratedCode(invite.code);
    } catch {
      // Error handled by store
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    await Clipboard.setStringAsync(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    if (!generatedCode) return;
    await Clipboard.setStringAsync(`Join me on Togetherly! Enter my pairing code: ${generatedCode}`);
    Alert.alert('Invitation Copied', 'Paste and send the code directly to your partner.');
  };

  const handleCancelInvite = async () => {
    if (!user) return;
    Alert.alert(
      'Cancel Invitation?',
      'Are you sure you want to cancel this pending invitation? Your partner will not be able to use this code.',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel Invite',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelInvite(user.uid);
              setGeneratedCode(null);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel invitation');
            }
          },
        },
      ]
    );
  };

  const handleJoinWithCode = async () => {
    if (!user) return;
    clearError();
    setValidationError(null);

    const cleanCode = partnerCode.trim().toUpperCase();
    if (!InvitationCodeSchema.safeParse({ code: cleanCode }).success) {
      setValidationError('Please enter a valid invitation code');
      return;
    }

    try {
      await pairWithCode(cleanCode, user);
      Alert.alert('Connected!', 'You and your partner are now linked!', [
        { text: 'Start Playing', onPress: () => router.replace('/(tabs)/home') },
      ]);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to link with that code');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconBubble,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Users size={30} color={theme.colors.primaryDark} />
          </View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Connect with Partner
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Togetherly is a private space designed exclusively for two.
          </Text>
        </View>

        {/* Mode Selector Tabs */}
        <View
          style={[
            styles.tabSelector,
            { backgroundColor: theme.isDark ? '#221E33' : '#EFEBF5' },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'invite' && [
                styles.activeTabItem,
                { backgroundColor: theme.colors.surface },
              ],
            ]}
            onPress={() => setActiveTab('invite')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'invite'
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                  fontWeight: activeTab === 'invite' ? '700' : '500',
                },
              ]}
            >
              1. Invite Partner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'join' && [
                styles.activeTabItem,
                { backgroundColor: theme.colors.surface },
              ],
            ]}
            onPress={() => setActiveTab('join')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'join'
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                  fontWeight: activeTab === 'join' ? '700' : '500',
                },
              ]}
            >
              2. Enter Their Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
            },
            theme.shadows.medium,
          ]}
        >
          {activeTab === 'invite' ? (
            <View>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                {generatedCode ? 'Waiting for your person ❤️' : 'Share Your Unique Code'}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                {generatedCode
                  ? 'Your invite is ready. Share it with your partner to start your little world together.'
                  : 'Generate an invitation code. Send it to your partner to link both of your devices automatically.'}
              </Text>

              {generatedCode ? (
                <View style={styles.codeContainer}>
                  <View
                    style={[
                      styles.codeBox,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.codeText, { color: theme.colors.primaryDark }]}
                    >
                      {generatedCode}
                    </Text>
                  </View>

                  <View style={styles.codeActionsRow}>
                    <AppButton
                      title={copied ? 'Copied!' : 'Copy Code'}
                      onPress={handleCopyCode}
                      variant="outline"
                      size="sm"
                      icon={
                        copied ? (
                          <Check size={16} color={theme.colors.primary} />
                        ) : (
                          <Copy size={16} color={theme.colors.primary} />
                        )
                      }
                      style={{ flex: 1, marginRight: 8 }}
                    />
                    <AppButton
                      title="Share Code"
                      onPress={handleShareCode}
                      variant="primary"
                      size="sm"
                      icon={<Share2 size={16} color="#FFFFFF" />}
                      style={{ flex: 1 }}
                    />
                  </View>

                  <View
                    style={[
                      styles.waitingNotice,
                      { backgroundColor: theme.colors.successSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
                    ]}
                  >
                    <ActivityIndicator size="small" color={theme.colors.success} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 13, color: theme.colors.success, textAlign: 'center' }}>
                      Expires in 48 hours • Listening for your partner...
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleCancelInvite}
                    style={{ marginTop: 14, alignSelf: 'center', paddingVertical: 6 }}
                  >
                    <Text style={{ fontSize: 14, color: theme.colors.error, fontWeight: '600' }}>
                      Cancel Invitation
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <AppButton
                  title="Generate Invitation Code"
                  onPress={handleGenerateCode}
                  loading={isLoading}
                  size="lg"
                  icon={<Heart size={18} color="#FFFFFF" />}
                  style={{ marginTop: 16 }}
                />
              )}
            </View>
          ) : (
            <View>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                Enter Partner&apos;s Code
              </Text>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                Paste the invitation code your partner shared with you.
              </Text>

              {(error || validationError) && (
                <View
                  style={[
                    styles.errorBanner,
                    { backgroundColor: theme.colors.errorSoft },
                  ]}
                >
                  <Text style={[styles.errorBannerText, { color: theme.colors.error }]}>
                    {validationError || error}
                  </Text>
                </View>
              )}

              <AppTextInput
                label="Invitation Code"
                value={partnerCode}
                onChangeText={(t) => setPartnerCode(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={INVITATION_CODE_LENGTH}
              />

              <AppButton
                title="Connect Couple"
                onPress={handleJoinWithCode}
                loading={isLoading}
                disabled={partnerCode.length !== INVITATION_CODE_LENGTH}
                size="lg"
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20 },
  iconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabItem: {
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
  },
  card: {
    padding: 24,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  codeContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  codeBox: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  codeActionsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  waitingNotice: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

