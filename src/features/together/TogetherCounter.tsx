import { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Heart } from 'lucide-react-native';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppTextInput } from '@/components/common/AppTextInput';
import { db } from '@/services/firebase/config';
import { useThemeStore } from '@/stores/useThemeStore';
import { parseTogetherDate, togetherDuration, TOGETHER_DATES, TogetherDateId } from './togetherDates';

const dateIds = Object.keys(TOGETHER_DATES) as TogetherDateId[];

export function TogetherCounter({ coupleId }: { coupleId: string }) {
  const { theme } = useThemeStore();
  const [dates, setDates] = useState<Partial<Record<TogetherDateId, string>>>({});
  const [selected, setSelected] = useState<TogetherDateId>('anniversary');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, 'couples', coupleId, 'togetherDates'), (snapshot) => {
      const saved: typeof dates = {};
      for (const item of snapshot.docs) {
        const value = item.data().date;
        if (dateIds.includes(item.id as TogetherDateId) && typeof value === 'string' && parseTogetherDate(value)) {
          saved[item.id as TogetherDateId] = value;
        }
      }
      setDates(saved);
      setLoaded(true);
    }, () => setError('Could not load your shared dates.'));
  }, [coupleId]);

  const active = dates.anniversary ? 'anniversary' : dateIds.find((id) => dates[id]);
  const activeDate = active ? dates[active] : undefined;
  const start = activeDate ? parseTogetherDate(activeDate) : null;

  useFocusEffect(useCallback(() => {
    if (!activeDate) return;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [activeDate]));

  async function save(remove = false) {
    if (!db || saving) return;
    const value = draft.trim();
    if (!remove && (!parseTogetherDate(value) || value > new Date().toISOString().slice(0, 10))) {
      setError('Enter a real date in YYYY-MM-DD format, up to today.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const reference = doc(db, 'couples', coupleId, 'togetherDates', selected);
      if (remove) await deleteDoc(reference);
      else await setDoc(reference, { date: value });
      setEditing(false);
    } catch {
      setError('Could not save the change. Try again when connected.');
    } finally {
      setSaving(false);
    }
  }

  const duration = start ? togetherDuration(start, now) : null;
  const secondary = { color: theme.colors.textSecondary };
  const primary = { color: theme.colors.textPrimary };

  return (
    <AppCard style={styles.card}>
      <View style={styles.heading}>
        <Heart size={20} fill={theme.colors.secondary} color={theme.colors.secondary} />
        <Text style={[styles.title, primary]}>Time Together</Text>
      </View>
      {duration && active ? (
        <>
          <Text style={secondary}>Since {TOGETHER_DATES[active].toLowerCase()} · {dates[active]}</Text>
          <View style={styles.units}>
            {Object.entries(duration).map(([unit, value]) => (
              <View key={unit} style={[styles.unit, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.value, { color: theme.colors.primary }]}>{value}</Text>
                <Text style={[styles.unitName, secondary]}>{unit}</Text>
              </View>
            ))}
          </View>
        </>
      ) : <Text style={secondary}>{loaded ? 'Add the date your story began. You can both see and edit it.' : 'Loading shared dates…'}</Text>}
      {dateIds.filter((id) => dates[id] && id !== active).map((id) => (
        <Text key={id} style={secondary}>{TOGETHER_DATES[id]} · {dates[id]}</Text>
      ))}
      {editing ? (
        <>
          <View style={styles.choices}>
            {dateIds.map((id) => (
              <AppButton key={id} title={TOGETHER_DATES[id]} size="sm" variant={selected === id ? 'primary' : 'outline'}
                disabled={saving} onPress={() => { setSelected(id); setDraft(dates[id] ?? ''); setError(''); }} />
            ))}
          </View>
          <AppTextInput label="Date (YYYY-MM-DD)" placeholder="2024-02-14" value={draft} onChangeText={setDraft} maxLength={10} />
          <View style={styles.choices}>
            <AppButton title="Save date" size="sm" loading={saving} onPress={() => void save()} />
            {dates[selected] && <AppButton title="Remove date" size="sm" variant="outline" disabled={saving} onPress={() => void save(true)} />}
            <AppButton title="Cancel" size="sm" variant="ghost" disabled={saving} onPress={() => { setEditing(false); setError(''); }} />
          </View>
        </>
      ) : (
        <AppButton title={duration ? 'Manage dates' : 'Add a date'} size="sm" variant="outline" disabled={!loaded}
          onPress={() => { setDraft(dates[selected] ?? ''); setEditing(true); }} />
      )}
      {!!error && <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>{error}</Text>}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 18, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 19, fontWeight: '800' },
  units: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  unit: { flexGrow: 1, minWidth: 42, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10 },
  value: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unitName: { fontSize: 10 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
