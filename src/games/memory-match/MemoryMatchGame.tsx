/**
 * TOGETHERLY — GAME 5: MEMORY MATCH
 *
 * 4x4 Card Grid (8 romantic pairs).
 * Alternating turns, double-blind memory flipping, pair scoring,
 * mismatch auto-reset, and winner calculation.
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
import { generateMemoryDeck, MemoryCard } from './cards';
import { AppButton } from '@/components/common/AppButton';
import { AppCard, Badge } from '@/components/common/AppCard';
import { Sparkles, RefreshCw, Heart } from 'lucide-react-native';

interface MemoryMatchGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onMakeMove: (actionType: string, payload: Record<string, any>) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  session,
  currentUser,
  partnerName,
  onMakeMove,
  onRematch,
  onExit,
}) => {
  const { theme } = useThemeStore();
  const partnerId = session.playerIds.find((id) => id !== currentUser.uid) || '';

  const isMyTurn = session.currentTurn === currentUser.uid;
  const isCompleted = session.status === 'completed';

  const deck: MemoryCard[] = React.useMemo(
    () => generateMemoryDeck(session.id),
    [session.id]
  );

  const matchedCardIds: number[] = session.gameState.matchedCardIds || [];
  const selectedCardIds: number[] = session.gameState.selectedCardIds || [];
  const [submitting, setSubmitting] = useState(false);

  const myPairs = session.scores[currentUser.uid] || 0;
  const partnerPairs = session.scores[partnerId] || 0;

  const handleCardPress = async (cardId: number) => {
    if (!isMyTurn || isCompleted || submitting) return;
    if (matchedCardIds.includes(cardId) || selectedCardIds.includes(cardId)) return;
    if (selectedCardIds.length >= 2) return; // Busy resolving

    if (selectedCardIds.length === 0) {
      // First card flipped
      await onMakeMove('flip_card', {
        selectedCardIds: [cardId],
      });
      return;
    }

    if (selectedCardIds.length === 1) {
      const firstCardId = selectedCardIds[0];
      const firstCard = deck.find((c) => c.id === firstCardId)!;
      const secondCard = deck.find((c) => c.id === cardId)!;

      const isMatch = firstCard.pairId === secondCard.pairId;
      setSubmitting(true);

      try {
        if (isMatch) {
          const nextMatched = [...matchedCardIds, firstCardId, cardId];
          const isAllMatched = nextMatched.length >= deck.length;
          const nextScores = {
            ...session.scores,
            [currentUser.uid]: (session.scores[currentUser.uid] || 0) + 1,
          };

          let finalWinner: string | 'draw' | null = null;
          if (isAllMatched) {
            const p1 = nextScores[currentUser.uid];
            const p2 = nextScores[partnerId] || 0;
            finalWinner = p1 > p2 ? currentUser.uid : p2 > p1 ? partnerId : 'draw';
          }

          // Active player gets another move on match!
          await onMakeMove('match_pair', {
            matchedCardIds: nextMatched,
            selectedCardIds: [],
            scores: nextScores,
            winnerId: finalWinner,
            status: isAllMatched ? 'completed' : 'active',
            // Keep turn with current player on match!
            currentTurn: currentUser.uid,
          });
        } else {
          // Show both cards briefly
          await onMakeMove('flip_card', {
            selectedCardIds: [firstCardId, cardId],
          });

          // Delay for 1.2 seconds, then flip back and pass turn
          setTimeout(async () => {
            await onMakeMove('mismatch_cards', {
              selectedCardIds: [],
              currentTurn: partnerId,
            });
          }, 1200);
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  // --- FINAL RESULTS SCREEN ---
  if (isCompleted) {
    const isWinner = myPairs > partnerPairs;
    const isDraw = myPairs === partnerPairs;

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.resultsHeader}>
          <Text style={{ fontSize: 52, marginBottom: 8 }}>
            {isWinner ? '🏆' : isDraw ? '🤝' : '💫'}
          </Text>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            {isWinner ? 'Memory Master!' : isDraw ? 'Perfect Tie!' : `${partnerName} Won!`}
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            You found {myPairs} pairs, and {partnerName} found {partnerPairs} pairs.
          </Text>
          <Badge label="+40 Shared XP Awarded" variant="success" style={{ marginTop: 12 }} />
        </View>

        <AppCard style={styles.scoreSummaryCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreCol}>
              <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>
                {currentUser.displayName}
              </Text>
              <Text style={[styles.scoreValue, { color: theme.colors.primary }]}>
                {myPairs} Pairs
              </Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreCol}>
              <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>
                {partnerName}
              </Text>
              <Text style={[styles.scoreValue, { color: theme.colors.secondary }]}>
                {partnerPairs} Pairs
              </Text>
            </View>
          </View>
        </AppCard>

        <View style={styles.actionRow}>
          <AppButton
            title="Play Rematch"
            onPress={onRematch}
            icon={<RefreshCw size={18} color="#FFFFFF" />}
            style={{ flex: 1, marginRight: 8 }}
          />
          <AppButton
            title="Back to Games"
            onPress={onExit}
            variant="outline"
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Turn Header */}
      <View style={styles.headerRow}>
        <Badge
          label={
            isMyTurn
              ? 'YOUR TURN'
              : `WAITING FOR ${partnerName.toUpperCase()}`
          }
          variant={isMyTurn ? 'primary' : 'warning'}
        />
        <View style={styles.pairsCounter}>
          <Heart size={14} color={theme.colors.secondary} fill={theme.colors.secondary} />
          <Text style={[styles.pairsCounterText, { color: theme.colors.textPrimary }]}>
            {matchedCardIds.length / 2} / {deck.length / 2} Pairs Found
          </Text>
        </View>
      </View>

      {/* 4x4 Grid Board */}
      <View style={styles.gridContainer}>
        {deck.map((card) => {
          const isMatched = matchedCardIds.includes(card.id);
          const isSelected = selectedCardIds.includes(card.id);
          const isFaceUp = isMatched || isSelected;

          return (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.8}
              disabled={isFaceUp || !isMyTurn || submitting}
              onPress={() => handleCardPress(card.id)}
              style={[
                styles.cardBox,
                {
                  backgroundColor: isMatched
                    ? '#EBFDF5' // Gentle green tint
                    : isSelected
                    ? theme.colors.primaryLight
                    : theme.colors.surfaceCard,
                  borderColor: isMatched
                    ? theme.colors.success
                    : isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              {isFaceUp ? (
                <View style={styles.cardFace}>
                  <Text style={styles.cardEmoji}>{card.emoji}</Text>
                  <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>
                    {card.label}
                  </Text>
                </View>
              ) : (
                <View style={styles.cardBack}>
                  <Sparkles size={22} color={theme.colors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.gameTip, { color: theme.colors.textMuted }]}>
        Find a matching pair to get a bonus turn!
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', paddingBottom: 40 },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pairsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  pairsCounterText: { fontSize: 13, fontWeight: '700' },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  cardBox: {
    width: '22%',
    aspectRatio: 0.85,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardFace: { alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 26, marginBottom: 2 },
  cardLabel: { fontSize: 8, fontWeight: '700', textAlign: 'center' },
  cardBack: { alignItems: 'center', justifyContent: 'center' },
  gameTip: { fontSize: 12, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  resultsHeader: { alignItems: 'center', marginBottom: 20 },
  resultTitle: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  resultSubtitle: { fontSize: 14, textAlign: 'center' },
  scoreSummaryCard: { width: '100%', padding: 18, marginBottom: 20 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  scoreCol: { alignItems: 'center' },
  scoreLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  scoreValue: { fontSize: 22, fontWeight: '900' },
  scoreDivider: { width: 1, height: 40, backgroundColor: 'rgba(0,0,0,0.1)' },
  actionRow: { flexDirection: 'row', width: '100%' },
});
