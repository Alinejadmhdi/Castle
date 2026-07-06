import { useMemo } from 'react';
import type { CategoryType } from '@/types';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { getBuildingVisualParams } from '@/rendering/three/buildingProgress';
import { HQ_LAYOUT, spriteDepthRenderOrder } from '@/rendering/three/mapContentLayout';
import { spriteSizeScale } from './coc/cocPalette';
import { BrickCountLabel } from './BrickCountLabel';
import { BuildingStageSprite } from './coc/BuildingStageSprite';

interface ProgressiveBuildingMeshProps {
  totalBrickValue: number;
  categoryType: CategoryType;
  plotScale: number;
  wallColor?: string;
}

/** CoC-style HQ at the plot center — grows with stage, sits toward map bottom. */
export function ProgressiveBuildingMesh({
  totalBrickValue,
  categoryType,
  plotScale,
}: ProgressiveBuildingMeshProps) {
  const visual = useMemo(
    () => getBuildingVisualParams(totalBrickValue, categoryType, plotScale),
    [totalBrickValue, categoryType, plotScale],
  );

  if (totalBrickValue <= 0) return null;

  const stages = categoryType === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  const stage = stages[visual.stageIndex] ?? stages[0];
  const labelY = plotScale * 5.2;

  const worldX = plotScale * HQ_LAYOUT.worldX;
  const worldZ = plotScale * HQ_LAYOUT.worldZ;

  return (
    <group position={[worldX, 0, worldZ]}>
      <BuildingStageSprite
        stageIndex={visual.stageIndex}
        categoryType={categoryType}
        plotScale={plotScale}
        sizeScale={spriteSizeScale(false, false, visual.stageIndex)}
        anchorLow
        renderOrder={spriteDepthRenderOrder(worldX, worldZ)}
      />
      <BrickCountLabel
        position={[0, labelY, 0]}
        label={`${totalBrickValue.toFixed(1)} bricks`}
        sublabel={stage.name}
        scale={plotScale * 0.85}
      />
    </group>
  );
}
