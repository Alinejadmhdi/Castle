import type { SettlementRenderer } from '../types';

/** 3D renderer metadata — scene lives in SettlementPlot + Three.js */
export const threeSettlementRenderer: SettlementRenderer = {
  mode: '3d',
  hitTest() {
    return null;
  },
};

export function getSettlementRenderer(): SettlementRenderer {
  return threeSettlementRenderer;
}
