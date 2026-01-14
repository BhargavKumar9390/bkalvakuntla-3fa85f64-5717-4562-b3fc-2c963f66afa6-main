import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app/app.module';
import { OrgsService } from '../orgs/orgs.service';
import { UsersService } from '../users/users.service';
import { signJwt } from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/auth';
import { RoleName } from '@bkalvakuntla-3fa85f64-5717-4562-b3fc-2c963f66afa6/data';

describe('Tasks integration (RBAC)', () => {
  let app: INestApplication;
  let orgs: OrgsService;
  let users: UsersService;
  const sfx = String(Date.now()).slice(-6);

  beforeAll(async () => {
    process.env.DATABASE_URL = 'sqlite::memory:';
    process.env.JWT_SECRET = process.env.JWT_SECRET;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    orgs = moduleRef.get(OrgsService);
    users = moduleRef.get(UsersService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows ADMIN on parent org to create task in child org', async () => {
    const a = await orgs.createOrg('A');
    const b = await orgs.createOrg('B', a.id);

    const admin = await users.createUser(`admin+${sfx}@x.test`, 'pass', a.id);
    await users.assignRole(admin.id, RoleName.ADMIN as any, a.id);

    const token = signJwt({
      sub: admin.id,
      email: admin.email,
      roles: [{ role: RoleName.ADMIN, organizationId: a.id }],
      organizationId: a.id,
    });

    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'child task', organizationId: b.id });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('forbids VIEWER from deleting tasks even in same org', async () => {
    const a = await orgs.createOrg('A2');
    const viewer = await users.createUser(`viewer+${sfx}@x.test`, 'pass', a.id);
    await users.assignRole(viewer.id, RoleName.VIEWER as any, a.id);

    const token = signJwt({
      sub: viewer.id,
      email: viewer.email,
      roles: [{ role: RoleName.VIEWER, organizationId: a.id }],
      organizationId: a.id,
    });

    // create a task as admin to have something to delete
    const admin = await users.createUser(`admin2+${sfx}@x.test`, 'pass', a.id);
    await users.assignRole(admin.id, RoleName.ADMIN as any, a.id);
    const adminToken = signJwt({
      sub: admin.id,
      email: admin.email,
      roles: [{ role: RoleName.ADMIN, organizationId: a.id }],
      organizationId: a.id,
    });

    const create = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'to-delete', organizationId: a.id });

    expect(create.status).toBe(201);
    const id = create.body.id;

    const del = await request(app.getHttpServer())
      .delete(`/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(403);
  });

  it('allows ADMIN to update task in child org (inherited)', async () => {
    const a = await orgs.createOrg('U1');
    const b = await orgs.createOrg('U2', a.id);

    const admin = await users.createUser(`adminup+${sfx}@x.test`, 'pass', a.id);
    await users.assignRole(admin.id, RoleName.ADMIN as any, a.id);
    const token = signJwt({
      sub: admin.id,
      email: admin.email,
      roles: [{ role: RoleName.ADMIN, organizationId: a.id }],
      organizationId: a.id,
    });

    // create as admin in child org
    const create = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'updatable task', organizationId: b.id });

    expect(create.status).toBe(201);
    const id = create.body.id;

    const upd = await request(app.getHttpServer())
      .put(`/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'updated title', organizationId: b.id });

    expect(upd.status).toBe(200);
    expect(upd.body.title).toBe('updated title');
  });

  it('allows OWNER to view audit-log but forbids VIEWER', async () => {
    const a = await orgs.createOrg('AL1');
    const owner = await users.createUser(`owner+${sfx}@x.test`, 'pass', a.id);
    await users.assignRole(owner.id, RoleName.OWNER as any, a.id);
    const ownerToken = signJwt({
      sub: owner.id,
      email: owner.email,
      roles: [{ role: RoleName.OWNER, organizationId: a.id }],
      organizationId: a.id,
    });

    const viewer = await users.createUser(
      `viewer2+${sfx}@x.test`,
      'pass',
      a.id
    );
    await users.assignRole(viewer.id, RoleName.VIEWER as any, a.id);
    const viewerToken = signJwt({
      sub: viewer.id,
      email: viewer.email,
      roles: [{ role: RoleName.VIEWER, organizationId: a.id }],
      organizationId: a.id,
    });

    const resOwner = await request(app.getHttpServer())
      .get(`/tasks/audit-log?organizationId=${a.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(resOwner.status).toBe(200);

    const resViewer = await request(app.getHttpServer())
      .get(`/tasks/audit-log?organizationId=${a.id}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(resViewer.status).toBe(403);
  });
});
