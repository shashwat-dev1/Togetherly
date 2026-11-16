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
import { GameCard } from '@/components/games/GameCard';
import { GAME_CATALOGUE } from '@/games/registry';
import { GameDefinition, DailyChallenge, CoupleDailyChallengeProgress } from '@/types';
import { DailyChallengeService } from '@/services/engagement/dailyChallengeService';
import { calculateLevelFromXP } from '@/services/engagement/xpProgressionService';
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
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { couple, updateSharedXP } = useCoupleStore();

  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

  // Shared couple XP & level progression curve
  const currentXP = couple?.sharedXP || 1450;
  const levelProgress = calculateLevelFromXP(currentXP);
  const streak = couple?.streakData.currentStreak || 7;

  // Daily Challenge State
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<CoupleDailyChallengeProgress | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);
  const [rewardClaimedSuccess, setRewardClaimedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchChallenge = async () => {
      if (!couple?.id) return;
      try {
        const { challenge, progress } = await DailyChallengeService.getDailyChallengeWithProgress(couple.id);
        if (isMounted) {
          setDailyChallenge(challenge);
          setChallengeProgress(progress);
        }
      } catch (err) {
        console.error('[Home] Failed to load daily challenge:', err);
      }
    };
    fetchChallenge();
    return () => {
      isMounted = false;
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

        {/* Pending Partner Actions Card */}
        <AppCard style={styles.pendingActionCard}>
          <View style={styles.pendingRow}>
            <View
              style={[
                styles.pendingIconBox,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Sparkles size={20} color={theme.colors.primaryDark} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.pendingTitle, { color: theme.colors.textPrimary }]}>
                Turns Waiting
              </Text>
              <Text style={[styles.pendingDesc, { color: theme.colors.textSecondary }]}>
                Check if your partner has made a move in your active games.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/activity')}
              style={styles.pendingArrowBtn}
            >
              <ArrowRight size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Recent Milestone / Achievement Highlight */}
        <AppCard style={styles.milestoneHighlightCard}>
          <View style={styles.milestoneRow}>
            <View style={styles.milestoneIcon}>
              <Trophy size={22} color={theme.colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.milestoneTitle, { color: theme.colors.textPrimary }]}>
                Recent Achievement
              </Text>
              <Text style={[styles.milestoneDesc, { color: theme.colors.textSecondary }]}>
                &quot;Seven Days Together&quot; consistency milestone unlocked!
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
});
