import { randomUUID } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const user = await this.users.create({ ...dto, role: UserRole.Patient });
    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByLoginWithSecrets(dto.login);
    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueSession(user);
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthResult> {
    const user = await this.users.findByIdWithRefreshToken(userId);
    if (
      !user ||
      !user.isActive ||
      !user.hashedRefreshToken ||
      !(await argon2.verify(user.hashedRefreshToken, refreshToken))
    ) {
      throw new UnauthorizedException('Access denied');
    }
    return this.issueSession(user);
  }

  async logout(userId: string): Promise<void> {
    await this.users.setRefreshTokenHash(userId, null);
  }

  private async issueSession(user: User): Promise<AuthResult> {
    const tokens = await this.signTokens(user);
    const hashedRefreshToken = await argon2.hash(tokens.refreshToken);
    await this.users.setRefreshTokenHash(user.id, hashedRefreshToken);
    return { ...tokens, user };
  }

  private async signTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, login: user.login, role: user.role };
    const expiry = (key: string) => this.config.get<string>(key) as JwtSignOptions['expiresIn'];
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { ...payload, jti: randomUUID() },
        {
          secret: this.config.getOrThrow<string>('jwt.accessSecret'),
          expiresIn: expiry('jwt.accessTtl'),
        },
      ),
      this.jwt.signAsync(
        { ...payload, jti: randomUUID() },
        {
          secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
          expiresIn: expiry('jwt.refreshTtl'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
