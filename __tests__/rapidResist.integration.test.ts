jest.mock('../src/services/database/db', () => require('../src/services/database/db.web'));

import { resetDatabase } from '../src/services/database/db.web';
import { createCategory } from '../src/services/database/repositories';
import { logMiniatureResist, logMiniatureResistWithRetry, reconcileWallBrickAbsorption } from '../src/features/bricks/brickService';
import { withDbWrite } from '../src/services/database/dbQueue';
import { waitForCategory } from '../src/services/database/categoryReadiness';
import { sumBrickValueByCategory, getBrickCount } from '../src/services/database/brickRepository';
import { getCategoryById } from '../src/services/database/repositories';

describe('rapid miniature resist (integration)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('creates miniature category and places 40 bricks sequentially', async () => {
    const cat = await createCategory({
      name: 'Social Media',
      defaultColor: '#c45c3a',
      type: 'miniature',
    });

    for (let i = 0; i < 40; i++) {
      await logMiniatureResist(cat.id);
    }

    const updated = await getCategoryById(cat.id);
    const sum = await sumBrickValueByCategory(cat.id);
    const count = await getBrickCount(cat.id);

    expect(count).toBe(40);
    expect(sum).toBe(40);
    expect(updated?.totalBrickValue).toBe(40);
  });

  it('places 30 bricks concurrently (spam taps)', async () => {
    const cat = await createCategory({
      name: 'Junk Food',
      defaultColor: '#c45c3a',
      type: 'miniature',
    });

    const results = await Promise.allSettled(
      Array.from({ length: 30 }, () => logMiniatureResist(cat.id)),
    );

    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    if (failed.length > 0) {
      console.error('Failures:', failed.map((f) => f.reason));
    }

    expect(failed).toHaveLength(0);

    const updated = await getCategoryById(cat.id);
    const count = await getBrickCount(cat.id);
    expect(count).toBe(30);
    expect(updated?.totalBrickValue).toBe(30);
  });

  it('creates category while spamming resists on another', async () => {
    const cat = await createCategory({
      name: 'Resist A',
      defaultColor: '#c45c3a',
      type: 'miniature',
    });

    const resistJob = Promise.all(
      Array.from({ length: 20 }, () => logMiniatureResist(cat.id)),
    );
    const createJob = createCategory({
      name: 'Resist B',
      defaultColor: '#1E40AF',
      type: 'miniature',
    });

    const [, catB] = await Promise.all([resistJob, createJob]);
    expect(catB.name).toBe('Resist B');

    const count = await getBrickCount(cat.id);
    expect(count).toBe(20);
  });

  it('places first brick immediately after creating a miniature category', async () => {
    const cat = await createCategory({
      name: 'Fresh Category',
      defaultColor: '#c45c3a',
      type: 'miniature',
    });

    const result = await logMiniatureResist(cat.id);
    expect(result.bricks).toHaveLength(1);

    const updated = await getCategoryById(cat.id);
    expect(updated?.totalBrickValue).toBe(1);
    expect(await getBrickCount(cat.id)).toBe(1);
  });

  it('waitForCategory finds row immediately after create', async () => {
    const cat = await createCategory({
      name: 'Readiness',
      defaultColor: '#c45c3a',
      type: 'miniature',
    });
    const found = await waitForCategory(cat.id, 3);
    expect(found.id).toBe(cat.id);
    await logMiniatureResistWithRetry(cat.id);
    expect((await getCategoryById(cat.id))?.totalBrickValue).toBe(1);
  });

  it('places first brick while scene reconcile runs (post-create race)', async () => {
    const cat = await createCategory({
      name: 'Fresh Race',
      defaultColor: '#c45c3a',
      type: 'miniature',
    });

    const [result] = await Promise.all([
      logMiniatureResistWithRetry(cat.id),
      withDbWrite(() => reconcileWallBrickAbsorption(cat.id)),
    ]);

    expect(result.bricks).toHaveLength(1);
    expect((await getCategoryById(cat.id))?.totalBrickValue).toBe(1);
  });

  it('createCategory returns without deadlock (nested withDb)', async () => {
    const cat = await createCategory({
      name: 'No Hang',
      defaultColor: '#c45c3a',
      type: 'miniature',
    });
    expect(cat.name).toBe('No Hang');
    await logMiniatureResistWithRetry(cat.id);
    expect((await getCategoryById(cat.id))?.totalBrickValue).toBe(1);
  }, 10000);

  it('places 200 bricks sequentially (one DB write each)', async () => {
    const cat = await createCategory({
      name: 'Stress Test',
      defaultColor: '#c45c3a',
      type: 'miniature',
    });

    for (let i = 0; i < 200; i++) {
      await logMiniatureResist(cat.id);
    }

    const updated = await getCategoryById(cat.id);
    expect(updated?.totalBrickValue).toBe(200);
    expect(await getBrickCount(cat.id)).toBe(200);
    expect(await sumBrickValueByCategory(cat.id)).toBe(200);
  });
});
