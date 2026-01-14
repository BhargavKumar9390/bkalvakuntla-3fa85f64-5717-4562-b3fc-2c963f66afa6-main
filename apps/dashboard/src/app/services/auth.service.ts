import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = '/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http
      .post<{ accessToken: string }>(`${this.api}/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('accessToken', res.accessToken);
        })
      );
  }

  logout() {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }

  get token() {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated() {
    return !!this.token;
  }

  private parseJwt(token: string | null): any | null {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  get user() {
    return this.parseJwt(this.token);
  }

  get roles(): string[] {
    const u = this.user;
    const raw = (u && u.roles) || [];
    return raw
      .map((r: any) => (typeof r === 'string' ? r : r.role || r.name || r))
      .filter(Boolean) as string[];
  }

  hasRole(role: string) {
    return this.roles.includes(role);
  }

  hasPermission(permission: string) {
    const u = this.user;
    if (!u) return false;
    if (Array.isArray(u.permissions)) {
      const perms = u.permissions.map((p: any) =>
        typeof p === 'string' ? p : p.permission || p.name || p
      );
      return perms.includes(permission);
    }

    // simple client-side mapping fallbacks
    if (this.hasRole('OWNER')) return true;
    if (this.hasRole('ADMIN')) {
      // Admins can create, read, and update but not delete
      return [
        'CREATE_TASK',
        'READ_TASK',
        'UPDATE_TASK',
        'VIEW_AUDIT',
        'VIEW_ANALYTICS',
      ].includes(permission);
    }
    if (this.hasRole('VIEWER')) {
      // Viewers can read and toggle completion only
      return ['READ_TASK', 'TOGGLE_COMPLETE'].includes(permission);
    }
    return false;
  }
}
