import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Category, BuildingInstance, Brick } from '@/types';
import { useTimerStore } from '@/store/timerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getCheckpointProgress } from '@/features/progression/checkpointProgress';
import { useMotivationQuote } from '@/hooks/useMotivationQuote';
import { useResist } from '@/hooks/useResist';
import { startAmbient, stopAmbient, playCompleteSound } from '@/services/audio/audioService';
import { useFocusSessionAppState } from '@/hooks/useFocusSessionAppState';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { showFocusPrimerIfNeeded } from '@/utils/focusPrimer';

const DURATIONS = [
  { label: '25m', ms: 25 * 60 * 1000 },
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '2h', ms: 2 * 60 * 60 * 1000 },
];

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export type MapPanelMode = 'focus-setup' | 'resist';

export interface SceneBrickUpdate {
  brick?: Brick;
  bricks?: Brick[];
  buildings?: BuildingInstance[];
}

interface MapActionPanelProps {
  category: Category;
  mode: MapPanelMode;
  onClose: () => void;
  /** Called after abandon / give up — always closes the panel. */
  onEndSession: () => void;
  onSceneRefresh: (categoryId: string, update?: SceneBrickUpdate) => void;
  /** Life Map tab is visible — avoids audio/GL work while on Settings. */
  isTabFocused?: boolean;
}

export function MapActionPanel({
  category,
  mode,
  onClose,
  onEndSession,
  onSceneRefresh,
  isTabFocused = true,
}: MapActionPanelProps) {
  const { session, remainingMs, start, pause, resume, abandon, lastResult, clearResult } =
    useTimerStore();
  const { settings } = useSettingsStore();
  const [durationMs, setDurationMs] = useState(DURATIONS[0].ms);
  const { tapResist, pending, error: resistError } = useResist({
    categoryId: category.id,
    categoryType: category.type,
    onSceneUpdate: (categoryId, bricks, buildings) =>
      onSceneRefresh(categoryId, { bricks, buildings }),
  });

  const totalBricks = Math.floor(category.totalBrickValue);
  const checkpoint = getCheckpointProgress(totalBricks, category.type);
  const quote = useMotivationQuote(category.name, totalBricks, category.type, totalBricks);

  const isActiveForCategory = session?.categoryId === category.id;
  const showActive = isActiveForCategory && session != null;
  const showComplete = lastResult != null && !session;

  useFocusSessionAppState(onEndSession);

  useEffect(() => {
    if (!isTabFocused || !showActive || !session) {
      void stopAmbient();
      return;
    }
    if (settings.ambientSound !== 'none') {
      void startAmbient(settings.ambientSound);
    } else {
      void stopAmbient();
    }
    return () => {
      void stopAmbient();
    };
  }, [isTabFocused, showActive, session, settings.ambientSound]);

  useEffect(() => {
    if (showComplete && settings.sfxEnabled) {
      void playCompleteSound();
    }
  }, [showComplete, settings.sfxEnabled]);

  useEffect(() => {
    if (!showComplete || !lastResult) return;
    const brick = lastResult.bricks[0];
    if (!brick) return;
    const newBuildings = lastResult.unlocks
      .map((u) => u.buildingInstance)
      .filter((b): b is BuildingInstance => b != null);
    onSceneRefresh(category.id, { brick, buildings: newBuildings });
  }, [showComplete, category.id, lastResult, onSceneRefresh]);

  async function handleStartFocus() {
    showFocusPrimerIfNeeded(() => {
      void start({
        categoryId: category.id,
        brickColor: category.defaultColor,
        plannedDurationMs: durationMs,
      }).catch((error) => {
        console.error('Start focus failed:', error);
      });
    });
  }

  function handleDismissComplete() {
    clearResult();
    onEndSession();
  }

  if (showComplete) {
    return (
      <View style={styles.panel}>
        <Text style={styles.completeTitle}>Brick placed on your wall</Text>
        <Button title="Continue on Life Map" onPress={handleDismissComplete} />
      </View>
    );
  }

  if (showActive && session) {
    const isPaused = session.status === 'paused';
    return (
      <View style={styles.panel}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.timer}>{formatTime(remainingMs)}</Text>
        <Text style={styles.hint}>
          {isPaused ? 'Paused' : 'Focus — your brick is baking'}
        </Text>
        <View style={styles.row}>
          {isPaused ? (
            <Button title="Resume" onPress={resume} style={styles.rowBtn} />
          ) : (
            <Button title="Pause" onPress={pause} variant="secondary" style={styles.rowBtn} />
          )}
          <Button
            title="Give Up"
            variant="danger"
            style={styles.rowBtn}
            onPress={() => {
              void abandon().then(onEndSession);
            }}
          />
        </View>
      </View>
    );
  }

  if (mode === 'resist') {
    return (
      <View style={styles.panel}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.checkpoint}>
          {checkpoint.current} bricks · {checkpoint.label} toward {checkpoint.nextStageName}
        </Text>
        {quote && <Text style={styles.quote}>{quote}</Text>}
        {pending > 0 && <Text style={styles.saving}>Saving…</Text>}
        {resistError && <Text style={styles.resistError} selectable>{resistError}</Text>}
        <Button title="I Resisted — Place Brick" onPress={tapResist} />
        <Button title="Close" onPress={onClose} variant="secondary" style={styles.closeBtn} />
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.label}>Duration</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((d) => (
          <Pressable
            key={d.ms}
            onPress={() => setDurationMs(d.ms)}
            style={[styles.durationChip, durationMs === d.ms && styles.durationChipOn]}
          >
            <Text style={styles.durationText}>{d.label}</Text>
          </Pressable>
        ))}
      </View>
      <Button title="Start Focus" onPress={handleStartFocus} />
      <Button title="Cancel" onPress={onClose} variant="secondary" style={styles.closeBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceElevated,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  categoryName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  label: { color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  durationRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  durationChip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
  },
  durationChipOn: { borderColor: theme.colors.primary },
  durationText: { color: theme.colors.text },
  timer: {
    color: theme.colors.primary,
    fontSize: 48,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  hint: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  rowBtn: { flex: 1 },
  closeBtn: { marginTop: theme.spacing.sm },
  completeTitle: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  checkpoint: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  quote: {
    color: theme.colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
    lineHeight: 20,
    fontSize: 14,
  },
  saving: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.sm },
  resistError: {
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontSize: 12,
    lineHeight: 16,
  },
});
