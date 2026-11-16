/**
 * TOGETHERLY — OUR WORLD (COUPLE UNIVERSE)
 *
 * Displays shared milestones, achievements, couple memory stats,
 * and the future "Our Little World" virtual pet teaser.
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { CoupleAvatar } from '@/components/common/CoupleAvatar';
import { AppCard, Badge } from '@/components/common/AppCard';
import { Trophy, Compass } from 'lucide-react-native';

const ACHIEVEMENTS = [
  {
    id: 'first-match',
    title: 'First Spark',
    desc: 'Completed your very first game together',
    tier: 'bronze',
    icon: '✨',
    unlocked: true,
  },
  {
    id: 'mind-reader',
    title: 'Mind Readers',
    desc: 'Achieved a 100% match in Who Knows Whom Better',
    tier: 'gold',
    icon: '🔮',
    unlocked: true,
  },
  {
    id: 'seven-days',
    title: 'Seven Days Together',
    desc: 'Maintained a 7-day continuous gaming streak',
    tier: 'silver',
    icon: '🔥',
    unlocked: true,
  },
  {
    id: 'game-explorer',
    title: 'Game Explorers',
    desc: 'Played at least 5 different games in the catalogue',
    tier: 'bronze',
    icon: '🧭',
    unlocked: false,
  },
  {
    id: 'trivia-champions',
    title: 'Trivia Champions',
    desc: 'Answered 20 trivia questions correctly',
    tier: 'silver',
    icon: '👑',
    unlocked: false,
  },
];

export default function OurWorldScreen() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { couple } = useCoupleStore();

  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

  const connectedDate = useMemo(() => {
    const timestamp = couple?.createdAt || 1700000000000;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [couple?.createdAt]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* World Header */}
        <View style={styles.header}>
          <CoupleAvatar
            userAvatarId={user?.avatarId}
            userName={user?.displayName}
            partnerAvatarId={partner?.avatarId}
            partnerName={partner?.displayName}
            size={64}
          />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {user?.displayName} & {partner?.displayName || 'Partner'}&apos;s Little World
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Connected since {connectedDate}
          </Text>
        </View>

        {/* Milestone Statistics Card */}
        <AppCard elevated style={styles.statsCard}>
          <Text style={[styles.cardHeader, { color: theme.colors.textPrimary }]}>
            Couple Milestones
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {couple?.sharedXP || 1450}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Shared XP
              </Text>
            </View>

            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.colors.secondary }]}>
                24
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Matches Played
              </Text>
            </View>

            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                {couple?.streakData.currentStreak || 7}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Day Streak
              </Text>
            </View>

            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                88%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Affinity Score
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Future Virtual World Teaser (Section 11 Architecture) */}
        <AppCard style={styles.virtualWorldCard}>
          <View style={styles.virtualHeaderRow}>
            <View
              style={[
                styles.virtualBubble,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Compass size={24} color={theme.colors.primaryDark} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Badge label="IN ROADMAP" variant="primary" style={{ marginBottom: 4 }} />
              <Text style={[styles.virtualTitle, { color: theme.colors.textPrimary }]}>
                Our Little World & Shared Pet
              </Text>
            </View>
          </View>
          <Text style={[styles.virtualDesc, { color: theme.colors.textSecondary }]}>
            A shared cozy virtual sanctuary where both of you can adopt a couple&apos;s pet, decorate your living room, and unlock furniture with your shared game XP.
          </Text>
        </AppCard>

        {/* Shared Achievements */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Trophy size={18} color={theme.colors.warning} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Unlocked Achievements
            </Text>
          </View>
          <Badge label="3 of 5 Unlocked" variant="neutral" />
        </View>

        {ACHIEVEMENTS.map((item) => (
          <AppCard
            key={item.id}
            style={[
              styles.achievementCard,
              { opacity: item.unlocked ? 1 : 0.55 },
            ]}
          >
            <View style={styles.achievementRow}>
              <View
                style={[
                  styles.achievementIconBox,
                  {
                    backgroundColor: item.unlocked
                      ? theme.colors.primaryLight
                      : theme.colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.achievementTitle, { color: theme.colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  {item.unlocked ? (
                    <Badge label="Unlocked" variant="success" />
                  ) : (
                    <Badge label="Locked" variant="neutral" />
                  )}
                </View>
                <Text style={[styles.achievementDesc, { color: theme.colors.textSecondary }]}>
                  {item.desc}
                </Text>
              </View>
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  header: { alignItems: 'center', marginVertical: 16 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 13, marginTop: 4 },
  statsCard: { padding: 18, marginBottom: 20 },
  cardHeader: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCell: { width: '50%', paddingVertical: 10, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  virtualWorldCard: {
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  virtualHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  virtualBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  virtualTitle: { fontSize: 16, fontWeight: '700' },
  virtualDesc: { fontSize: 13, lineHeight: 19 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  achievementCard: { padding: 14, marginBottom: 10 },
  achievementRow: { flexDirection: 'row', alignItems: 'center' },
  achievementIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementTitle: { fontSize: 15, fontWeight: '700' },
  achievementDesc: { fontSize: 12, lineHeight: 16, marginTop: 2 },
});

