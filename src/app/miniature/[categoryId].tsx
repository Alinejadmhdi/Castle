import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { logMiniatureResist } from '@/features/bricks/brickService';
import { useCategoryStore } from '@/store/categoryStore';
import { useCelebrationStore } from '@/store/celebrationStore';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export default function MiniatureLogScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const { refreshOne } = useCategoryStore();
  const { trigger } = useCelebrationStore();
  const [logging, setLogging] = useState(false);
  const [count, setCount] = useState(0);

  async function handleResist() {
    if (!categoryId) return;
    setLogging(true);
    const result = await logMiniatureResist(categoryId);
    await refreshOne(categoryId);
    if (result.unlocks.length > 0) trigger(result.unlocks);
    setCount((c) => c + 1);
    setLogging(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.title}>Resisted temptation</Text>
      <Text style={styles.sub}>
        Each resist lays one miniature brick on your tiny settlement.
      </Text>
      {count > 0 && (
        <Text style={styles.count}>{count} brick{count !== 1 ? 's' : ''} logged this visit</Text>
      )}
      <Button
        title={logging ? 'Placing brick...' : 'I Resisted — Place Brick'}
        onPress={handleResist}
        disabled={logging}
        style={styles.btn}
      />
      <Button title="Back to Life Map" onPress={() => router.back()} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  emoji: { fontSize: 48, textAlign: 'center' },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  sub: { color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.sm },
  count: { color: theme.colors.primary, textAlign: 'center', marginTop: theme.spacing.lg },
  btn: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
});
