import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators';
import { userHasPermission } from './rbac';
import { Permission } from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('ORG_RESOLVER')
    private orgResolver: (
      id: string
    ) =>
      | Promise<{ id: string; parentId?: string | null } | null>
      | { id: string; parentId?: string | null }
      | null
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler()) || [];
    if (!required || required.length === 0) return true; // no permissions required

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user)
      throw new ForbiddenException(
        'No user in request (JWT guard must run before RBAC)'
      );

    // Determine resource org id from common locations
    const resourceOrgId =
      req.params?.organizationId ||
      req.body?.organizationId ||
      req.query?.organizationId ||
      req.body?.task?.organizationId ||
      req.params?.idOrg ||
      undefined;

    for (const p of required) {
      const has = await userHasPermission(
        user.roles,
        p as Permission,
        resourceOrgId,
        this.orgResolver as any
      );
      if (!has) throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
