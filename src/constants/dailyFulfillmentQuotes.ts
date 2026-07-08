export interface FulfillmentQuote {
  text: string;
  author: string;
}

export const DAILY_FULFILLMENT_QUOTES: FulfillmentQuote[] = [
  {
    text: 'Waste no more time arguing what a good man should be. Be one.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'You have power over your mind — not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'The best time to plant a tree was twenty years ago. The second best time is now.',
    author: 'Jim Rohn',
  },
  {
    text: 'Discipline is the bridge between goals and accomplishment.',
    author: 'Jim Rohn',
  },
  {
    text: 'Success is nothing more than a few simple disciplines, practiced every day.',
    author: 'Jim Rohn',
  },
  {
    text: 'A journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
  },
  {
    text: 'The flame that burns twice as bright burns half as long. Build steadily, and endure.',
    author: 'Lao Tzu',
  },
  {
    text: 'Every day you practice, you invest in the person you are becoming.',
    author: 'Shi Heng Yi',
  },
  {
    text: 'Your future is built in the quiet moments when no one is watching.',
    author: 'Shi Heng Yi',
  },
  {
    text: 'Do not wish for an easy life. Wish for the strength to build a worthy one.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'Motivation is what gets you started. Habit is what keeps you building.',
    author: 'Jim Rohn',
  },
  {
    text: 'Nature does not hurry, yet everything is accomplished. Lay one brick, then the next.',
    author: 'Lao Tzu',
  },
];

export function getDailyFulfillmentQuote(dateKey: string): FulfillmentQuote {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return DAILY_FULFILLMENT_QUOTES[hash % DAILY_FULFILLMENT_QUOTES.length];
}
