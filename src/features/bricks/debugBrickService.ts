import { getCheckpointProgress } from '@/features/progression/checkpointProgress';
import { addBrickToCategory } from './brickService';
import { getCategoryById } from '@/services/database/repositories';
import type { BrickCreationResult } from './brickService';

/**
 * Dev / test phase: add whole bricks to a category (triggers stage unlocks + monuments).
 */
export async function grantBricksToCategory(
  categoryId: string,
  brickCount: number,
): Promise<BrickCreationResult[]> {
  if (!__DEV__) {
    throw new Error('grantBricksToCategory is only available in development builds');
  }
  const category = await getCategoryById(categoryId);
  if (!category) throw new Error('Category not found');

  const whole = Math.max(0, Math.floor(brickCount));
  const results: BrickCreationResult[] = [];
  const isMiniature = category.type === 'miniature';

  for (let i = 0; i < whole; i++) {
    const result = await addBrickToCategory(
      categoryId,
      category.defaultColor,
      1,
      null,
      isMiniature,
    );
    results.push(result);
  }

  return results;
}

/** Add exactly enough bricks to reach the next building stage (test phase shortcut). */
export async function grantBricksToNextStage(
  categoryId: string,
): Promise<{ results: BrickCreationResult[]; granted: number }> {
  if (!__DEV__) {
    throw new Error('grantBricksToNextStage is only available in development builds');
  }
  const category = await getCategoryById(categoryId);
  if (!category) throw new Error('Category not found');

  const checkpoint = getCheckpointProgress(category.totalBrickValue, category.type);
  const granted = Math.max(1, Math.ceil(checkpoint.remaining));
  const isMiniature = category.type === 'miniature';
  const result = await addBrickToCategory(
    categoryId,
    category.defaultColor,
    granted,
    null,
    isMiniature,
  );
  return { results: [result], granted };
}
