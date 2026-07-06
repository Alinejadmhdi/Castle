import type { BuildingInstance, CategoryType } from '@/types';
import { CENTER_WALL_ABSORBER_KEY, shouldDisplayPlotMonument } from '@/constants/monumentPersistence';
import { getStageForBrickValue } from '@/features/progression/progressionService';
import { reconcileMonumentLayout } from '@/rendering/three/settlementLayout';
import { getCategoryById } from '@/services/database/repositories';
import {
  deleteBuildingInstance,
  getBuildingsByCategory,
  updateBuildingPlotPosition,
} from '@/services/database/buildingRepository';
import { withDbWrite } from '@/services/database/dbQueue';

function isPlotMonument(building: BuildingInstance): boolean {
  if (building.stageKey === CENTER_WALL_ABSORBER_KEY) return false;
  return building.kind === 'macro' || building.kind === 'miniature';
}

/** One monument per stage key; scatter non-overlapping slots (fixes old saves). */
export async function relayoutCategoryMonuments(
  categoryId: string,
  categoryType: CategoryType,
): Promise<BuildingInstance[]> {
  const category = await getCategoryById(categoryId);
  const currentStageIndex = category
    ? getStageForBrickValue(category.totalBrickValue, categoryType).index
    : 26;
  const buildings = await getBuildingsByCategory(categoryId);
  const monuments = buildings.filter(
    (b) =>
      isPlotMonument(b) &&
      shouldDisplayPlotMonument(categoryType, b.stageKey, currentStageIndex),
  );

  if (monuments.length === 0) return buildings;

  return withDbWrite(async () => {
    const sorted = [...monuments].sort((a, b) => a.unlockedAt.localeCompare(b.unlockedAt));
    const keepByStage = new Map<string, BuildingInstance>();
    for (const monument of sorted) {
      keepByStage.set(monument.stageKey, monument);
    }
    const kept = [...keepByStage.values()];

    await Promise.all(
      monuments
        .filter((b) => !kept.some((k) => k.id === b.id))
        .map((b) => deleteBuildingInstance(b.id)),
    );

    const layout = reconcileMonumentLayout(kept, currentStageIndex);
    await Promise.all(
      kept.map(async (building) => {
        const slot = layout.get(building.id);
        if (!slot) return;
        if (slot.plotX === building.plotX && slot.plotY === building.plotY) return;
        await updateBuildingPlotPosition(building.id, slot.plotX, slot.plotY);
        building.plotX = slot.plotX;
        building.plotY = slot.plotY;
      }),
    );

    return getBuildingsByCategory(categoryId);
  });
}
