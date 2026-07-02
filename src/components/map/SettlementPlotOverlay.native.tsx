import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CategoryType } from '@/types';
import { MACRO_BUILDING_STAGES } from '@/constants/buildings';
import { MINIATURE_BUILDING_STAGES } from '@/constants/miniatureBuildings';
import { getBuildingVisualParams } from '@/rendering/three/buildingProgress';
import { theme } from '@/constants/theme';

interface SettlementPlotOverlayProps {
  totalBrickValue: number;
  categoryType: CategoryType;
}

/** 2D brick count + stage name over the map (native skips Troika 3D text). */
export function SettlementPlotOverlay({
  totalBrickValue,
  categoryType,
}: SettlementPlotOverlayProps) {
  const stageName = useMemo(() => {
    if (totalBrickValue <= 0) return null;
    const visual = getBuildingVisualParams(totalBrickValue, categoryType, 1);
    const stages =
      categoryType === 'miniature' ? MINIATURE_BUILDING_STAGES : MACRO_BUILDING_STAGES;
    return stages[visual.stageIndex]?.name ?? null;
  }, [totalBrickValue, categoryType]);

  if (totalBrickValue <= 0) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.label}>{totalBrickValue.toFixed(1)} bricks</Text>
      {stageName ? <Text style={styles.stage}>{stageName}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stage: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
