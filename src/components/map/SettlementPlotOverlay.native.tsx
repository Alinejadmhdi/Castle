import { View, Text, StyleSheet } from 'react-native';
import type { CategoryType } from '@/types';
import { getStageForBrickValue } from '@/features/progression/progressionService';

interface SettlementPlotOverlayProps {
  totalBrickValue: number;
  categoryType: CategoryType;
}

/** Stage name and brick count over the map (native skips Troika 3D text). */
export function SettlementPlotOverlay({
  totalBrickValue,
  categoryType,
}: SettlementPlotOverlayProps) {
  const stageName = getStageForBrickValue(totalBrickValue, categoryType).name;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.stageName}>{stageName}</Text>
      {totalBrickValue > 0 && (
        <Text style={styles.label}>{totalBrickValue.toFixed(1)} bricks</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  stageName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.92,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
