import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { AppModule } from '../../app.module';
import { UsersService } from '../../modules/users/users.service';
import { seedDemoData } from './demo-data';

async function run(): Promise<void> {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const config = app.get(ConfigService);
    const users = app.get(UsersService);
    const login = config.getOrThrow<string>('admin.login');
    const password = config.getOrThrow<string>('admin.password');
    const created = await users.ensureAdmin(login, password);
    logger.log(created ? `Created admin "${login}"` : `Admin "${login}" already exists`);

    await seedDemoData(app.get(DataSource));
  } finally {
    await app.close();
  }
}

void run();
