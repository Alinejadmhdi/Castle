import { useEffect, useRef } from 'react';

/** Debounce store/category refresh during rapid resist taps. */
export function useDebouncedRefresh(refresh: (id: string) => Promise<void>, delayMs = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (categoryId: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void refresh(categoryId);
    }, delayMs);
  };
}
