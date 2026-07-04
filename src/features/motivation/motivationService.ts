import type { CategoryType } from '@/types';
import { detectCategoryTheme } from './categoryTheme';
import { getMilestoneMessage } from './stageMilestones';
import { getCheckpointProgress } from '@/features/progression/checkpointProgress';

async function fetchGeminiQuote(
  categoryName: string,
  totalHours: number,
  isMiniature: boolean,
  checkpointHint: string,
  milestone: string,
): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const mode = isMiniature
    ? `resisting the temptation "${categoryName}"`
    : `focused work on "${categoryName}" (1 brick = 1 hour)`;

  const prompt = `Write ONE encouraging sentence (max 28 words) for someone doing ${mode}. They have ${Math.floor(totalHours)} total logged. Progress: ${checkpointHint}. Real-world meaning: ${milestone}. Mention their category by name. Warm, specific, no slang.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 80, temperature: 0.75 },
        }),
      },
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text && text.length > 0 ? text.replace(/^["']|["']$/g, '') : null;
  } catch {
    return null;
  }
}

function localQuote(
  categoryName: string,
  totalHours: number,
  categoryType: CategoryType,
): string {
  const isMiniature = categoryType === 'miniature';
  const theme = detectCategoryTheme(categoryName, isMiniature);
  const checkpoint = getCheckpointProgress(totalHours, categoryType);
  const milestone = getMilestoneMessage(theme, Math.max(totalHours, 1));

  if (isMiniature) {
    return `${milestone} ${checkpoint.hint} (${checkpoint.label} toward ${checkpoint.nextStageName}).`;
  }
  return `${milestone} ${checkpoint.hint} (${checkpoint.label} toward ${checkpoint.nextStageName}).`;
}

export async function getMotivationQuote(
  categoryName: string,
  totalBrickValue: number,
  categoryType: CategoryType,
): Promise<string> {
  const isMiniature = categoryType === 'miniature';
  const checkpoint = getCheckpointProgress(totalBrickValue, categoryType);
  const theme = detectCategoryTheme(categoryName, isMiniature);
  const milestone = getMilestoneMessage(theme, Math.max(totalBrickValue, 1));

  const remote = await fetchGeminiQuote(
    categoryName,
    totalBrickValue,
    isMiniature,
    checkpoint.hint,
    milestone,
  );
  if (remote) return remote;

  return localQuote(categoryName, totalBrickValue, categoryType);
}
