import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import type { Category, BuildingInstance, Brick, SessionTimerMode } from '@/types';
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
import { BRICK_PRESET_COLORS } from '@/constants/brickColors';
import { formatBrickValue, msToBrickValue } from '@/utils';

const PRESET_DURATIONS = [
  { label: '25m', ms: 25 * 60 * 1000 },
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '2h', ms: 2 * 60 * 60 * 1000 },
  { label: '4h', ms: 4 * 60 * 60 * 1000 },
];

function parseCustomDurationMs(hours: string, minutes: string): number {
  const h = Math.max(0, parseInt(hours, 10) || 0);
  const m = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
  return (h * 60 + m) * 60 * 1000;
}

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
  const {
    session,
    remainingMs,
    start,
    pause,
    resume,
    abandon,
    complete,
    lastResult,
    clearResult,
  } = useTimerStore();
  const { settings } = useSettingsStore();
  const [durationMs, setDurationMs] = useState(PRESET_DURATIONS[1].ms);
  const [timerMode, setTimerMode] = useState<SessionTimerMode>('countdown');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [customHours, setCustomHours] = useState('1');
  const [customMinutes, setCustomMinutes] = useState('0');
  const [brickColor, setBrickColor] = useState(category.defaultColor);
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

  function resolvedDurationMs(): number {
    if (timerMode === 'stopwatch') return 0;
    if (useCustomDuration) return parseCustomDurationMs(customHours, customMinutes);
    return durationMs;
  }

  async function handleStartFocus() {
    const plannedDurationMs = resolvedDurationMs();
    if (timerMode === 'countdown' && plannedDurationMs < 60_000) return;

    showFocusPrimerIfNeeded(() => {
      void start({
        categoryId: category.id,
        brickColor,
        plannedDurationMs,
        timerMode,
      }).catch((error) => {
        console.error('Start focus failed:', error);
      });
    });
  }

  async function handleDismissComplete() {
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
    const isStopwatch = session.timerMode === 'stopwatch';
    const brickPreview = msToBrickValue(remainingMs, settings.fractionalBricksEnabled);

    return (
      <View style={styles.panel}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.timer}>{formatTime(remainingMs)}</Text>
        <Text style={styles.brickPreview}>
          Baking {formatBrickValue(brickPreview)} brick{brickPreview === 1 ? '' : 's'} (1 hr = 1 brick)
        </Text>
        <Text style={styles.hint}>
          {isPaused
            ? 'Paused'
            : isStopwatch
              ? 'Focus — tap Finish when done'
              : 'Focus — your brick is baking'}
        </Text>
        <View style={styles.row}>
          {isPaused ? (
            <Button title="Resume" onPress={resume} style={styles.rowBtn} />
          ) : (
            <Button title="Pause" onPress={pause} variant="secondary" style={styles.rowBtn} />
          )}
          {isStopwatch ? (
            <Button
              title="Finish"
              style={styles.rowBtn}
              onPress={() => {
                void complete();
              }}
            />
          ) : null}
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

      <Text style={styles.label}>Brick color</Text>
      <View style={styles.colorRow}>
        {BRICK_PRESET_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setBrickColor(c)}
            style={[styles.colorSwatch, { backgroundColor: c }, brickColor === c && styles.colorSwatchOn]}
          />
        ))}
      </View>

      <Text style={styles.label}>Timer type</Text>
      <View style={styles.durationRow}>
        <Pressable
          onPress={() => setTimerMode('countdown')}
          style={[styles.durationChip, timerMode === 'countdown' && styles.durationChipOn]}
        >
          <Text style={styles.durationText}>Countdown</Text>
        </Pressable>
        <Pressable
          onPress={() => setTimerMode('stopwatch')}
          style={[styles.durationChip, timerMode === 'stopwatch' && styles.durationChipOn]}
        >
          <Text style={styles.durationText}>Stopwatch</Text>
        </Pressable>
      </View>

      {timerMode === 'countdown' && (
        <>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durationRow}>
            {PRESET_DURATIONS.map((d) => (
              <Pressable
                key={d.ms}
                onPress={() => {
                  setUseCustomDuration(false);
                  setDurationMs(d.ms);
                }}
                style={[
                  styles.durationChip,
                  !useCustomDuration && durationMs === d.ms && styles.durationChipOn,
                ]}
              >
                <Text style={styles.durationText}>{d.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setUseCustomDuration(true)}
              style={[styles.durationChip, useCustomDuration && styles.durationChipOn]}
            >
              <Text style={styles.durationText}>Custom</Text>
            </Pressable>
          </View>

          {useCustomDuration && (
            <View style={styles.customRow}>
              <View style={styles.customField}>
                <Text style={styles.customLabel}>Hours</Text>
                <TextInput
                  style={styles.customInput}
                  keyboardType="number-pad"
                  value={customHours}
                  onChangeText={setCustomHours}
                  maxLength={3}
                />
              </View>
              <View style={styles.customField}>
                <Text style={styles.customLabel}>Minutes</Text>
                <TextInput
                  style={styles.customInput}
                  keyboardType="number-pad"
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                  maxLength={2}
                />
              </View>
            </View>
          )}
        </>
      )}

      {timerMode === 'stopwatch' && (
        <Text style={styles.hintInline}>
          Counts up until you finish. 1 hour focused = 1 brick (fractional when enabled in Settings).
        </Text>
      )}

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
  label: { color: theme.colors.textMuted, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  colorSwatch: { width: 28, height: 28, borderRadius: 14 },
  colorSwatchOn: { borderWidth: 2, borderColor: theme.colors.primary },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
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
  customRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  customField: { flex: 1 },
  customLabel: { color: theme.colors.textMuted, marginBottom: 4, fontSize: 13 },
  customInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
    color: theme.colors.text,
    padding: theme.spacing.md,
    fontSize: 18,
  },
  hintInline: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
    fontSize: 14,
  },
  timer: {
    color: theme.colors.primary,
    fontSize: 48,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  brickPreview: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  hint: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  rowBtn: { flex: 1, minWidth: '30%' },
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
