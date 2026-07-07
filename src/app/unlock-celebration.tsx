import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { UnlockCelebration } from '@/components/celebration/UnlockCelebration';
import { useCelebrationStore } from '@/store/celebrationStore';
import { theme } from '@/constants/theme';

/** Android: full-screen unlock route (overlay crashes navigation). */
export default function UnlockCelebrationScreen() {
  const router = useRouter();
  const { active, unlocks, dismiss } = useCelebrationStore();

  useEffect(() => {
    if (!active || unlocks.length === 0) {
      router.back();
    }
  }, [active, unlocks.length, router]);

  if (!active || unlocks.length === 0) return null;

  function handleDismiss() {
    dismiss();
    router.back();
  }

  return (
    <View style={styles.container}>
      <UnlockCelebration visible unlocks={unlocks} onDismiss={handleDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
