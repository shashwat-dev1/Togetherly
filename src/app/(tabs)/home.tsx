/**
 * TOGETHERLY — HOME DASHBOARD
 *
 * Primary couple hub featuring shared presence, streak counter,
 * couple level progression, daily challenge, continue playing, and quick play.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { GameDefinition } from '@/types';
import {
  Flame,
  Sparkles,
  ChevronRight,
  Target,
  Crown,
  PlayCircle,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { couple } = useCoupleStore();

  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

  // XP calculation
  const currentXP = couple?.sharedXP || 1450;
  const currentLevel = couple?.coupleLevel || 5;
  const progressRatio = Math.min(1, (currentXP % 500) / 500);

  const streak = couple?.streakData.currentStreak || 7;

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

        {/* Couple Progression Banner (Streak + Shared XP) */}
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
                Days Together
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.colors.divider }]} />

            {/* Shared Level */}
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Sparkles size={18} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                  Lvl {currentLevel}
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Couple Level
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

          {/* XP Progress Bar */}
          <View style={styles.xpBarTrack}>
            <View
              style={[
                styles.xpBarFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${Math.round(progressRatio * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.xpBarCaption, { color: theme.colors.textMuted }]}>
            {500 - (currentXP % 500)} XP to reach Level {currentLevel + 1}
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
          <Badge label="+100 XP" variant="warning" />
        </View>

        <AppCard style={styles.challengeCard}>
          <View style={styles.challengeContentRow}>
            <View style={styles.challengeInfo}>
              <Text style={[styles.challengeTitle, { color: theme.colors.textPrimary }]}>
                Mind Reader Showdown
              </Text>
              <Text style={[styles.challengeDesc, { color: theme.colors.textSecondary }]}>
                Complete 1 match of &quot;Who Knows Whom Better?&quot; and answer 5 questions about each other.
              </Text>
            </View>
          </View>

          <AppButton
            title="Start Challenge"
            onPress={() => router.push('/(tabs)/games')}
            size="md"
            icon={<PlayCircle size={18} color="#FFFFFF" />}
            style={{ marginTop: 14 }}
          />
        </AppCard>

        {/* Continue Playing / Active Turn */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Ready to Play
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/games')}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
              All 10 Games
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
                { backgroundColor: theme.colors.accent },
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
  challengeCard: { padding: 16, marginBottom: 24 },
  challengeContentRow: { flexDirection: 'row', alignItems: 'center' },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  challengeDesc: { fontSize: 13, lineHeight: 18 },
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

