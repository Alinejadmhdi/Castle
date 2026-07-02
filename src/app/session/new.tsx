import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCategoryStore } from '@/store/categoryStore';
import { useTimerStore } from '@/store/timerStore';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

const DURATIONS = [
  { label: '25 min', ms: 25 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '2 hours', ms: 2 * 60 * 60 * 1000 },
  { label: '4 hours', ms: 4 * 60 * 60 * 1000 },
];

import { BRICK_DISPLAY_COLOR } from '@/rendering/three/constants';

const COLORS = [BRICK_DISPLAY_COLOR, '#1E40AF', '#C2410C', '#15803D', '#7C3AED', '#CA8A04'];

export default function NewSessionScreen() {
  const router = useRouter();
  const { categoryId: paramId } = useLocalSearchParams<{ categoryId?: string }>();
  const { categories } = useCategoryStore();
  const { start } = useTimerStore();
  const standardCats = categories.filter((c) => c.type === 'standard');

  const [categoryId, setCategoryId] = useState(paramId ?? standardCats[0]?.id ?? '');
  const [color, setColor] = useState(COLORS[0]);
  const [durationMs, setDurationMs] = useState(DURATIONS[1].ms);

  async function handleStart() {
    if (!categoryId) return;
    await start({ categoryId, brickColor: color, plannedDurationMs: durationMs });
    router.replace('/session/active');
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

      <Text style={styles.label}>Duration</Text>
      <View style={styles.durations}>
        {DURATIONS.map((d) => (
          <Pressable
            key={d.ms}
            onPress={() => setDurationMs(d.ms)}
            style={[styles.durationBtn, durationMs === d.ms && styles.optionActive]}
          >
            <Text style={styles.optionText}>{d.label}</Text>
          </Pressable>
        ))}
      </View>

      <Button title="Start Focus" onPress={handleStart} style={styles.start} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  empty: { color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
  label: { color: theme.colors.text, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
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
  start: { marginTop: theme.spacing.xl },
});
