import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTimerStore } from '@/store/timerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useFocusSessionAppState } from '@/hooks/useFocusSessionAppState';
import { startAmbient, stopAmbient } from '@/services/audio/audioService';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

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
  const { session, remainingMs, pause, resume, abandon, lastResult } = useTimerStore();
  const { settings } = useSettingsStore();

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
    if (!session) return;
    if (settings.ambientSound !== 'none') {
      void startAmbient(settings.ambientSound);
    }
    return () => {
      void stopAmbient();
    };
  }, [session, settings.ambientSound]);

  if (!session) return null;

  const isPaused = session.status === 'paused';

  return (
    <View style={styles.container}>
      <Text style={styles.mode}>{settings.focusMode === 'strict' ? 'Strict' : 'Soft'} mode</Text>
      <Text style={styles.timer}>{formatTime(remainingMs)}</Text>
      <Text style={styles.hint}>
        {isPaused
          ? 'Paused — tap Resume to continue'
          : 'Stay focused. Your brick is baking...'}
      </Text>

      <View style={styles.kiln}>
        <Text style={styles.kilnEmoji}>🧱</Text>
        <Text style={styles.kilnText}>Kiln active</Text>
      </View>

      <View style={styles.actions}>
        {isPaused ? (
          <Button title="Resume" onPress={resume} />
        ) : (
          <Button title="Pause" onPress={pause} variant="secondary" />
        )}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mode: { color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  timer: {
    color: theme.colors.primary,
    fontSize: 64,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  hint: { color: theme.colors.textMuted, marginTop: theme.spacing.md, textAlign: 'center' },
  kiln: { marginTop: theme.spacing.xl, alignItems: 'center' },
  kilnEmoji: { fontSize: 48 },
  kilnText: { color: theme.colors.text, marginTop: theme.spacing.sm },
  actions: { marginTop: theme.spacing.xl, alignSelf: 'stretch', gap: theme.spacing.sm },
  giveUp: { marginTop: theme.spacing.sm },
});
