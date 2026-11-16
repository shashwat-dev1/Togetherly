/**
 * TOGETHERLY — ACTIVITY FEED & INVITATIONS
 *
 * Real-time match invitations, turns waiting for you,
 * completed game summaries, and couple notifications.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { AppCard } from '@/components/common/AppCard';
import { AppButton } from '@/components/common/AppButton';
import { Play } from 'lucide-react-native';

const RECENT_ACTIVITIES = [
  {
    id: 'act_1',
    type: 'turn_ready',
    gameTitle: 'Who Knows Whom Better?',
    partnerName: 'Sam',
    timestamp: '10 mins ago',
    message: 'Submitted answers for Round 3! Your turn to guess.',
    actionRequired: true,
    gameId: 'who-knows-whom',
  },
  {
    id: 'act_2',
    type: 'completed',
    gameTitle: 'Tic-Tac-Toe',
    partnerName: 'Sam',
    timestamp: '2 hours ago',
    message: 'Match ended in a Draw! +20 XP awarded to both.',
    actionRequired: false,
    gameId: 'tic-tac-toe',
  },
  {
    id: 'act_3',
    type: 'achievement',
    gameTitle: 'Milestone Unlocked',
    partnerName: 'Togetherly',
    timestamp: 'Yesterday',
    message: 'Unlocked "Seven Days Together" streak achievement! 🔥',
    actionRequired: false,
  },
  {
    id: 'act_4',
    type: 'completed',
    gameTitle: 'This or That',
    partnerName: 'Sam',
    timestamp: '2 days ago',
    message: '90% Affinity match achieved! 9 out of 10 matched choices.',
    actionRequired: false,
    gameId: 'this-or-that',
  },
];

export default function ActivityScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { couple } = useCoupleStore();
  const { user } = useAuthStore();

  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Activity & Turns
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Invitations and turns waiting between you and {partner?.displayName || 'your partner'}.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {RECENT_ACTIVITIES.map((act) => (
          <AppCard key={act.id} style={styles.activityCard}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <View
                  style={[
                    styles.typeDot,
                    {
                      backgroundColor: act.actionRequired
                        ? theme.colors.primary
                        : theme.colors.success,
                    },
                  ]}
                />
                <Text style={[styles.activityTitle, { color: theme.colors.textPrimary }]}>
                  {act.gameTitle}
                </Text>
              </View>
              <Text style={[styles.timestamp, { color: theme.colors.textMuted }]}>
                {act.timestamp}
              </Text>
            </View>

            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
              {act.message}
            </Text>

            {act.actionRequired ? (
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
                style={{ marginTop: 12, alignSelf: 'flex-start' }}
              />
            ) : null}
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  activityCard: { padding: 16, marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  activityTitle: { fontSize: 15, fontWeight: '700' },
  timestamp: { fontSize: 12 },
  message: { fontSize: 13, lineHeight: 18 },
});

