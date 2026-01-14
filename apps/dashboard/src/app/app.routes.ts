import { Route } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { TasksComponent } from './tasks/tasks.component';
import { AuthGuard } from './guards/auth.guard';
import { RbacGuard } from './guards/rbac.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [AuthGuard, RbacGuard],
    data: { permissions: ['READ_TASK'] },
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./analytics/analytics.component').then(
        (m) => m.AnalyticsComponent
      ),
    canActivate: [AuthGuard, RbacGuard],
    data: { permissions: ['VIEW_ANALYTICS'] },
  },
  {
    path: 'audit',
    loadComponent: () =>
      import('./audit/audit.component').then((m) => m.AuditComponent),
    canActivate: [AuthGuard, RbacGuard],
    data: { permissions: ['VIEW_AUDIT'] },
  },
];
