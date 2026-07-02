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
const PARTICLE_COUNT = 40;

function Particle({ index, onDone }: { index: number; onDone?: () => void }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const startX = (index % 10) * (width / 10);
  const color = theme.colors.confetti[index % theme.colors.confetti.length];

  useEffect(() => {
    translateY.value = withDelay(
      index * 30,
      withTiming(height * 0.6, { duration: 2000 }, (finished) => {
        if (finished && index === PARTICLE_COUNT - 1 && onDone) {
          runOnJS(onDone)();
        }
      }),
    );
    translateX.value = withDelay(index * 30, withTiming((index % 2 === 0 ? 1 : -1) * 40, { duration: 2000 }));
    opacity.value = withDelay(index * 30 + 1500, withTiming(0, { duration: 500 }));
  }, [index, onDone, opacity, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        style,
        { left: startX, backgroundColor: color },
      ]}
    />
  );
}

interface ConfettiOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

export function ConfettiOverlay({ visible, onComplete }: ConfettiOverlayProps) {
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
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    top: height * 0.2,
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
