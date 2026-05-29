import { validate } from './env.validation';

describe('validate (env)', () => {
  const base = {
    NODE_ENV: 'test',
    PORT: '3000',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USERNAME: 'user',
    DB_PASSWORD: 'pass',
    DB_NAME: 'miramono',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    JWT_ACCESS_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
    ADMIN_LOGIN: 'admin',
    ADMIN_PASSWORD: 'admin-secret',
    LIQPAY_PUBLIC_KEY: 'sandbox_i00000000000',
    LIQPAY_PRIVATE_KEY: 'sandbox_private_key',
  };

  it('passes with a complete config and coerces numeric strings', () => {
    const result = validate(base);
    expect(result.PORT).toBe(3000);
    expect(result.DB_PORT).toBe(5432);
    expect(result.REDIS_PORT).toBe(6379);
  });

  it('throws when a required variable is missing', () => {
    const incomplete = { ...base };
    delete (incomplete as Record<string, unknown>).DB_HOST;
    expect(() => validate(incomplete)).toThrow();
  });

  it('throws on an out-of-range port', () => {
    expect(() => validate({ ...base, PORT: '70000' })).toThrow();
  });

  it('throws when a JWT secret is missing', () => {
    const incomplete = { ...base };
    delete (incomplete as Record<string, unknown>).JWT_ACCESS_SECRET;
    expect(() => validate(incomplete)).toThrow();
  });

  it('throws when a LiqPay key is missing', () => {
    const incomplete = { ...base };
    delete (incomplete as Record<string, unknown>).LIQPAY_PRIVATE_KEY;
    expect(() => validate(incomplete)).toThrow();
  });
});
