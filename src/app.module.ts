import { join } from 'node:path';

import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { DataSource, DataSourceOptions } from 'typeorm';

import {
  adminConfig,
  appConfig,
  i18nConfig,
  jwtConfig,
  liqpayConfig,
  redisConfig,
  seoConfig,
  throttleConfig,
  uploadConfig,
} from './config/configuration';
import { validate } from './config/env.validation';
import { AppCacheModule } from './common/cache/cache.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { dataSourceOptions } from './database/data-source';
import { HealthModule } from './health/health.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { BlogModule } from './modules/blog/blog.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ClinicModule } from './modules/clinic/clinic.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SeoModule } from './modules/seo/seo.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [
        appConfig,
        redisConfig,
        throttleConfig,
        jwtConfig,
        adminConfig,
        uploadConfig,
        liqpayConfig,
        seoConfig,
        i18nConfig,
      ],
    }),
    I18nModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        fallbackLanguage: config.get<string>('i18n.fallbackLanguage') ?? 'uk',
        loaderOptions: { path: join(__dirname, 'i18n'), watch: false },
      }),
      resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...dataSourceOptions, autoLoadEntities: true }),
      dataSourceFactory: async (options) =>
        new DataSource(options as DataSourceOptions).initialize(),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [createKeyv(config.get<string>('redis.url'))],
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl') ?? 60000,
            limit: config.get<number>('throttle.limit') ?? 120,
          },
        ],
      }),
    }),
    AppCacheModule,
    HealthModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    DoctorsModule,
    ClinicModule,
    AppointmentsModule,
    ConsultationsModule,
    BlogModule,
    ReviewsModule,
    GalleryModule,
    UploadsModule,
    PaymentsModule,
    SeoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
