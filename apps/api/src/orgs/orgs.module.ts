import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../entities/organization.entity';
import { OrgsService } from './orgs.service';
import { OrgsController } from './orgs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity])],
  controllers: [OrgsController],
  providers: [
    OrgsService,
    {
      provide: 'ORG_RESOLVER',
      useFactory: (orgService: OrgsService) => (id: string) => orgService.findLiteById(id),
      inject: [OrgsService],
    },
  ],
  exports: [OrgsService, 'ORG_RESOLVER'],
})
export class OrgsModule {}
