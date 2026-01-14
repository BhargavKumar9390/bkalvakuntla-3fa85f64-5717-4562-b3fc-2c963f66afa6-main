import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  constructor(private auth: AuthService, private tpl: TemplateRef<any>, private vcr: ViewContainerRef) {}

  @Input('hasPermission') set hasPermission(permission: string | string[]) {
    const perms = Array.isArray(permission) ? permission : [permission];
    const ok = perms.every((p) => this.auth.hasPermission(p));
    this.vcr.clear();
    if (ok) this.vcr.createEmbeddedView(this.tpl);
  }
}
