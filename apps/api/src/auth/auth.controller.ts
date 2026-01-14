import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { signJwt } from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/auth';
import { RoleName } from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private usersService: UsersService) {}

  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      organizationId: string;
      displayName?: string;
      role?: string;
    }
  ) {
    this.logger.log(
      `Registration request received for: ${body.email}, requested role: ${
        body.role || 'not provided'
      }`
    );

    const existing = await this.usersService.findByEmail(body.email);
    if (existing) throw new BadRequestException('Email already exists');

    const u = await this.usersService.createUser(
      body.email,
      body.password,
      body.organizationId,
      body.displayName
    );

    // Parse and validate the role
    let roleToAssign = RoleName.OWNER;
    if (body.role) {
      const upperRole = body.role.toUpperCase();
      if (upperRole === 'VIEWER') {
        roleToAssign = RoleName.VIEWER;
      } else if (upperRole === 'ADMIN') {
        roleToAssign = RoleName.ADMIN;
      } else if (upperRole === 'OWNER') {
        roleToAssign = RoleName.OWNER;
      }
    }

    this.logger.log(`Assigning role ${roleToAssign} to user ${u.email}`);

    try {
      const roleAssignment = await this.usersService.assignRole(
        u.id,
        roleToAssign as any,
        body.organizationId
      );
      this.logger.log(
        `Role assignment created: ${JSON.stringify(roleAssignment)}`
      );
    } catch (e) {
      this.logger.error(`Failed to assign role: ${e.message}`, e.stack);
    }

    return { id: u.id, email: u.email, role: roleToAssign };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(body.email);
    if (!user) throw new BadRequestException('Invalid credentials');
    const ok = await this.usersService.validatePassword(user, body.password);
    if (!ok) throw new BadRequestException('Invalid credentials');

    this.logger.log(
      `User ${user.email} logging in. Raw roles from DB: ${JSON.stringify(
        user.roles
      )}`
    );

    const roles = (user.roles || []).map((r: any) =>
      typeof r === 'string' ? r : r.role || r.name
    );

    this.logger.log(`Parsed roles for JWT: ${JSON.stringify(roles)}`);

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      organizationId: user.organizationId,
    };
    const token = signJwt(payload);
    return {
      accessToken: token,
      expiresIn: process.env.JWT_EXPIRATION || '1h',
    };
  }
}
