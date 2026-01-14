import { Reflector } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';
import {
  RoleName,
  Permission,
} from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';
import { ForbiddenException } from '@nestjs/common';

describe('RbacGuard (HTTP)', () => {
  const orgs: Record<string, { id: string; parentId?: string | null }> = {
    A: { id: 'A', parentId: null },
    B: { id: 'B', parentId: 'A' },
  };
  const orgResolver = (id: string) => orgs[id] || null;

  function makeCtx(req: any) {
    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => req.handler || (() => {}),
    } as any;
  }

  it('throws when no user present', async () => {
    const reflector = {
      get: () => [Permission.READ_TASK],
    } as unknown as Reflector;
    const guard = new RbacGuard(reflector, orgResolver as any);
    const ctx = makeCtx({});
    await expect(guard.canActivate(ctx as any)).rejects.toThrow(
      ForbiddenException
    );
  });

  it('throws when resource org id missing', async () => {
    const reflector = {
      get: () => [Permission.READ_TASK],
    } as unknown as Reflector;
    const guard = new RbacGuard(reflector, orgResolver as any);
    const ctx = makeCtx({ user: { roles: [] } });
    await expect(guard.canActivate(ctx as any)).rejects.toThrow(
      ForbiddenException
    );
  });

  it('allows when role grants inherited permission', async () => {
    const reflector = {
      get: () => [Permission.READ_TASK],
    } as unknown as Reflector;
    const guard = new RbacGuard(reflector, orgResolver as any);
    const user = { roles: [{ role: RoleName.ADMIN, organizationId: 'A' }] };
    // place resource org id on request body for check
    const ctx2 = makeCtx({ user, body: { organizationId: 'B' } });
    await expect(guard.canActivate(ctx2 as any)).resolves.toBe(true);
  });

  it('throws when user lacks permission', async () => {
    const reflector = {
      get: () => [Permission.DELETE_TASK],
    } as unknown as Reflector;
    const guard = new RbacGuard(reflector, orgResolver as any);
    const user = { roles: [{ role: RoleName.VIEWER, organizationId: 'B' }] };
    const ctx = makeCtx({ user, body: { organizationId: 'B' } });
    await expect(guard.canActivate(ctx as any)).rejects.toThrow(
      ForbiddenException
    );
  });

  it('allows when handler has no permissions metadata', async () => {
    const reflector = { get: () => undefined } as unknown as Reflector;
    const guard = new RbacGuard(reflector, orgResolver as any);
    const user = { roles: [] };
    const ctx = makeCtx({ user, body: { organizationId: 'A' } });
    await expect(guard.canActivate(ctx as any)).resolves.toBe(true);
  });

  it('works with async orgResolver returning promises', async () => {
    const asyncResolver = async (id: string) =>
      Promise.resolve(orgs[id] || null);
    const reflector = {
      get: () => [Permission.READ_TASK],
    } as unknown as Reflector;
    const guard = new RbacGuard(reflector, asyncResolver as any);
    const user = { roles: [{ role: RoleName.ADMIN, organizationId: 'A' }] };
    const ctx = makeCtx({ user, body: { organizationId: 'B' } });
    await expect(guard.canActivate(ctx as any)).resolves.toBe(true);
  });

  it('allows when multiple permissions are required and user has them all', async () => {
    const reflector = {
      get: () => [Permission.CREATE_TASK, Permission.READ_TASK],
    } as unknown as Reflector;
    const guard = new RbacGuard(reflector, orgResolver as any);
    const user = { roles: [{ role: RoleName.ADMIN, organizationId: 'A' }] };
    const ctx = makeCtx({ user, body: { organizationId: 'B' } });
    await expect(guard.canActivate(ctx as any)).resolves.toBe(true);
  });
});
