export type CategoryTheme = 'study' | 'career' | 'fitness' | 'creative' | 'resist' | 'general';

const THEME_KEYWORDS: Record<Exclude<CategoryTheme, 'general' | 'resist'>, string[]> = {
  study: ['study', 'learn', 'school', 'exam', 'course', 'read', 'homework', 'uni', 'college', 'math', 'science'],
  career: ['work', 'code', 'job', 'career', 'build', 'project', 'business', 'startup', 'dev', 'design'],
  fitness: ['gym', 'fit', 'run', 'workout', 'health', 'walk', 'sport', 'train', 'yoga'],
  creative: ['art', 'music', 'write', 'draw', 'paint', 'create', 'craft', 'photo'],
};

export function detectCategoryTheme(categoryName: string, isMiniature: boolean): CategoryTheme {
  if (isMiniature) return 'resist';
  const lower = categoryName.toLowerCase();
  for (const [theme, words] of Object.entries(THEME_KEYWORDS) as [CategoryTheme, string[]][]) {
    if (words.some((w) => lower.includes(w))) return theme;
  }
  return 'general';
}
