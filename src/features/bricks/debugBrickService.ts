import { addBrickToCategory } from './brickService';
import { getCategoryById } from '@/services/database/repositories';
import type { BrickCreationResult } from './brickService';

/**
 * Dev-only: add whole bricks to a category (triggers stage unlocks + monuments).
 * Use from Settings → Developer tools in Expo Go (__DEV__).
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
