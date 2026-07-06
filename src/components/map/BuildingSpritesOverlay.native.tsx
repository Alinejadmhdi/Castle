import { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import type { BuildingInstance, CategoryType } from '@/types';
import { BUILDING_STAGE_IMAGES } from '@/constants/buildingPreviewAssets';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { getBuildingVisualParams } from '@/rendering/three/buildingProgress';
import { getStageForBrickValue } from '@/features/progression/progressionService';
import { shouldDisplayPlotMonument } from '@/constants/monumentPersistence';
import { layoutMonuments } from '@/rendering/three/settlementLayout';
import { hqOverlayLayout, monumentOverlayLayout } from '@/rendering/three/plotOverlayLayout';

interface BuildingSpritesOverlayProps {
  buildings: BuildingInstance[];
  totalBrickValue: number;
  categoryType: CategoryType;
  plotScale?: number;
}

function isStageMonument(kind: BuildingInstance['kind']) {
  return kind === 'macro' || kind === 'miniature';
}

function getStageIndex(building: BuildingInstance): number {
  const stages =
    building.kind === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
  return stages.find((s) => s.key === building.stageKey)?.index ?? 0;
}

/** Native building art — RN Image overlays with %-based layout (not pixels). */
export function BuildingSpritesOverlay({
  buildings,
  totalBrickValue,
  categoryType,
  plotScale = 1,
}: BuildingSpritesOverlayProps) {
  const currentHqStageIndex = useMemo(
    () => getStageForBrickValue(totalBrickValue, categoryType).index,
    [totalBrickValue, categoryType],
  );

  const hqVisual = useMemo(
    () =>
      totalBrickValue > 0
        ? getBuildingVisualParams(totalBrickValue, categoryType, plotScale)
        : null,
    [totalBrickValue, categoryType, plotScale],
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

  if (!hqVisual && monuments.length === 0) return null;

  return (
    <View style={styles.layer} pointerEvents="none">
      {hqVisual && (
        <Image
          source={BUILDING_STAGE_IMAGES[hqVisual.stageIndex]}
          style={hqOverlayLayout(plotScale, hqVisual.stageIndex, categoryType)}
          resizeMode="contain"
        />
      )}
      {monuments.map((building) => {
        const slot = monumentLayout.get(building.id);
        if (!slot) return null;
        const stageIndex = getStageIndex(building);
        return (
          <Image
            key={building.id}
            source={BUILDING_STAGE_IMAGES[stageIndex]}
            style={monumentOverlayLayout(
              slot.plotX,
              slot.plotY,
              plotScale,
              stageIndex,
              currentHqStageIndex,
              building.scale,
            )}
            resizeMode="contain"
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
});
