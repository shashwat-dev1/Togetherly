/**
 * TOGETHERLY — GAME CARD COMPONENT
 *
 * Displays game thumbnail, metadata, duration, mode,
 * and quick-launch invitation action.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GameDefinition } from '@/types';
import { useThemeStore } from '@/stores/useThemeStore';
import { Badge } from '@/components/common/AppCard';
import { Clock, Play, Lock } from 'lucide-react-native';

interface GameCardProps {
  game: GameDefinition;
  onPress: (game: GameDefinition) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress }) => {
  const { theme } = useThemeStore();

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'simultaneous':
        return 'Simultaneous';
      case 'realtime':
        return 'Real-Time';
      case 'turn_based':
        return 'Turn-Based';
      default:
        return mode;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(game)}
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
        },
        theme.shadows.soft,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Game Icon Graphic */}
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: game.isImplemented
                ? theme.colors.primaryLight
                : theme.isDark
                ? '#2A263D'
                : '#ECE8F5',
            },
          ]}
        >
          <Text style={styles.iconEmoji}>
            {game.id === 'who-knows-whom'
              ? '💭'
              : game.id === 'this-or-that'
              ? '⚖️'
              : game.id === 'tic-tac-toe'
              ? '⭕'
              : game.id === 'rock-paper-scissors'
              ? '✌️'
              : game.id === 'truth-or-dare'
              ? '🔥'
              : game.id === 'couple-trivia'
              ? '🧠'
              : game.id === 'draw-and-guess'
              ? '🎨'
              : game.id === 'connect-four'
              ? '🔴'
              : game.id === 'memory-match'
              ? '🃏'
              : '🔤'}
          </Text>
        </View>

        {/* Game Info */}
        <View style={styles.infoCol}>
          <View style={styles.headerRow}>
            <Text
              style={[styles.title, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {game.name}
            </Text>
            {game.isPremium && (
              <Badge label="PLUS" variant="secondary" style={styles.plusBadge} />
            )}
          </View>

          <Text
            style={[styles.tagline, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {game.tagline}
          </Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={12} color={theme.colors.textMuted} />
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                {game.estimatedMinutes}m
              </Text>
            </View>

            <Badge
              label={getModeLabel(game.gameMode)}
              variant="neutral"
              style={styles.modeBadge}
            />

            {!game.isImplemented ? (
              <Badge label="Coming Soon" variant="warning" style={styles.modeBadge} />
            ) : null}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionCol}>
          <View
            style={[
              styles.circlePlay,
              {
                backgroundColor: game.isImplemented
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
          >
            {game.isPremium ? (
              <Lock size={16} color="#FFFFFF" />
            ) : (
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 26,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  plusBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  actionCol: {
    marginLeft: 8,
  },
  circlePlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

