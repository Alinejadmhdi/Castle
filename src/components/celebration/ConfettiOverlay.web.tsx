import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '@/constants/theme';

const PARTICLE_COUNT = 24;

function Particle({ index }: { index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const startX = (index % 8) * 40;
  const color = theme.colors.confetti[index % theme.colors.confetti.length];

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 2000,
      delay: index * 40,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 280] });
  const opacity = anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          backgroundColor: color,
          transform: [{ translateY }],
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
    top: 80,
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
