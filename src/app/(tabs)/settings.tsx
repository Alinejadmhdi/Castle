import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { useSettingsStore } from '@/store/settingsStore';
import { useCategoryStore } from '@/store/categoryStore';
import { resetDatabase } from '@/services/database/db';
import { useTimerStore } from '@/store/timerStore';
import { useMapSceneStore } from '@/store/mapSceneStore';
import { grantBricksToCategory } from '@/features/bricks/debugBrickService';
import { finishTodayForAllCategories } from '@/features/daily/dailySealService';
import { alertMessage, confirmAction } from '@/utils/confirm';
import type { FocusMode, AmbientSound } from '@/types';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

const COMING_SOON: { key: keyof typeof FEATURE_FLAGS; label: string }[] = [
  { key: 'CLOUD_SYNC', label: 'Cloud Sync' },
  { key: 'SOCIAL_FEED', label: 'Social Feed' },
  { key: 'LEADERBOARDS', label: 'Leaderboards' },
  { key: 'MULTIPLE_TIMERS', label: 'Multiple Timers' },
  { key: 'REAL_MONEY_PLANTING', label: 'Charitable Planting' },
  { key: 'VIEW_MODE_3D', label: '3D View Mode' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, update } = useSettingsStore();
  const { categories, load } = useCategoryStore();
  const refreshCategory = useMapSceneStore((s) => s.refreshCategory);
  const [devBrickAmounts, setDevBrickAmounts] = useState<Record<string, string>>({});
  const [devBusy, setDevBusy] = useState(false);
  const [finishingDay, setFinishingDay] = useState(false);

  function confirmFinishDay() {
    confirmAction(
      'Finish day',
      "Seal today's daily structures for all standard categories?",
      'Finish day',
      async () => {
        setFinishingDay(true);
        try {
          const unlocks = await finishTodayForAllCategories();
          await load();
          if (unlocks.length === 0) {
            alertMessage('Day sealed', 'No daily structure reached today (need 2+ hours).');
          } else {
            alertMessage(
              'Day sealed',
              unlocks.map((u) => u.stageName).join(', '),
            );
          }
        } catch (e) {
          alertMessage('Error', e instanceof Error ? e.message : 'Could not seal day');
        } finally {
          setFinishingDay(false);
        }
      },
    );
  }

  function confirmResetAll() {
    confirmAction(
      'Reset all data',
      'Delete every category, brick, session, and building? This cannot be undone.',
      'Reset everything',
      async () => {
        await resetDatabase();
        useMapSceneStore.getState().clearAll();
        useTimerStore.getState().clearResult();
        await useSettingsStore.getState().load();
        await load();
        alertMessage('Done', 'All data has been reset.');
      },
      true,
    );
  }


  async function grantDevBricks(categoryId: string, categoryName: string) {
    const parsed = parseInt(devBrickAmounts[categoryId] ?? '', 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      alertMessage('Invalid amount', 'Enter a whole number of bricks (1 or more).');
      return;
    }
    if (parsed > 500) {
      alertMessage('Too many', 'Max 500 bricks per grant in dev tools.');
      return;
    }
    setDevBusy(true);
    try {
      await grantBricksToCategory(categoryId, parsed);
      await refreshCategory(categoryId);
      await load();
      alertMessage('Done', `Added ${parsed} brick(s) to "${categoryName}". Open Life Map to see updates.`);
      setDevBrickAmounts((prev) => ({ ...prev, [categoryId]: '' }));
    } catch (e) {
      alertMessage('Error', e instanceof Error ? e.message : 'Could not add bricks');
    } finally {
      setDevBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>Settings</Text>

      <Text style={styles.section}>Focus mode</Text>
      {(['soft', 'strict'] as FocusMode[]).map((mode) => (
        <Pressable
          key={mode}
          onPress={() => update({ focusMode: mode })}
          style={[styles.row, settings.focusMode === mode && styles.rowActive]}
        >
          <Text style={styles.rowText}>
            {mode === 'soft'
              ? 'Soft — timer runs when screen locks'
              : 'Strict — leaving app cancels session'}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Fractional bricks</Text>
      <Pressable
        onPress={() => update({ fractionalBricksEnabled: !settings.fractionalBricksEnabled })}
        style={styles.row}
      >
        <Text style={styles.rowText}>
          {settings.fractionalBricksEnabled ? 'On (25 min = 0.42 brick)' : 'Off (full hours only)'}
        </Text>
      </Pressable>

      <Text style={styles.section}>Ambient sound</Text>
      {(['rain', 'fire', 'wind', 'none'] as AmbientSound[]).map((sound) => (
        <Pressable
          key={sound}
          onPress={() => update({ ambientSound: sound })}
          style={[styles.row, settings.ambientSound === sound && styles.rowActive]}
        >
          <Text style={styles.rowText}>{sound}</Text>
        </Pressable>
      ))}

      <Pressable onPress={() => update({ sfxEnabled: !settings.sfxEnabled })} style={styles.row}>
        <Text style={styles.rowText}>Sound effects: {settings.sfxEnabled ? 'On' : 'Off'}</Text>
      </Pressable>

      <Pressable onPress={() => update({ hapticsEnabled: !settings.hapticsEnabled })} style={styles.row}>
        <Text style={styles.rowText}>Haptics: {settings.hapticsEnabled ? 'On' : 'Off'}</Text>
      </Pressable>

      <Text style={styles.section}>Daily build</Text>
      <Text style={styles.devHint}>
        Seal today&apos;s daily structure (2+ hours logged). Past open days auto-seal at midnight when
        you open the app.
      </Text>
      <Button
        title={finishingDay ? 'Sealing…' : 'Finish Day'}
        onPress={confirmFinishDay}
        disabled={finishingDay}
        variant="secondary"
      />

      <Text style={styles.section}>Data</Text>
      <Button title="Reset All Data" onPress={confirmResetAll} variant="danger" />
      <Button
        title="View 27 Stage Building Gallery"
        onPress={() => router.push('/building-gallery')}
        variant="secondary"
        style={styles.galleryBtn}
      />

      {__DEV__ && (
        <>
          <Text style={styles.section}>Developer tools (Expo Go)</Text>
          <Text style={styles.devHint}>
            Add whole bricks to any category to test stage unlocks and monument placement. Standard
            categories keep monuments from Garden Enclosure (stage 6) onward.
          </Text>
          {categories.map((cat) => (
            <View key={`dev-${cat.id}`} style={styles.devRow}>
              <View style={styles.devMeta}>
                <Text style={styles.rowText}>{cat.name}</Text>
                <Text style={styles.catMeta}>
                  {cat.type} · {cat.totalBrickValue.toFixed(0)} bricks now
                </Text>
              </View>
              <TextInput
                style={styles.devInput}
                keyboardType="number-pad"
                placeholder="Qty"
                placeholderTextColor={theme.colors.textMuted}
                value={devBrickAmounts[cat.id] ?? ''}
                onChangeText={(text) =>
                  setDevBrickAmounts((prev) => ({ ...prev, [cat.id]: text.replace(/[^0-9]/g, '') }))
                }
              />
              <Pressable
                style={[styles.devAddBtn, devBusy && styles.devAddBtnDisabled]}
                disabled={devBusy}
                onPress={() => void grantDevBricks(cat.id, cat.name)}
              >
                <Text style={styles.devAddText}>Add</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      <Text style={styles.comingTitle}>Coming soon (3D-ready architecture)</Text>
      {COMING_SOON.map(({ key, label }) => (
        <Text key={key} style={styles.comingItem}>
          {label}
        </Text>
      ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: 48 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '700' },
  section: { color: theme.colors.primary, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm, fontWeight: '600' },
  row: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceElevated,
  },
  rowActive: { borderColor: theme.colors.primary },
  rowText: { color: theme.colors.text },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  catMeta: { color: theme.colors.textMuted, fontSize: 12 },
  delete: { color: theme.colors.danger },
  comingTitle: { color: theme.colors.textMuted, marginTop: theme.spacing.xl, fontStyle: 'italic' },
  comingItem: { color: theme.colors.textMuted, marginTop: 4, fontSize: 13 },
  galleryBtn: { marginTop: theme.spacing.sm },
  devHint: { color: theme.colors.textMuted, fontSize: 13, marginBottom: theme.spacing.sm },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  devMeta: { flex: 1 },
  devInput: {
    width: 56,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    color: theme.colors.text,
    textAlign: 'center',
  },
  devAddBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
  },
  devAddBtnDisabled: { opacity: 0.5 },
  devAddText: { color: '#1a1410', fontWeight: '700' },
});
