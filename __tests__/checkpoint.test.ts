import { getCheckpointProgress } from '../src/features/progression/checkpointProgress';
import { withCategoryLock } from '../src/utils/categoryLock';

describe('getCheckpointProgress', () => {
  it('shows progress toward next stage', () => {
    const p = getCheckpointProgress(100, 'miniature');
    expect(p.current).toBe(100);
    expect(p.target).toBe(120);
    expect(p.remaining).toBe(20);
    expect(p.nextStageName).toBe('Garden Enclosure');
    expect(p.label).toBe('100/120');
    expect(p.hint).toBe('20 more until Garden Enclosure');
  });

  it('at max stage uses final cumulative', () => {
    const p = getCheckpointProgress(11000, 'standard');
    expect(p.target).toBe(11000);
  });
});

describe('withCategoryLock', () => {
  it('runs jobs sequentially per category', async () => {
    const order: number[] = [];
    const p1 = withCategoryLock('cat-a', async () => {
      order.push(1);
      await new Promise((r) => setTimeout(r, 30));
      order.push(2);
    });
    const p2 = withCategoryLock('cat-a', async () => {
      order.push(3);
    });
    await Promise.all([p1, p2]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('allows parallel work on different categories', async () => {
    let aDone = false;
    let bDone = false;
    await Promise.all([
      withCategoryLock('a', async () => {
        await new Promise((r) => setTimeout(r, 20));
        aDone = true;
      }),
      withCategoryLock('b', async () => {
        bDone = true;
      }),
    ]);
    expect(aDone && bDone).toBe(true);
  });
});
