import '@/rendering/three/nativeThreeSetup';
import { Suspense, memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Canvas, events } from '@react-three/fiber/native';
import type { Brick, BuildingInstance, CategoryType } from '@/types';
import { theme } from '@/constants/theme';
import { SettlementScene3D } from './three/SettlementScene3D';
import { MapBackgroundImage } from './MapBackgroundImage';
import { SettlementPlotOverlay } from './SettlementPlotOverlay';

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

/** Native Life Map — expo-gl + R3F (same scene graph as Expo Go / web). */
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
      <Suspense
        fallback={
          <View style={styles.loader}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        }
      >
        <Canvas
          style={styles.canvas}
          orthographic
          frameloop="demand"
          events={events}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <SettlementScene3D
            bricks={bricks}
            buildings={buildings}
            plotScale={scale}
            totalBrickValue={totalBrickValue}
            categoryType={categoryType}
            highlightBrickId={highlightBrickId}
            onBrickPress={onBrickPress}
          />
        </Canvas>
      </Suspense>
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
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
