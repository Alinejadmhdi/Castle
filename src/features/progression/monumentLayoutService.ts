import type { BuildingInstance, CategoryType } from '@/types';
import { shouldDisplayPlotMonument } from '@/constants/monumentPersistence';
import { reconcileMonumentLayout } from '@/rendering/three/settlementLayout';
import {
  deleteBuildingInstance,
  getBuildingsByCategory,
  updateBuildingPlotPosition,
} from '@/services/database/buildingRepository';

function isPlotMonument(building: BuildingInstance): boolean {
  return building.kind === 'macro' || building.kind === 'miniature';
}

/** One monument per stage key; scatter non-overlapping slots (fixes old saves). */
export async function relayoutCategoryMonuments(
  categoryId: string,
  categoryType: CategoryType,
): Promise<BuildingInstance[]> {
  const buildings = await getBuildingsByCategory(categoryId);
  const monuments = buildings.filter(
    (b) => isPlotMonument(b) && shouldDisplayPlotMonument(categoryType, b.stageKey),
  );

  if (monuments.length === 0) return buildings;

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

  const layout = reconcileMonumentLayout(kept);
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
}
