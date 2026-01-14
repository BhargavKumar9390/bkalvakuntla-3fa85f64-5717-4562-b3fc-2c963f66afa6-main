import { userHasPermission } from './rbac';
import {
  RoleName,
  Permission,
  RoleAssignment,
} from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';

describe('userHasPermission', () => {
  const orgs: Record<string, { id: string; parentId?: string | null }> = {
    A: { id: 'A', parentId: null },
    B: { id: 'B', parentId: 'A' },
    C: { id: 'C', parentId: 'B' },
  };

  const resolver = (id: string) => orgs[id] || null;

  it('allows inherited permission for ADMIN on child org', async () => {
    const roles: RoleAssignment[] = [
      { role: RoleName.ADMIN, organizationId: 'A' } as any,
    ];
    const ok = await userHasPermission(
      roles,
      Permission.READ_TASK,
      'B',
      resolver as any
    );
    expect(ok).toBe(true);
  });

  it('denies non-inherited role (VIEWER) on child org', async () => {
    const roles: RoleAssignment[] = [
      { role: RoleName.VIEWER, organizationId: 'A' } as any,
    ];
    const ok = await userHasPermission(
      roles,
      Permission.READ_TASK,
      'B',
      resolver as any
    );
    expect(ok).toBe(false);
  });

  it('allows exact-org permission for VIEWER on same org', async () => {
    const roles: RoleAssignment[] = [
      { role: RoleName.VIEWER, organizationId: 'B' } as any,
    ];
    const ok = await userHasPermission(
      roles,
      Permission.READ_TASK,
      'B',
      resolver as any
    );
    expect(ok).toBe(true);
  });

  it('returns false when no roles', async () => {
    const ok = await userHasPermission(
      [],
      Permission.READ_TASK,
      'A',
      resolver as any
    );
    expect(ok).toBe(false);
  });

  it('supports async org resolver and deep ancestry', async () => {
    const asyncResolver = async (id: string) =>
      Promise.resolve(orgs[id] || null);
    const roles: RoleAssignment[] = [
      { role: RoleName.ADMIN, organizationId: 'A' } as any,
    ];
    // C is descendant of A through B
    const ok = await userHasPermission(
      roles,
      Permission.CREATE_TASK,
      'C',
      asyncResolver as any
    );
    expect(ok).toBe(true);
  });

  it('caches resolver calls during traversal', async () => {
    let calls = 0;
    const countingResolver = async (id: string) => {
      calls += 1;
      return orgs[id] || null;
    };

    const roles: RoleAssignment[] = [
      { role: RoleName.ADMIN, organizationId: 'A' } as any,
    ];
    const ok = await userHasPermission(
      roles,
      Permission.READ_TASK,
      'C',
      countingResolver as any
    );
    expect(ok).toBe(true);
    // traversal should not call resolver excessively; expect at most 3 calls (C, B, A)
    expect(calls).toBeLessThanOrEqual(3);
  });

  it('allows when any role grants permission among multiple role assignments', async () => {
    const roles: RoleAssignment[] = [
      { role: RoleName.VIEWER, organizationId: 'A' } as any,
      { role: RoleName.ADMIN, organizationId: 'B' } as any,
    ];
    // ADMIN at B should grant READ_TASK on C
    const ok = await userHasPermission(
      roles,
      Permission.READ_TASK,
      'C',
      resolver as any
    );
    expect(ok).toBe(true);
  });

  it('denies when roles exist but none grant the specific permission', async () => {
    const roles: RoleAssignment[] = [
      { role: RoleName.VIEWER, organizationId: 'C' } as any,
    ];
    const ok = await userHasPermission(
      roles,
      Permission.DELETE_TASK,
      'C',
      resolver as any
    );
    expect(ok).toBe(false);
  });

  it('OWNER grants all permissions and inherits to children', async () => {
    const roles: RoleAssignment[] = [
      { role: RoleName.OWNER, organizationId: 'A' } as any,
    ];
    const okCreate = await userHasPermission(
      roles,
      Permission.CREATE_TASK,
      'B',
      resolver as any
    );
    const okDelete = await userHasPermission(
      roles,
      Permission.DELETE_TASK,
      'C',
      resolver as any
    );
    expect(okCreate).toBe(true);
    expect(okDelete).toBe(true);
  });

  it('OWNER exact-org permission works as expected', async () => {
    const roles: RoleAssignment[] = [
      { role: RoleName.OWNER, organizationId: 'B' } as any,
    ];
    const ok = await userHasPermission(
      roles,
      Permission.VIEW_AUDIT,
      'B',
      resolver as any
    );
    expect(ok).toBe(true);
  });
});
