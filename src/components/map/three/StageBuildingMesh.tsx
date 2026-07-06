import { useMemo } from 'react';
import type { BuildingInstance } from '@/types';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { spriteDepthRenderOrder } from '@/rendering/three/mapContentLayout';
import { plotSlotToWorld } from '@/rendering/three/settlementLayout';
import { spriteSizeScale } from './coc/cocPalette';
import { BrickCountLabel } from './BrickCountLabel';
import { BuildingStageSprite } from './coc/BuildingStageSprite';

interface StageBuildingMeshProps {
  building: BuildingInstance;
  plotScale: number;
  plotX: number;
  plotY: number;
  currentHqStageIndex: number;
}

function getStageIndex(building: BuildingInstance): number {
  const stages =
    building.kind === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  return stages.find((s) => s.key === building.stageKey)?.index ?? 0;
}

/** Single monument in the ring — tiered size by monument stage and current HQ stage. */
export function StageBuildingMesh({
  building,
  plotScale,
  plotX,
  plotY,
  currentHqStageIndex,
}: StageBuildingMeshProps) {
  const stageIndex = getStageIndex(building);

  const position = useMemo(
    () => plotSlotToWorld(plotX, plotY, plotScale),
    [plotX, plotY, plotScale],
  );

  const labelY = plotScale * 3.4;
  const brickLabel = Number.isInteger(building.totalBrickValue)
    ? `${building.totalBrickValue} bricks`
    : `${building.totalBrickValue.toFixed(1)} bricks`;

  return (
    <group position={[position.x, 0, position.z]}>
      <BuildingStageSprite
        stageIndex={stageIndex}
        categoryType={building.kind === 'miniature' ? 'miniature' : 'standard'}
        plotScale={plotScale * building.scale}
        sizeScale={spriteSizeScale(true, false, stageIndex, currentHqStageIndex)}
        renderOrder={spriteDepthRenderOrder(position.x, position.z)}
      />
      <BrickCountLabel
        position={[0, labelY, 0]}
        label={brickLabel}
        sublabel={building.name}
        scale={plotScale * 0.55}
      />
    </group>
  );
}
