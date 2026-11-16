/**
 * TOGETHERLY — GAME 2: COUPLE TRIVIA
 *
 * Timed quiz rounds with multiple choice questions across 5 categories.
 * Simultaneous answer submission, server-authoritative scoring,
 * speed bonuses, partner reveal, and match leaderboard.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { GameSession, UserProfile } from '@/types';
import { useThemeStore } from '@/stores/useThemeStore';
import { TRIVIA_QUESTIONS } from './questions';
import { AppButton } from '@/components/common/AppButton';
import { AppCard, Badge } from '@/components/common/AppCard';
import { Clock, RefreshCw, Sparkles } from 'lucide-react-native';

interface CoupleTriviaGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onSubmitAnswer: (round: number, answer: any) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

function getDeterministicQuestion(sessionId: string, round: number) {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash << 5) - hash + sessionId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash + round * 31) % TRIVIA_QUESTIONS.length;
  return TRIVIA_QUESTIONS[idx];
}

export const CoupleTriviaGame: React.FC<CoupleTriviaGameProps> = ({
  session,
  currentUser,
  partnerName,
  onSubmitAnswer,
  onRematch,
  onExit,
}) => {
  const { theme } = useThemeStore();
  const currentRound = session.gameState.round || 1;
  const maxRounds = session.gameState.maxRounds || 5;
  const partnerId = session.playerIds.find((id) => id !== currentUser.uid) || '';

  const question = getDeterministicQuestion(session.id, currentRound);

  const [roundState, setRoundState] = useState({
    round: currentRound,
    option: null as number | null,
    timeLeft: 20,
  });

  if (roundState.round !== currentRound) {
    setRoundState({
      round: currentRound,
      option: null,
      timeLeft: 20,
    });
  }

  const selectedOption = roundState.option;
  const timeLeft = roundState.timeLeft;
  const [submitting, setSubmitting] = useState(false);

  const isWaitingForPartner = session.gameState.waitingForPartner;
  const isCompleted = session.status === 'completed';
  const roundHistory = session.gameState.roundHistory || [];

  const handleSelectOption = useCallback(
    async (optionIndex: number, remainingTime: number) => {
      if (roundState.option !== null || submitting) return;
      setRoundState((prev) => ({ ...prev, option: optionIndex }));
      setSubmitting(true);
      try {
        await onSubmitAnswer(currentRound, {
          selectedOption: optionIndex,
          timeLeft: remainingTime,
          correctIndex: question.correctIndex,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [roundState.option, submitting, onSubmitAnswer, currentRound, question.correctIndex]
  );

  // Countdown timer per round
  useEffect(() => {
    if (isWaitingForPartner || isCompleted || roundState.option !== null) return;
    const timer = setInterval(() => {
      setRoundState((prev) => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          onSubmitAnswer(currentRound, {
            selectedOption: -1,
            timeLeft: 0,
            correctIndex: question.correctIndex,
          }).catch(() => {});
          return { ...prev, option: -1, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRound, isWaitingForPartner, isCompleted, roundState.option, onSubmitAnswer, question.correctIndex]);

  // --- FINAL MATCH RESULTS SCREEN ---
  if (isCompleted) {
    const myScore = session.scores[currentUser.uid] || 0;
    const partnerScore = session.scores[partnerId] || 0;
    const isWinner = myScore > partnerScore;
    const isDraw = myScore === partnerScore;

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.resultsHeader}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>
            {isWinner ? '🏆' : isDraw ? '🤝' : '💫'}
          </Text>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            {isWinner ? 'Victory is Yours!' : isDraw ? 'A Perfect Dead Heat!' : `${partnerName} Wins!`}
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            What an intense brain battle!
          </Text>

          {/* Scoreboard Card */}
          <AppCard style={styles.leaderboardCard}>
            <View style={styles.leaderboardRow}>
              <View style={styles.leadCol}>
                <Text style={[styles.leadName, { color: theme.colors.textPrimary }]}>
                  {currentUser.displayName}
                </Text>
                <Text style={[styles.leadScore, { color: theme.colors.primary }]}>
                  {myScore} pts
                </Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: theme.colors.textMuted }}>
                VS
              </Text>
              <View style={styles.leadCol}>
                <Text style={[styles.leadName, { color: theme.colors.textPrimary }]}>
                  {partnerName}
                </Text>
                <Text style={[styles.leadScore, { color: theme.colors.secondary }]}>
                  {partnerScore} pts
                </Text>
              </View>
            </View>
          </AppCard>

          <Badge label="+50 Shared XP Awarded" variant="success" style={{ marginTop: 14 }} />
        </View>

        <Text style={[styles.historyHeader, { color: theme.colors.textSecondary }]}>
          ROUND-BY-ROUND BREAKDOWN
        </Text>

        {roundHistory.map((item: any, idx: number) => {
          const q = getDeterministicQuestion(session.id, item.round || idx + 1);
          const myAns = item[currentUser.uid];
          const partnerAns = item[partnerId];
          const myCorrect = myAns?.selectedOption === q.correctIndex;
          const partnerCorrect = partnerAns?.selectedOption === q.correctIndex;

          return (
            <AppCard key={idx} style={styles.historyCard}>
              <View style={styles.historyTop}>
                <Badge label={`Round ${idx + 1}`} variant="secondary" />
                <Text style={[styles.categorySmall, { color: theme.colors.textMuted }]}>
                  {q.categoryName}
                </Text>
              </View>
              <Text style={[styles.historyQText, { color: theme.colors.textPrimary }]}>
                {q.question}
              </Text>
              <Text style={[styles.correctAnswerText, { color: theme.colors.success }]}>
                ✓ {q.options[q.correctIndex]}
              </Text>

              <View style={styles.playerPicksRow}>
                <View style={styles.pickBadge}>
                  <Text style={[styles.pickLabel, { color: theme.colors.textSecondary }]}>
                    You:
                  </Text>
                  <Text
                    style={[
                      styles.pickValue,
                      { color: myCorrect ? theme.colors.success : theme.colors.error },
                    ]}
                  >
                    {myAns?.selectedOption >= 0 ? q.options[myAns.selectedOption] : 'Timed Out'}
                  </Text>
                </View>
                <View style={styles.pickBadge}>
                  <Text style={[styles.pickLabel, { color: theme.colors.textSecondary }]}>
                    {partnerName}:
                  </Text>
                  <Text
                    style={[
                      styles.pickValue,
                      { color: partnerCorrect ? theme.colors.success : theme.colors.error },
                    ]}
                  >
                    {partnerAns?.selectedOption >= 0 ? q.options[partnerAns.selectedOption] : 'Timed Out'}
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

  // --- WAITING FOR PARTNER SCREEN ---
  if (isWaitingForPartner) {
    return (
      <View style={styles.waitingContainer}>
        <View style={[styles.timerBadge, { backgroundColor: theme.colors.primaryLight }]}>
          <Clock size={36} color={theme.colors.primary} />
        </View>
        <Text style={[styles.waitingTitle, { color: theme.colors.textPrimary }]}>
          Answer Locked In!
        </Text>
        <Text style={[styles.waitingSubtitle, { color: theme.colors.textSecondary }]}>
          Waiting for {partnerName} to submit their answer...
        </Text>
        <Badge
          label="Responses will be revealed simultaneously"
          variant="secondary"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  // --- ACTIVE QUESTION PLAY SCREEN ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Info Bar */}
      <View style={styles.roundBar}>
        <Badge label={`Round ${currentRound} of ${maxRounds}`} variant="primary" />
        <View style={styles.timerPill}>
          <Clock size={16} color={timeLeft <= 5 ? theme.colors.error : theme.colors.textPrimary} />
          <Text
            style={[
              styles.timerText,
              { color: timeLeft <= 5 ? theme.colors.error : theme.colors.textPrimary },
            ]}
          >
            {timeLeft}s
          </Text>
        </View>
      </View>

      {/* Category Pill */}
      <View style={styles.categoryPill}>
        <Sparkles size={14} color={theme.colors.primary} />
        <Text style={[styles.categoryPillText, { color: theme.colors.primaryDark }]}>
          {question.categoryName}
        </Text>
      </View>

      {/* Question Card */}
      <AppCard style={styles.questionCard}>
        <Text style={[styles.questionText, { color: theme.colors.textPrimary }]}>
          {question.question}
        </Text>
      </AppCard>

      {/* 4 Multiple Choice Options */}
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              disabled={selectedOption !== null || submitting}
              onPress={() => handleSelectOption(index, timeLeft)}
              style={[
                styles.optionButton,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surfaceCard,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.optionLetter,
                  {
                    backgroundColor: isSelected
                      ? '#FFFFFF'
                      : theme.colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionLetterText,
                    {
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                  },
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.speedTip, { color: theme.colors.textMuted }]}>
        ⚡ Answer faster for bonus speed points!
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  roundBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  timerText: { fontSize: 14, fontWeight: '800', marginLeft: 6 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3EEFF',
    marginBottom: 12,
  },
  categoryPillText: { fontSize: 12, fontWeight: '700', marginLeft: 6 },
  questionCard: { padding: 20, marginBottom: 16 },
  questionText: { fontSize: 18, fontWeight: '700', lineHeight: 26 },
  optionsContainer: { gap: 12 },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionLetterText: { fontSize: 14, fontWeight: '800' },
  optionText: { fontSize: 15, fontWeight: '600', flex: 1 },
  speedTip: { textAlign: 'center', fontSize: 12, marginTop: 16 },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  timerBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  waitingTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  waitingSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  resultsHeader: { alignItems: 'center', marginBottom: 24 },
  resultTitle: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  resultSubtitle: { fontSize: 14, textAlign: 'center' },
  leaderboardCard: { width: '100%', padding: 18, marginTop: 16 },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  leadCol: { alignItems: 'center' },
  leadName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  leadScore: { fontSize: 24, fontWeight: '900' },
  historyHeader: { fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5 },
  historyCard: { padding: 14, marginBottom: 10 },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categorySmall: { fontSize: 11, fontWeight: '600' },
  historyQText: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  correctAnswerText: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  playerPicksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 8,
  },
  pickBadge: { flex: 1 },
  pickLabel: { fontSize: 11, fontWeight: '600' },
  pickValue: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  actionRow: { flexDirection: 'row', marginTop: 16 },
});
