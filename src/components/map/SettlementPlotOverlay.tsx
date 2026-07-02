import type { CategoryType } from '@/types';

interface SettlementPlotOverlayProps {
  totalBrickValue: number;
  categoryType: CategoryType;
}

/** Web uses 3D Troika labels on buildings — no 2D overlay needed. */
export function SettlementPlotOverlay(_props: SettlementPlotOverlayProps) {
  return null;
}
