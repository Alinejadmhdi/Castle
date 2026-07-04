import { useEffect, useState } from 'react';
import type { CategoryType } from '@/types';
import { getMotivationQuote } from '@/features/motivation/motivationService';

export function useMotivationQuote(
  categoryName: string | undefined,
  totalBrickValue: number,
  categoryType: CategoryType,
  refreshKey = 0,
): string | null {
  const [quote, setQuote] = useState<string | null>(null);
  const stableTotal = Math.floor(totalBrickValue / 5) * 5;

  useEffect(() => {
    if (!categoryName) return;
    let cancelled = false;
    void getMotivationQuote(categoryName, stableTotal || totalBrickValue, categoryType).then(
      (text) => {
        if (!cancelled) setQuote(text);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [categoryName, stableTotal, totalBrickValue, categoryType, refreshKey]);

  return quote;
}
