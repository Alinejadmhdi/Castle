import { useMemo } from 'react';
import type { CategoryType } from '@/types';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { getBuildingVisualParams } from '@/rendering/three/buildingProgress';
import { HQ_FIXED_VISUAL_SCALE } from './coc/cocPalette';
import { BrickCountLabel } from './BrickCountLabel';
import { CoCBuildingModel } from './coc/CoCBuildingModel';

interface ProgressiveBuildingMeshProps {
  totalBrickValue: number;
  categoryType: CategoryType;
  plotScale: number;
  wallColor?: string;
}

/** CoC-style HQ at the plot center — fixed size, stage mesh updates in place. */
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
  const hqScale = plotScale * HQ_FIXED_VISUAL_SCALE;
  const labelY = plotScale * (categoryType === 'miniature' ? 4.2 : 6.8);

  return (
    <group position={[0, 0, 0]}>
      <CoCBuildingModel
        stageIndex={visual.stageIndex}
        categoryType={categoryType}
        progress={1}
        plotScale={hqScale}
      />
      <BrickCountLabel
        position={[0, labelY, 0]}
        label={`${totalBrickValue.toFixed(1)} bricks`}
        sublabel={stage.name}
        scale={plotScale}
      />
    </group>
  );
}
