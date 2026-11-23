/**
 * TOGETHERLY — OUR WORLD (COUPLE UNIVERSE)
 *
 * Displays shared milestones, couple level progression,
 * 17 hydrated achievements across 5 categories, and the
 * future "Our Little World" virtual pet teaser.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { CoupleAvatar } from '@/components/common/CoupleAvatar';
import { AppCard, Badge } from '@/components/common/AppCard';
import { Modal } from '@/components/common/Modal';
import { AppButton } from '@/components/common/AppButton';
import { AchievementService } from '@/services/engagement/achievementService';
import { calculateLevelFromXP } from '@/services/engagement/xpProgressionService';
import { Achievement, AchievementCategory, AchievementTier } from '@/types';
import { ACHIEVEMENT_CATEGORIES } from '@/constants/achievements';
import {
  Trophy,
  Compass,
  Sparkles,
  Award,
  CheckCircle2,
  Lock,
  Users,
} from 'lucide-react-native';

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#8A99A8',
  gold: '#F59E0B',
  platinum: '#00B4D8',
};

export default function OurWorldScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { couple } = useCoupleStore();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(couple?.id));

  const coupleId = couple?.id;
  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

  useEffect(() => {
    let isMounted = true;
    if (!coupleId) {
      return;
    }
    AchievementService.getCoupleAchievements(coupleId)
      .then((list) => {
        if (isMounted) {
          setAchievements(list);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load achievements:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [coupleId]);

  const connectedDate = useMemo(() => {
    const timestamp = couple?.createdAt || 1700000000000;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [couple?.createdAt]);

  const levelInfo = useMemo(() => {
    return calculateLevelFromXP(couple?.sharedXP || 0);
  }, [couple?.sharedXP]);

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.unlocked).length;
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter((a) => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  if (!couple) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Users size={52} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.textPrimary, marginTop: 16 }]}>
            No Couple Connected
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textSecondary, textAlign: 'center', marginHorizontal: 28, marginTop: 8 },
            ]}
          >
            Pair with your partner to start unlocking shared milestones, leveling up, and tracking achievements together.
          </Text>
          <AppButton
            title="Pair With Partner"
            onPress={() => router.push('/(onboarding)/pair')}
            style={{ marginTop: 24, minWidth: 200 }}
          />
        </View>
      </SafeAreaView>
    );
  }

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

        {/* Couple Level Progression Banner */}
        <AppCard elevated style={styles.progressionCard}>
          <View style={styles.levelRow}>
            <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}>
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.levelBadgeText}>Level {levelInfo.level}</Text>
            </View>
            <Text style={[styles.levelTitle, { color: theme.colors.primary }]}>
              {levelInfo.title}
            </Text>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.progressBarWrapper}>
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: theme.isDark ? '#2B263D' : '#E8E2F2' },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${Math.min(100, Math.max(0, levelInfo.progressPercent))}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.progressTextRow}>
              <Text style={[styles.progressSubText, { color: theme.colors.textMuted }]}>
                {levelInfo.currentLevelXP} / {levelInfo.nextLevelXP - levelInfo.currentLevelMinXP} XP
              </Text>
              <Text style={[styles.progressSubText, { color: theme.colors.textMuted }]}>
                {levelInfo.xpToNextLevel} XP to Level {levelInfo.level + 1}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Milestone Statistics Card */}
        <AppCard elevated style={styles.statsCard}>
          <Text style={[styles.cardHeader, { color: theme.colors.textPrimary }]}>
            Shared Milestones
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {couple?.sharedXP || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total XP Earned
              </Text>
            </View>

            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                {couple?.streakData.currentStreak || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Current Streak
              </Text>
            </View>

            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.colors.secondary }]}>
                {couple?.streakData.longestStreak || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Longest Streak
              </Text>
            </View>

            <View style={styles.statCell}>
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                {unlockedCount} / {achievements.length || 17}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Achievements
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

        {/* Shared Achievements Section */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Trophy size={18} color={theme.colors.warning} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Couple Achievements
            </Text>
          </View>
          <Badge
            label={`${unlockedCount} of ${achievements.length || 17} Unlocked`}
            variant={unlockedCount > 0 ? 'success' : 'neutral'}
          />
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  selectedCategory === 'all'
                    ? theme.colors.primary
                    : theme.isDark
                    ? '#2A243C'
                    : '#ECE8F5',
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.categoryChipText,
                {
                  color: selectedCategory === 'all' ? '#FFFFFF' : theme.colors.textSecondary,
                  fontWeight: selectedCategory === 'all' ? '700' : '500',
                },
              ]}
            >
              All ({achievements.length})
            </Text>
          </TouchableOpacity>

          {ACHIEVEMENT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = achievements.filter((a) => a.category === cat.id).length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.isDark
                      ? '#2A243C'
                      : '#ECE8F5',
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          filteredAchievements.map((item) => {
            const tierColor = TIER_COLORS[item.tier];
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedAchievement(item)}
              >
                <AppCard
                  style={[
                    styles.achievementCard,
                    {
                      opacity: item.unlocked ? 1 : 0.6,
                      borderColor: item.unlocked ? `${tierColor}40` : theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.achievementRow}>
                    <View
                      style={[
                        styles.achievementIconBox,
                        {
                          backgroundColor: item.unlocked
                            ? theme.colors.primaryLight
                            : theme.isDark
                            ? '#2A243C'
                            : '#ECE8F5',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.achievementTitleRow}>
                        <Text
                          style={[styles.achievementTitle, { color: theme.colors.textPrimary }]}
                        >
                          {item.title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View
                            style={[
                              styles.tierBadge,
                              { backgroundColor: `${tierColor}20`, borderColor: tierColor },
                            ]}
                          >
                            <Text style={[styles.tierText, { color: tierColor }]}>
                              {item.tier.toUpperCase()}
                            </Text>
                          </View>
                          {item.unlocked ? (
                            <Badge label="Unlocked" variant="success" />
                          ) : (
                            <Badge label="Locked" variant="neutral" />
                          )}
                        </View>
                      </View>

                      <Text
                        style={[styles.achievementDesc, { color: theme.colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>

                      <View style={styles.rewardRow}>
                        <Award size={13} color={theme.colors.primary} />
                        <Text style={[styles.rewardText, { color: theme.colors.primary }]}>
                          +{item.rewardXP} Shared XP
                        </Text>
                      </View>
                    </View>
                  </View>
                </AppCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Achievement Detail Modal */}
      {selectedAchievement ? (
        <Modal
          visible={!!selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
          title="Achievement Details"
        >
          <View style={styles.modalContent}>
            <View
              style={[
                styles.modalIconBox,
                {
                  backgroundColor: selectedAchievement.unlocked
                    ? theme.colors.primaryLight
                    : theme.isDark
                    ? '#2A243C'
                    : '#ECE8F5',
                },
              ]}
            >
              <Text style={{ fontSize: 44 }}>{selectedAchievement.icon}</Text>
            </View>

            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
              {selectedAchievement.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 }}>
              <View
                style={[
                  styles.tierBadge,
                  {
                    backgroundColor: `${TIER_COLORS[selectedAchievement.tier]}20`,
                    borderColor: TIER_COLORS[selectedAchievement.tier],
                  },
                ]}
              >
                <Text style={[styles.tierText, { color: TIER_COLORS[selectedAchievement.tier] }]}>
                  {selectedAchievement.tier.toUpperCase()} TIER
                </Text>
              </View>

              {selectedAchievement.unlocked ? (
                <View style={styles.unlockedTag}>
                  <CheckCircle2 size={13} color={theme.colors.success} />
                  <Text style={[styles.unlockedText, { color: theme.colors.success }]}>
                    Unlocked
                  </Text>
                </View>
              ) : (
                <View style={styles.lockedTag}>
                  <Lock size={13} color={theme.colors.textMuted} />
                  <Text style={[styles.lockedText, { color: theme.colors.textMuted }]}>
                    In Progress
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.modalDesc, { color: theme.colors.textSecondary }]}>
              {selectedAchievement.description}
            </Text>

            <View
              style={[
                styles.modalRewardBox,
                { backgroundColor: theme.isDark ? '#27223B' : '#F6F2FC' },
              ]}
            >
              <Award size={18} color={theme.colors.primary} />
              <Text style={[styles.modalRewardText, { color: theme.colors.primary }]}>
                Reward: +{selectedAchievement.rewardXP} Shared Couple XP
              </Text>
            </View>

            {selectedAchievement.unlockedAt ? (
              <Text style={[styles.unlockedAtDate, { color: theme.colors.textMuted }]}>
                Unlocked on {new Date(selectedAchievement.unlockedAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            ) : null}

            <AppButton
              title="Close"
              variant="outline"
              onPress={() => setSelectedAchievement(null)}
              style={{ marginTop: 18, width: '100%' }}
            />
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 32 },
  header: { alignItems: 'center', marginVertical: 12 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 13, marginTop: 4 },
  progressionCard: { padding: 16, marginBottom: 16 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  levelBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  levelTitle: { fontSize: 14, fontWeight: '700' },
  progressBarWrapper: { marginTop: 12 },
  progressBarBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: 10, borderRadius: 5 },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressSubText: { fontSize: 11, fontWeight: '500' },
  statsCard: { padding: 18, marginBottom: 16 },
  cardHeader: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCell: { width: '50%', paddingVertical: 10, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  virtualWorldCard: {
    padding: 18,
    marginBottom: 20,
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
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  categoryScroll: { gap: 8, paddingBottom: 14 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  categoryChipText: { fontSize: 12 },
  achievementCard: { padding: 14, marginBottom: 10, borderWidth: 1 },
  achievementRow: { flexDirection: 'row', alignItems: 'center' },
  achievementIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  achievementTitle: { fontSize: 15, fontWeight: '700' },
  achievementDesc: { fontSize: 12, lineHeight: 16, marginTop: 4 },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  rewardText: { fontSize: 11, fontWeight: '700' },
  modalContent: { alignItems: 'center', paddingVertical: 10 },
  modalIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginVertical: 10 },
  modalRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  modalRewardText: { fontSize: 13, fontWeight: '700' },
  unlockedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unlockedText: { fontSize: 12, fontWeight: '700' },
  lockedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedText: { fontSize: 12, fontWeight: '600' },
  unlockedAtDate: { fontSize: 11, marginTop: 10 },
});
