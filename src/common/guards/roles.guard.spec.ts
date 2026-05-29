import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../modules/users/entities/user.entity';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  function context(user?: { role?: UserRole }): ExecutionContext {
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  function guardWith(roles: UserRole[] | undefined): RolesGuard {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(roles),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  it('allows access when no roles are required', () => {
    expect(guardWith(undefined).canActivate(context({ role: UserRole.Patient }))).toBe(true);
  });

  it('allows a user that has a required role', () => {
    expect(guardWith([UserRole.Admin]).canActivate(context({ role: UserRole.Admin }))).toBe(true);
  });

  it('forbids a user that lacks the required role', () => {
    expect(() =>
      guardWith([UserRole.Admin]).canActivate(context({ role: UserRole.Patient })),
    ).toThrow(ForbiddenException);
  });
});
