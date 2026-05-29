import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  url: `redis://${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? 6379}`,
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: Number(process.env.THROTTLE_TTL ?? 60000),
  limit: Number(process.env.THROTTLE_LIMIT ?? 120),
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
}));

export const adminConfig = registerAs('admin', () => ({
  login: process.env.ADMIN_LOGIN,
  password: process.env.ADMIN_PASSWORD,
}));

export const uploadConfig = registerAs('upload', () => ({
  dir: process.env.UPLOAD_DIR ?? 'uploads',
  servePath: '/uploads',
  maxFileSizeBytes: 5 * 1024 * 1024,
}));

export const liqpayConfig = registerAs('liqpay', () => ({
  publicKey: process.env.LIQPAY_PUBLIC_KEY,
  privateKey: process.env.LIQPAY_PRIVATE_KEY,
  sandbox: (process.env.LIQPAY_SANDBOX ?? 'true').toLowerCase() !== 'false',
  checkoutUrl: 'https://www.liqpay.ua/api/3/checkout',
  apiVersion: 3,
}));

export const seoConfig = registerAs('seo', () => ({
  siteUrl: (process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
}));

export const i18nConfig = registerAs('i18n', () => ({
  fallbackLanguage: process.env.DEFAULT_LOCALE ?? 'uk',
}));
