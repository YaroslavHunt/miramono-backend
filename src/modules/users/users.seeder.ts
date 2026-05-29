import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UsersService } from './users.service';

@Injectable()
export class UsersSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersSeeder.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const login = this.config.getOrThrow<string>('admin.login');
    const password = this.config.getOrThrow<string>('admin.password');
    const created = await this.users.ensureAdmin(login, password);
    if (created) {
      this.logger.log(`Seeded admin account "${login}"`);
    }
  }
}
