import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Put,
  Param,
  Delete,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuditService } from './audit.service';
import {
  JwtAuthGuard,
  RbacGuard,
  Permissions,
} from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/auth';
import {
  Permission,
  TaskStatus,
} from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';
import { OrgsService } from '../orgs/orgs.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private orgsService: OrgsService,
    private auditService: AuditService
  ) {}

  @Post()
  @Permissions(Permission.CREATE_TASK)
  @UseGuards(RbacGuard)
  async create(@Body() body: any, @Req() req: any) {
    const user = req.user;
    // Allow specifying organizationId in body, default to user's org
    const targetOrgId = body.organizationId || user.organizationId;
    return this.tasksService.create({ ...body }, user.sub, targetOrgId);
  }

  @Get()
  @Permissions(Permission.READ_TASK)
  @UseGuards(RbacGuard)
  async findAll(@Query() query: any, @Req() req: any) {
    const user = req.user;
    let visibleOrgs: string[];

    // If organizationIds explicitly provided in query, use those
    if (query.organizationIds) {
      visibleOrgs = Array.isArray(query.organizationIds)
        ? query.organizationIds
        : [query.organizationIds];
    } else {
      // Auto-expand based on user's roles
      visibleOrgs = await this.getVisibleOrgsForUser(user);
    }

    return this.tasksService.findAll(query, visibleOrgs);
  }

  private async getVisibleOrgsForUser(user: any): Promise<string[]> {
    const roles = user.roles || [];
    const orgIds = new Set<string>();

    for (const roleAssignment of roles) {
      const role = roleAssignment.role || roleAssignment;
      const orgId = roleAssignment.organizationId || user.organizationId;

      if (role === 'ADMIN' || role === 'OWNER') {
        const descendants = await this.orgsService.findDescendants(orgId);
        descendants.forEach((id) => orgIds.add(id));
      } else {
        orgIds.add(orgId);
      }
    }

    // If no roles or empty set, default to user's org
    if (orgIds.size === 0) {
      orgIds.add(user.organizationId);
    }

    return Array.from(orgIds);
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_TASK)
  @UseGuards(RbacGuard)
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const user = req.user;
    return this.tasksService.update(id, body, user.sub);
  }

  @Patch(':id/toggle')
  @Permissions(Permission.TOGGLE_COMPLETE)
  @UseGuards(RbacGuard)
  async toggleComplete(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const t = await this.tasksService.findById(id);
    if (!t) throw new NotFoundException('Task not found');
    const newStatus =
      t.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    return this.tasksService.update(id, { status: newStatus }, user.sub);
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_TASK)
  @UseGuards(RbacGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.tasksService.remove(id, user.sub);
  }

  @Patch('order')
  @Permissions(Permission.UPDATE_TASK)
  @UseGuards(RbacGuard)
  async reorder(@Body('ids') ids: string[], @Req() req: any) {
    const user = req.user;
    return this.tasksService.reorder(ids, user.sub);
  }

  @Get('/audit-log')
  @Permissions(Permission.VIEW_AUDIT)
  @UseGuards(RbacGuard)
  async audit(@Req() req: any) {
    return this.auditService.getAll();
  }
}
