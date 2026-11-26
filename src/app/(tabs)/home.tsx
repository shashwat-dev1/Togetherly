/**
 * TOGETHERLY — UPGRADED HOME DASHBOARD
 *
 * Primary couple hub featuring shared presence, streak counter,
 * couple level progression curve, live daily challenge tracking with instant claim,
 * pending turn alerts, recent achievements, and recommended games.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { CoupleAvatar } from '@/components/common/CoupleAvatar';
import { AppCard, Badge } from '@/components/common/AppCard';
import { AppButton } from '@/components/common/AppButton';
import { TogetherCounter } from '@/features/together/TogetherCounter';
import { GameCard } from '@/components/games/GameCard';
import { GAME_CATALOGUE } from '@/games/registry';
import { GameDefinition, DailyChallenge, CoupleDailyChallengeProgress, GameSession, Achievement } from '@/types';
import { DailyChallengeService } from '@/services/engagement/dailyChallengeService';
import { calculateLevelFromXP } from '@/services/engagement/xpProgressionService';
import { GameSessionService } from '@/services/firebase/gameSessionService';
import { AchievementService } from '@/services/engagement/achievementService';
import { NotificationService, InAppNotification } from '@/services/notifications/notificationService';
import { PermissionManager } from '@/services/notifications/permissionManager';
import { scheduleRomanticReminders } from '@/services/notifications/localScheduler';
import * as Notifications from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';
import {
  Flame,
  Sparkles,
  ChevronRight,
  Target,
  Crown,
  PlayCircle,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Gift,
  Heart,
  X,
  Share2,
  Copy,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { couple, activeInvitation, checkActiveInvite, cancelInvite, updateSharedXP } = useCoupleStore();

  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

  // Shared couple XP & level progression curve (real values from couple state)
  const currentXP = couple?.sharedXP ?? 0;
  const levelProgress = calculateLevelFromXP(currentXP);
  const streak = couple?.streakData?.currentStreak ?? 0;

  // Daily Challenge State
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<CoupleDailyChallengeProgress | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);
  const [rewardClaimedSuccess, setRewardClaimedSuccess] = useState(false);

  // Real-Time Active Sessions & Achievements State
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  // In-App Notification Toast State & Invite Copy State
  const [incomingToast, setIncomingToast] = useState<InAppNotification | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Notification Lifecycle & Device Token Registration
  useEffect(() => {
    if (!user?.uid) return;

    // 1. Safe device token registration (Spark-compliant)
    PermissionManager.registerDeviceTokenSafely(user.uid).catch(() => {});

    // 2. Schedule local romantic reminders based on user preferences
    scheduleRomanticReminders(user.preferences, partner?.displayName).catch(() => {});

    // 3. Real-time in-app notification subscriber
    const unsubNotifs = NotificationService.subscribeToInAppNotifications(user.uid, (notif) => {
      setIncomingToast(notif);
      NotificationService.markNotificationAsRead(notif.id).catch(() => {});
    });

    // 4. Response listener for background notification tap
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      NotificationService.handleNotificationResponse(response, router);
    });

    return () => {
      unsubNotifs();
      responseSub.remove();
    };
  }, [user?.uid, user?.preferences, partner?.displayName, router]);

  // Auto-dismiss in-app notification banner after 4.5 seconds
  useEffect(() => {
    if (!incomingToast) return;
    const timer = setTimeout(() => {
      setIncomingToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [incomingToast]);

  // Check pending invite on mount if partner is not yet paired
  useEffect(() => {
    if (!user?.uid || partner) return;
    checkActiveInvite(user.uid);
  }, [user?.uid, partner, checkActiveInvite]);

  useEffect(() => {
    let isMounted = true;
    if (!couple?.id) return;

    // Fetch Daily Challenge
    DailyChallengeService.getDailyChallengeWithProgress(couple.id)
      .then(({ challenge, progress }) => {
        if (isMounted) {
          setDailyChallenge(challenge);
          setChallengeProgress(progress);
        }
      })
      .catch((err) => console.error('[Home] Failed to load daily challenge:', err));

    // Fetch Recent Achievement
    AchievementService.getCoupleAchievements(couple.id)
      .then((achievements) => {
        if (isMounted) {
          const unlocked = achievements.filter((a) => a.unlocked);
          if (unlocked.length > 0) {
            // Sort by unlockedAt desc if available, else first unlocked
            setRecentAchievement(unlocked[unlocked.length - 1]);
          }
        }
      })
      .catch((err) => console.warn('[Home] Failed to load achievements:', err));

    // Subscribe to live active game sessions
    const unsubSessions = GameSessionService.subscribeToActiveSessions(couple.id, (sessions) => {
      if (isMounted) {
        setActiveSessions(sessions);
      }
    });

    return () => {
      isMounted = false;
      unsubSessions();
    };
  }, [couple?.id]);

  const handleClaimChallengeReward = async () => {
    if (!couple?.id || claimingReward) return;
    setClaimingReward(true);
    try {
      const result = await DailyChallengeService.claimChallengeReward(couple.id);
      updateSharedXP(result.newTotalXP, result.newLevel);
      setChallengeProgress((prev) => (prev ? { ...prev, rewardClaimed: true } : null));
      setRewardClaimedSuccess(true);
    } catch (err) {
      console.error('[Home] Failed to claim challenge reward:', err);
    } finally {
      setClaimingReward(false);
    }
  };

  const handleStartChallenge = () => {
    if (dailyChallenge?.targetGameId) {
      router.push({
        pathname: '/(tabs)/games',
        params: { selectedGameId: dailyChallenge.targetGameId },
      });
    } else {
      router.push('/(tabs)/games');
    }
  };

  const handleGamePress = (game: GameDefinition) => {
    router.push({
      pathname: '/(tabs)/games',
      params: { selectedGameId: game.id },
    });
  };

  const recommendedGames = GAME_CATALOGUE.filter((g) => g.isImplemented);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Floating In-App Real-time Notification Banner */}
      {incomingToast && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            const route = NotificationService.getRouteForNotification(incomingToast.type, incomingToast.data);
            setIncomingToast(null);
            router.push(route as any);
          }}
          style={[
            styles.toastBanner,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary,
            },
            theme.shadows.medium,
          ]}
        >
          <View style={[styles.toastIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Heart size={18} color={theme.colors.primaryDark} fill={theme.colors.primaryDark} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={[styles.toastTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {incomingToast.title}
            </Text>
            <Text style={[styles.toastBody, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {incomingToast.body}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setIncomingToast(null)} style={{ padding: 4 }}>
            <X size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Couple Presence Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
              Two people, one little world
            </Text>
            <Text style={[styles.coupleNames, { color: theme.colors.textPrimary }]}>
              {user?.displayName} & {partner?.displayName || 'Partner'}
            </Text>
            <View style={styles.onlineStatusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: partner?.isOnline
                      ? theme.colors.success
                      : theme.colors.textMuted,
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                {partner?.isOnline ? `${partner.displayName} is online` : 'Partner active earlier'}
              </Text>
            </View>
          </View>

          <CoupleAvatar
            userAvatarId={user?.avatarId}
            userName={user?.displayName}
            partnerAvatarId={partner?.avatarId}
            partnerName={partner?.displayName}
            isPartnerOnline={partner?.isOnline}
            size={52}
          />
        </View>

        {/* Couple Progression Banner (Streak + Shared XP + Level Title) */}
        {couple && <TogetherCounter key={couple.id} coupleId={couple.id} />}

        <AppCard elevated style={styles.progressionCard}>
          <View style={styles.progressionStatsRow}>
            {/* Streak */}
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Flame size={20} color={theme.colors.warning} />
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                  {streak}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Days Streak
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.colors.divider }]} />

            {/* Shared Level */}
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Sparkles size={18} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                  Lvl {levelProgress.level}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {levelProgress.title}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.colors.divider }]} />

            {/* Total XP */}
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {currentXP}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Shared XP
              </Text>
            </View>
          </View>

          {/* Dynamic XP Progress Bar */}
          <View style={styles.xpBarTrack}>
            <View
              style={[
                styles.xpBarFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${levelProgress.progressPercent}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.xpBarCaption, { color: theme.colors.textMuted }]}>
            {levelProgress.xpToNextLevel} XP to reach Level {levelProgress.level + 1}
          </Text>
        </AppCard>

        {/* Daily Challenge Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Target size={18} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Today&apos;s Challenge
            </Text>
          </View>
          <Badge
            label={`+${dailyChallenge?.rewardXP || 100} XP`}
            variant={challengeProgress?.completed ? 'success' : 'warning'}
          />
        </View>

        <AppCard style={styles.challengeCard}>
          <View style={styles.challengeContentRow}>
            <View style={styles.challengeInfo}>
              <View style={styles.challengeHeaderRow}>
                <Text style={[styles.challengeTitle, { color: theme.colors.textPrimary }]}>
                  {dailyChallenge?.title || 'Daily Synchrony'}
                </Text>
                {challengeProgress?.completed && (
                  <CheckCircle2 size={18} color={theme.colors.success} />
                )}
              </View>
              <Text style={[styles.challengeDesc, { color: theme.colors.textSecondary }]}>
                {dailyChallenge?.description || 'Complete a multiplayer game together to keep your couple streak alive!'}
              </Text>

              {/* Progress counter */}
              <View style={styles.challengeProgressRow}>
                <Text style={[styles.progressCountText, { color: theme.colors.textMuted }]}>
                  Progress: {challengeProgress?.currentCount || 0} / {dailyChallenge?.targetCount || 1}
                </Text>
                {dailyChallenge?.hint && (
                  <Text style={[styles.challengeHint, { color: theme.colors.primaryDark }]}>
                    💡 {dailyChallenge.hint}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Action Button: Claim Reward vs Start Challenge vs Claimed */}
          {challengeProgress?.completed && !challengeProgress?.rewardClaimed ? (
            <AppButton
              title={claimingReward ? 'Claiming...' : 'Claim +100 Shared XP!'}
              onPress={handleClaimChallengeReward}
              disabled={claimingReward}
              size="md"
              icon={
                claimingReward ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Gift size={18} color="#FFFFFF" />
                )
              }
              style={{ marginTop: 14 }}
            />
          ) : challengeProgress?.rewardClaimed || rewardClaimedSuccess ? (
            <View style={styles.completedBadgeRow}>
              <CheckCircle2 size={16} color={theme.colors.success} />
              <Text style={[styles.completedText, { color: theme.colors.success }]}>
                Reward Claimed for Today! See you tomorrow.
              </Text>
            </View>
          ) : (
            <AppButton
              title="Start Challenge"
              onPress={handleStartChallenge}
              size="md"
              icon={<PlayCircle size={18} color="#FFFFFF" />}
              style={{ marginTop: 14 }}
            />
          )}
        </AppCard>

        {/* Event 3: Persistent Waiting-For-Partner Card */}
        {!partner && activeInvitation && (
          <AppCard elevated style={[styles.waitingCard, { borderColor: theme.colors.primary, borderWidth: 1.5 }]}>
            <View style={styles.waitingHeader}>
              <View style={[styles.waitingIconBubble, { backgroundColor: theme.colors.primaryLight }]}>
                <Heart size={20} color={theme.colors.primaryDark} fill={theme.colors.primaryDark} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.waitingTitle, { color: theme.colors.textPrimary }]}>
                  Waiting for your person 💌
                </Text>
                <Text style={[styles.waitingSubtitle, { color: theme.colors.textSecondary }]}>
                  Share code {activeInvitation.code} with your partner to start your shared world.
                </Text>
              </View>
            </View>

            <View style={styles.waitingCodeRow}>
              <View style={[styles.waitingCodeBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Text style={[styles.waitingCodeText, { color: theme.colors.primaryDark }]}>
                  {activeInvitation.code}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.waitingBtn, { backgroundColor: theme.colors.primary }]}
                onPress={async () => {
                  await Clipboard.setStringAsync(activeInvitation.code);
                  setCopiedInvite(true);
                  setTimeout(() => setCopiedInvite(false), 2000);
                }}
              >
                <Copy size={16} color="#FFFFFF" />
                <Text style={styles.waitingBtnText}>{copiedInvite ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.waitingBtn, { backgroundColor: theme.colors.primaryDark, marginLeft: 8 }]}
                onPress={() => router.push('/(onboarding)/pair')}
              >
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.waitingBtnText}>Share</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.waitingPulseRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.waitingPulseText, { color: theme.colors.textMuted }]}>
                Expires in 48 hours • Waiting for partner...
              </Text>
              <TouchableOpacity
                onPress={() => user && cancelInvite(user.uid)}
                style={{ marginLeft: 'auto' }}
              >
                <Text style={{ fontSize: 13, color: theme.colors.error, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        )}

        {/* Dynamic Real-Time Active Match / Pending Turns Card */}
        {activeSessions.length > 0 ? (() => {
          const topSession = activeSessions[0];
          const gameDef = GAME_CATALOGUE.find((g) => g.id === topSession.gameId);
          const isWaitingForMe =
            topSession.status === 'waiting' &&
            !topSession.readyPlayers.includes(user?.uid || '');
          const isMyTurn =
            topSession.status === 'active' && topSession.currentTurn === user?.uid;

          const title = isWaitingForMe
            ? `Match Invite: ${gameDef?.name || 'Game'}`
            : isMyTurn
            ? `Your Turn: ${gameDef?.name || 'Game'}`
            : `Active Game: ${gameDef?.name || 'Game'}`;

          const desc = isWaitingForMe
            ? `${partner?.displayName || 'Your partner'} started a game and is waiting for you!`
            : isMyTurn
            ? `It's your move in ${gameDef?.name || 'the match'}!`
            : `Waiting for ${partner?.displayName || 'your partner'} to make their move.`;

          return (
            <AppCard style={styles.pendingActionCard}>
              <View style={styles.pendingRow}>
                <View
                  style={[
                    styles.pendingIconBox,
                    {
                      backgroundColor:
                        isWaitingForMe || isMyTurn
                          ? theme.colors.primaryLight
                          : theme.isDark
                          ? '#2A253C'
                          : '#F0EEF6',
                    },
                  ]}
                >
                  <Sparkles
                    size={20}
                    color={
                      isWaitingForMe || isMyTurn
                        ? theme.colors.primaryDark
                        : theme.colors.textMuted
                    }
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.pendingTitle, { color: theme.colors.textPrimary }]}>
                    {title}
                  </Text>
                  <Text style={[styles.pendingDesc, { color: theme.colors.textSecondary }]}>
                    {desc}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/game',
                      params: { gameId: topSession.gameId, sessionId: topSession.id },
                    })
                  }
                  style={styles.pendingArrowBtn}
                >
                  <ArrowRight size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </AppCard>
          );
        })() : (
          <AppCard style={styles.pendingActionCard}>
            <View style={styles.pendingRow}>
              <View
                style={[
                  styles.pendingIconBox,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <PlayCircle size={20} color={theme.colors.primaryDark} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.pendingTitle, { color: theme.colors.textPrimary }]}>
                  All Caught Up
                </Text>
                <Text style={[styles.pendingDesc, { color: theme.colors.textSecondary }]}>
                  {partner
                    ? `Ready to play? Start a match with ${partner.displayName}!`
                    : 'Pair with your partner to start playing multiplayer games!'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(partner ? '/(tabs)/games' : '/(onboarding)/pair')}
                style={styles.pendingArrowBtn}
              >
                <ArrowRight size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </AppCard>
        )}

        {/* Real Recent Milestone / Achievement Highlight */}
        <AppCard style={styles.milestoneHighlightCard}>
          <View style={styles.milestoneRow}>
            <View style={styles.milestoneIcon}>
              <Trophy size={22} color={theme.colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.milestoneTitle, { color: theme.colors.textPrimary }]}>
                {recentAchievement ? 'Recent Milestone' : 'Couple Milestones'}
              </Text>
              <Text style={[styles.milestoneDesc, { color: theme.colors.textSecondary }]}>
                {recentAchievement
                  ? `"${recentAchievement.title}" milestone unlocked! (+${recentAchievement.rewardXP} XP)`
                  : 'Play matches and daily challenges together to unlock badges!'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/our-world')}
              style={styles.milestoneViewBtn}
            >
              <Text style={[styles.milestoneViewText, { color: theme.colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Ready to Play / Catalogue Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            All 10 Games Ready
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/games')}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
              Browse All
            </Text>
            <ChevronRight size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Recommended Game Cards */}
        {recommendedGames.slice(0, 3).map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPress={handleGamePress}
          />
        ))}

        {/* Tasteful Plus Subscription Card */}
        <AppCard style={styles.premiumCard}>
          <View style={styles.premiumRow}>
            <View
              style={[
                styles.crownBubble,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Crown size={22} color={theme.colors.secondary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.premiumTitle, { color: theme.colors.textPrimary }]}>
                Togetherly Plus
              </Text>
              <Text style={[styles.premiumDesc, { color: theme.colors.textSecondary }]}>
                1 subscription unlocks all 10 games & zero ads for both of you!
              </Text>
            </View>
          </View>
          <AppButton
            title="Explore Plus Perks (₹99/mo)"
            onPress={() => router.push('/(tabs)/profile')}
            variant="outline"
            size="sm"
            style={{ marginTop: 12 }}
          />
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, fontWeight: '500' },
  coupleNames: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  progressionCard: {
    padding: 16,
    marginBottom: 24,
  },
  progressionStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 28 },
  xpBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EBE6F2',
    marginTop: 16,
    overflow: 'hidden',
  },
  xpBarFill: { height: '100%', borderRadius: 4 },
  xpBarCaption: { fontSize: 11, textAlign: 'center', marginTop: 6, fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontSize: 13, fontWeight: '600' },
  challengeCard: { padding: 16, marginBottom: 18 },
  challengeContentRow: { flexDirection: 'row', alignItems: 'center' },
  challengeInfo: { flex: 1 },
  challengeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  challengeTitle: { fontSize: 16, fontWeight: '700' },
  challengeDesc: { fontSize: 13, lineHeight: 18 },
  challengeProgressRow: { marginTop: 8 },
  progressCountText: { fontSize: 12, fontWeight: '600' },
  challengeHint: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  completedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
  },
  completedText: { fontSize: 13, fontWeight: '700' },
  pendingActionCard: { padding: 14, marginBottom: 14 },
  pendingRow: { flexDirection: 'row', alignItems: 'center' },
  pendingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: { fontSize: 14, fontWeight: '700' },
  pendingDesc: { fontSize: 12, marginTop: 2 },
  pendingArrowBtn: { padding: 8 },
  milestoneHighlightCard: { padding: 14, marginBottom: 24 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center' },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF6E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneTitle: { fontSize: 14, fontWeight: '700' },
  milestoneDesc: { fontSize: 12, marginTop: 2 },
  milestoneViewBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  milestoneViewText: { fontSize: 12, fontWeight: '700' },
  premiumCard: {
    padding: 16,
    marginTop: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  premiumRow: { flexDirection: 'row', alignItems: 'center' },
  crownBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: { fontSize: 16, fontWeight: '700' },
  premiumDesc: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  toastBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    elevation: 8,
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toastBody: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  waitingCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitingIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  waitingSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  waitingCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  waitingCodeBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
  },
  waitingCodeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  waitingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  waitingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  waitingPulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  waitingPulseText: {
    fontSize: 12,
    marginLeft: 8,
  },
});
