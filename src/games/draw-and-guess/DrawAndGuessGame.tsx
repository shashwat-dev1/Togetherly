/**
 * TOGETHERLY — GAME 3: DRAW & GUESS
 *
 * Interactive real-time drawing canvas using SVG.
 * Structured stroke synchronization, color/brush picking, undo/clear,
 * role alternation (Artist vs Guesser), secret prompt masking, and live guess validation.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { GameSession, UserProfile } from '@/types';
import { useThemeStore } from '@/stores/useThemeStore';
import { DRAWING_PROMPTS } from './prompts';
import { AppButton } from '@/components/common/AppButton';
import { AppCard, Badge } from '@/components/common/AppCard';
import { Undo2, Trash2, Clock, Send, RefreshCw } from 'lucide-react-native';

interface Stroke {
  points: string;
  color: string;
  width: number;
}

interface DrawAndGuessGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onMakeMove: (actionType: string, payload: Record<string, any>) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

const PALETTE = [
  '#2C2C2C', // Charcoal Black
  '#E0533C', // Coral Red
  '#9275E8', // Soft Lavender
  '#3B82F6', // Sky Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Amber Yellow
  '#EC4899', // Pink
  '#8B5CF6', // Royal Purple
];

const BRUSH_SIZES = [
  { size: 3, label: 'S' },
  { size: 6, label: 'M' },
  { size: 12, label: 'L' },
];

function getDeterministicPrompt(sessionId: string, round: number) {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash << 5) - hash + sessionId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash + round * 17) % DRAWING_PROMPTS.length;
  return DRAWING_PROMPTS[idx];
}

export const DrawAndGuessGame: React.FC<DrawAndGuessGameProps> = ({
  session,
  currentUser,
  partnerName,
  onMakeMove,
  onRematch,
  onExit,
}) => {
  const { theme } = useThemeStore();
  const currentRound = session.gameState.round || 1;
  const maxRounds = session.gameState.maxRounds || 4;
  const partnerId = session.playerIds.find((id) => id !== currentUser.uid) || '';

  // Artist alternates every round: Round 1 = Player 0, Round 2 = Player 1, Round 3 = Player 0...
  const artistIndex = (currentRound - 1) % 2;
  const artistId = session.playerIds[artistIndex];
  const isArtist = currentUser.uid === artistId;

  const prompt = getDeterministicPrompt(session.id, currentRound);
  const isCompleted = session.status === 'completed';

  // Canvas drawing state
  const strokes: Stroke[] = session.gameState.strokes || [];
  const [currentColor, setCurrentColor] = useState<string>(PALETTE[0]);
  const [currentWidth, setCurrentWidth] = useState<number>(4);
  const [activePoints, setActivePoints] = useState<string>('');

  // Guessing state
  const [roundState, setRoundState] = useState({
    round: currentRound,
    timeLeft: 60,
    feedback: null as string | null,
    guessInput: '',
  });

  if (roundState.round !== currentRound) {
    setRoundState({
      round: currentRound,
      timeLeft: 60,
      feedback: null,
      guessInput: '',
    });
  }

  const timeLeft = roundState.timeLeft;
  const guessFeedback = roundState.feedback;
  const guessInput = roundState.guessInput;

  const guesses: { id: string; name: string; text: string; correct?: boolean }[] =
    session.gameState.guesses || [];

  // Canvas bounding box ref for touch coordinates
  const canvasRef = useRef<any>(null);

  const handleTimeExpired = useCallback(async () => {
    if (!isArtist) return; // Artist controls timeout transition
    const isFinal = currentRound >= maxRounds;
    await onMakeMove('round_timeout', {
      round: isFinal ? currentRound : currentRound + 1,
      status: isFinal ? 'completed' : 'active',
      strokes: [],
      guesses: [],
      winnerId: isFinal ? 'draw' : null,
    });
  }, [isArtist, currentRound, maxRounds, onMakeMove]);

  // Round countdown
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setRoundState((prev) => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRound, isCompleted, handleTimeExpired]);

  // --- TOUCH HANDLERS FOR DRAWING ---
  const handleTouchStart = (e: GestureResponderEvent) => {
    if (!isArtist) return;
    const { locationX, locationY } = e.nativeEvent;
    const initialPoint = `${Math.round(locationX)},${Math.round(locationY)}`;
    setActivePoints(initialPoint);
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    if (!isArtist) return;
    const { locationX, locationY } = e.nativeEvent;
    const nextPoint = `${Math.round(locationX)},${Math.round(locationY)}`;
    setActivePoints((prev) => (prev ? `${prev} ${nextPoint}` : nextPoint));
  };

  const handleTouchEnd = async () => {
    if (!isArtist || !activePoints) return;
    const newStroke: Stroke = {
      points: activePoints,
      color: currentColor,
      width: currentWidth,
    };
    setActivePoints('');
    const updatedStrokes = [...strokes, newStroke];
    await onMakeMove('append_stroke', { strokes: updatedStrokes });
  };

  const handleUndo = async () => {
    if (!isArtist || strokes.length === 0) return;
    const updatedStrokes = strokes.slice(0, -1);
    await onMakeMove('undo_stroke', { strokes: updatedStrokes });
  };

  const handleClear = async () => {
    if (!isArtist || strokes.length === 0) return;
    await onMakeMove('clear_canvas', { strokes: [] });
  };

  // --- GUESS HANDLER ---
  const handleSendGuess = async () => {
    const trimmed = guessInput.trim().toLowerCase();
    if (!trimmed) return;

    setRoundState((prev) => ({ ...prev, guessInput: '' }));
    const isCorrect = trimmed === prompt.word.toLowerCase();

    const guessItem = {
      id: `guess_${guesses.length + 1}_${currentRound}`,
      name: currentUser.displayName,
      text: guessInput.trim(),
      correct: isCorrect,
    };

    const nextGuesses = [...guesses, guessItem];

    if (isCorrect) {
      setRoundState((prev) => ({ ...prev, feedback: '🎉 Correct Guess!' }));
      const isFinal = currentRound >= maxRounds;
      const roundScore = Math.max(50, 100 + timeLeft * 2);

      // Cooperative / shared scoring
      const nextScores = {
        ...session.scores,
        [currentUser.uid]: (session.scores[currentUser.uid] || 0) + roundScore,
        [artistId]: (session.scores[artistId] || 0) + roundScore,
      };

      const roundHistoryItem = {
        round: currentRound,
        word: prompt.word,
        solvedBy: currentUser.displayName,
        timeTaken: 60 - timeLeft,
        score: roundScore,
      };

      await onMakeMove('correct_guess', {
        round: isFinal ? currentRound : currentRound + 1,
        status: isFinal ? 'completed' : 'active',
        winnerId: isFinal ? 'draw' : null,
        scores: nextScores,
        strokes: [],
        guesses: [],
        roundHistory: [...(session.gameState.roundHistory || []), roundHistoryItem],
      });
    } else {
      setRoundState((prev) => ({ ...prev, feedback: 'Not quite, keep guessing!' }));
      await onMakeMove('submit_guess', { guesses: nextGuesses });
    }
  };

  // --- COMPLETED RESULTS SCREEN ---
  if (isCompleted) {
    const history = session.gameState.roundHistory || [];
    const totalScore = (session.scores[currentUser.uid] || 0) + (session.scores[partnerId] || 0);

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.resultsHeader}>
          <Text style={{ fontSize: 52, marginBottom: 8 }}>🎨</Text>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            Masterpiece Match!
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            You and {partnerName} created art and guessed together!
          </Text>
          <Badge
            label={`${totalScore} Combined Couple XP`}
            variant="success"
            style={{ marginTop: 12 }}
          />
        </View>

        <Text style={[styles.historyHeader, { color: theme.colors.textSecondary }]}>
          SOLVED SKETCHES
        </Text>

        {history.map((h: any, idx: number) => (
          <AppCard key={idx} style={styles.historyCard}>
            <View style={styles.historyTop}>
              <Badge label={`Round ${h.round || idx + 1}`} variant="secondary" />
              <Text style={[styles.historyScoreText, { color: theme.colors.primary }]}>
                +{h.score} pts
              </Text>
            </View>
            <Text style={[styles.historyWord, { color: theme.colors.textPrimary }]}>
              &ldquo;{h.word}&rdquo;
            </Text>
            <Text style={[styles.historyDesc, { color: theme.colors.textSecondary }]}>
              Guessed by {h.solvedBy} in {h.timeTaken}s!
            </Text>
          </AppCard>
        ))}

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

  // Word mask for the guesser (e.g. "_ _ _ _ _")
  const maskedWord = prompt.word
    .split('')
    .map((ch) => (ch === ' ' ? '  ' : '_ '))
    .join('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <Badge
          label={`Round ${currentRound} of ${maxRounds}`}
          variant="primary"
        />
        <View style={styles.timerPill}>
          <Clock size={16} color={timeLeft <= 10 ? theme.colors.error : theme.colors.textPrimary} />
          <Text
            style={[
              styles.timerText,
              { color: timeLeft <= 10 ? theme.colors.error : theme.colors.textPrimary },
            ]}
          >
            {timeLeft}s
          </Text>
        </View>
      </View>

      {/* Role & Prompt Banner */}
      <AppCard style={styles.promptCard}>
        {isArtist ? (
          <View style={styles.promptCol}>
            <View style={styles.badgeRow}>
              <Badge label="YOU ARE DRAWING" variant="success" />
              <Text style={[styles.categoryLabel, { color: theme.colors.textMuted }]}>
                {prompt.category.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.secretWord, { color: theme.colors.primary }]}>
              {prompt.word}
            </Text>
            <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
              Hint: {prompt.hint}
            </Text>
          </View>
        ) : (
          <View style={styles.promptCol}>
            <View style={styles.badgeRow}>
              <Badge label={`${partnerName.toUpperCase()} IS DRAWING`} variant="warning" />
              <Text style={[styles.categoryLabel, { color: theme.colors.textMuted }]}>
                {prompt.category.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.maskedWordText, { color: theme.colors.textPrimary }]}>
              {maskedWord}
            </Text>
            <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
              {prompt.word.length} letters • Watch the canvas and guess!
            </Text>
          </View>
        )}
      </AppCard>

      {/* SVG Canvas Board */}
      <View
        ref={canvasRef}
        style={[
          styles.canvasContainer,
          {
            backgroundColor: '#FFFFFF',
            borderColor: theme.colors.border,
          },
        ]}
        onStartShouldSetResponder={() => isArtist}
        onMoveShouldSetResponder={() => isArtist}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
      >
        <Svg height="300" width="100%" style={styles.svg}>
          {strokes.map((stroke, i) => (
            <Polyline
              key={i}
              points={stroke.points}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {/* Active stroke currently being drawn */}
          {activePoints ? (
            <Polyline
              points={activePoints}
              fill="none"
              stroke={currentColor}
              strokeWidth={currentWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      </View>

      {/* Artist Controls (Color Palette, Brush Sizes, Undo, Clear) */}
      {isArtist ? (
        <View style={styles.toolsContainer}>
          {/* Palette Colors */}
          <View style={styles.paletteRow}>
            {PALETTE.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setCurrentColor(color)}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  currentColor === color && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>

          {/* Brush Sizes & Actions */}
          <View style={styles.bottomToolRow}>
            <View style={styles.brushRow}>
              {BRUSH_SIZES.map((b) => (
                <TouchableOpacity
                  key={b.size}
                  onPress={() => setCurrentWidth(b.size)}
                  style={[
                    styles.brushBtn,
                    currentWidth === b.size && {
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.brushBtnText,
                      {
                        color: currentWidth === b.size ? '#FFFFFF' : theme.colors.textPrimary,
                      },
                    ]}
                  >
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionIconsRow}>
              <TouchableOpacity
                onPress={handleUndo}
                style={[styles.toolIconBtn, { backgroundColor: theme.colors.surfaceCard }]}
              >
                <Undo2 size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClear}
                style={[styles.toolIconBtn, { backgroundColor: theme.colors.surfaceCard }]}
              >
                <Trash2 size={18} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* Guesser Controls (Input & Live Guess Feed) */
        <View style={styles.guesserContainer}>
          {guessFeedback && (
            <Text
              style={[
                styles.feedbackText,
                {
                  color: guessFeedback.includes('🎉')
                    ? theme.colors.success
                    : theme.colors.error,
                },
              ]}
            >
              {guessFeedback}
            </Text>
          )}

          <View style={styles.inputRow}>
            <TextInput
              value={guessInput}
              onChangeText={(val) => setRoundState((prev) => ({ ...prev, guessInput: val }))}
              placeholder="Type your guess here..."
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="send"
              onSubmitEditing={handleSendGuess}
              style={[
                styles.guessInput,
                {
                  backgroundColor: theme.colors.surfaceCard,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                },
              ]}
            />
            <TouchableOpacity
              onPress={handleSendGuess}
              style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Recent Guesses List */}
          <View style={styles.guessesList}>
            {guesses.slice(-3).map((g) => (
              <View key={g.id} style={styles.guessBubble}>
                <Text style={[styles.guessAuthor, { color: theme.colors.textSecondary }]}>
                  {g.name}:
                </Text>
                <Text
                  style={[
                    styles.guessContent,
                    {
                      color: g.correct ? theme.colors.success : theme.colors.textPrimary,
                      fontWeight: g.correct ? '800' : '500',
                    },
                  ]}
                >
                  {g.text} {g.correct ? '✓' : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  promptCard: { padding: 16, marginBottom: 12 },
  promptCol: { alignItems: 'center' },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  categoryLabel: { fontSize: 11, fontWeight: '700' },
  secretWord: { fontSize: 24, fontWeight: '800', textTransform: 'capitalize', marginBottom: 4 },
  maskedWordText: { fontSize: 26, fontWeight: '800', letterSpacing: 4, marginBottom: 4 },
  hintText: { fontSize: 13 },
  canvasContainer: {
    height: 300,
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  svg: { flex: 1 },
  toolsContainer: { marginTop: 4 },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  colorDotSelected: {
    borderColor: '#000000',
    transform: [{ scale: 1.15 }],
  },
  bottomToolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brushRow: { flexDirection: 'row', gap: 8 },
  brushBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brushBtnText: { fontSize: 14, fontWeight: '800' },
  actionIconsRow: { flexDirection: 'row', gap: 8 },
  toolIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  guesserContainer: { marginTop: 4 },
  feedbackText: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  guessInput: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 15,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guessesList: { gap: 6 },
  guessBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  guessAuthor: { fontSize: 13, fontWeight: '700', marginRight: 6 },
  guessContent: { fontSize: 14 },
  resultsHeader: { alignItems: 'center', marginBottom: 24 },
  resultTitle: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  resultSubtitle: { fontSize: 14, textAlign: 'center' },
  historyHeader: { fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5 },
  historyCard: { padding: 14, marginBottom: 10 },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyScoreText: { fontSize: 14, fontWeight: '800' },
  historyWord: { fontSize: 16, fontWeight: '800', textTransform: 'capitalize', marginBottom: 2 },
  historyDesc: { fontSize: 13 },
  actionRow: { flexDirection: 'row', marginTop: 16 },
});
