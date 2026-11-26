import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Heart, Trophy } from 'lucide-react-native';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { useThemeStore } from '@/stores/useThemeStore';
import type { GameSession } from '@/types';
import { STARTING_HEARTS } from './logic';

export function LastHeartGame({
  session, uid, partnerName, take, rematch,
}: {
  session: GameSession;
  uid: string;
  partnerName: string;
  take: (count: number) => Promise<void>;
  rematch: () => Promise<void>;
}) {
  const { theme } = useThemeStore();
  const remaining = session.gameState.remaining ?? STARTING_HEARTS;
  const finished = session.status === 'completed';
  const myTurn = session.currentTurn === uid && session.status === 'active';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try { await action(); }
    catch { setError('That move did not sync. Try again.'); }
    finally { setBusy(false); }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppCard style={styles.card}>
        {finished && <Trophy color={theme.colors.primary} size={34} />}
        <Text accessibilityLiveRegion="polite" style={[styles.title, { color: theme.colors.textPrimary }]}>
          {finished ? (session.winnerId === uid ? 'You took the last heart!' : `${partnerName} took the last heart!`)
            : myTurn ? 'Your move' : `${partnerName}’s move`}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
          Take one, two, or three hearts. Whoever takes the last one wins.
        </Text>
        <View style={styles.hearts} accessibilityLabel={remaining + ' hearts remaining'} accessible>
          {Array.from({ length: STARTING_HEARTS }, (_, index) => (
            <Heart key={index} size={29} color={index < remaining ? theme.colors.secondary : theme.colors.border}
              fill={index < remaining ? theme.colors.secondary : 'transparent'} />
          ))}
        </View>
        {finished ? <AppButton title="Play again" loading={busy} onPress={() => void act(rematch)} /> : (
          <View style={styles.actions}>
            {[1, 2, 3].map((count) => (
              <AppButton key={count} title={`Take ${count}`} size="sm"
                disabled={busy || !myTurn || count > remaining} onPress={() => void act(() => take(count))} />
            ))}
          </View>
        )}
        {!!error && <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>{error}</Text>}
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { padding: 20, gap: 16, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  hearts: { width: 183, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
});
