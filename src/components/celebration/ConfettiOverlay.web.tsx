import { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import {
  buildConfettiParticles,
  type ConfettiVariant,
  type ParticleSpec,
} from '@/components/celebration/confettiParticles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function Particle({ spec }: { spec: ParticleSpec }) {
  const progress = useRef(new Animated.Value(0)).current;
  const totalMs = spec.burstMs + spec.fallMs;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: totalMs,
      delay: spec.delayMs,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress, spec.delayMs, totalMs]);

  const burstT = spec.burstMs / totalMs;
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, spec.driftX],
  });
  const translateY = progress.interpolate({
    inputRange: [0, burstT, 1],
    outputRange: [0, spec.liftY, spec.fallY],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${spec.rotationDeg}deg`],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 0.65, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: spec.originX - spec.width / 2,
          top: spec.originY - spec.height / 2,
          width: spec.width,
          height: spec.height,
          backgroundColor: spec.color,
          borderRadius: spec.width <= 4 ? spec.width / 2 : 1,
          opacity,
          transform: [{ translateX }, { translateY }, { rotate }],
        },
      ]}
    />
  );
}

interface ConfettiOverlayProps {
  visible: boolean;
  variant?: ConfettiVariant;
  onComplete?: () => void;
}

/** Web fallback without Reanimated worklets */
export function ConfettiOverlay({ visible, variant = 'celebration' }: ConfettiOverlayProps) {
  const particles = useMemo(
    () => buildConfettiParticles(variant, SCREEN_WIDTH, SCREEN_HEIGHT),
    [variant],
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particles.map((spec, index) => (
        <Particle key={`${variant}-${index}`} spec={spec} />
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
  },
});
