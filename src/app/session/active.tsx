import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTimerStore } from '@/store/timerStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useMapSceneStore } from '@/store/mapSceneStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useFocusSessionAppState } from '@/hooks/useFocusSessionAppState';
import { startAmbient, stopAmbient } from '@/services/audio/audioService';
import { SettlementPlot } from '@/components/map/SettlementPlot';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { formatBrickValue, msToBrickValue } from '@/utils';
import { focusModeLabel } from '@/utils/formatSession';

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ActiveSessionScreen() {
  const router = useRouter();
  const { session, remainingMs, pause, resume, abandon, complete, lastResult } = useTimerStore();
  const { settings } = useSettingsStore();
  const categories = useCategoryStore((s) => s.categories);
  const scenes = useMapSceneStore((s) => s.scenes);
  const loadCategory = useMapSceneStore((s) => s.loadCategory);

  const category = session ? categories.find((c) => c.id === session.categoryId) : null;
  const scene = session ? scenes[session.categoryId] : undefined;

  useFocusSessionAppState(() => router.replace('/'));

  useEffect(() => {
    if (lastResult) {
      router.replace('/session/complete');
    }
  }, [lastResult, router]);

  useEffect(() => {
    if (!session && !lastResult) {
      router.replace('/');
    }
  }, [session, lastResult, router]);

  useEffect(() => {
    if (!session?.categoryId) return;
    void loadCategory(session.categoryId);
  }, [session?.categoryId, loadCategory]);

  useEffect(() => {
    if (!session) return;
    if (settings.ambientSound !== 'none') {
      void startAmbient(settings.ambientSound);
    }
    return () => {
      void stopAmbient();
    };
  }, [session, settings.ambientSound]);

  if (!session) return null;

  const isStopwatch = session.timerMode === 'stopwatch';
  const isPaused = session.status === 'paused';
  const displayMs = isStopwatch ? remainingMs : remainingMs;
  const elapsedMs = isStopwatch
    ? remainingMs
    : Math.max(0, session.plannedDurationMs - remainingMs);
  const brickPreview = msToBrickValue(elapsedMs, settings.fractionalBricksEnabled);

  return (
    <View style={styles.container}>
      <View style={styles.plotWrap}>
        <SettlementPlot
          bricks={scene?.bricks ?? []}
          buildings={scene?.buildings ?? []}
          scale={1}
          totalBrickValue={category?.totalBrickValue ?? 0}
          categoryType={category?.type ?? 'standard'}
          wallColor={session.brickColor}
        />
      </View>

      <View style={styles.hud}>
        <Text style={styles.mode}>
          {focusModeLabel(settings.focusMode)} · {isStopwatch ? 'Stopwatch' : 'Countdown'}
        </Text>
        <Text style={styles.timer}>{formatTime(displayMs)}</Text>
        <Text style={styles.brickPreview}>
          Baking {formatBrickValue(brickPreview)} brick{brickPreview === 1 ? '' : 's'} (1 hr = 1 brick)
        </Text>
        <Text style={styles.hint}>
          {isPaused
            ? 'Paused — tap Resume to continue'
            : isStopwatch
              ? 'Stay focused — tap Finish when done'
              : 'Stay focused. Your brick is baking...'}
        </Text>

        <View style={styles.actions}>
          {isPaused ? (
            <Button title="Resume" onPress={resume} />
          ) : (
            <Button title="Pause" onPress={pause} variant="secondary" />
          )}
          {isStopwatch ? (
            <Button
              title="Finish & Place Brick"
              onPress={async () => {
                await complete();
              }}
            />
          ) : null}
          <Button
            title="Give Up"
            onPress={async () => {
              await abandon();
              router.replace('/');
            }}
            variant="danger"
            style={styles.giveUp}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  plotWrap: {
    flex: 1,
    minHeight: 280,
  },
  hud: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  mode: { color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
  timer: {
    color: theme.colors.primary,
    fontSize: 48,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  brickPreview: {
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    fontSize: 14,
  },
  hint: { color: theme.colors.textMuted, marginTop: theme.spacing.sm, textAlign: 'center' },
  actions: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  giveUp: { marginTop: theme.spacing.xs },
});
