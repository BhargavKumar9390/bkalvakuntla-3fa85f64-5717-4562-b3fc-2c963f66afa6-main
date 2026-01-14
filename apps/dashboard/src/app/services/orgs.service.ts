import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class OrgsService {
  private api = '/api/orgs';
  
  constructor(private http: HttpClient) {}

  create(name: string, parentId?: string) {
    return this.http.post<any>(this.api, { name, parentId });
  }

  getById(id: string) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  getChildren(id: string) {
    return this.http.get<any[]>(`${this.api}/${id}/children`);
  }

  getDescendants(id: string) {
    return this.http.get<{ organizationIds: string[] }>(`${this.api}/${id}/descendants`);
  }
}
