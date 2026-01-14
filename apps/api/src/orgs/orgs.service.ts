import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '../entities/organization.entity';

@Injectable()
export class OrgsService {
  constructor(@InjectRepository(OrganizationEntity) private orgRepo: Repository<OrganizationEntity>) {}

  async findById(id: string) {
    return this.orgRepo.findOne({ where: { id } });
  }

  // return minimal info for resolver
  async findLiteById(id: string) {
    const o = await this.orgRepo.findOne({ where: { id } });
    if (!o) return null;
    return { id: o.id, parentId: o.parentId };
  }

  async createOrg(name: string, parentId?: string) {
    const o = this.orgRepo.create({ name, parentId });
    return this.orgRepo.save(o);
  }

  // Get all direct children of an organization
  async findChildren(parentId: string): Promise<OrganizationEntity[]> {
    return this.orgRepo.find({ where: { parentId } });
  }

  // Get all descendants (children, grandchildren, etc.) of an organization
  async findDescendants(orgId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [orgId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      descendants.push(currentId);
      const children = await this.findChildren(currentId);
      queue.push(...children.map(c => c.id));
    }

    return descendants;
  }
}
