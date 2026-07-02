import { useMemo } from 'react';
import type { Brick, BuildingInstance, CategoryType } from '@/types';
import { COC_COLORS } from './coc/cocPalette';
import { getVisibleWallBricks } from '@/features/progression/progressionService';
import { shouldDisplayPlotMonument } from '@/constants/monumentPersistence';
import { layoutMonuments, getMaxMonumentFootprintRadius } from '@/rendering/three/settlementLayout';
import { BrickWallInstanced } from './BrickWallInstanced';
import { ProgressiveBuildingMesh } from './ProgressiveBuildingMesh';
import { StageBuildingMesh } from './StageBuildingMesh';
import { CoCMapEnvironment } from './CoCMapEnvironment';
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

  const monuments = useMemo(
    () =>
      buildings
        .filter(
          (b) =>
            isStageMonument(b.kind) && shouldDisplayPlotMonument(categoryType, b.stageKey),
        )
        .sort((a, b) => a.unlockedAt.localeCompare(b.unlockedAt)),
    [buildings, categoryType],
  );

  const monumentLayout = useMemo(() => layoutMonuments(monuments), [monuments]);

  const treeClearRadius = useMemo(
    () => Math.max(4, getMaxMonumentFootprintRadius(monuments) * 0.55),
    [monuments],
  );

  const buildingSlots = useMemo(
    () => [...monumentLayout.values()],
    [monumentLayout],
  );

  return (
    <>
      <color attach="background" args={[COC_COLORS.wilderness]} />
      <ambientLight intensity={0.55} color="#fff5e6" />
      <hemisphereLight args={['#3a9a2a', COC_COLORS.grassDark, 0.38]} />
      <directionalLight position={[16, 24, 12]} intensity={1.45} color="#fff0c8" />
      <directionalLight position={[-10, 14, -8]} intensity={0.2} color="#e8f0e0" />

      <CameraRig plotScale={plotScale} />

      <SceneInvalidator
        bricksCount={wallBricks.length}
        buildingsCount={monuments.length}
        totalBrickValue={totalBrickValue}
      />

      <CoCMapEnvironment
        plotScale={plotScale}
        buildingSlots={buildingSlots}
        treeClearRadius={treeClearRadius}
      />

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
          />
        );
      })}

      <BrickWallInstanced
        bricks={wallBricks}
        plotScale={plotScale}
        highlightBrickId={highlightBrickId}
        onPress={onBrickPress}
      />
    </>
  );
}
