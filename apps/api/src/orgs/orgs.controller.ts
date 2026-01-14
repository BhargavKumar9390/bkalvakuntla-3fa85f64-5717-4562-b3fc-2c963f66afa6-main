import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { OrgsService } from './orgs.service';

@Controller('orgs')
export class OrgsController {
  constructor(private orgsService: OrgsService) {}

  @Post()
  async create(@Body() body: { name: string; parentId?: string }) {
    return this.orgsService.createOrg(body.name, body.parentId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.orgsService.findById(id);
  }

  @Get(':id/children')
  async getChildren(@Param('id') id: string) {
    return this.orgsService.findChildren(id);
  }

  @Get(':id/descendants')
  async getDescendants(@Param('id') id: string) {
    const ids = await this.orgsService.findDescendants(id);
    return { organizationIds: ids };
  }
}
