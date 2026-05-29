import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async wrap<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    const fresh = await loader();
    await this.cache.set(key, fresh, ttlMs);
    return fresh;
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async namespacedKey(namespace: string, suffix: string): Promise<string> {
    return `${namespace}:v${await this.version(namespace)}:${suffix}`;
  }

  async invalidate(namespace: string): Promise<void> {
    await this.cache.set(this.versionKey(namespace), (await this.version(namespace)) + 1);
  }

  serializeQuery(query: Record<string, unknown>): string {
    const parts = Object.keys(query)
      .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== '')
      .sort()
      .map((key) => `${key}=${String(query[key])}`);
    return parts.length > 0 ? parts.join('&') : 'all';
  }

  private async version(namespace: string): Promise<number> {
    const current = await this.cache.get<number>(this.versionKey(namespace));
    if (typeof current === 'number') {
      return current;
    }
    await this.cache.set(this.versionKey(namespace), 1);
    return 1;
  }

  private versionKey(namespace: string): string {
    return `${namespace}:__version`;
  }
}
