import type { CompoundRule } from '@/types';

export const COMPOUND_RULES: CompoundRule[] = [
  {
    subKey: 'pillar',
    subName: 'Pillar',
    subBrickCount: 20,
    combineCount: 4,
    compoundKey: 'arch_row',
    compoundName: 'Arch Row',
    minStageBrickCount: 80,
  },
  {
    subKey: 'wing',
    subName: 'Wing',
    subBrickCount: 80,
    combineCount: 4,
    compoundKey: 'grand_wing',
    compoundName: 'Grand Wing',
    minStageBrickCount: 80,
  },
  {
    subKey: 'tower',
    subName: 'Tower',
    subBrickCount: 150,
    combineCount: 2,
    compoundKey: 'twin_tower',
    compoundName: 'Twin Tower',
    minStageBrickCount: 150,
  },
  {
    subKey: 'bastion',
    subName: 'Bastion',
    subBrickCount: 200,
    combineCount: 4,
    compoundKey: 'fortress_ring',
    compoundName: 'Fortress Ring',
    minStageBrickCount: 200,
  },
];

export const COMPOUND_STAGE_THRESHOLD = 80;

export function getCompoundRuleForStageGap(stageBrickCount: number): CompoundRule {
  const sorted = [...COMPOUND_RULES].sort(
    (a, b) => b.minStageBrickCount - a.minStageBrickCount,
  );
  return (
    sorted.find((r) => stageBrickCount >= r.minStageBrickCount) ??
    COMPOUND_RULES[0]
  );
}
