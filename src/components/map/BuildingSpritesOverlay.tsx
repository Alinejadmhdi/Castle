import type { BuildingInstance, CategoryType } from '@/types';

interface BuildingSpritesOverlayProps {
  buildings: BuildingInstance[];
  totalBrickValue: number;
  categoryType: CategoryType;
  plotScale?: number;
}

/** Web uses 3D building meshes — native uses BuildingSpritesOverlay.native.tsx. */
export function BuildingSpritesOverlay(_props: BuildingSpritesOverlayProps) {
  return null;
}
