import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import type { UnlockEvent } from '@/types';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { formatUnlockMessage, formatUnlockSummary } from '@/utils/unlockMessages';

interface UnlockCelebrationProps {
  unlocks: UnlockEvent[];
  visible: boolean;
  onDismiss: () => void;
}

export function UnlockCelebration({ unlocks, visible, onDismiss }: UnlockCelebrationProps) {
  if (!visible || unlocks.length === 0) return null;
  const latest = unlocks[unlocks.length - 1];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🏰</Text>
          <Text style={styles.title}>Unlocked!</Text>
          <Text style={styles.name}>{latest.stageName}</Text>
          <Text style={styles.threshold}>{formatUnlockMessage(latest)}</Text>
          <Text style={styles.sub}>
            {unlocks.length > 1
              ? formatUnlockSummary(unlocks)
              : 'This structure stays on your settlement forever'}
          </Text>
          <Button title="Continue Building" onPress={onDismiss} style={styles.btn} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
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
  sub: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  btn: { marginTop: theme.spacing.xl, alignSelf: 'stretch' },
});
