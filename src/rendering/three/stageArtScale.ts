/**
 * Per-stage PNG art correction — sprites share one billboard width formula, but
 * extracted art varies in visual mass. Normalizes so adjacent stages grow gently.
 */
const STAGE_ART_SIZE_FACTOR: readonly number[] = [
  0.72, // 0 foundation — smaller footprint at first unlock
  0.52, // 1 low_wall — wall art reads much larger than foundation at equal scale
  0.78, // 2 knee_wall
  0.84, // 3 chest_wall
  0.88, // 4 full_enclosure
  0.92, // 5 gated_wall
  0.94, // 6 garden_enclosure
  0.95, // 7 lean_to
  0.96, // 8 shack
  0.97, // 9 hut
  0.98, // 10 cottage
  0.99, // 11 bungalow
  1.0, // 12 small_house
  1.0, // 13 house
  1.0, // 14 farmhouse
  1.0, // 15 townhouse
  1.0, // 16 manor
  1.0, // 17 villa
  1.0, // 18 mansion
  1.0, // 19 estate
  1.0, // 20 keep
  1.0, // 21 fortified_manor
  1.0, // 22 small_fort
  1.0, // 23 fort
  1.0, // 24 citadel
  1.0, // 25 castle_gatehouse
  1.0, // 26 castle
];

export function stageArtSizeFactor(stageIndex: number): number {
  const s = Math.min(26, Math.max(0, Math.round(stageIndex)));
  return STAGE_ART_SIZE_FACTOR[s] ?? 1;
}
