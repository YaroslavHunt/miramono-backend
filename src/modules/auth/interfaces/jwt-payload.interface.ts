import { UserRole } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  login: string;
  role: UserRole;
}
