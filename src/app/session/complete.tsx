import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTimerStore } from '@/store/timerStore';
import { playCompleteSound } from '@/services/audio/audioService';
import { useSettingsStore } from '@/store/settingsStore';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { formatBrickValue } from '@/utils';
import { resolveBrickDisplayColor } from '@/utils/brickColor';
import { formatUnlockMessage } from '@/utils/unlockMessages';
import { BRICK_DISPLAY_COLOR } from '@/rendering/three/constants';

export default function SessionCompleteScreen() {
  const router = useRouter();
  const { lastResult, clearResult } = useTimerStore();
  const { settings } = useSettingsStore();
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  useEffect(() => {
    if (!lastResult) {
      router.replace('/');
    }
  }, [lastResult, router]);

  useEffect(() => {
    if (settings.sfxEnabled) void playCompleteSound();
    scale.value = withSequence(
      withTiming(1.2, { duration: 400 }),
      withTiming(1, { duration: 200 }),
    );
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withDelay(600, withTiming(-80, { duration: 800 }));
  }, [opacity, scale, settings.sfxEnabled, translateY]);

  const brickStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const brick = lastResult?.bricks[0];

  function handleDone() {
    clearResult();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brick Baked!</Text>
      <Animated.View
        style={[
          styles.brick,
          brickStyle,
          { backgroundColor: brick ? resolveBrickDisplayColor(brick.color) : BRICK_DISPLAY_COLOR },
        ]}
      >
        <Text style={styles.brickLabel}>🧱</Text>
      </Animated.View>
      {brick && (
        <Text style={styles.value}>
          +{formatBrickValue(brick.fractionalValue)} brick-hour placed on your wall
        </Text>
      )}
      {lastResult && lastResult.unlocks.length > 0 && (
        <Text style={styles.unlock}>
          New structure unlocked: {formatUnlockMessage(lastResult.unlocks[lastResult.unlocks.length - 1])}
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
    backgroundColor: BRICK_DISPLAY_COLOR,
    marginTop: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brickLabel: { fontSize: 24 },
  value: { color: theme.colors.text, marginTop: theme.spacing.lg, textAlign: 'center' },
  unlock: { color: theme.colors.primary, marginTop: theme.spacing.md, fontWeight: '600' },
  btn: { marginTop: theme.spacing.xl, alignSelf: 'stretch' },
});
