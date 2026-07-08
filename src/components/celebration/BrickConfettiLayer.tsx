import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ConfettiOverlay } from '@/components/celebration/ConfettiOverlay';
import { useBrickConfettiStore } from '@/store/brickConfettiStore';

/** Brief confetti burst when any category places a brick. */
export function BrickConfettiLayer() {
  const burstId = useBrickConfettiStore((s) => s.burstId);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (burstId === 0) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(timer);
  }, [burstId]);

  if (!visible) return null;

  return (
    <View style={styles.host} pointerEvents="none">
      <ConfettiOverlay visible />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    elevation: 9998,
  },
});
