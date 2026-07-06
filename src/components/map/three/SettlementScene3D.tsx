import { useEffect, useMemo } from 'react';
import type { Brick, BuildingInstance, CategoryType } from '@/types';
import { CoCLighting } from './coc/CoCLighting';
import { getVisibleWallBricks, getStageForBrickValue } from '@/features/progression/progressionService';
import { shouldDisplayPlotMonument } from '@/constants/monumentPersistence';
import { layoutMonuments } from '@/rendering/three/settlementLayout';
import { MAP_SCENE_OFFSET } from '@/rendering/three/mapContentLayout';
import { BrickWallInstanced } from './BrickWallInstanced';
import { ProgressiveBuildingMesh } from './ProgressiveBuildingMesh';
import { StageBuildingMesh } from './StageBuildingMesh';
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

function isStageMonument(kind: BuildingInstance['kind']) {
  return kind === 'macro' || kind === 'miniature';
}

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

  const currentHqStageIndex = useMemo(
    () => getStageForBrickValue(totalBrickValue, categoryType).index,
    [totalBrickValue, categoryType],
  );

  const monuments = useMemo(
    () =>
      buildings
        .filter(
          (b) =>
            isStageMonument(b.kind) &&
            shouldDisplayPlotMonument(categoryType, b.stageKey, currentHqStageIndex),
        )
        .sort((a, b) => a.unlockedAt.localeCompare(b.unlockedAt)),
    [buildings, categoryType, currentHqStageIndex],
  );

  const monumentLayout = useMemo(
    () => layoutMonuments(monuments, currentHqStageIndex, plotScale),
    [monuments, currentHqStageIndex, plotScale],
  );

  useEffect(() => {
    console.log('[SettlementScene3D]', {
      wallBricks: wallBricks.length,
      monuments: monuments.length,
      hqStage: currentHqStageIndex,
      totalBrickValue,
      categoryType,
    });
  }, [
    wallBricks.length,
    monuments.length,
    currentHqStageIndex,
    totalBrickValue,
    categoryType,
  ]);

  return (
    <>
      <CoCLighting />

      <CameraRig plotScale={plotScale} />

      <SceneInvalidator
        bricksCount={wallBricks.length}
        buildingsCount={monuments.length}
        totalBrickValue={totalBrickValue}
      />

      <group
        position={[
          plotScale * MAP_SCENE_OFFSET.x,
          0,
          plotScale * MAP_SCENE_OFFSET.z,
        ]}
      >
        <ProgressiveBuildingMesh
          totalBrickValue={totalBrickValue}
          categoryType={categoryType}
          plotScale={plotScale}
        />

        {monuments.map((building) => {
          const slot = monumentLayout.get(building.id);
          if (!slot) return null;
          return (
            <StageBuildingMesh
              key={building.id}
              building={building}
              plotScale={plotScale}
              plotX={slot.plotX}
              plotY={slot.plotY}
              currentHqStageIndex={currentHqStageIndex}
            />
          );
        })}

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
