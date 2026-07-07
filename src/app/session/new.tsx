import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCategoryStore } from '@/store/categoryStore';
import { useTimerStore } from '@/store/timerStore';
import type { SessionTimerMode } from '@/types';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { showFocusPrimerIfNeeded } from '@/utils/focusPrimer';
import { BRICK_PRESET_COLORS } from '@/constants/brickColors';

const COLORS = [...BRICK_PRESET_COLORS];

const PRESET_DURATIONS = [
  { label: '25 min', ms: 25 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '2 hours', ms: 2 * 60 * 60 * 1000 },
  { label: '4 hours', ms: 4 * 60 * 60 * 1000 },
];

function parseCustomDurationMs(hours: string, minutes: string): number {
  const h = Math.max(0, parseInt(hours, 10) || 0);
  const m = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
  return (h * 60 + m) * 60 * 1000;
}

export default function NewSessionScreen() {
  const router = useRouter();
  const { categoryId: paramId } = useLocalSearchParams<{ categoryId?: string }>();
  const { categories } = useCategoryStore();
  const { start } = useTimerStore();
  const standardCats = categories.filter((c) => c.type === 'standard');

  const [categoryId, setCategoryId] = useState(paramId ?? standardCats[0]?.id ?? '');
  const [color, setColor] = useState(COLORS[0]);
  const [timerMode, setTimerMode] = useState<SessionTimerMode>('countdown');
  const [durationMs, setDurationMs] = useState(PRESET_DURATIONS[1].ms);
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [customHours, setCustomHours] = useState('1');
  const [customMinutes, setCustomMinutes] = useState('0');

  function resolvedDurationMs(): number {
    if (timerMode === 'stopwatch') return 0;
    if (useCustomDuration) return parseCustomDurationMs(customHours, customMinutes);
    return durationMs;
  }

  function handleStart() {
    if (!categoryId) return;
    const plannedDurationMs = resolvedDurationMs();
    if (timerMode === 'countdown' && plannedDurationMs < 60_000) return;

    showFocusPrimerIfNeeded(() => {
      void start({ categoryId, brickColor: color, plannedDurationMs, timerMode }).then(() => {
        router.replace('/session/active');
      });
    });
  }

  if (standardCats.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Create a standard category first.</Text>
        <Button title="Create Category" onPress={() => router.push('/category/new')} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Category</Text>
      {standardCats.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => setCategoryId(c.id)}
          style={[styles.option, categoryId === c.id && styles.optionActive]}
        >
          <Text style={styles.optionText}>{c.name}</Text>
        </Pressable>
      ))}

      <Text style={styles.label}>Brick color</Text>
      <View style={styles.colors}>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]}
          />
        ))}
      </View>

      <Text style={styles.label}>Timer type</Text>
      <View style={styles.durations}>
        <Pressable
          onPress={() => setTimerMode('countdown')}
          style={[styles.durationBtn, timerMode === 'countdown' && styles.optionActive]}
        >
          <Text style={styles.optionText}>Countdown</Text>
        </Pressable>
        <Pressable
          onPress={() => setTimerMode('stopwatch')}
          style={[styles.durationBtn, timerMode === 'stopwatch' && styles.optionActive]}
        >
          <Text style={styles.optionText}>Stopwatch</Text>
        </Pressable>
      </View>

      {timerMode === 'countdown' && (
        <>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durations}>
            {PRESET_DURATIONS.map((d) => (
              <Pressable
                key={d.ms}
                onPress={() => {
                  setUseCustomDuration(false);
                  setDurationMs(d.ms);
                }}
                style={[
                  styles.durationBtn,
                  !useCustomDuration && durationMs === d.ms && styles.optionActive,
                ]}
              >
                <Text style={styles.optionText}>{d.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setUseCustomDuration(true)}
              style={[styles.durationBtn, useCustomDuration && styles.optionActive]}
            >
              <Text style={styles.optionText}>Custom</Text>
            </Pressable>
          </View>

          {useCustomDuration && (
            <View style={styles.customRow}>
              <View style={styles.customField}>
                <Text style={styles.customLabel}>Hours</Text>
                <TextInput
                  style={styles.customInput}
                  keyboardType="number-pad"
                  value={customHours}
                  onChangeText={setCustomHours}
                  maxLength={3}
                />
              </View>
              <View style={styles.customField}>
                <Text style={styles.customLabel}>Minutes</Text>
                <TextInput
                  style={styles.customInput}
                  keyboardType="number-pad"
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                  maxLength={2}
                />
              </View>
            </View>
          )}
        </>
      )}

      {timerMode === 'stopwatch' && (
        <Text style={styles.hint}>
          Counts up until you finish. Still 1 hour focused = 1 brick on your wall.
        </Text>
      )}

      <Button title="Start Focus" onPress={handleStart} style={styles.start} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  empty: { color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
  label: { color: theme.colors.text, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  hint: {
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    lineHeight: 20,
    fontSize: 14,
  },
  option: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
  },
  optionActive: { borderColor: theme.colors.primary },
  optionText: { color: theme.colors.text },
  colors: { flexDirection: 'row', gap: theme.spacing.sm },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  swatchOn: { borderWidth: 2, borderColor: '#fff' },
  durations: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  durationBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
  },
  customRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  customField: { flex: 1 },
  customLabel: { color: theme.colors.textMuted, marginBottom: 4, fontSize: 13 },
  customInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
    color: theme.colors.text,
    padding: theme.spacing.md,
    fontSize: 18,
  },
  start: { marginTop: theme.spacing.xl },
});
