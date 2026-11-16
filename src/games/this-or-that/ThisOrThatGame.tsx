/**
 * TOGETHERLY — GAME 2: THIS OR THAT
 *
 * Simultaneous preference duel. Both players pick independently.
 * Reveals both answers on double submission, tracking affinity percentage.
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
import { THIS_OR_THAT_BANK } from './questions';
import { AppButton } from '@/components/common/AppButton';
import { AppCard, Badge } from '@/components/common/AppCard';
import { Heart, RefreshCw, Clock } from 'lucide-react-native';

interface ThisOrThatGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onSubmitAnswer: (round: number, choice: string) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

export const ThisOrThatGame: React.FC<ThisOrThatGameProps> = ({
  session,
  currentUser,
  partnerName,
  onSubmitAnswer,
  onRematch,
  onExit,
}) => {
  const { theme } = useThemeStore();
  const currentRound = session.gameState.round || 1;
  const maxRounds = session.gameState.maxRounds || 10;
  const question = THIS_OR_THAT_BANK[(currentRound - 1) % THIS_OR_THAT_BANK.length];

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isWaitingForPartner = session.gameState.waitingForPartner;
  const isCompleted = session.status === 'completed';
  const roundHistory = session.gameState.roundHistory || [];

  const handlePick = async (choice: string) => {
    setSelectedOption(choice);
    setSubmitting(true);
    try {
      await onSubmitAnswer(currentRound, choice);
    } finally {
      setSubmitting(false);
      setSelectedOption(null);
    }
  };

  // --- FINAL RESULTS SCREEN ---
  if (isCompleted) {
    const matchesCount = roundHistory.filter((r: any) => r.matched).length;
    const totalRounds = roundHistory.length || maxRounds;
    const affinityPercent = Math.round((matchesCount / totalRounds) * 100);

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.resultsHeader}>
          <Text style={{ fontSize: 52, marginBottom: 8 }}>💖</Text>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            {affinityPercent >= 80
              ? 'Incredible Alignment!'
              : affinityPercent >= 50
              ? 'Great Balance of Minds!'
              : 'Opposites Truly Attract!'}
          </Text>
          <Text style={[styles.affinityText, { color: theme.colors.primary }]}>
            {affinityPercent}% Shared Affinity
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            You and {partnerName} agreed on {matchesCount} out of {totalRounds} choices.
          </Text>
          <Badge label="+50 Shared XP Awarded" variant="success" style={{ marginTop: 12 }} />
        </View>

        <Text style={[styles.historyHeader, { color: theme.colors.textSecondary }]}>
          PREFERENCE COMPARISONS
        </Text>
        {roundHistory.map((item: any, idx: number) => (
          <AppCard key={idx} style={styles.matchCard}>
            <View style={styles.matchCardHeader}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary }}>
                Round {item.round || idx + 1}
              </Text>
              <Badge
                label={item.matched ? 'MATCHED' : 'DIFFERENT'}
                variant={item.matched ? 'success' : 'neutral'}
              />
            </View>
            <View style={styles.picksComparisonRow}>
              <View style={styles.pickBox}>
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>You Picked</Text>
                <Text style={[styles.pickText, { color: theme.colors.textPrimary }]}>
                  {item[currentUser.uid] || '—'}
                </Text>
              </View>
              <Heart
                size={16}
                color={item.matched ? theme.colors.secondary : theme.colors.textMuted}
                fill={item.matched ? theme.colors.secondary : 'transparent'}
              />
              <View style={styles.pickBox}>
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>{partnerName} Picked</Text>
                <Text style={[styles.pickText, { color: theme.colors.textPrimary }]}>
                  {item[session.playerIds.find((id) => id !== currentUser.uid) || ''] || '—'}
                </Text>
              </View>
            </View>
          </AppCard>
        ))}

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
          Choice Locked In!
        </Text>
        <Text style={[styles.waitingSubtitle, { color: theme.colors.textSecondary }]}>
          Waiting for {partnerName} to make their choice. Results will pop up instantly!
        </Text>
      </View>
    );
  }

  // --- ACTIVE CHOICE SCREEN ---
  return (
    <View style={styles.container}>
      <View style={styles.roundHeader}>
        <Text style={[styles.roundText, { color: theme.colors.textSecondary }]}>
          Card {currentRound} of {maxRounds}
        </Text>
        <Badge label="Pick One" variant="primary" />
      </View>

      <Text style={[styles.promptTitle, { color: theme.colors.textPrimary }]}>
        Which would you choose?
      </Text>

      <View style={styles.cardsRow}>
        {/* OPTION A */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={submitting}
          onPress={() => handlePick(question.optionA)}
          style={[
            styles.choiceCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: selectedOption === question.optionA ? theme.colors.primary : theme.colors.border,
            },
            theme.shadows.medium,
          ]}
        >
          <Text style={styles.cardEmoji}>{question.emojiA}</Text>
          <Text style={[styles.cardOptionTitle, { color: theme.colors.textPrimary }]}>
            {question.optionA}
          </Text>
        </TouchableOpacity>

        <View style={styles.orCircle}>
          <Text style={styles.orText}>OR</Text>
        </View>

        {/* OPTION B */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={submitting}
          onPress={() => handlePick(question.optionB)}
          style={[
            styles.choiceCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: selectedOption === question.optionB ? theme.colors.secondary : theme.colors.border,
            },
            theme.shadows.medium,
          ]}
        >
          <Text style={styles.cardEmoji}>{question.emojiB}</Text>
          <Text style={[styles.cardOptionTitle, { color: theme.colors.textPrimary }]}>
            {question.optionB}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  roundHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roundText: { fontSize: 13, fontWeight: '700' },
  promptTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  cardsRow: { gap: 14, alignItems: 'center' },
  choiceCard: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 48, marginBottom: 8 },
  cardOptionTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  orCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -6,
    zIndex: 2,
  },
  orText: { fontSize: 11, fontWeight: '800', color: '#7152C5' },
  waitingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  waitingBubble: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  waitingTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  waitingSubtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  resultsHeader: { alignItems: 'center', marginBottom: 20 },
  resultTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  affinityText: { fontSize: 28, fontWeight: '800', marginVertical: 6 },
  resultSubtitle: { fontSize: 14, textAlign: 'center' },
  historyHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  matchCard: { padding: 14, marginBottom: 10 },
  matchCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  picksComparisonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickBox: { flex: 1 },
  pickText: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  actionRow: { flexDirection: 'row', marginTop: 20 },
});
