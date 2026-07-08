import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { ConfettiOverlay } from '@/components/celebration/ConfettiOverlay';
import { getConfettiVariantDurationMs } from '@/components/celebration/confettiParticles';
import { useBrickConfettiStore } from '@/store/brickConfettiStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Brief confetti burst when any category places a brick. */
export function BrickConfettiLayer() {
  const burstId = useBrickConfettiStore((s) => s.burstId);
  const variant = useBrickConfettiStore((s) => s.variant);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (burstId === 0) return;
    setVisible(true);
    const duration = getConfettiVariantDurationMs(variant, SCREEN_WIDTH, SCREEN_HEIGHT);
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [burstId, variant]);

  if (!visible) return null;

  return (
    <View style={styles.host} pointerEvents="none">
      <ConfettiOverlay visible variant={variant} />
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
