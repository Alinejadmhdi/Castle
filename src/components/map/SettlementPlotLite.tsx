import { View, StyleSheet } from 'react-native';
import type { CategoryType } from '@/types';
import { MapBackgroundImage } from './MapBackgroundImage';
import { SettlementPlotOverlay } from './SettlementPlotOverlay';

interface SettlementPlotLiteProps {
  totalBrickValue?: number;
  categoryType?: CategoryType;
}

/** Static map card — no GL context (Life Map list uses one live canvas at a time). */
export function SettlementPlotLite({
  totalBrickValue = 0,
  categoryType = 'standard',
}: SettlementPlotLiteProps) {
  return (
    <View style={styles.wrap}>
      <MapBackgroundImage />
      <SettlementPlotOverlay totalBrickValue={totalBrickValue} categoryType={categoryType} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#4a9238',
  },
});
