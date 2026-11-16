/**
 * TOGETHERLY — UNIVERSAL MULTIPLAYER GAME RUNNER SCREEN
 *
 * Connects to active game sessions via `useGameSession` with:
 * - Real-time Firestore synchronization
 * - Connection state tracking (connecting, connected, reconnecting)
 * - Waiting-for-partner lobby state
 * - Modular delegation to all 4 fully playable game engines
 * - Atomic rematch creation and session completion
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoupleStore } from '@/stores/useCoupleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { GAME_CATALOGUE } from '@/games/registry';
import { GameSessionService } from '@/services/firebase/gameSessionService';
import { useGameSession } from '@/hooks/useGameSession';
import { Avatar } from '@/components/common/Avatar';
import { AppCard, Badge } from '@/components/common/AppCard';
import { AppButton } from '@/components/common/AppButton';
import { WhoKnowsWhomGame } from '@/games/who-knows-whom/WhoKnowsWhomGame';
import { ThisOrThatGame } from '@/games/this-or-that/ThisOrThatGame';
import { TicTacToeGame } from '@/games/tic-tac-toe/TicTacToeGame';
import { RockPaperScissorsGame } from '@/games/rock-paper-scissors/RockPaperScissorsGame';
import { ArrowLeft, WifiOff, Users, Play, Heart } from 'lucide-react-native';

export default function GameRunnerScreen() {
  const router = useRouter();
  const { gameId, sessionId: initialSessionId } = useLocalSearchParams<{ gameId: string; sessionId?: string }>();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { couple } = useCoupleStore();

  const game = GAME_CATALOGUE.find((g) => g.id === gameId) || GAME_CATALOGUE[0];
  const partnerId = couple?.memberIds.find((id) => id !== user?.uid) || 'usr_partner_demo';
  const partner = couple?.members[partnerId] || {
    displayName: 'Partner',
    avatarId: 'avatar_fox',
    joinedAt: couple?.createdAt || 1700000000000,
    isOnline: true,
  };

  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(initialSessionId);
  const [initError, setInitError] = useState<string | null>(null);

  // Auto-initialize session if none provided in query params
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      if (activeSessionId || !user || !couple) return;
      try {
        const session = await GameSessionService.createGameSession({
          coupleId: couple.id,
          gameId: game.id,
          hostPlayerId: user.uid,
          partnerPlayerId: partnerId,
          gameMode: game.gameMode,
        });
        if (isMounted) {
          setActiveSessionId(session.id);
        }
      } catch (err: any) {
        if (isMounted) {
          setInitError(err.message || 'Failed to start game session');
        }
      }
    };
    initSession();
    return () => {
      isMounted = false;
    };
  }, [activeSessionId, couple, game, partnerId, user]);

  const {
    session,
    connectionState,
    error,
    submitAction,
    submitAnswer,
    joinSession,
    requestRematch,
    abandonSession,
    retryConnection,
  } = useGameSession(activeSessionId, user?.uid);

  const handleRematch = async () => {
    try {
      const newSession = await requestRematch();
      setActiveSessionId(newSession.id);
    } catch {
      // Handled in hook
    }
  };

  const handleExit = async () => {
    if (session && session.status !== 'completed') {
      await abandonSession();
    }
    router.back();
  };

  // --- LOADING / INITIALIZING STATE ---
  if (!activeSessionId || (connectionState === 'connecting' && !session)) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingTitle, { color: theme.colors.textPrimary }]}>
            Preparing {game.name}...
          </Text>
          <Text style={[styles.loadingSubtitle, { color: theme.colors.textSecondary }]}>
            Syncing multiplayer state with partner
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- RECONNECTING / ERROR STATE ---
  if (connectionState === 'reconnecting' && !session) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <WifiOff size={44} color={theme.colors.warning} />
          <Text style={[styles.loadingTitle, { color: theme.colors.textPrimary }]}>
            Connection Lost
          </Text>
          <Text style={[styles.loadingSubtitle, { color: theme.colors.textSecondary }]}>
            {error || 'Reconnecting with exponential backoff...'}
          </Text>
          <AppButton
            title="Retry Connection"
            onPress={retryConnection}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (initError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>⚠️</Text>
          <Text style={[styles.loadingTitle, { color: theme.colors.textPrimary }]}>
            Could Not Launch Game
          </Text>
          <Text style={[styles.loadingSubtitle, { color: theme.colors.textSecondary }]}>
            {initError}
          </Text>
          <AppButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleExit} style={styles.backButton}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.gameHeaderTitle, { color: theme.colors.textPrimary }]}>
          {game.name}
        </Text>
        <Badge
          label={
            connectionState === 'connected'
              ? 'LIVE SYNC'
              : connectionState.toUpperCase()
          }
          variant={connectionState === 'connected' ? 'success' : 'warning'}
        />
      </View>

      {/* Universal Scoreboard & Partner Header */}
      <AppCard style={styles.scoreboardCard}>
        <View style={styles.playersRow}>
          {/* User Col */}
          <View style={styles.playerCol}>
            <Avatar id={user?.avatarId} name={user?.displayName} size={44} showOnline isOnline />
            <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>
              {user?.displayName} (You)
            </Text>
            <Text style={[styles.playerScore, { color: theme.colors.primary }]}>
              {session?.scores[user?.uid || ''] || 0}
            </Text>
          </View>

          {/* VS Center Badge */}
          <View style={styles.vsBadge}>
            <Heart size={18} color={theme.colors.secondary} fill={theme.colors.secondary} />
          </View>

          {/* Partner Col */}
          <View style={styles.playerCol}>
            <Avatar id={partner.avatarId} name={partner.displayName} size={44} showOnline isOnline={partner.isOnline} />
            <Text style={[styles.playerName, { color: theme.colors.textPrimary }]}>
              {partner.displayName}
            </Text>
            <Text style={[styles.playerScore, { color: theme.colors.secondary }]}>
              {session?.scores[partnerId] || 0}
            </Text>
          </View>
        </View>
      </AppCard>

      {/* LOBBY / WAITING FOR PARTNER JOIN */}
      {session && session.status === 'waiting' && !session.readyPlayers.includes(partnerId) && (
        <View style={styles.lobbyContainer}>
          <View
            style={[
              styles.lobbyBubble,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Users size={36} color={theme.colors.primaryDark} />
          </View>
          <Text style={[styles.lobbyTitle, { color: theme.colors.textPrimary }]}>
            Waiting for {partner.displayName}...
          </Text>
          <Text style={[styles.lobbyDesc, { color: theme.colors.textSecondary }]}>
            Match session created! Once {partner.displayName} opens this game on their device, the match will begin automatically.
          </Text>

          {/* Developer Quick Simulation Button for local tests */}
          <AppButton
            title={`Simulate ${partner.displayName} Ready`}
            onPress={joinSession}
            variant="outline"
            size="sm"
            icon={<Play size={14} color={theme.colors.primary} fill={theme.colors.primary} />}
            style={{ marginTop: 24 }}
          />
        </View>
      )}

      {/* ACTIVE / COMPLETED GAME ENGINES */}
      {session && (session.status === 'active' || session.status === 'completed' || session.status === 'ready') && user && (
        <View style={styles.gameViewContainer}>
          {game.id === 'who-knows-whom' && (
            <WhoKnowsWhomGame
              session={session}
              currentUser={user}
              partnerName={partner.displayName}
              onSubmitAnswer={submitAnswer}
              onRematch={handleRematch}
              onExit={handleExit}
            />
          )}

          {game.id === 'this-or-that' && (
            <ThisOrThatGame
              session={session}
              currentUser={user}
              partnerName={partner.displayName}
              onSubmitAnswer={(round, choice) => submitAnswer(round, choice)}
              onRematch={handleRematch}
              onExit={handleExit}
            />
          )}

          {game.id === 'tic-tac-toe' && (
            <TicTacToeGame
              session={session}
              currentUser={user}
              partnerName={partner.displayName}
              onMakeMove={(index, symbol) =>
                submitAction('place_mark', { index, symbol })
              }
              onRematch={handleRematch}
              onExit={handleExit}
            />
          )}

          {game.id === 'rock-paper-scissors' && (
            <RockPaperScissorsGame
              session={session}
              currentUser={user}
              partnerName={partner.displayName}
              onSubmitPick={(round, pick) => submitAnswer(round, pick)}
              onRematch={handleRematch}
              onExit={handleExit}
            />
          )}
        </View>
      )}
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
  scoreboardCard: { marginHorizontal: 16, padding: 12, marginBottom: 10 },
  playersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerCol: { alignItems: 'center', flex: 1 },
  playerName: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  playerScore: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  vsBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingTitle: { fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  loadingSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 6 },
  lobbyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lobbyBubble: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  lobbyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  lobbyDesc: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  gameViewContainer: { flex: 1 },
});
