/**
 * TOGETHERLY — GAMES CATALOGUE
 *
 * Full catalogue of all 10 multiplayer games with category filtering,
 * instant search, rule modals, and multiplayer session launch triggers.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/useThemeStore';
import { GAME_CATALOGUE, CATEGORIES } from '@/games/registry';
import { GameDefinition } from '@/types';
import { GameCard } from '@/components/games/GameCard';
import { Modal } from '@/components/common/Modal';
import { AppButton } from '@/components/common/AppButton';
import { Badge } from '@/components/common/AppCard';
import { Search, Clock, Users, Play } from 'lucide-react-native';

export default function GamesScreen() {
  const router = useRouter();
  const { selectedGameId } = useLocalSearchParams<{ selectedGameId?: string }>();
  const { theme } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalGame, setActiveModalGame] = useState<GameDefinition | null>(
    selectedGameId ? GAME_CATALOGUE.find((g) => g.id === selectedGameId) || null : null
  );

  const filteredGames = GAME_CATALOGUE.filter((game) => {
    const matchesCategory =
      selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch =
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLaunchGame = (game: GameDefinition) => {
    setActiveModalGame(null);
    router.push({
      pathname: '/game',
      params: { gameId: game.id },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Games for Two
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          10 handcrafted games to connect, laugh, and compete.
        </Text>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Search size={18} color={theme.colors.textMuted} />
          <TextInput
            placeholder="Search games or categories..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          />
        </View>

        {/* Category Horizontal Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Games List */}
      <ScrollView contentContainerStyle={styles.gamesList}>
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPress={(g) => setActiveModalGame(g)}
          />
        ))}

        {filteredGames.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              No games found
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
              Try searching with another keyword or resetting the filter.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Game Details & Instructions Modal */}
      {activeModalGame && (
        <Modal
          visible={Boolean(activeModalGame)}
          onClose={() => setActiveModalGame(null)}
          title={activeModalGame.name}
        >
          <View>
            <View style={styles.modalMetaRow}>
              <Badge label={activeModalGame.categoryLabel} variant="primary" />
              <View style={styles.modalMetaItem}>
                <Clock size={14} color={theme.colors.textMuted} />
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginLeft: 4 }}>
                  {activeModalGame.estimatedMinutes} mins
                </Text>
              </View>
              <View style={styles.modalMetaItem}>
                <Users size={14} color={theme.colors.textMuted} />
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginLeft: 4 }}>
                  2 Players
                </Text>
              </View>
            </View>

            <Text style={[styles.modalDesc, { color: theme.colors.textPrimary }]}>
              {activeModalGame.description}
            </Text>

            <Text style={[styles.modalSectionTitle, { color: theme.colors.textPrimary }]}>
              How to Play:
            </Text>
            {activeModalGame.instructions.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepNumber,
                    { backgroundColor: theme.colors.primaryLight },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primaryDark }}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                  {step}
                </Text>
              </View>
            ))}

            <View style={{ marginTop: 20 }}>
              {activeModalGame.isImplemented ? (
                <AppButton
                  title="Invite Partner & Play"
                  onPress={() => handleLaunchGame(activeModalGame)}
                  size="lg"
                  icon={<Play size={18} color="#FFFFFF" fill="#FFFFFF" />}
                />
              ) : (
                <View
                  style={[
                    styles.comingSoonBox,
                    { backgroundColor: theme.colors.warningSoft },
                  ]}
                >
                  <Text style={{ color: theme.colors.warning, fontWeight: '700', textAlign: 'center' }}>
                    Scheduled for Phase 4 Release
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  chipsContainer: { paddingBottom: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  gamesList: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyDesc: { fontSize: 13, textAlign: 'center', marginTop: 4 },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  modalMetaItem: { flexDirection: 'row', alignItems: 'center' },
  modalDesc: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  modalSectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepText: { flex: 1, fontSize: 13, lineHeight: 19 },
  comingSoonBox: { padding: 14, borderRadius: 12 },
});

