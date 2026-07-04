import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
import type { CategoryType } from '@/types';
import { BUILDING_PREVIEW_SHEETS } from '@/constants/buildingPreviewAssets';

export { BUILDING_PREVIEW_SHEETS };

export interface PreviewSheetSlice {
  sheetIndex: number;
  localIndex: number;
  cols: number;
}

type AssetModule =
  | number
  | string
  | { uri?: string; default?: string | number; src?: string };

function resolvePreviewUri(module: AssetModule): string {
  const resolved = resolveAssetSource(module as number);
  if (resolved?.uri) return resolved.uri;

  if (typeof module === 'string') return module;
  if (typeof module === 'object' && module !== null) {
    if (typeof module.uri === 'string') return module.uri;
    if (typeof module.src === 'string') return module.src;
    if (typeof module.default === 'string') return module.default;
  }

  throw new Error('Unable to resolve building preview asset URI');
}

/** Map macro/mini stage index to a cell on the reference art sheets. */
export function getPreviewSheetSlice(
  stageIndex: number,
  categoryType: CategoryType,
): PreviewSheetSlice {
  const idx = stageIndex;

  if (idx <= 6) return { sheetIndex: 0, localIndex: idx, cols: 7 };
  if (idx <= 13) return { sheetIndex: 1, localIndex: idx - 7, cols: 7 };
  if (idx <= 20) return { sheetIndex: 2, localIndex: idx - 14, cols: 7 };
  return { sheetIndex: 3, localIndex: idx - 21, cols: 6 };
}

/** Resolved URIs for Three.js loaders (Expo web + native). */
export function getBuildingPreviewSheetUris(): string[] {
  return BUILDING_PREVIEW_SHEETS.map((module) => resolvePreviewUri(module));
}
