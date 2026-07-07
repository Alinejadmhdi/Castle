import { Platform, StyleSheet, View } from 'react-native';
import { UnlockCelebration } from '@/components/celebration/UnlockCelebration';
import { useCelebrationStore } from '@/store/celebrationStore';

/** iOS/web overlay — Android uses /unlock-celebration route instead. */
export function CelebrationLayer() {
  if (Platform.OS === 'android') return null;

  const active = useCelebrationStore((s) => s.active);
  const unlocks = useCelebrationStore((s) => s.unlocks);
  const dismiss = useCelebrationStore((s) => s.dismiss);

  if (!active || unlocks.length === 0) return null;

  return (
    <View style={styles.host} pointerEvents="box-none">
      <UnlockCelebration visible unlocks={unlocks} onDismiss={dismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
