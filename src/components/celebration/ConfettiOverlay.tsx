import { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  buildConfettiParticles,
  type ConfettiVariant,
  type ParticleSpec,
} from '@/components/celebration/confettiParticles';
import {
  particleVisualStyle,
} from '@/components/celebration/confettiParticleStyle';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function Particle({
  spec,
  onDone,
}: {
  spec: ParticleSpec;
  onDone?: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const totalMs = spec.burstMs + spec.fallMs;
    opacity.value = withDelay(
      spec.delayMs,
      withSequence(
        withTiming(1, { duration: 80 }),
        withDelay(totalMs * 0.55, withTiming(0, { duration: totalMs * 0.4 })),
      ),
    );
    translateX.value = withDelay(
      spec.delayMs,
      withTiming(spec.driftX, {
        duration: totalMs,
        easing: Easing.out(Easing.cubic),
      }),
    );
    translateY.value = withDelay(
      spec.delayMs,
      withSequence(
        withTiming(spec.liftY, {
          duration: spec.burstMs,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(spec.fallY, {
          duration: spec.fallMs,
          easing: Easing.in(Easing.quad),
        }),
      ),
    );
    rotate.value = withDelay(
      spec.delayMs,
      withTiming(spec.rotationDeg, {
        duration: totalMs,
        easing: Easing.linear,
      }, (finished) => {
        if (finished && onDone) {
          runOnJS(onDone)();
        }
      }),
    );
  }, [onDone, opacity, rotate, spec, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value + spec.shapeRotation}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        style,
        particleVisualStyle(spec),
        {
          left: spec.originX - spec.width / 2,
          top: spec.originY - spec.height / 2,
          width: spec.width,
          height: spec.height,
        },
      ]}
    />
  );
}

interface ConfettiOverlayProps {
  visible?: boolean;
  variant?: ConfettiVariant;
  onComplete?: () => void;
}

export function ConfettiOverlay({
  visible = true,
  variant = 'celebration',
  onComplete,
}: ConfettiOverlayProps) {
  const particles = useMemo(
    () => buildConfettiParticles(variant, SCREEN_WIDTH, SCREEN_HEIGHT),
    [variant],
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particles.map((spec, index) => (
        <Particle
          key={`${variant}-${index}`}
          spec={spec}
          onDone={index === particles.length - 1 ? onComplete : undefined}
        />
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
  },
});
