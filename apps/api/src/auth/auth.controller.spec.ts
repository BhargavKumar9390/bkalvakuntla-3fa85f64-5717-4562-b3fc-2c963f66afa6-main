import { AuthController } from './auth.controller';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  const mockUser = {
    id: 'u1',
    email: 'test@example.com',
    passwordHash: 'irrelevant',
    roles: ['ADMIN'],
    organizationId: 'org1',
  } as any;

  it('returns token on successful login', async () => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      validatePassword: jest.fn().mockResolvedValue(true),
    } as any;

    const ctrl = new AuthController(usersService);
    const res = await ctrl.login({ email: 'test@example.com', password: 'pw' });
    expect(res).toHaveProperty('accessToken');
    expect(res).toHaveProperty('expiresIn');
    expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(usersService.validatePassword).toHaveBeenCalledWith(mockUser, 'pw');
  });

  it('throws BadRequestException for missing user', async () => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
    } as any;
    const ctrl = new AuthController(usersService);
    await expect(
      ctrl.login({ email: 'noone@example.com', password: 'pw' })
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for invalid password', async () => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      validatePassword: jest.fn().mockResolvedValue(false),
    } as any;
    const ctrl = new AuthController(usersService);
    await expect(
      ctrl.login({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toThrow(BadRequestException);
  });
});
