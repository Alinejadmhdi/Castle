import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCheckpointProgress } from '@/features/progression/checkpointProgress';
import { useCategoryStore } from '@/store/categoryStore';
import { useMapSceneStore } from '@/store/mapSceneStore';
import { useMotivationQuote } from '@/hooks/useMotivationQuote';
import { useResist } from '@/hooks/useResist';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export default function MiniatureLogScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const category = useCategoryStore((s) => s.categories.find((c) => c.id === categoryId));
  const loadCategory = useMapSceneStore((s) => s.loadCategory);
  const { tapResist, pending, error } = useResist({
    categoryId,
    categoryType: category?.type,
  });

  const totalBricks = Math.floor(category?.totalBrickValue ?? 0);
  const checkpoint = getCheckpointProgress(totalBricks, 'miniature');
  const quote = useMotivationQuote(category?.name, totalBricks, 'miniature', totalBricks);

  useEffect(() => {
    if (categoryId) void loadCategory(categoryId);
  }, [categoryId, loadCategory]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{category?.name ?? 'Resist'}</Text>
      <Text style={styles.checkpoint}>
        {checkpoint.current} bricks · {checkpoint.label} toward {checkpoint.nextStageName}
      </Text>
      {quote && <Text style={styles.quote}>{quote}</Text>}
      {pending > 0 && <Text style={styles.saving}>Saving…</Text>}
      {error && <Text style={styles.error} selectable>{error}</Text>}
      <Button title="I Resisted — Place Brick" onPress={tapResist} style={styles.btn} />
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
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  checkpoint: {
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  quote: {
    color: theme.colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
    fontSize: 14,
  },
  saving: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.sm },
  error: { color: theme.colors.danger, textAlign: 'center', marginBottom: theme.spacing.sm },
  btn: { marginTop: theme.spacing.md },
});
