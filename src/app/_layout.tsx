import '@/rendering/three/nativeThreeSetup';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDatabase } from '@/services/database/db';
import { useSettingsStore } from '@/store/settingsStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useTimerStore } from '@/store/timerStore';
import { stopAmbient } from '@/services/audio/audioService';
import { useDailySeal } from '@/hooks/useDailySeal';
import { UnlockCelebration } from '@/components/celebration/UnlockCelebration';
import { useCelebrationStore } from '@/store/celebrationStore';
import { theme } from '@/constants/theme';

function CelebrationLayer() {
  const { active, unlocks, dismiss } = useCelebrationStore();
  return <UnlockCelebration visible={active} unlocks={unlocks} onDismiss={dismiss} />;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useDailySeal(ready);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void useTimerStore.getState().syncFromClock();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await useSettingsStore.getState().load();
        await useCategoryStore.getState().load();
        await useTimerStore.getState().loadActive();
        await stopAmbient();
      } catch (error) {
        console.error('App init failed:', error);
      } finally {
        setReady(true);
      }
    }
    void init();
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <View style={styles.flex}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="category/new" options={{ title: 'New Category' }} />
          <Stack.Screen name="category/[id]" options={{ title: 'Settlement' }} />
          <Stack.Screen name="session/new" options={{ title: 'New Session' }} />
          <Stack.Screen name="session/active" options={{ title: 'Focus', headerBackVisible: false }} />
          <Stack.Screen name="session/complete" options={{ title: 'Complete', headerShown: false }} />
          <Stack.Screen name="miniature/[categoryId]" options={{ title: 'Log Resist' }} />
          <Stack.Screen name="building-gallery" options={{ title: 'Building Gallery' }} />
          <Stack.Screen name="building/[id]" options={{ title: 'Building' }} />
        </Stack>
        {!ready && (
          <View style={styles.loadingOverlay} pointerEvents="auto">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
      {Platform.OS !== 'android' && <CelebrationLayer />}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
