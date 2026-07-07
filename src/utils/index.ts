const MS_PER_HOUR = 3_600_000;

export function msToBrickValue(ms: number, fractionalEnabled = true): number {
  const raw = ms / MS_PER_HOUR;
  if (!fractionalEnabled) {
    return Math.floor(raw);
  }
  return Math.round(raw * 1000) / 1000;
}

/** Split a focus-session brick total into one record per full hour plus any remainder. */
export function splitBrickValue(total: number, fractionalEnabled = true): number[] {
  const chunks: number[] = [];
  let remaining = Math.round(total * 1000) / 1000;
  if (remaining <= 0) return chunks;

  if (!fractionalEnabled) {
    const whole = Math.floor(remaining);
    for (let i = 0; i < whole; i++) chunks.push(1);
    return chunks;
  }

  while (remaining > 0.0001) {
    const chunk = remaining >= 1 ? 1 : remaining;
    chunks.push(Math.round(chunk * 1000) / 1000);
    remaining -= chunk;
    remaining = Math.round(remaining * 1000) / 1000;
  }
  return chunks;
}

export function brickValueToHours(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatBrickValue(value: number): string {
  if (value >= 1 && value === Math.floor(value)) {
    return String(value);
  }
  return value.toFixed(2);
}

export function todayLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isConsecutiveDay(previousDate: string | null, currentDate: string): boolean {
  if (!previousDate) return false;
  const prev = new Date(previousDate + 'T12:00:00');
  const curr = new Date(currentDate + 'T12:00:00');
  const diffMs = curr.getTime() - prev.getTime();
  const oneDay = 86_400_000;
  return diffMs >= oneDay && diffMs < oneDay * 2;
}

export function isSameDay(dateA: string, dateB: string): boolean {
  return dateA === dateB;
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function normalizeColor(hex: string): string {
  const cleaned = hex.replace('#', '').toUpperCase();
  if (cleaned.length === 3) {
    return (
      '#' +
      cleaned
        .split('')
        .map((c) => c + c)
        .join('')
    );
  }
  return '#' + cleaned.slice(0, 6);
}
