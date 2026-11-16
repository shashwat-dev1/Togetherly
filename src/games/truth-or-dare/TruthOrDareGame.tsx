/**
 * TOGETHERLY — GAME 1: TRUTH OR DARE
 *
 * Alternating couple challenges with curated prompts across
 * Cute, Funny, Romantic, Deep, and Adventurous categories.
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
import { TRUTH_OR_DARE_PROMPTS, TruthOrDarePrompt, PromptCategory } from './prompts';
import { AppButton } from '@/components/common/AppButton';
import { AppCard, Badge } from '@/components/common/AppCard';
import { RefreshCw, CheckCircle2, SkipForward, Flame, MessageCircle, Heart } from 'lucide-react-native';

interface TruthOrDareGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onMakeMove: (actionType: string, payload: Record<string, any>) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

const CATEGORIES: { id: PromptCategory; label: string }[] = [
  { id: 'cute', label: 'Cute' },
  { id: 'funny', label: 'Funny' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'deep', label: 'Deep' },
  { id: 'adventurous', label: 'Adventurous' },
];

export const TruthOrDareGame: React.FC<TruthOrDareGameProps> = ({
  session,
  currentUser,
  partnerName,
  onMakeMove,
  onRematch,
  onExit,
}) => {
  const { theme } = useThemeStore();
  const currentRound = session.gameState.round || 1;
  const maxRounds = session.gameState.maxRounds || 6;

  const isMyTurn = session.currentTurn === currentUser.uid;
  const isCompleted = session.status === 'completed';

  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('romantic');
  const [activePrompt, setActivePrompt] = useState<TruthOrDarePrompt | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const skipsUsed = session.gameState.skips?.[currentUser.uid] || 0;
  const maxSkips = 2;

  const handleSelectChoice = (type: 'truth' | 'dare') => {
    const matching = TRUTH_OR_DARE_PROMPTS.filter(
      (p) => p.type === type && p.category === selectedCategory && !p.isMature
    );
    const pool = matching.length > 0 ? matching : TRUTH_OR_DARE_PROMPTS.filter((p) => p.type === type && !p.isMature);
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    setActivePrompt(randomPick);
  };

  const handleCompletePrompt = async () => {
    if (!activePrompt) return;
    setSubmitting(true);
    try {
      const historyItem = {
        round: currentRound,
        playerId: currentUser.uid,
        type: activePrompt.type,
        category: activePrompt.category,
        text: activePrompt.text,
        completed: true,
      };
      const updatedHistory = [...(session.gameState.roundHistory || []), historyItem];
      const isFinal = currentRound >= maxRounds;

      await onMakeMove('complete_prompt', {
        round: isFinal ? currentRound : currentRound + 1,
        status: isFinal ? 'completed' : 'active',
        winnerId: isFinal ? 'draw' : null,
        roundHistory: updatedHistory,
      });
      setActivePrompt(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipPrompt = async () => {
    if (skipsUsed >= maxSkips) return;
    setSubmitting(true);
    try {
      const updatedSkips = {
        ...(session.gameState.skips || {}),
        [currentUser.uid]: skipsUsed + 1,
      };
      await onMakeMove('skip_prompt', {
        skips: updatedSkips,
      });
      // Draw a different prompt
      if (activePrompt) {
        handleSelectChoice(activePrompt.type);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- FINAL COMPLETION SCREEN ---
  if (isCompleted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.resultsHeader}>
          <Text style={{ fontSize: 52, marginBottom: 8 }}>💖</Text>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            Truth or Dare Completed!
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            You and {partnerName} completed {maxRounds} shared challenges and truths.
          </Text>
          <Badge label="+50 Shared XP Awarded" variant="success" style={{ marginTop: 12 }} />
        </View>

        <Text style={[styles.historyHeader, { color: theme.colors.textSecondary }]}>
          COMPLETED CHALLENGES
        </Text>
        {(session.gameState.roundHistory || []).map((item: any, idx: number) => {
          const isPlayer = item.playerId === currentUser.uid;
          return (
            <AppCard key={idx} style={styles.historyCard}>
              <View style={styles.historyCardHeader}>
                <Badge
                  label={item.type.toUpperCase()}
                  variant={item.type === 'dare' ? 'secondary' : 'primary'}
                />
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                  {isPlayer ? 'Your Turn' : `${partnerName}'s Turn`}
                </Text>
              </View>
              <Text style={[styles.historyPromptText, { color: theme.colors.textPrimary }]}>
                {item.text}
              </Text>
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

  // --- WAITING FOR PARTNER'S TURN ---
  if (!isMyTurn) {
    return (
      <View style={styles.waitingContainer}>
        <View style={[styles.waitingBubble, { backgroundColor: theme.colors.primaryLight }]}>
          <Heart size={36} color={theme.colors.primaryDark} />
        </View>
        <Text style={[styles.waitingTitle, { color: theme.colors.textPrimary }]}>
          {partnerName}&apos;s Turn!
        </Text>
        <Text style={[styles.waitingSubtitle, { color: theme.colors.textSecondary }]}>
          {partnerName} is choosing Truth or Dare for Round {currentRound} of {maxRounds}.
        </Text>
      </View>
    );
  }

  // --- ACTIVE TURN: PROMPT ACTIVE ---
  if (activePrompt) {
    return (
      <View style={styles.container}>
        <View style={styles.quizHeader}>
          <Badge
            label={activePrompt.type === 'dare' ? 'DARE' : 'TRUTH'}
            variant={activePrompt.type === 'dare' ? 'secondary' : 'primary'}
          />
          <Text style={[styles.roundText, { color: theme.colors.textSecondary }]}>
            Round {currentRound} of {maxRounds}
          </Text>
        </View>

        <AppCard elevated style={styles.activePromptCard}>
          <Text style={styles.promptEmoji}>
            {activePrompt.type === 'dare' ? '🔥' : '💭'}
          </Text>
          <Text style={[styles.promptText, { color: theme.colors.textPrimary }]}>
            {activePrompt.text}
          </Text>
        </AppCard>

        <View style={styles.promptActions}>
          <AppButton
            title="Challenge Completed!"
            onPress={handleCompletePrompt}
            loading={submitting}
            size="lg"
            icon={<CheckCircle2 size={18} color="#FFFFFF" />}
            style={{ width: '100%', marginBottom: 12 }}
          />

          <AppButton
            title={`Skip Prompt (${maxSkips - skipsUsed} skips left)`}
            onPress={handleSkipPrompt}
            disabled={skipsUsed >= maxSkips || submitting}
            variant="ghost"
            size="sm"
            icon={<SkipForward size={14} color={theme.colors.textSecondary} />}
          />
        </View>
      </View>
    );
  }

  // --- ACTIVE TURN: PICK TRUTH OR DARE ---
  return (
    <View style={styles.container}>
      <View style={styles.quizHeader}>
        <Badge label="YOUR TURN" variant="primary" />
        <Text style={[styles.roundText, { color: theme.colors.textSecondary }]}>
          Round {currentRound} of {maxRounds}
        </Text>
      </View>

      <Text style={[styles.pickTitle, { color: theme.colors.textPrimary }]}>
        Choose Your Challenge
      </Text>
      <Text style={[styles.pickSubtitle, { color: theme.colors.textSecondary }]}>
        Pick whether you want to answer a heartfelt Truth or complete a fun Dare!
      </Text>

      {/* Category Horizontal Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChips}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setSelectedCategory(cat.id)}
            style={[
              styles.chip,
              {
                backgroundColor: selectedCategory === cat.id ? theme.colors.primary : theme.colors.surface,
                borderColor: selectedCategory === cat.id ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: selectedCategory === cat.id ? '700' : '500',
                color: selectedCategory === cat.id ? '#FFFFFF' : theme.colors.textSecondary,
              }}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Big Buttons: Truth or Dare */}
      <View style={styles.choicesGrid}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelectChoice('truth')}
          style={[
            styles.choiceCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary,
            },
            theme.shadows.medium,
          ]}
        >
          <MessageCircle size={44} color={theme.colors.primary} />
          <Text style={[styles.choiceCardTitle, { color: theme.colors.primaryDark }]}>
            TRUTH
          </Text>
          <Text style={[styles.choiceCardDesc, { color: theme.colors.textSecondary }]}>
            Honest, sweet & deep relationship revelations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelectChoice('dare')}
          style={[
            styles.choiceCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.secondary,
            },
            theme.shadows.medium,
          ]}
        >
          <Flame size={44} color={theme.colors.secondary} />
          <Text style={[styles.choiceCardTitle, { color: theme.colors.secondary }]}>
            DARE
          </Text>
          <Text style={[styles.choiceCardDesc, { color: theme.colors.textSecondary }]}>
            Silly, cute & playful romantic challenges
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  roundText: { fontSize: 13, fontWeight: '600' },
  pickTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  pickSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  categoryChips: { gap: 8, paddingBottom: 16, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  choicesGrid: { gap: 16 },
  choiceCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCardTitle: { fontSize: 22, fontWeight: '800', marginTop: 10, marginBottom: 4 },
  choiceCardDesc: { fontSize: 13, textAlign: 'center' },
  activePromptCard: { padding: 24, borderRadius: 20, alignItems: 'center', marginVertical: 20 },
  promptEmoji: { fontSize: 44, marginBottom: 12 },
  promptText: { fontSize: 18, fontWeight: '700', lineHeight: 26, textAlign: 'center' },
  promptActions: { alignItems: 'center' },
  waitingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  waitingBubble: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  waitingTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  waitingSubtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  resultsHeader: { alignItems: 'center', marginBottom: 24 },
  resultTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  resultSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  historyHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  historyCard: { padding: 14, marginBottom: 10 },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyPromptText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  actionRow: { flexDirection: 'row', marginTop: 20 },
});
