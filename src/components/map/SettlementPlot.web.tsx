import { Suspense, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Canvas } from '@react-three/fiber';
import type { WebGLRenderer } from 'three';
import type { Brick, BuildingInstance, CategoryType } from '@/types';
import { MAP_CANVAS_HEIGHT } from '@/rendering/three/constants';
import {
  COC_BASE_DISTANCE,
  COC_DEFAULT_ZOOM,
  getCameraLookAt,
  getCoCCameraOffset,
  getCoCOrthographicBounds,
} from '@/rendering/three/cocCamera';
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

function clearCanvasAlpha(gl: WebGLRenderer) {
  gl.setClearColor(0x000000, 0);
}

export function SettlementPlot({
  bricks,
  buildings,
  scale = 1,
  totalBrickValue = 0,
  categoryType = 'standard',
  wallColor,
  highlightBrickId,
  onBrickPress,
}: SettlementPlotProps) {
  const canvasHeight = MAP_CANVAS_HEIGHT;

  const cameraConfig = useMemo(() => {
    const bounds = getCoCOrthographicBounds(scale);
    const lookAt = getCameraLookAt(scale);
    const offset = getCoCCameraOffset(COC_BASE_DISTANCE * scale);
    return {
      position: [
        lookAt.x + offset.x,
        lookAt.y + offset.y,
        lookAt.z + offset.z,
      ] as [number, number, number],
      zoom: COC_DEFAULT_ZOOM,
      near: 0.1,
      far: 500,
      ...bounds,
    };
  }, [scale]);

  return (
    <View style={[styles.wrap, { height: canvasHeight }]}>
      <MapBackgroundImage />
      <Suspense
        fallback={
          <View style={styles.loader}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        }
      >
        <Canvas
          orthographic
          style={styles.canvas}
          camera={cameraConfig}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => clearCanvasAlpha(gl)}
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
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#4a9238',
  },
  canvas: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
