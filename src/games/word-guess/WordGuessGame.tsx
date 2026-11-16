/**
 * TOGETHERLY — GAME 6: WORD GUESS
 *
 * 5-letter relationship word puzzle with 6 collaborative attempts.
 * On-screen keyboard with letter color feedback (Green/Yellow/Gray),
 * turn alternation, romantic hint system, and victory celebration.
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
import {
  WordGuessItem,
  LetterStatus,
  EvaluatedLetter,
  evaluateWordGuess,
  getDeterministicWordGuess,
} from './wordList';
import { AppButton } from '@/components/common/AppButton';
import { AppCard, Badge } from '@/components/common/AppCard';
import { RefreshCw, Delete, HelpCircle } from 'lucide-react-native';

interface WordGuessGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onMakeMove: (actionType: string, payload: Record<string, any>) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

export const WordGuessGame: React.FC<WordGuessGameProps> = ({
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

  const puzzle: WordGuessItem = React.useMemo(
    () => getDeterministicWordGuess(session.id),
    [session.id]
  );

  const guesses: EvaluatedLetter[][] = session.gameState.guesses || [];
  const currentAttempt = guesses.length; // 0 to 5

  const [currentInput, setCurrentInput] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Compute key colors across all guesses
  const keyStatusMap: Record<string, LetterStatus> = {};
  for (const guess of guesses) {
    for (const letter of guess) {
      const current = keyStatusMap[letter.char];
      if (letter.status === 'correct') {
        keyStatusMap[letter.char] = 'correct';
      } else if (letter.status === 'present' && current !== 'correct') {
        keyStatusMap[letter.char] = 'present';
      } else if (!current) {
        keyStatusMap[letter.char] = letter.status;
      }
    }
  }

  const handleKeyPress = (key: string) => {
    if (!isMyTurn || isCompleted || submitting) return;
    setErrorMessage(null);

    if (key === 'BACK') {
      setCurrentInput((prev) => prev.slice(0, -1));
      return;
    }

    if (key === 'ENTER') {
      handleEnterGuess();
      return;
    }

    if (currentInput.length < 5) {
      setCurrentInput((prev) => prev + key);
    }
  };

  const handleEnterGuess = async () => {
    if (currentInput.length < 5) {
      setErrorMessage('Word must be 5 letters');
      return;
    }

    setSubmitting(true);
    try {
      const evaluated = evaluateWordGuess(puzzle.word, currentInput);
      const nextGuesses = [...guesses, evaluated];
      const isWordSolved = evaluated.every((l) => l.status === 'correct');
      const isExhausted = nextGuesses.length >= 6;
      const isOver = isWordSolved || isExhausted;

      const nextScores = { ...session.scores };
      if (isWordSolved) {
        // Cooperative win: both score!
        nextScores[currentUser.uid] = (nextScores[currentUser.uid] || 0) + 50;
        nextScores[partnerId] = (nextScores[partnerId] || 0) + 50;
      }

      await onMakeMove('submit_word_guess', {
        guesses: nextGuesses,
        scores: nextScores,
        winnerId: isWordSolved ? 'both' : isExhausted ? 'none' : null,
        status: isOver ? 'completed' : 'active',
        currentTurn: partnerId,
        solvedWord: isOver ? puzzle.word : null,
      });

      setCurrentInput('');
    } finally {
      setSubmitting(false);
    }
  };

  // --- FINAL RESULTS SCREEN ---
  if (isCompleted) {
    const won = session.winnerId === 'both';

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.resultsHeader}>
          <Text style={{ fontSize: 52, marginBottom: 8 }}>{won ? '🎉' : '💔'}</Text>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            {won ? 'You Cracked the Code!' : 'Almost Got It!'}
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            The secret word was <Text style={{ fontWeight: '800', color: theme.colors.primary }}>{puzzle.word}</Text>
          </Text>
          <Badge
            label={won ? '+50 Shared XP Awarded' : 'Better luck next time!'}
            variant={won ? 'success' : 'secondary'}
            style={{ marginTop: 12 }}
          />
        </View>

        {/* Revealed Final Board */}
        <View style={styles.boardGrid}>
          {guesses.map((row, rIdx) => (
            <View key={rIdx} style={styles.boardRow}>
              {row.map((tile, cIdx) => (
                <View
                  key={cIdx}
                  style={[
                    styles.tile,
                    {
                      backgroundColor:
                        tile.status === 'correct'
                          ? '#10B981'
                          : tile.status === 'present'
                          ? '#F59E0B'
                          : '#64748B',
                      borderColor: 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.tileText}>{tile.char}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

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
              ? 'YOUR TURN TO GUESS'
              : `${partnerName.toUpperCase()}'S TURN TO GUESS`
          }
          variant={isMyTurn ? 'primary' : 'warning'}
        />
        <TouchableOpacity
          onPress={() => setShowHint((prev) => !prev)}
          style={[styles.hintBtn, { backgroundColor: theme.colors.primaryLight }]}
        >
          <HelpCircle size={14} color={theme.colors.primaryDark} />
          <Text style={[styles.hintBtnText, { color: theme.colors.primaryDark }]}>
            {showHint ? 'Hide Clue' : 'Clue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clue Banner */}
      {showHint && (
        <AppCard style={styles.hintCard}>
          <Text style={[styles.hintLabel, { color: theme.colors.primary }]}>
            💡 Secret Word Clue:
          </Text>
          <Text style={[styles.hintText, { color: theme.colors.textPrimary }]}>
            &ldquo;{puzzle.hint}&rdquo;
          </Text>
        </AppCard>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Text style={[styles.errorBanner, { color: theme.colors.error }]}>
          {errorMessage}
        </Text>
      )}

      {/* 6 Rows of 5 Letter Tiles */}
      <View style={styles.boardGrid}>
        {Array.from({ length: 6 }).map((_, rIdx) => {
          const isSubmittedRow = rIdx < guesses.length;
          const isCurrentRow = rIdx === currentAttempt;
          const submittedLetters = guesses[rIdx];

          return (
            <View key={rIdx} style={styles.boardRow}>
              {Array.from({ length: 5 }).map((__, cIdx) => {
                let char = '';
                let tileBg = theme.colors.surfaceCard;
                let tileBorder = theme.colors.border;
                let textColor = theme.colors.textPrimary;

                if (isSubmittedRow && submittedLetters) {
                  const letter = submittedLetters[cIdx];
                  char = letter.char;
                  textColor = '#FFFFFF';
                  if (letter.status === 'correct') tileBg = '#10B981';
                  else if (letter.status === 'present') tileBg = '#F59E0B';
                  else tileBg = '#64748B';
                  tileBorder = 'transparent';
                } else if (isCurrentRow) {
                  char = currentInput[cIdx] || '';
                  if (char) {
                    tileBorder = theme.colors.primary;
                  }
                }

                return (
                  <View
                    key={cIdx}
                    style={[
                      styles.tile,
                      {
                        backgroundColor: tileBg,
                        borderColor: tileBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.tileText, { color: textColor }]}>
                      {char}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* On-Screen Keyboard */}
      <View style={styles.keyboardContainer}>
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <View key={rIdx} style={styles.keyboardRow}>
            {row.map((key) => {
              const status = keyStatusMap[key];
              let keyBg = theme.colors.surfaceCard;
              let keyColor = theme.colors.textPrimary;

              if (status === 'correct') {
                keyBg = '#10B981';
                keyColor = '#FFFFFF';
              } else if (status === 'present') {
                keyBg = '#F59E0B';
                keyColor = '#FFFFFF';
              } else if (status === 'absent') {
                keyBg = '#64748B';
                keyColor = '#FFFFFF';
              }

              const isWide = key === 'ENTER' || key === 'BACK';

              return (
                <TouchableOpacity
                  key={key}
                  disabled={!isMyTurn || isCompleted || submitting}
                  onPress={() => handleKeyPress(key)}
                  style={[
                    styles.key,
                    isWide && styles.wideKey,
                    { backgroundColor: keyBg, borderColor: theme.colors.border },
                  ]}
                >
                  {key === 'BACK' ? (
                    <Delete size={16} color={keyColor} />
                  ) : (
                    <Text
                      style={[
                        styles.keyText,
                        isWide && styles.wideKeyText,
                        { color: keyColor },
                      ]}
                    >
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 14, alignItems: 'center', paddingBottom: 40 },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  hintBtnText: { fontSize: 12, fontWeight: '700' },
  hintCard: { width: '100%', padding: 12, marginBottom: 10 },
  hintLabel: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  hintText: { fontSize: 13, fontWeight: '600', fontStyle: 'italic' },
  errorBanner: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  boardGrid: { width: '100%', alignItems: 'center', gap: 6, marginVertical: 8 },
  boardRow: { flexDirection: 'row', gap: 6 },
  tile: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { fontSize: 22, fontWeight: '900', textTransform: 'uppercase' },
  keyboardContainer: { width: '100%', marginTop: 14, gap: 6 },
  keyboardRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  key: {
    height: 42,
    minWidth: 30,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideKey: { minWidth: 54, paddingHorizontal: 8 },
  keyText: { fontSize: 13, fontWeight: '700' },
  wideKeyText: { fontSize: 11, fontWeight: '800' },
  resultsHeader: { alignItems: 'center', marginBottom: 20 },
  resultTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  resultSubtitle: { fontSize: 14, textAlign: 'center' },
  actionRow: { flexDirection: 'row', width: '100%', marginTop: 24 },
});
