/**
 * TOGETHERLY — GAME 4: ROCK PAPER SCISSORS
 *
 * Simultaneous hidden selection duel.
 * Best-of-three match progression with server-authoritative reveal.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { GameSession, UserProfile } from '@/types';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppButton } from '@/components/common/AppButton';
import { AppCard, Badge } from '@/components/common/AppCard';
import { RefreshCw, Clock } from 'lucide-react-native';

interface RockPaperScissorsGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onSubmitPick: (round: number, pick: string) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

const RPS_OPTIONS = [
  { id: 'Rock', emoji: '🪨', label: 'Rock' },
  { id: 'Paper', emoji: '📄', label: 'Paper' },
  { id: 'Scissors', emoji: '✂️', label: 'Scissors' },
];

export const RockPaperScissorsGame: React.FC<RockPaperScissorsGameProps> = ({
  session,
  currentUser,
  partnerName,
  onSubmitPick,
  onRematch,
  onExit,
}) => {
  const { theme } = useThemeStore();
  const currentRound = session.gameState.round || 1;
  const partnerId = session.playerIds.find((id) => id !== currentUser.uid) || '';

  const [selectedPick, setSelectedPick] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isWaitingForPartner = session.gameState.waitingForPartner;
  const isCompleted = session.status === 'completed';
  const roundHistory = session.gameState.roundHistory || [];

  const myScore = session.scores[currentUser.uid] || 0;
  const partnerScore = session.scores[partnerId] || 0;
  const isWinner = session.winnerId === currentUser.uid;

  const handlePick = async (pick: string) => {
    setSelectedPick(pick);
    setSubmitting(true);
    try {
      await onSubmitPick(currentRound, pick);
    } finally {
      setSubmitting(false);
      setSelectedPick(null);
    }
  };

  // --- FINAL RESULTS SCREEN ---
  if (isCompleted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.resultsHeader}>
          <Text style={{ fontSize: 52, marginBottom: 8 }}>{isWinner ? '🏆' : '👏'}</Text>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            {isWinner ? 'Match Won!' : `${partnerName} Won the Match!`}
          </Text>
          <Text style={[styles.scoreSummary, { color: theme.colors.primary }]}>
            {myScore} — {partnerScore}
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            First to win 2 rounds achieved victory!
          </Text>
          <Badge label="+50 Shared XP Awarded" variant="success" style={{ marginTop: 12 }} />
        </View>

        <Text style={[styles.historyHeader, { color: theme.colors.textSecondary }]}>
          ROUND SHOWDOWNS
        </Text>
        {roundHistory.map((item: any, idx: number) => {
          const myPick = item[currentUser.uid];
          const pPick = item[partnerId];
          const roundWinner = item.winner;
          const didIWinRound = roundWinner === currentUser.uid;
          const isTie = roundWinner === 'tie';

          const getEmoji = (p: string) => (p === 'Rock' ? '🪨' : p === 'Paper' ? '📄' : '✂️');

          return (
            <AppCard key={idx} style={styles.roundCard}>
              <View style={styles.roundCardHeader}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary }}>
                  Round {item.round || idx + 1}
                </Text>
                <Badge
                  label={isTie ? 'TIE' : didIWinRound ? 'YOU WON' : `${partnerName.toUpperCase()} WON`}
                  variant={isTie ? 'neutral' : didIWinRound ? 'success' : 'secondary'}
                />
              </View>

              <View style={styles.clashRow}>
                <View style={styles.clashPick}>
                  <Text style={{ fontSize: 36 }}>{getEmoji(myPick)}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 4 }}>You ({myPick})</Text>
                </View>

                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.textMuted }}>VS</Text>

                <View style={styles.clashPick}>
                  <Text style={{ fontSize: 36 }}>{getEmoji(pPick)}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                    {partnerName} ({pPick})
                  </Text>
                </View>
              </View>
            </AppCard>
          );
        })}

        <View style={styles.actionRow}>
          <AppButton
            title="Play Rematch"
            onPress={onRematch}
            size="lg"
            icon={<RefreshCw size={18} color="#FFFFFF" />}
            style={{ flex: 1, marginRight: 8 }}
          />
          <AppButton
            title="Exit"
            onPress={onExit}
            variant="outline"
            size="lg"
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    );
  }

  // --- WAITING FOR PARTNER ---
  if (isWaitingForPartner) {
    return (
      <View style={styles.waitingContainer}>
        <View style={[styles.waitingBubble, { backgroundColor: theme.colors.primaryLight }]}>
          <Clock size={36} color={theme.colors.primaryDark} />
        </View>
        <Text style={[styles.waitingTitle, { color: theme.colors.textPrimary }]}>
          Weapon Chosen!
        </Text>
        <Text style={[styles.waitingSubtitle, { color: theme.colors.textSecondary }]}>
          Waiting for {partnerName} to pick. As soon as both are locked, the clash will reveal instantly!
        </Text>
      </View>
    );
  }

  // --- ACTIVE RPS SELECTION SCREEN ---
  return (
    <View style={styles.container}>
      {/* Best of 3 Score Indicator */}
      <View style={styles.scoreBoardHeader}>
        <View style={styles.scoreCol}>
          <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>You</Text>
          <Text style={[styles.scoreDigit, { color: theme.colors.primary }]}>{myScore}</Text>
        </View>
        <View style={styles.roundBadgeBox}>
          <Badge label={`Round ${currentRound}`} variant="primary" />
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 }}>
            Best of 3
          </Text>
        </View>
        <View style={styles.scoreCol}>
          <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>{partnerName}</Text>
          <Text style={[styles.scoreDigit, { color: theme.colors.secondary }]}>{partnerScore}</Text>
        </View>
      </View>

      <Text style={[styles.promptTitle, { color: theme.colors.textPrimary }]}>
        Choose your move!
      </Text>

      {/* Choice Buttons */}
      <View style={styles.choicesRow}>
        {RPS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.82}
            disabled={submitting}
            onPress={() => handlePick(opt.id)}
            style={[
              styles.choiceBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: selectedPick === opt.id ? theme.colors.primary : theme.colors.border,
              },
              theme.shadows.medium,
            ]}
          >
            <Text style={styles.choiceEmoji}>{opt.emoji}</Text>
            <Text style={[styles.choiceLabel, { color: theme.colors.textPrimary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  scoreBoardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  scoreCol: { alignItems: 'center' },
  scoreLabel: { fontSize: 13, fontWeight: '600' },
  scoreDigit: { fontSize: 32, fontWeight: '800' },
  roundBadgeBox: { alignItems: 'center' },
  promptTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  choicesRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  choiceBtn: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceEmoji: { fontSize: 44, marginBottom: 8 },
  choiceLabel: { fontSize: 15, fontWeight: '700' },
  waitingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  waitingBubble: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  waitingTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  waitingSubtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  resultsHeader: { alignItems: 'center', marginBottom: 20 },
  resultTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  scoreSummary: { fontSize: 36, fontWeight: '800', marginVertical: 6 },
  resultSubtitle: { fontSize: 14, textAlign: 'center' },
  historyHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  roundCard: { padding: 14, marginBottom: 10 },
  roundCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clashRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  clashPick: { alignItems: 'center' },
  actionRow: { flexDirection: 'row', marginTop: 20 },
});
