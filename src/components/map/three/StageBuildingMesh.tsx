import { useMemo } from 'react';
import type { BuildingInstance } from '@/types';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { plotSlotToWorld } from '@/rendering/three/settlementLayout';
import { RING_MONUMENT_VISUAL_SCALE } from './coc/cocPalette';
import { BrickCountLabel } from './BrickCountLabel';
import { CoCBuildingModel } from './coc/CoCBuildingModel';

interface StageBuildingMeshProps {
  building: BuildingInstance;
  plotScale: number;
  plotX: number;
  plotY: number;
}

function getStageIndex(building: BuildingInstance): number {
  const stages =
    building.kind === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  return stages.find((s) => s.key === building.stageKey)?.index ?? 0;
}

/** Single smaller monument in the ring — replaced when the next stage unlocks. */
export function StageBuildingMesh({ building, plotScale, plotX, plotY }: StageBuildingMeshProps) {
  const stageIndex = getStageIndex(building);
  const categoryType = building.kind === 'miniature' ? 'miniature' : 'standard';
  const monumentScale = plotScale * building.scale * RING_MONUMENT_VISUAL_SCALE;

  const position = useMemo(
    () => plotSlotToWorld(plotX, plotY, plotScale),
    [plotX, plotY, plotScale],
  );

  const labelY = plotScale * (categoryType === 'miniature' ? 2.8 : 4.2);
  const brickLabel = Number.isInteger(building.totalBrickValue)
    ? `${building.totalBrickValue} bricks`
    : `${building.totalBrickValue.toFixed(1)} bricks`;

  return (
    <group position={[position.x, 0, position.z]}>
      <CoCBuildingModel
        stageIndex={stageIndex}
        categoryType={categoryType}
        progress={1}
        plotScale={monumentScale}
      />
      <BrickCountLabel
        position={[0, labelY, 0]}
        label={brickLabel}
        sublabel={building.name}
        scale={plotScale * 0.65}
      />
    </group>
  );
}
