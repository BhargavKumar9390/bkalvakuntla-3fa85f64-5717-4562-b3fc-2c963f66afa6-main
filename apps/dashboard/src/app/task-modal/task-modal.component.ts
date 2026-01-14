import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrgsService } from '../services/orgs.service';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule],
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.css'],
})
export class TaskModalComponent implements OnChanges, OnInit {
  @Input() initial: any | null = null;
  @Input() initialTitle = 'Edit Task';
  @Output() saved = new EventEmitter<any>();
  @Output() closed = new EventEmitter<void>();
  @Input() saving = false;

  form: FormGroup;
  availableOrgs: Array<{ id: string; name: string }> = [];
  loadingOrgs = false;

  constructor(
    private fb: FormBuilder,
    private orgsService: OrgsService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['TODO'],
      category: ['OTHER'],
      priority: ['', Validators.required],
      dueDate: [''],
      organizationId: [''],
    });
  }

  ngOnInit() {
    this.loadAvailableOrgs();
  }

  private loadAvailableOrgs() {
    this.loadingOrgs = true;
    const user = this.authService.user;
    const userOrgId = user?.organizationId;

    if (!userOrgId) {
      this.loadingOrgs = false;
      return;
    }

    // Fetch user's org details first
    this.orgsService.getById(userOrgId).subscribe({
      next: (org) => {
        this.availableOrgs = [{ id: org.id, name: org.name }];

        // If user is OWNER or ADMIN, fetch descendants
        const roles = this.authService.roles || [];
        const isOwnerOrAdmin = roles.some(
          (r) => r === 'OWNER' || r === 'ADMIN'
        );

        if (isOwnerOrAdmin) {
          this.orgsService.getDescendants(userOrgId).subscribe({
            next: (result) => {
              // Fetch details for all descendant orgs
              const descendants = result.organizationIds.filter(
                (id) => id !== userOrgId
              );
              descendants.forEach((id) => {
                this.orgsService.getById(id).subscribe({
                  next: (childOrg) => {
                    this.availableOrgs.push({
                      id: childOrg.id,
                      name: childOrg.name,
                    });
                  },
                  error: () => {},
                });
              });
              this.loadingOrgs = false;
            },
            error: () => {
              this.loadingOrgs = false;
            },
          });
        } else {
          this.loadingOrgs = false;
        }
      },
      error: () => {
        this.loadingOrgs = false;
      },
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.initial) {
      this.form.patchValue({
        title: this.initial.title || '',
        description: this.initial.description || '',
        status: this.initial.status || 'TODO',
        category: this.initial.category || 'OTHER',
        priority: this.initial.priority || '',
        dueDate: this.initial.dueDate
          ? new Date(this.initial.dueDate).toISOString().slice(0, 10)
          : '',
        organizationId: this.initial.organizationId || '',
      });
      this.initialTitle = this.initial.id ? 'Edit Task' : 'Create Task';
    }
  }

  save() {
    // mark all controls touched so validation messages appear
    this.form.markAllAsTouched();

    // normalize/trim title to avoid whitespace-only values
    const titleCtrl = this.form.get('title');
    if (titleCtrl && typeof titleCtrl.value === 'string') {
      titleCtrl.setValue(titleCtrl.value.trim());
    }

    // dueDate validation: not allowed to be in the past
    const dd = this.form.get('dueDate')?.value;
    if (dd) {
      const d = new Date(dd);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (d < now) {
        this.form.get('dueDate')?.setErrors({ past: true });
        return;
      }
    }

    if (this.form.invalid) return;

    const val = { ...this.initial, ...this.form.value };
    this.saved.emit(val);
  }

  cancel() {
    this.closed.emit();
  }
}
