export function createCacheMock() {
  return {
    wrap: jest.fn((_key: string, _ttl: number, loader: () => unknown) => loader()),
    namespacedKey: jest.fn((namespace: string, suffix: string) =>
      Promise.resolve(`${namespace}:v1:${suffix}`),
    ),
    serializeQuery: jest.fn((query: Record<string, unknown>) => JSON.stringify(query)),
    invalidate: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
}
