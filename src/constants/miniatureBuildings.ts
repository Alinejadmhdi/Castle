import type { BuildingStage } from '@/types';

export const MINIATURE_BUILDING_STAGES: BuildingStage[] = [
  { index: 0, key: 'pebble_path', name: 'Pebble Path', cumulativeBricks: 3, stageBrickCount: 3, templateId: 'mini_pebble', usesCompoundFill: false },
  { index: 1, key: 'tiny_wall', name: 'Tiny Wall', cumulativeBricks: 7, stageBrickCount: 4, templateId: 'mini_wall', usesCompoundFill: false },
  { index: 2, key: 'garden_fence', name: 'Garden Fence', cumulativeBricks: 12, stageBrickCount: 5, templateId: 'mini_fence', usesCompoundFill: false },
  { index: 3, key: 'birdhouse', name: 'Birdhouse', cumulativeBricks: 18, stageBrickCount: 6, templateId: 'mini_birdhouse', usesCompoundFill: false },
  { index: 4, key: 'mini_shed', name: 'Mini Shed', cumulativeBricks: 25, stageBrickCount: 7, templateId: 'mini_shed', usesCompoundFill: false },
  { index: 5, key: 'mini_cottage', name: 'Mini Cottage', cumulativeBricks: 35, stageBrickCount: 10, templateId: 'mini_cottage', usesCompoundFill: false },
  { index: 6, key: 'mini_manor', name: 'Mini Manor', cumulativeBricks: 50, stageBrickCount: 15, templateId: 'mini_manor', usesCompoundFill: false },
  { index: 7, key: 'mini_castle', name: 'Mini Castle', cumulativeBricks: 75, stageBrickCount: 25, templateId: 'mini_castle', usesCompoundFill: false },
];

export const MINIATURE_SCALE = 0.4;
