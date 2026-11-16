/**
 * TOGETHERLY — GAME 1: WHO KNOWS WHOM BETTER?
 *
 * Full simultaneous double-blind relationship quiz.
 * Both players submit privately:
 * 1. Their own answer
 * 2. Their prediction of partner's answer
 * Once both submit, answers are revealed and points are scored.
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
import { getAllQuizQuestions, QuizQuestion } from './questions';
import { AppButton } from '@/components/common/AppButton';
import { AppCard, Badge } from '@/components/common/AppCard';
import { Check, Sparkles, Clock, RefreshCw } from 'lucide-react-native';

interface WhoKnowsWhomGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onSubmitAnswer: (round: number, answerPayload: any) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

export const WhoKnowsWhomGame: React.FC<WhoKnowsWhomGameProps> = ({
  session,
  currentUser,
  partnerName,
  onSubmitAnswer,
  onRematch,
  onExit,
}) => {
  const { theme } = useThemeStore();
  const allQuestions = getAllQuizQuestions();

  const currentRound = session.gameState.round || 1;
  const maxRounds = session.gameState.maxRounds || 5;
  const currentQuestion: QuizQuestion =
    allQuestions[(currentRound - 1) % allQuestions.length] || allQuestions[0];

  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [guessForPartner, setGuessForPartner] = useState<string | null>(null);
  const [step, setStep] = useState<'my_answer' | 'guess_partner'>('my_answer');
  const [submitting, setSubmitting] = useState(false);

  const lastRevealed = session.gameState.lastRevealedResult;
  const isWaitingForPartner = session.gameState.waitingForPartner;
  const isMatchCompleted = session.status === 'completed';

  const partnerId = session.playerIds.find((id) => id !== currentUser.uid) || '';

  const handleSubmit = async () => {
    if (!myAnswer || !guessForPartner) return;
    setSubmitting(true);
    try {
      await onSubmitAnswer(currentRound, {
        answer: myAnswer,
        guessForPartner,
      });
      // Reset local inputs for next round
      setMyAnswer(null);
      setGuessForPartner(null);
      setStep('my_answer');
    } finally {
      setSubmitting(false);
    }
  };

  // --- FINAL RESULTS SCREEN ---
  if (isMatchCompleted) {
    const myScore = session.scores[currentUser.uid] || 0;
    const partnerScore = session.scores[partnerId] || 0;
    const isWinner = session.winnerId === currentUser.uid;
    const isDraw = session.winnerId === 'draw';

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.resultsHeader}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>
            {isWinner ? '🏆' : isDraw ? '🤝' : '💖'}
          </Text>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            {isWinner
              ? `You Know ${partnerName} Best!`
              : isDraw
              ? 'A Perfect Mutual Match!'
              : `${partnerName} Knows You Best!`}
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            Final Score: {myScore} — {partnerScore}
          </Text>
          <Badge label="+50 Shared XP Awarded" variant="success" style={{ marginTop: 10 }} />
        </View>

        {/* Round by Round History */}
        <Text style={[styles.historyHeader, { color: theme.colors.textSecondary }]}>
          ROUND BREAKDOWN
        </Text>
        {(session.gameState.roundHistory || []).map((roundRes: any, idx: number) => {
          const myRound = roundRes[currentUser.uid];
          const partnerRound = roundRes[partnerId];

          return (
            <AppCard key={idx} style={styles.historyCard}>
              <View style={styles.historyCardHeader}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.primary }}>
                  Round {roundRes.round || idx + 1}
                </Text>
                <Badge
                  label={myRound?.correct ? 'Correct Guess' : 'Missed'}
                  variant={myRound?.correct ? 'success' : 'neutral'}
                />
              </View>

              <View style={styles.answerComparisonRow}>
                <View style={styles.answerCol}>
                  <Text style={[styles.answerLabel, { color: theme.colors.textSecondary }]}>
                    Your Truth:
                  </Text>
                  <Text style={[styles.answerValue, { color: theme.colors.textPrimary }]}>
                    {myRound?.answer || '—'}
                  </Text>
                </View>
                <View style={styles.answerCol}>
                  <Text style={[styles.answerLabel, { color: theme.colors.textSecondary }]}>
                    {partnerName}&apos;s Guess:
                  </Text>
                  <Text style={[styles.answerValue, { color: theme.colors.textPrimary }]}>
                    {partnerRound?.guessForPartner || '—'}
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

  // --- WAITING FOR PARTNER STATE ---
  if (isWaitingForPartner && !lastRevealed) {
    return (
      <View style={styles.waitingContainer}>
        <View style={[styles.waitingBubble, { backgroundColor: theme.colors.primaryLight }]}>
          <Clock size={36} color={theme.colors.primaryDark} />
        </View>
        <Text style={[styles.waitingTitle, { color: theme.colors.textPrimary }]}>
          Answers Locked In!
        </Text>
        <Text style={[styles.waitingSubtitle, { color: theme.colors.textSecondary }]}>
          Waiting for {partnerName} to submit their answers. As soon as both of you submit, the results will reveal simultaneously!
        </Text>
      </View>
    );
  }

  // --- ACTIVE QUESTION PLAY SCREEN ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Round & Category Header */}
      <View style={styles.quizHeader}>
        <Badge label={currentQuestion.deckName} variant="secondary" />
        <Text style={[styles.roundText, { color: theme.colors.textSecondary }]}>
          Round {currentRound} of {maxRounds}
        </Text>
      </View>

      {/* Main Question Prompt */}
      <AppCard elevated style={styles.questionCard}>
        <Text style={[styles.questionText, { color: theme.colors.textPrimary }]}>
          {currentQuestion.questionText}
        </Text>
      </AppCard>

      {/* Step Indicator Tabs */}
      <View style={styles.stepTabs}>
        <TouchableOpacity
          onPress={() => setStep('my_answer')}
          style={[
            styles.stepTab,
            step === 'my_answer' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 },
          ]}
        >
          <Text
            style={[
              styles.stepTabText,
              { color: step === 'my_answer' ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            1. Your Answer {myAnswer ? '✓' : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStep('guess_partner')}
          style={[
            styles.stepTab,
            step === 'guess_partner' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 3 },
          ]}
        >
          <Text
            style={[
              styles.stepTabText,
              { color: step === 'guess_partner' ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            2. Guess {partnerName}&apos;s {guessForPartner ? '✓' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Step Prompt */}
      <Text style={[styles.stepInstruction, { color: theme.colors.textSecondary }]}>
        {step === 'my_answer'
          ? 'Pick the option that is truly YOU:'
          : `What do you predict ${partnerName} will pick?`}
      </Text>

      {/* Options List */}
      <View style={styles.optionsList}>
        {currentQuestion.options.map((option, idx) => {
          const isSelected =
            step === 'my_answer' ? myAnswer === option : guessForPartner === option;

          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => {
                if (step === 'my_answer') {
                  setMyAnswer(option);
                  // Automatically advance to partner guess
                  if (!guessForPartner) setStep('guess_partner');
                } else {
                  setGuessForPartner(option);
                }
              }}
              style={[
                styles.optionItem,
                {
                  backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surface,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? theme.colors.primaryDark : theme.colors.textPrimary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {option}
              </Text>
              {isSelected ? <Check size={18} color={theme.colors.primaryDark} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Submit Button */}
      <AppButton
        title={
          !myAnswer
            ? 'Pick Your Answer First'
            : !guessForPartner
            ? `Guess ${partnerName}'s Answer`
            : 'Lock In Secret Answers'
        }
        onPress={handleSubmit}
        disabled={!myAnswer || !guessForPartner}
        loading={submitting}
        size="lg"
        icon={<Sparkles size={18} color="#FFFFFF" />}
        style={{ marginTop: 20 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roundText: { fontSize: 13, fontWeight: '600' },
  questionCard: { padding: 20, marginBottom: 16 },
  questionText: { fontSize: 18, fontWeight: '700', lineHeight: 26, textAlign: 'center' },
  stepTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EDE8E3', marginBottom: 14 },
  stepTab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  stepTabText: { fontSize: 13, fontWeight: '600' },
  stepInstruction: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  optionsList: { gap: 10 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionText: { fontSize: 15, flex: 1, marginRight: 8 },
  waitingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  waitingBubble: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  waitingTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  waitingSubtitle: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  resultsHeader: { alignItems: 'center', marginBottom: 24 },
  resultTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  resultSubtitle: { fontSize: 15, marginTop: 4 },
  historyHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  historyCard: { padding: 14, marginBottom: 10 },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  answerComparisonRow: { flexDirection: 'row', gap: 12 },
  answerCol: { flex: 1 },
  answerLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  answerValue: { fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', marginTop: 20 },
});
