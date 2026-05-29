import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { QueryFailedError, Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';

const PG_UNIQUE_VIOLATION = '23505';

export interface CreateUserData {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  role?: UserRole;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const existing = await this.users.findOne({ where: { login: data.login } });
    if (existing) {
      throw new ConflictException('Login already taken');
    }

    const passwordHash = await argon2.hash(data.password);
    const user = this.users.create({
      login: data.login,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email ?? null,
      role: data.role ?? UserRole.Patient,
    });

    return this.users.save(user);
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async getById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  findByLoginWithSecrets(login: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.login = :login', { login })
      .getOne();
  }

  findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.hashedRefreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.getById(id);
    Object.assign(user, data);
    return this.users.save(user);
  }

  async setRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.users.update(id, { hashedRefreshToken: hash });
  }

  async ensureAdmin(login: string, password: string): Promise<boolean> {
    const existing = await this.users.findOne({ where: { login } });
    if (existing) {
      return false;
    }

    try {
      await this.create({
        login,
        password,
        firstName: 'System',
        lastName: 'Administrator',
        phone: '',
        role: UserRole.Admin,
      });
      return true;
    } catch (error) {
      // a concurrent boot/replica may seed the same admin first — that is fine
      if (error instanceof ConflictException || this.isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { code?: string }).code === PG_UNIQUE_VIOLATION
    );
  }
}
