import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Brick, BuildingInstance, CategoryType } from '@/types';
import { SettlementPlotOverlay } from './SettlementPlotOverlay';
import { MapBackgroundImage } from './MapBackgroundImage';
import { BuildingSpritesOverlay } from './BuildingSpritesOverlay';
import { BrickWallOverlay } from './BrickWallOverlay';

interface SettlementPlotProps {
  bricks: Brick[];
  buildings: BuildingInstance[];
  scale?: number;
  totalBrickValue?: number;
  categoryType?: CategoryType;
  wallColor?: string;
  highlightBrickId?: string | null;
  onBrickPress?: (brick: Brick) => void;
}

/**
 * Native Life Map — 2D React Native layers only.
 * Three.js Canvas is unreliable on Android release (blank GL + texture crashes).
 * Web uses SettlementPlot.web.tsx with full 3D.
 */
export const SettlementPlot = memo(function SettlementPlot({
  bricks,
  buildings,
  scale = 1,
  totalBrickValue = 0,
  categoryType = 'standard',
  highlightBrickId,
  onBrickPress,
}: SettlementPlotProps) {
  return (
    <View style={styles.wrap}>
      <MapBackgroundImage />
      <BrickWallOverlay
        bricks={bricks}
        totalBrickValue={totalBrickValue}
        categoryType={categoryType}
        plotScale={scale}
        highlightBrickId={highlightBrickId}
        onBrickPress={onBrickPress}
      />
      <BuildingSpritesOverlay
        buildings={buildings}
        totalBrickValue={totalBrickValue}
        categoryType={categoryType}
        plotScale={scale}
      />
      <SettlementPlotOverlay
        totalBrickValue={totalBrickValue}
        categoryType={categoryType}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#4a9238',
  },
});
