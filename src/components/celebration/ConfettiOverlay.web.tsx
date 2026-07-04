import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 36;
const CENTER_X = width / 2;
const CENTER_Y = height * 0.45;

function Particle({ index }: { index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 80 + (index % 5) * 40;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance + 60;
  const color = theme.colors.confetti[index % theme.colors.confetti.length];

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1800,
      delay: index * 25,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, targetX] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, targetY] });
  const opacity = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: CENTER_X - 4,
          top: CENTER_Y - 4,
          backgroundColor: color,
          transform: [{ translateX }, { translateY }],
          opacity,
        },
      ]}
    />
  );
}

interface ConfettiOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

/** Web fallback without Reanimated worklets */
export function ConfettiOverlay({ visible }: ConfettiOverlayProps) {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} index={i} />
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
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
