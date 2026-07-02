import { Suspense, memo, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import type { Brick, BuildingInstance, CategoryType } from '@/types';
import { MAP_SKY_COLOR } from '@/rendering/three/constants';
import {
  COC_BASE_DISTANCE,
  COC_DEFAULT_ZOOM,
  getCameraLookAt,
  getCoCCameraOffset,
  getCoCOrthographicBounds,
} from '@/rendering/three/cocCamera';
import { theme } from '@/constants/theme';
import { SettlementScene3D } from './three/SettlementScene3D';
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

function SceneLoader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

export const SettlementPlot = memo(function SettlementPlot({
  bricks,
  buildings,
  scale = 1,
  totalBrickValue = 0,
  categoryType = 'standard',
  wallColor,
  highlightBrickId,
  onBrickPress,
}: SettlementPlotProps) {
  const cameraConfig = useMemo(() => {
    const bounds = getCoCOrthographicBounds(scale, 1, COC_DEFAULT_ZOOM, 'native');
    const lookAt = getCameraLookAt(scale);
    const offset = getCoCCameraOffset(COC_BASE_DISTANCE * scale);
    return {
      position: [
        lookAt.x + offset.x,
        lookAt.y + offset.y,
        lookAt.z + offset.z,
      ] as [number, number, number],
      zoom: 1,
      near: 0.1,
      far: 500,
      ...bounds,
    };
  }, [scale]);

  return (
    <View style={styles.wrap}>
      <Suspense fallback={<SceneLoader />}>
        <Canvas
          orthographic
          frameloop="demand"
          style={styles.canvas}
          camera={cameraConfig}
          onCreated={(state) => state.invalidate()}
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
    backgroundColor: MAP_SKY_COLOR,
  },
  canvas: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
