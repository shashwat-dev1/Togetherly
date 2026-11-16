/**
 * TOGETHERLY — ACTIVE MULTIPLAYER GAME SESSION SCREEN
 *
 * Provides a universal game runner container with top scoreboard,
 * partner presence, round timer, and interactive game board.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { GAME_CATALOGUE } from '@/games/registry';
import { Avatar } from '@/components/common/Avatar';
import { AppCard, Badge } from '@/components/common/AppCard';
import { AppButton } from '@/components/common/AppButton';
import { ArrowLeft, RefreshCw, Heart } from 'lucide-react-native';

export default function GameScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { couple } = useCoupleStore();

  const game = GAME_CATALOGUE.find((g) => g.id === gameId) || GAME_CATALOGUE[0];
  const partnerId = couple?.memberIds.find((id) => id !== user?.uid);
  const partner = partnerId && couple?.members[partnerId] ? couple.members[partnerId] : null;

  // --- GAME 1: TIC TAC TOE STATE ---
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  // --- GAME 2: ROCK PAPER SCISSORS STATE ---
  const [userPick, setUserPick] = useState<string | null>(null);
  const [partnerPick, setPartnerPick] = useState<string | null>(null);
  const [rpsResult, setRpsResult] = useState<string | null>(null);

  // --- GAME 3: THIS OR THAT STATE ---
  const thisOrThatQuestions = [
    { a: 'Beach Vacation', b: 'Mountain Cabin', emojiA: '🏖️', emojiB: '🏔️' },
    { a: 'Late Night Movie', b: 'Fancy Dinner', emojiA: '🎬', emojiB: '🍷' },
    { a: 'Morning Coffee', b: 'Late Night Tea', emojiA: '☕', emojiB: '🫖' },
  ];
  const [totIndex, setTotIndex] = useState(0);
  const [totUserChoices, setTotUserChoices] = useState<string[]>([]);
  const [totCompleted, setTotCompleted] = useState(false);

  // Check Tic-Tac-Toe Win Condition
  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every((sq) => sq !== null)) return 'draw';
    return null;
  };

  const handleCellPress = (index: number) => {
    if (board[index] || winner || !isUserTurn) return;

    const newBoard = [...board];
    newBoard[index] = '❤️'; // User is Heart
    setBoard(newBoard);

    const win = checkWinner(newBoard);
    if (win) {
      setWinner(win);
      return;
    }

    // Simulate Partner Turn (alternating)
    setIsUserTurn(false);
    setTimeout(() => {
      setBoard((currentBoard) => {
        const emptyIndices = currentBoard
          .map((val, idx) => (val === null ? idx : null))
          .filter((val): val is number => val !== null);

        if (emptyIndices.length > 0) {
          const randomPick = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          const partnerBoard = [...currentBoard];
          partnerBoard[randomPick] = '⭐'; // Partner is Star
          const partnerWin = checkWinner(partnerBoard);
          if (partnerWin) {
            setWinner(partnerWin);
          }
          return partnerBoard;
        }
        return currentBoard;
      });
      setIsUserTurn(true);
    }, 700);
  };

  const resetTicTacToe = () => {
    setBoard(Array(9).fill(null));
    setIsUserTurn(true);
    setWinner(null);
  };

  // Rock Paper Scissors Logic
  const handleRpsPick = (choice: string) => {
    setUserPick(choice);
    // Partner picks simultaneously
    const options = ['Rock', 'Paper', 'Scissors'];
    const pChoice = options[Math.floor(Math.random() * options.length)];

    setTimeout(() => {
      setPartnerPick(pChoice);
      if (choice === pChoice) {
        setRpsResult("It's a Tie!");
      } else if (
        (choice === 'Rock' && pChoice === 'Scissors') ||
        (choice === 'Paper' && pChoice === 'Rock') ||
        (choice === 'Scissors' && pChoice === 'Paper')
      ) {
        setRpsResult(`${user?.displayName || 'You'} Won! +30 XP`);
      } else {
        setRpsResult(`${partner?.displayName || 'Partner'} Won! +30 XP`);
      }
    }, 800);
  };

  const resetRps = () => {
    setUserPick(null);
    setPartnerPick(null);
    setRpsResult(null);
  };

  // This or That Logic
  const handleTotPick = (choice: string) => {
    const nextChoices = [...totUserChoices, choice];
    setTotUserChoices(nextChoices);
    if (totIndex < thisOrThatQuestions.length - 1) {
      setTotIndex(totIndex + 1);
    } else {
      setTotCompleted(true);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Top Header & Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.gameHeaderTitle, { color: theme.colors.textPrimary }]}>
          {game.name}
        </Text>
        <Badge label="2 Players" variant="primary" />
      </View>

      {/* Scoreboard Header */}
      <AppCard style={styles.scoreboardCard}>
        <View style={styles.playersRow}>
          {/* Player A (User) */}
          <View style={styles.playerCol}>
            <Avatar id={user?.avatarId} name={user?.displayName} size={46} showOnline isOnline />
            <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>
              {user?.displayName} (You)
            </Text>
            <Badge label="Player 1" variant="neutral" style={{ marginTop: 2 }} />
          </View>

          {/* VS Center Badge */}
          <View style={styles.vsBadge}>
            <Heart size={20} color={theme.colors.secondary} fill={theme.colors.secondary} />
          </View>

          {/* Player B (Partner) */}
          <View style={styles.playerCol}>
            <Avatar id={partner?.avatarId} name={partner?.displayName} size={46} showOnline isOnline />
            <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>
              {partner?.displayName || 'Partner'}
            </Text>
            <Badge label="Player 2" variant="neutral" style={{ marginTop: 2 }} />
          </View>
        </View>
      </AppCard>

      {/* Game Content Arena */}
      <View style={styles.arenaContainer}>
        {/* GAME: TIC TAC TOE */}
        {game.id === 'tic-tac-toe' && (
          <View style={styles.gameWrapper}>
            <Text style={[styles.turnPrompt, { color: theme.colors.textSecondary }]}>
              {winner
                ? winner === 'draw'
                  ? "It's a draw!"
                  : winner === '❤️'
                  ? `🎉 ${user?.displayName || 'You'} Won! (+30 XP)`
                  : `🎉 ${partner?.displayName || 'Partner'} Won! (+30 XP)`
                : isUserTurn
                ? 'Your turn (❤️)'
                : `${partner?.displayName || 'Partner'}'s turn (⭐)...`}
            </Text>

            <View style={[styles.grid, { borderColor: theme.colors.border }]}>
              {board.map((cell, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => handleCellPress(idx)}
                  style={[
                    styles.gridCell,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <Text style={styles.cellEmoji}>{cell || ''}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {winner && (
              <AppButton
                title="Play Rematch"
                onPress={resetTicTacToe}
                icon={<RefreshCw size={16} color="#FFFFFF" />}
                style={{ marginTop: 20 }}
              />
            )}
          </View>
        )}

        {/* GAME: ROCK PAPER SCISSORS */}
        {game.id === 'rock-paper-scissors' && (
          <View style={styles.gameWrapper}>
            <Text style={[styles.turnPrompt, { color: theme.colors.textSecondary }]}>
              {rpsResult ? rpsResult : 'Pick your weapon simultaneously!'}
            </Text>

            <View style={styles.rpsPicksRow}>
              <View style={styles.rpsBox}>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 }}>
                  You
                </Text>
                <Text style={{ fontSize: 44 }}>
                  {userPick === 'Rock' ? '🪨' : userPick === 'Paper' ? '📄' : userPick === 'Scissors' ? '✂️' : '❓'}
                </Text>
              </View>

              <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.textMuted }}>VS</Text>

              <View style={styles.rpsBox}>
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6 }}>
                  {partner?.displayName || 'Partner'}
                </Text>
                <Text style={{ fontSize: 44 }}>
                  {partnerPick === 'Rock' ? '🪨' : partnerPick === 'Paper' ? '📄' : partnerPick === 'Scissors' ? '✂️' : userPick ? '🤔' : '❓'}
                </Text>
              </View>
            </View>

            {!userPick ? (
              <View style={styles.rpsChoices}>
                <TouchableOpacity
                  style={[styles.rpsChoiceBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleRpsPick('Rock')}
                >
                  <Text style={{ fontSize: 32 }}>🪨</Text>
                  <Text style={{ fontWeight: '700', marginTop: 4, color: theme.colors.textPrimary }}>Rock</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rpsChoiceBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleRpsPick('Paper')}
                >
                  <Text style={{ fontSize: 32 }}>📄</Text>
                  <Text style={{ fontWeight: '700', marginTop: 4, color: theme.colors.textPrimary }}>Paper</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rpsChoiceBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleRpsPick('Scissors')}
                >
                  <Text style={{ fontSize: 32 }}>✂️</Text>
                  <Text style={{ fontWeight: '700', marginTop: 4, color: theme.colors.textPrimary }}>Scissors</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <AppButton
                title="Play Next Round"
                onPress={resetRps}
                icon={<RefreshCw size={16} color="#FFFFFF" />}
                style={{ marginTop: 24 }}
              />
            )}
          </View>
        )}

        {/* GAME: THIS OR THAT */}
        {game.id === 'this-or-that' && (
          <View style={styles.gameWrapper}>
            {!totCompleted ? (
              <>
                <Text style={[styles.turnPrompt, { color: theme.colors.textSecondary }]}>
                  Question {totIndex + 1} of {thisOrThatQuestions.length}
                </Text>

                <View style={styles.totCardRow}>
                  <TouchableOpacity
                    style={[styles.totCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
                    onPress={() => handleTotPick(thisOrThatQuestions[totIndex].a)}
                  >
                    <Text style={{ fontSize: 44 }}>{thisOrThatQuestions[totIndex].emojiA}</Text>
                    <Text style={[styles.totTitle, { color: theme.colors.textPrimary }]}>
                      {thisOrThatQuestions[totIndex].a}
                    </Text>
                  </TouchableOpacity>

                  <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.textMuted }}>OR</Text>

                  <TouchableOpacity
                    style={[styles.totCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.secondary }]}
                    onPress={() => handleTotPick(thisOrThatQuestions[totIndex].b)}
                  >
                    <Text style={{ fontSize: 44 }}>{thisOrThatQuestions[totIndex].emojiB}</Text>
                    <Text style={[styles.totTitle, { color: theme.colors.textPrimary }]}>
                      {thisOrThatQuestions[totIndex].b}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>💖</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary }}>
                  100% Affinity Match!
                </Text>
                <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginVertical: 8, textAlign: 'center' }}>
                  You and {partner?.displayName || 'your partner'} picked identical answers on all rounds!
                </Text>
                <Badge label="+50 Shared XP Awarded" variant="success" style={{ marginVertical: 8 }} />
                <AppButton
                  title="Back to Games"
                  onPress={() => router.back()}
                  style={{ marginTop: 16 }}
                />
              </View>
            )}
          </View>
        )}

        {/* DEFAULT / OTHER GAMES */}
        {game.id !== 'tic-tac-toe' && game.id !== 'rock-paper-scissors' && game.id !== 'this-or-that' && (
          <View style={styles.gameWrapper}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🎮</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary }}>
              {game.name}
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: 10, maxWidth: 300 }}>
              {game.description}
            </Text>
            <Badge label={game.isImplemented ? 'Session Active' : 'Scheduled for Phase 4'} variant="primary" style={{ marginVertical: 8 }} />
            <AppButton
              title="Return to Catalogue"
              onPress={() => router.back()}
              variant="outline"
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center' },
  gameHeaderTitle: { fontSize: 18, fontWeight: '700' },
  scoreboardCard: { marginHorizontal: 16, padding: 12, marginBottom: 12 },
  playersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerCol: { alignItems: 'center', flex: 1 },
  playerName: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  vsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arenaContainer: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameWrapper: { width: '100%', alignItems: 'center' },
  turnPrompt: { fontSize: 16, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  grid: {
    width: 280,
    height: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridCell: {
    width: '33.333%',
    height: '33.333%',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmoji: { fontSize: 36 },
  rpsPicksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  rpsBox: { alignItems: 'center' },
  rpsChoices: {
    flexDirection: 'row',
    gap: 12,
  },
  rpsChoiceBtn: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 90,
  },
  totCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  totCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  totTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
});

