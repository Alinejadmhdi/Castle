import { View, Text, StyleSheet } from 'react-native';
import type { CategoryType } from '@/types';

interface SettlementPlotOverlayProps {
  totalBrickValue: number;
  categoryType: CategoryType;
}

/** 2D brick count over the map (native skips Troika 3D text). */
export function SettlementPlotOverlay({ totalBrickValue }: SettlementPlotOverlayProps) {
  if (totalBrickValue <= 0) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.label}>{totalBrickValue.toFixed(1)} bricks</Text>
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
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
