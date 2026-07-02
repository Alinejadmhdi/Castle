import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import type { Brick } from '@/types';
import { formatBrickValue } from '@/utils';
import { theme } from '@/constants/theme';

interface BrickPopoverProps {
  brick: Brick | null;
  visible: boolean;
  onClose: () => void;
}

export function BrickPopover({ brick, visible, onClose }: BrickPopoverProps) {
  if (!brick) return null;

  const date = new Date(brick.completedAt).toLocaleString();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.card}>
          <View style={[styles.swatch, { backgroundColor: brick.color }]} />
          <Text style={styles.title}>Brick #{brick.globalIndex}</Text>
          <Text style={styles.row}>Value: {formatBrickValue(brick.fractionalValue)} hr</Text>
          <Text style={styles.row}>Placed: {date}</Text>
          {brick.streakRewardLabel && (
            <Text style={styles.streak}>Streak reward: {brick.streakRewardLabel} days</Text>
          )}
          {brick.isMiniature && <Text style={styles.row}>Miniature resist brick</Text>}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  swatch: {
    width: 40,
    height: 24,
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  row: {
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  streak: {
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
});
