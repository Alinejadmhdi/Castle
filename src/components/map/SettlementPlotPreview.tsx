import { View, StyleSheet } from 'react-native';
import type { Brick, BuildingInstance, CategoryType } from '@/types';
import { MapBackgroundImage } from './MapBackgroundImage';
import { SettlementPlotOverlay } from './SettlementPlotOverlay';
import { BrickWallOverlay } from './BrickWallOverlay';
import { BuildingSpritesOverlay } from './BuildingSpritesOverlay';

interface SettlementPlotPreviewProps {
  bricks: Brick[];
  buildings: BuildingInstance[];
  totalBrickValue?: number;
  categoryType?: CategoryType;
  plotScale?: number;
}

/** Life Map card — 2D bricks + buildings, no GL (one Canvas only while focus panel is open). */
export function SettlementPlotPreview({
  bricks,
  buildings,
  totalBrickValue = 0,
  categoryType = 'standard',
  plotScale = 1,
}: SettlementPlotPreviewProps) {
  return (
    <View style={styles.wrap}>
      <MapBackgroundImage />
      <BuildingSpritesOverlay
        buildings={buildings}
        totalBrickValue={totalBrickValue}
        categoryType={categoryType}
        plotScale={plotScale}
      />
      <BrickWallOverlay
        bricks={bricks}
        totalBrickValue={totalBrickValue}
        categoryType={categoryType}
        plotScale={plotScale}
      />
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
