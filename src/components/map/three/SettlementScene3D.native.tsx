import { useMemo } from 'react';
import type { Brick, BuildingInstance, CategoryType } from '@/types';
import { CoCLighting } from './coc/CoCLighting';
import { getVisibleWallBricks } from '@/features/progression/progressionService';
import { MAP_SCENE_OFFSET } from '@/rendering/three/mapContentLayout';
import { BrickWallInstanced } from './BrickWallInstanced';
import { CameraRig } from './CameraRig';
import { SceneInvalidator } from './SceneInvalidator';

interface SettlementScene3DProps {
  bricks: Brick[];
  buildings: BuildingInstance[];
  plotScale?: number;
  totalBrickValue?: number;
  categoryType?: CategoryType;
  highlightBrickId?: string | null;
  onBrickPress?: (brick: Brick) => void;
}

/** Native: bricks in Three.js; building sprites are 2D overlays (BuildingSpritesOverlay). */
export function SettlementScene3D({
  bricks,
  buildings,
  plotScale = 1,
  totalBrickValue = 0,
  categoryType = 'standard',
  highlightBrickId,
  onBrickPress,
}: SettlementScene3DProps) {
  const wallBricks = useMemo(
    () => getVisibleWallBricks(bricks, totalBrickValue, categoryType),
    [bricks, totalBrickValue, categoryType],
  );

  return (
    <>
      <CoCLighting />

      <CameraRig plotScale={plotScale} />

      <SceneInvalidator
        bricksCount={wallBricks.length}
        buildingsCount={buildings.length}
        totalBrickValue={totalBrickValue}
      />

      <group
        position={[
          plotScale * MAP_SCENE_OFFSET.x,
          0,
          plotScale * MAP_SCENE_OFFSET.z,
        ]}
      >
        <BrickWallInstanced
          bricks={wallBricks}
          plotScale={plotScale}
          highlightBrickId={highlightBrickId}
          onPress={onBrickPress}
        />
      </group>
    </>
  );
}
