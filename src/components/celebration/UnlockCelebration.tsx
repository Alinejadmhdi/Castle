import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { UnlockEvent } from '@/types';
import { useCategoryStore } from '@/store/categoryStore';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { ConfettiOverlay } from '@/components/celebration/ConfettiOverlay';
import { formatUnlockMessage, formatUnlockProgression, formatUnlockSummary } from '@/utils/unlockMessages';

interface UnlockCelebrationProps {
  unlocks: UnlockEvent[];
  visible: boolean;
  onDismiss: () => void;
}

/** Root overlay — avoids RN Modal, which crashes navigation on Android during rapid resist. */
export function UnlockCelebration({ unlocks, visible, onDismiss }: UnlockCelebrationProps) {
  const categories = useCategoryStore((s) => s.categories);

  if (!visible || unlocks.length === 0) return null;
  const latest = unlocks[unlocks.length - 1];
  const categoryId = latest.buildingInstance?.categoryId;
  const category = categories.find((c) => c.id === categoryId);
  const categoryType = category?.type ?? (latest.type === 'miniature' ? 'miniature' : 'standard');
  const progression = formatUnlockProgression(latest, categoryType, category?.name);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <ConfettiOverlay visible />
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.emoji}>🏰</Text>
          <Text style={styles.title}>Unlocked!</Text>
          <Text style={styles.name}>{latest.stageName}</Text>
          <Text style={styles.threshold}>{formatUnlockMessage(latest)}</Text>
          <Text style={styles.progression}>{progression}</Text>
          {unlocks.length > 1 && (
            <Text style={styles.sub}>{formatUnlockSummary(unlocks)}</Text>
          )}
          <Button title="Continue Building" onPress={onDismiss} style={styles.btn} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    elevation: 2000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    zIndex: 2,
  },
  emoji: { fontSize: 48 },
  title: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: theme.spacing.md,
  },
  name: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  threshold: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  progression: {
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 22,
    fontSize: 15,
  },
  sub: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontSize: 13,
  },
  btn: { marginTop: theme.spacing.xl, alignSelf: 'stretch' },
});
