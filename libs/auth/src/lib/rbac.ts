import {
  RoleName,
  Permission,
  RoleAssignment,
} from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';

// Map role -> permissions
const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  [RoleName.OWNER]: [
    Permission.CREATE_ORG,
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.VIEW_AUDIT,
  ],
  // Admins can create, read and update but not delete
  [RoleName.ADMIN]: [
    Permission.CREATE_ORG,
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.VIEW_AUDIT,
  ],
  // Viewers can read and toggle completion only
  [RoleName.VIEWER]: [Permission.READ_TASK, Permission.TOGGLE_COMPLETE],
};

export function getPermissionsForRole(role: RoleName): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Role inheritance rules:
// - OWNER and ADMIN roles inherit to child organizations (if assigned on parent org)
// - VIEWER applies only to exact org
export function isRoleInheritedDown(role: RoleName) {
  return role === RoleName.OWNER || role === RoleName.ADMIN;
}

export async function userHasPermission(
  roles: RoleAssignment[] | undefined | any[],
  permission: Permission,
  resourceOrgId?: string | null,
  orgResolver?:
    | ((
        orgId?: string | null
      ) => Promise<{ id: string; parentId?: string | null } | null>)
    | ((
        orgId?: string | null
      ) => { id: string; parentId?: string | null } | null)
    | null
) {
  // Support being passed a full `user` object (client tokens may include `permissions` array)
  if (roles && !Array.isArray(roles) && typeof roles === 'object') {
    // If `permissions` present on the object, use it directly (string or object shapes)
    const maybePerms = (roles as any).permissions;
    if (Array.isArray(maybePerms)) {
      const perms = maybePerms.map((p: any) =>
        typeof p === 'string' ? p : p.permission || p.name || p
      );
      return perms.includes(permission as any);
    }

    // If it's a full user object with nested `roles`, use that roles array going forward
    if ((roles as any).roles) {
      roles = (roles as any).roles;
    }
  }

  if (!roles || roles.length === 0) return false;

  // Normalize incoming role shapes to { role: string, organizationId?: string }
  const normalized = (roles || []).map((r: any) => {
    if (typeof r === 'string')
      return { role: r as RoleName, organizationId: undefined };
    return {
      role: (r.role || r.name || r.roleName) as RoleName,
      organizationId: r.organizationId || r.org || undefined,
    };
  });

  // Per-call cache for orgResolver results to avoid duplicate lookups
  const cache = new Map<
    string,
    { id: string; parentId?: string | null } | null
  >();
  const resolve = async (id?: string | null) => {
    if (!id) return null;
    if (cache.has(id)) return cache.get(id) as any;
    try {
      const res = orgResolver
        ? await Promise.resolve(orgResolver(id as any))
        : null;
      cache.set(id, res || null);
      return res as { id: string; parentId?: string | null } | null;
    } catch {
      cache.set(id, null);
      return null;
    }
  };

  for (const r of normalized) {
    if (!r || !r.role) continue;
    const perms = getPermissionsForRole(r.role as RoleName);
    if (!perms.includes(permission)) continue;

    // If assignment has no org, treat as global grant for the permission
    if (!r.organizationId) return true;

    if (r.organizationId === resourceOrgId) return true;

    if (isRoleInheritedDown(r.role as RoleName)) {
      // walk up from resourceOrgId to root and see if we hit r.organizationId
      let cur = (await resolve(resourceOrgId as any)) as {
        id: string;
        parentId?: string | null;
      } | null;
      while (cur) {
        if (cur.id === r.organizationId) return true;
        if (!cur.parentId) break;
        cur = (await resolve(cur.parentId as any)) as {
          id: string;
          parentId?: string | null;
        } | null;
      }
    }
  }

  return false;
}
