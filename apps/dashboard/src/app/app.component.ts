import { Component, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HasPermissionDirective } from './directives/has-permission.directive';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { KeyboardService } from './services/keyboard.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HasPermissionDirective,
    MatButtonModule,
    MatSnackBarModule,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnDestroy {
  title = 'dashboard';

  private keydownHandler = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (e.key === '/' && tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
      this.kb.emit('focusSearch');
      return;
    }
    if (
      (e.key === 'n' || e.key === 'N') &&
      tag !== 'input' &&
      tag !== 'textarea'
    ) {
      this.kb.emit('newTask');
      return;
    }
    if (
      (e.key === 'd' || e.key === 'D') &&
      tag !== 'input' &&
      tag !== 'textarea'
    ) {
      this.kb.emit('toggleTheme');
      return;
    }
    if (
      (e.key === 's' || e.key === 'S') &&
      tag !== 'input' &&
      tag !== 'textarea'
    ) {
      this.kb.emit('saveModal');
      return;
    }

    // Task-specific shortcuts
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.kb.emit('nextTask');
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.kb.emit('prevTask');
      return;
    }
    if (
      (e.key === 'e' || e.key === 'E') &&
      tag !== 'input' &&
      tag !== 'textarea'
    ) {
      e.preventDefault();
      this.kb.emit('editTask');
      return;
    }
    if (
      (e.key === ' ' || e.key === 'Spacebar') &&
      tag !== 'input' &&
      tag !== 'textarea'
    ) {
      e.preventDefault();
      this.kb.emit('toggleTask');
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        this.kb.emit('deleteTask');
        return;
      }
    }
  };

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private kb: KeyboardService
  ) {
    window.addEventListener('keydown', this.keydownHandler);
  }

  get role() {
    const r = this.auth.roles;
    return r && r.length ? r[0] : 'Guest';
  }

  get isAuthenticated() {
    return this.auth.isAuthenticated();
  }

  get permissionsSummary() {
    const perms = [
      { key: 'CREATE_TASK', label: 'Create' },
      { key: 'UPDATE_TASK', label: 'Edit' },
      { key: 'DELETE_TASK', label: 'Delete' },
      { key: 'TOGGLE_COMPLETE', label: 'Toggle' },
      { key: 'VIEW_AUDIT', label: 'Audit' },
      { key: 'VIEW_ANALYTICS', label: 'Analytics' },
    ];
    const allowed = perms
      .filter((p) => this.auth.hasPermission(p.key))
      .map((p) => p.label);
    return allowed.length ? `Perms: ${allowed.join(', ')}` : 'Perms: Read only';
  }

  toggleTheme() {
    this.theme.toggle();
  }

  logout() {
    this.auth.logout();
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.keydownHandler);
  }
}
