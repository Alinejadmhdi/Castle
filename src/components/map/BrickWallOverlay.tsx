import type { Brick, CategoryType } from '@/types';

interface BrickWallOverlayProps {
  bricks: Brick[];
  totalBrickValue: number;
  categoryType: CategoryType;
  plotScale?: number;
  highlightBrickId?: string | null;
  onBrickPress?: (brick: Brick) => void;
}

/** Web uses 3D BrickWallInstanced — native uses BrickWallOverlay.native.tsx. */
export function BrickWallOverlay(_props: BrickWallOverlayProps) {
  return null;
}
