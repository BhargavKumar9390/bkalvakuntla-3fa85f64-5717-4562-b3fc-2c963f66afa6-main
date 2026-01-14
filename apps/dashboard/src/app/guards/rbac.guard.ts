import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RbacGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const required = (route.data && (route.data['permissions'] as string[] | undefined)) || undefined;
    if (!required || required.length === 0) return true;

    const ok = required.every((p) => this.auth.hasPermission(p));
    if (!ok) {
      // simple fallback: navigate to login if unauthorized
      this.router.navigate(['/login']);
    }
    return ok;
  }
}
