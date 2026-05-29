import { Cache } from '@nestjs/cache-manager';

import { CacheService } from './cache.service';

class FakeCache {
  private readonly store = new Map<string, unknown>();

  get = jest.fn((key: string) =>
    Promise.resolve(this.store.has(key) ? this.store.get(key) : undefined),
  );

  set = jest.fn((key: string, value: unknown) => {
    this.store.set(key, value);
    return Promise.resolve(value);
  });

  del = jest.fn((key: string) => Promise.resolve(this.store.delete(key)));
}

describe('CacheService', () => {
  let fake: FakeCache;
  let cache: CacheService;

  beforeEach(() => {
    fake = new FakeCache();
    cache = new CacheService(fake as unknown as Cache);
  });

  it('computes the loader once and serves the cached value afterwards', async () => {
    const loader = jest.fn().mockResolvedValue('value');
    expect(await cache.wrap('k', 1000, loader)).toBe('value');
    expect(await cache.wrap('k', 1000, loader)).toBe('value');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('caches a null result and does not recompute it', async () => {
    const loader = jest.fn().mockResolvedValue(null);
    expect(await cache.wrap('empty', 1000, loader)).toBeNull();
    expect(await cache.wrap('empty', 1000, loader)).toBeNull();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('rotates namespaced keys on invalidation so stale entries are unreachable', async () => {
    const before = await cache.namespacedKey('services', 'list');
    await cache.invalidate('services');
    const after = await cache.namespacedKey('services', 'list');
    expect(after).not.toBe(before);
  });

  it('serializes queries deterministically and skips empty values', () => {
    expect(cache.serializeQuery({ b: 2, a: 1, c: undefined })).toBe('a=1&b=2');
    expect(cache.serializeQuery({})).toBe('all');
  });
});
