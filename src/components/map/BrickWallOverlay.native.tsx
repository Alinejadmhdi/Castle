import { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type { Brick, CategoryType } from '@/types';
import { getVisibleWallBricks } from '@/features/progression/progressionService';
import { brickOverlayLayout } from '@/rendering/three/plotOverlayLayout';
import { isWallBrickDarkVariant, wallBrickDisplayColor, wallBrickPlacementIndex } from '@/utils/brickColor';

interface BrickWallOverlayProps {
  bricks: Brick[];
  totalBrickValue: number;
  categoryType: CategoryType;
  plotScale?: number;
  highlightBrickId?: string | null;
  onBrickPress?: (brick: Brick) => void;
}

function lighten(hex: string, amount = 0.14): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darken(hex: string, amount = 0.12): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Native brick wall — 2D isometric chips using the same gridToWorld layout as 3D. */
export function BrickWallOverlay({
  bricks,
  totalBrickValue,
  categoryType,
  plotScale = 1,
  highlightBrickId,
  onBrickPress,
}: BrickWallOverlayProps) {
  const wallBricks = useMemo(() => {
    const visible = getVisibleWallBricks(bricks, totalBrickValue, categoryType);
    return [...visible].sort((a, b) => {
      if (a.gridY !== b.gridY) return a.gridY - b.gridY;
      if (a.gridX !== b.gridX) return a.gridX - b.gridX;
      return a.id.localeCompare(b.id);
    });
  }, [bricks, totalBrickValue, categoryType]);

  if (wallBricks.length === 0) return null;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {wallBricks.map((brick) => {
        const highlighted = highlightBrickId === brick.id;
        const placementIndex = wallBrickPlacementIndex(brick);
        let color = wallBrickDisplayColor(brick.color, placementIndex);
        if (highlighted) color = '#ffffff';
        else if (brick.streakRewardLabel) color = '#e8c547';

        const isDark = isWallBrickDarkVariant(placementIndex);
        const topColor = isDark ? darken(color, 0.04) : lighten(color);
        const sideColor = darken(color, 0.1);

        const layout = brickOverlayLayout(brick, plotScale);

        return (
          <Pressable
            key={brick.id}
            style={[
              layout.container,
              highlighted && styles.highlighted,
            ]}
            onPress={onBrickPress ? () => onBrickPress(brick) : undefined}
          >
            <View
              style={[
                styles.topFace,
                {
                  backgroundColor: topColor,
                  height: layout.topHeightPct,
                  marginLeft: layout.depthSkewLeftPct,
                  marginTop: layout.depthSkewTopPct,
                },
              ]}
            />
            <View
              style={[
                styles.frontFace,
                {
                  backgroundColor: color,
                  height: layout.frontHeightPct,
                },
              ]}
            />
            <View
              style={[
                styles.sideFace,
                {
                  backgroundColor: sideColor,
                  width: layout.depthSkewLeftPct,
                  height: layout.frontHeightPct,
                  marginTop: layout.depthSkewTopPct,
                },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    elevation: 4,
  },
  highlighted: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  topFace: {
    width: '100%',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  frontFace: {
    width: '100%',
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  sideFace: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderBottomRightRadius: 1,
  },
});
