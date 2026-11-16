/**
 * TOGETHERLY — ACTIVITY FEED & INVITATIONS
 *
 * Real-time match invitations, turns waiting for you,
 * completed game summaries, achievements, and couple milestones.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { ActivityService } from '@/services/engagement/activityService';
import { CoupleActivityItem } from '@/types';
import { AppCard, Badge } from '@/components/common/AppCard';
import { AppButton } from '@/components/common/AppButton';
import {
  Play,
  Trophy,
  Flame,
  Target,
  Sparkles,
  Gamepad2,
  Clock,
  RotateCcw,
} from 'lucide-react-native';

type FilterType = 'all' | 'turns' | 'games' | 'milestones';

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ActivityScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { couple } = useCoupleStore();
  const { user } = useAuthStore();

  const [activities, setActivities] = useState<CoupleActivityItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const coupleId = couple?.id || 'cpl_demo_mock_123';
  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

  useEffect(() => {
    let isMounted = true;
    ActivityService.getActivities(coupleId, 50)
      .then((list) => {
        if (isMounted) {
          setActivities(list);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load activities:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [coupleId]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const list = await ActivityService.getActivities(coupleId, 50);
      setActivities(list);
    } catch (err) {
      console.warn('Failed to refresh activities:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [coupleId]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (filter === 'all') return true;
      if (filter === 'turns') return act.actionRequired || act.type === 'turn_ready';
      if (filter === 'games') return act.type === 'game_completed';
      if (filter === 'milestones') {
        return (
          act.type === 'achievement_unlocked' ||
          act.type === 'level_up' ||
          act.type === 'daily_challenge' ||
          act.type === 'streak_milestone'
        );
      }
      return true;
    });
  }, [activities, filter]);

  const renderIcon = (type: CoupleActivityItem['type']) => {
    switch (type) {
      case 'turn_ready':
        return <Play size={18} color="#FFFFFF" fill="#FFFFFF" />;
      case 'game_completed':
        return <Gamepad2 size={18} color="#FFFFFF" />;
      case 'achievement_unlocked':
        return <Trophy size={18} color="#FFFFFF" />;
      case 'daily_challenge':
        return <Target size={18} color="#FFFFFF" />;
      case 'level_up':
        return <Sparkles size={18} color="#FFFFFF" />;
      case 'streak_milestone':
        return <Flame size={18} color="#FFFFFF" />;
      default:
        return <Clock size={18} color="#FFFFFF" />;
    }
  };

  const getIconBg = (act: CoupleActivityItem) => {
    if (act.actionRequired) return theme.colors.primary;
    switch (act.type) {
      case 'achievement_unlocked':
        return theme.colors.warning;
      case 'daily_challenge':
        return theme.colors.secondary;
      case 'level_up':
        return '#8A4FFF';
      case 'streak_milestone':
        return '#FF7043';
      default:
        return theme.colors.success;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Activity & Turns
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Shared gaming timeline with {partner?.displayName || 'your partner'}.
        </Text>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'turns', label: 'Turns Waiting' },
              { id: 'games', label: 'Games' },
              { id: 'milestones', label: 'Milestones' },
            ] as const
          ).map((tab) => {
            const isActive = filter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? theme.colors.primary
                      : theme.isDark
                      ? '#2A243C'
                      : '#ECE8F5',
                  },
                ]}
                onPress={() => setFilter(tab.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {filteredActivities.length === 0 ? (
            <AppCard style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>💌</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                No activities yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                {filter === 'turns'
                  ? 'All caught up! No turns are waiting for you right now.'
                  : 'Start a game or complete today’s daily challenge to see it here.'}
              </Text>
            </AppCard>
          ) : (
            filteredActivities.map((act) => (
              <AppCard key={act.id} style={styles.activityCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <View style={[styles.typeIcon, { backgroundColor: getIconBg(act) }]}>
                      {renderIcon(act.type)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activityTitle, { color: theme.colors.textPrimary }]}>
                        {act.title}
                      </Text>
                      <Text style={[styles.timestamp, { color: theme.colors.textMuted }]}>
                        {formatRelativeTime(act.timestamp)}
                      </Text>
                    </View>
                  </View>
                  {act.xpAwarded ? (
                    <Badge label={`+${act.xpAwarded} XP`} variant="primary" />
                  ) : null}
                </View>

                <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                  {act.description}
                </Text>

                {act.actionRequired && act.gameId ? (
                  <View style={styles.actionRow}>
                    <AppButton
                      title="Play Your Turn"
                      onPress={() =>
                        router.push({
                          pathname: '/game',
                          params: { gameId: act.gameId },
                        })
                      }
                      size="sm"
                      icon={<Play size={14} color="#FFFFFF" fill="#FFFFFF" />}
                      style={{ alignSelf: 'flex-start' }}
                    />
                  </View>
                ) : act.gameId && act.type === 'game_completed' ? (
                  <View style={styles.actionRow}>
                    <AppButton
                      title="Play Again"
                      variant="outline"
                      onPress={() =>
                        router.push({
                          pathname: '/game',
                          params: { gameId: act.gameId },
                        })
                      }
                      size="sm"
                      icon={<RotateCcw size={14} color={theme.colors.primary} />}
                      style={{ alignSelf: 'flex-start' }}
                    />
                  </View>
                ) : null}
              </AppCard>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 12,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activityCard: { padding: 16, marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: { fontSize: 15, fontWeight: '700' },
  timestamp: { fontSize: 12, marginTop: 1 },
  message: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  actionRow: { marginTop: 12 },
  emptyCard: { padding: 28, alignItems: 'center', marginTop: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
