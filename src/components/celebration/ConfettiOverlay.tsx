import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 48;
const CENTER_X = width / 2;
const CENTER_Y = height * 0.45;

function Particle({ index, onDone }: { index: number; onDone?: () => void }) {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 80 + (index % 5) * 40;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance + 60;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const color = theme.colors.confetti[index % theme.colors.confetti.length];

  useEffect(() => {
    translateX.value = withDelay(
      index * 25,
      withTiming(targetX, { duration: 1800 }, (finished) => {
        if (finished && index === PARTICLE_COUNT - 1 && onDone) {
          runOnJS(onDone)();
        }
      }),
    );
    translateY.value = withDelay(index * 25, withTiming(targetY, { duration: 1800 }));
    opacity.value = withDelay(index * 25 + 1200, withTiming(0, { duration: 600 }));
  }, [index, onDone, opacity, targetX, targetY, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.particle, style, { left: CENTER_X - 4, top: CENTER_Y - 4, backgroundColor: color }]}
    />
  );
}

interface ConfettiOverlayProps {
  visible?: boolean;
  onComplete?: () => void;
}

export function ConfettiOverlay({ visible = true, onComplete }: ConfettiOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} index={i} onDone={i === PARTICLE_COUNT - 1 ? onComplete : undefined} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
