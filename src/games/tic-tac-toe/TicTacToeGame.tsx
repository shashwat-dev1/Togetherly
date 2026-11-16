/**
 * TOGETHERLY — GAME 3: TIC-TAC-TOE (HEARTS & STARS)
 *
 * Real-time 3x3 board duel with alternating turns,
 * win detection, draw detection, and instant rematch.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { GameSession, UserProfile } from '@/types';
import { useThemeStore } from '@/stores/useThemeStore';
import { AppButton } from '@/components/common/AppButton';
import { Badge } from '@/components/common/AppCard';
import { RefreshCw } from 'lucide-react-native';

interface TicTacToeGameProps {
  session: GameSession;
  currentUser: UserProfile;
  partnerName: string;
  onMakeMove: (index: number, symbol: string) => Promise<void>;
  onRematch: () => void;
  onExit: () => void;
}

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  session,
  currentUser,
  partnerName,
  onMakeMove,
  onRematch,
  onExit,
}) => {
  const { theme } = useThemeStore();

  const isPlayer1 = session.playerIds[0] === currentUser.uid;
  const mySymbol = isPlayer1 ? '❤️' : '⭐';
  const partnerSymbol = isPlayer1 ? '⭐' : '❤️';

  const board: (string | null)[] = session.gameState.board || Array(9).fill(null);
  const isMyTurn = session.currentTurn === currentUser.uid && session.status === 'active';
  const isCompleted = session.status === 'completed';

  const isWinner = session.winnerId === currentUser.uid;
  const isDraw = session.winnerId === 'draw';

  const handleCellPress = async (index: number) => {
    if (board[index] !== null || !isMyTurn || isCompleted) return;
    await onMakeMove(index, mySymbol);
  };

  return (
    <View style={styles.container}>
      {/* Turn & Status Header */}
      <View style={styles.statusBox}>
        {isCompleted ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 44, marginBottom: 4 }}>
              {isWinner ? '🎉' : isDraw ? '🤝' : '😢'}
            </Text>
            <Text style={[styles.statusTitle, { color: theme.colors.textPrimary }]}>
              {isWinner
                ? 'You Won the Match!'
                : isDraw
                ? 'It’s a Draw!'
                : `${partnerName} Won!`}
            </Text>
            <Badge label="+30 Shared XP Awarded" variant="success" style={{ marginTop: 6 }} />
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.turnTitle, { color: theme.colors.textPrimary }]}>
              {isMyTurn
                ? `Your Turn (${mySymbol})`
                : `Waiting for ${partnerName} (${partnerSymbol})...`}
            </Text>
            <Text style={[styles.turnSubtitle, { color: theme.colors.textSecondary }]}>
              Get 3 in a row to win!
            </Text>
          </View>
        )}
      </View>

      {/* 3x3 Grid */}
      <View
        style={[
          styles.gridContainer,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
          theme.shadows.medium,
        ]}
      >
        {board.map((cell, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.7}
            disabled={cell !== null || !isMyTurn || isCompleted}
            onPress={() => handleCellPress(idx)}
            style={[
              styles.gridCell,
              {
                borderColor: theme.colors.border,
                backgroundColor: cell ? theme.colors.primaryLight : 'transparent',
              },
            ]}
          >
            <Text style={styles.cellEmoji}>{cell || ''}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Footer */}
      {isCompleted ? (
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
      ) : (
        <View style={styles.playersSummaryRow}>
          <View style={styles.playerTag}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary }}>
              You: {mySymbol}
            </Text>
          </View>
          <View style={styles.playerTag}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary }}>
              {partnerName}: {partnerSymbol}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBox: { marginBottom: 28, alignItems: 'center' },
  statusTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  turnTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  turnSubtitle: { fontSize: 13, marginTop: 4 },
  gridContainer: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 28,
  },
  gridCell: {
    width: '33.333%',
    height: '33.333%',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmoji: { fontSize: 40 },
  actionRow: { flexDirection: 'row', width: '100%', maxWidth: 300 },
  playersSummaryRow: { flexDirection: 'row', gap: 16 },
  playerTag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#EFEBF5' },
});
