import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private api = '/api/tasks';
  // Emit when tasks list may have changed (create/update/delete/reorder/toggle)
  tasksChanged = new Subject<void>();
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<any[]>(this.api);
  }

  listWithParams(params: any) {
    return this.http.get<any[]>(this.api, { params });
  }

  create(payload: any) {
    return this.http.post(this.api, payload).pipe((res) => {
      // notify consumers after success via tap in callers; keep simple here
      return res;
    });
  }

  update(id: string, payload: any) {
    return this.http.put(`${this.api}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }

  persistOrder(ids: string[]) {
    return this.http.patch(`${this.api}/order`, { ids });
  }

  toggleComplete(id: string) {
    return this.http.patch(`${this.api}/${id}/toggle`, {});
  }

  audit() {
    return this.http.get<any[]>(`${this.api}/audit-log`);
  }
}
