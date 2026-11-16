/**
 * TOGETHERLY — GAME 4: CONNECT FOUR
 *
 * 7 columns x 6 rows vertical disc dropping game.
 * Alternating real-time turns, gravity placement, 4-in-a-row detection,
 * winning line highlight, and rematch loop.
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
  COLUMNS,
  BoardGrid,
  createEmptyBoard,
  getLowestEmptyRow,
  checkConnectFourWin,
  isBoardFull,
} from './logic';
import { AppButton } from '@/components/common/AppButton';
import { AppCard, Badge } from '@/components/common/AppCard';
import { Trophy, RefreshCw, ArrowDown } from 'lucide-react-native';

interface ConnectFourGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onMakeMove: (actionType: string, payload: Record<string, any>) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

export const ConnectFourGame: React.FC<ConnectFourGameProps> = ({
  session,
  currentUser,
  partnerName,
  onMakeMove,
  onRematch,
  onExit,
}) => {
  const { theme } = useThemeStore();
  // Host gets 'P1' (Coral), Partner gets 'P2' (Lavender)
  const isHost = session.playerIds[0] === currentUser.uid;
  const mySymbol = isHost ? 'P1' : 'P2';
  const partnerSymbol = isHost ? 'P2' : 'P1';

  const myColor = theme.colors.primary; // Soft Lavender or Coral
  const partnerColor = theme.colors.secondary;

  const isMyTurn = session.currentTurn === currentUser.uid;
  const isCompleted = session.status === 'completed';

  const board: BoardGrid = session.gameState.board || createEmptyBoard();
  const winningCells: [number, number][] = session.gameState.winningCells || [];
  const [submitting, setSubmitting] = useState(false);

  const handleDropDisc = async (col: number) => {
    if (!isMyTurn || isCompleted || submitting) return;

    const row = getLowestEmptyRow(board, col);
    if (row === null) return; // Column is full

    setSubmitting(true);
    try {
      const nextBoard = board.map((r) => [...r]);
      nextBoard[row][col] = mySymbol;

      const winResult = checkConnectFourWin(nextBoard, row, col, mySymbol);
      const isFull = isBoardFull(nextBoard);

      const isWon = winResult.won;
      const isDraw = !isWon && isFull;

      const isFinal = isWon || isDraw;
      const winnerId = isWon ? currentUser.uid : isDraw ? 'draw' : null;

      const nextScores = { ...session.scores };
      if (isWon) {
        nextScores[currentUser.uid] = (nextScores[currentUser.uid] || 0) + 1;
      }

      await onMakeMove('drop_disc', {
        col,
        row,
        symbol: mySymbol,
        board: nextBoard,
        winningCells: winResult.winningCells || [],
        scores: nextScores,
        winnerId,
        status: isFinal ? 'completed' : 'active',
        turnNumber: (session.gameState.turnNumber || 0) + 1,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isWinningCell = (r: number, c: number) => {
    return winningCells.some(([wr, wc]) => wr === r && wc === c);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Turn & Status Header */}
      <View style={styles.topHeader}>
        <Badge
          label={
            isCompleted
              ? 'GAME OVER'
              : isMyTurn
              ? 'YOUR TURN'
              : `${partnerName.toUpperCase()}'S TURN`
          }
          variant={isCompleted ? 'secondary' : isMyTurn ? 'primary' : 'warning'}
        />
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.discPreview, { backgroundColor: myColor }]} />
            <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>You</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.discPreview, { backgroundColor: partnerColor }]} />
            <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>
              {partnerName}
            </Text>
          </View>
        </View>
      </View>

      {/* Column Arrow Indicators */}
      {!isCompleted && isMyTurn && (
        <View style={styles.columnSelectorRow}>
          {Array.from({ length: COLUMNS }).map((_, c) => {
            const isColFull = board[0][c] !== null;
            return (
              <TouchableOpacity
                key={c}
                disabled={isColFull || submitting}
                onPress={() => handleDropDisc(c)}
                style={styles.colArrowBtn}
              >
                {!isColFull && <ArrowDown size={18} color={myColor} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Connect Four 7x6 Board Grid */}
      <View style={[styles.boardWrapper, { backgroundColor: '#1E293B', borderColor: '#0F172A' }]}>
        {board.map((rowArr, rIdx) => (
          <View key={rIdx} style={styles.boardRow}>
            {rowArr.map((cell, cIdx) => {
              const isWin = isWinningCell(rIdx, cIdx);
              let cellColor = '#0F172A'; // Empty hole
              if (cell === mySymbol) cellColor = myColor;
              else if (cell === partnerSymbol) cellColor = partnerColor;

              return (
                <TouchableOpacity
                  key={cIdx}
                  activeOpacity={0.8}
                  disabled={!isMyTurn || isCompleted || submitting || board[0][cIdx] !== null}
                  onPress={() => handleDropDisc(cIdx)}
                  style={styles.cellHoleWrapper}
                >
                  <View
                    style={[
                      styles.cellHole,
                      {
                        backgroundColor: cellColor,
                        borderColor: isWin ? '#FBBF24' : 'transparent',
                        borderWidth: isWin ? 3 : 0,
                      },
                    ]}
                  >
                    {isWin && <Trophy size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Results / End of Match Card */}
      {isCompleted && (
        <AppCard style={styles.resultCard}>
          <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 8 }}>
            {session.winnerId === currentUser.uid
              ? '🎉'
              : session.winnerId === 'draw'
              ? '🤝'
              : '🌟'}
          </Text>
          <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
            {session.winnerId === currentUser.uid
              ? 'You Connected Four!'
              : session.winnerId === 'draw'
              ? 'A Perfectly Balanced Draw!'
              : `${partnerName} Connected Four!`}
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
            {session.winnerId === currentUser.uid
              ? 'Brilliant vertical strategy!'
              : session.winnerId === 'draw'
              ? 'Every slot filled to the brim.'
              : 'Better luck in the rematch!'}
          </Text>
          <Badge label="+30 Shared XP Awarded" variant="success" style={{ alignSelf: 'center', marginTop: 10 }} />

          <View style={styles.actionRow}>
            <AppButton
              title="Play Rematch"
              onPress={onRematch}
              icon={<RefreshCw size={18} color="#FFFFFF" />}
              style={{ flex: 1, marginRight: 8 }}
            />
            <AppButton
              title="Exit"
              onPress={onExit}
              variant="outline"
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </AppCard>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  discPreview: { width: 14, height: 14, borderRadius: 7 },
  legendText: { fontSize: 13, fontWeight: '700' },
  columnSelectorRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  colArrowBtn: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardWrapper: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  boardRow: { flexDirection: 'row', gap: 6, marginVertical: 3 },
  cellHoleWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellHole: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: { width: '100%', padding: 20, marginTop: 24, alignItems: 'center' },
  resultTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  resultSubtitle: { fontSize: 14, textAlign: 'center' },
  actionRow: { flexDirection: 'row', width: '100%', marginTop: 20 },
});
