import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTimerStore } from '@/store/timerStore';
import { playCompleteSound } from '@/services/audio/audioService';
import { useSettingsStore } from '@/store/settingsStore';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { formatBrickValue } from '@/utils';
import { resolveBrickDisplayColor } from '@/utils/brickColor';
import { BRICK_DISPLAY_COLOR } from '@/rendering/three/constants';

/** Web fallback without Reanimated */
export default function SessionCompleteScreen() {
  const router = useRouter();
  const { lastResult, clearResult } = useTimerStore();
  const { settings } = useSettingsStore();
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!lastResult) router.replace('/');
  }, [lastResult, router]);

  useEffect(() => {
    if (settings.sfxEnabled) void playCompleteSound();
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.2, duration: 400, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [scale, settings.sfxEnabled]);

  const brick = lastResult?.bricks[0];

  function handleDone() {
    clearResult();
    router.replace('/');
  }

  if (!lastResult) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brick Baked!</Text>
      <Animated.View
        style={[
          styles.brick,
          { transform: [{ scale }], backgroundColor: brick ? resolveBrickDisplayColor(brick.color) : BRICK_DISPLAY_COLOR },
        ]}
      >
        <Text style={styles.brickLabel}>🧱</Text>
      </Animated.View>
      {brick && (
        <Text style={styles.value}>
          +{formatBrickValue(brick.fractionalValue)} brick-hour placed on your wall
        </Text>
      )}
      <Button title="View Settlement" onPress={handleDone} style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: { color: theme.colors.primary, fontSize: 32, fontWeight: '800' },
  brick: {
    width: 80,
    height: 40,
    borderRadius: 6,
    marginTop: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brickLabel: { fontSize: 24 },
  value: { color: theme.colors.text, marginTop: theme.spacing.lg, textAlign: 'center' },
  btn: { marginTop: theme.spacing.xl, alignSelf: 'stretch' },
});
