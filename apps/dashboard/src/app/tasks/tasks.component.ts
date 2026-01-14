import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { HasPermissionDirective } from '../directives/has-permission.directive';
import { TasksService } from '../services/tasks.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { KeyboardService } from '../services/keyboard.service';
import { ViewChild, ElementRef } from '@angular/core';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { TaskCardComponent } from '../generated/task-card/task-card.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    HasPermissionDirective,
    TaskModalComponent,
    TaskCardComponent,
  ],
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit, OnDestroy {
  // filtering & sorting
  sortField = 'dueDate';
  sortOrder: 'asc' | 'desc' = 'asc';
  private search$ = new Subject<string>();
  private subs: any[] = [];
  tasks: any[] = [];
  selectedIndex: number = -1;
  newTitle = '';
  filterStatus = '';
  filterCategory = '';
  showShortcuts = false;
  private dragIndex: number | null = null;
  hoverIndex: number | null = null;
  draggingId: string | null = null;
  showModal = false;
  editing: any = null;
  isLoading = false;
  saving = false;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild(TaskModalComponent) modalComp?: TaskModalComponent;

  constructor(
    private tasksSvc: TasksService,
    public auth: AuthService,
    private toast: ToastService,
    private kb: KeyboardService
  ) {
    // debounce search and reload
    const s = this.search$.pipe(debounceTime(300)).subscribe((q) => {
      this.newTitle = q;
      this.load();
    });
    this.subs.push(s);

    const ksub = this.kb.shortcuts$.subscribe((s) => {
      if (s === 'focusSearch') {
        setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
      } else if (s === 'newTask') {
        this.create();
      } else if (s === 'saveModal') {
        if (this.showModal && this.modalComp) this.modalComp.save();
      } else if (s === 'nextTask') {
        this.moveSelection(1);
      } else if (s === 'prevTask') {
        this.moveSelection(-1);
      } else if (s === 'editTask') {
        const t = this.getSelectedTask();
        if (t) this.edit(t);
      } else if (s === 'deleteTask') {
        const t = this.getSelectedTask();
        if (t) this.remove(t);
      } else if (s === 'toggleTask') {
        const t = this.getSelectedTask();
        if (t) this.onToggleComplete(t);
      }
    });
    this.subs.push(ksub);
  }

  get hasActiveFilters(): boolean {
    // consider sort changes as an active filter as well
    const defaultSortField = 'dueDate';
    const defaultSortOrder: 'asc' | 'desc' = 'asc';
    return !!(
      this.filterStatus ||
      this.filterCategory ||
      (this.newTitle && this.newTitle.trim()) ||
      this.sortField !== defaultSortField ||
      this.sortOrder !== defaultSortOrder
    );
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterCategory = '';
    this.newTitle = '';
    // reset sort choices to defaults as well
    this.sortField = 'dueDate';
    this.sortOrder = 'asc';
    this.load();
  }

  ngOnInit() {
    this.load();
  }

  load() {
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterCategory) params.category = this.filterCategory;
    if (this.newTitle) params.q = this.newTitle;
    if (this.sortField) params.sort = this.sortField;
    if (this.sortOrder) params.order = this.sortOrder;
    this.isLoading = true;
    // use new listWithParams if available
    if ((this.tasksSvc as any).listWithParams) {
      (this.tasksSvc as any).listWithParams(params).subscribe({
        next: (res: any[]) => {
          this.tasks = res;
          // keep selection in bounds after reload
          if (this.selectedIndex >= this.tasks.length) {
            this.selectedIndex = this.tasks.length - 1;
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    } else {
      this.tasksSvc.list().subscribe({
        next: (res) => {
          // client-side filter/sort/search fallback
          let list = res as any[];
          if (this.filterStatus)
            list = list.filter((t) => t.status === this.filterStatus);
          if (this.filterCategory)
            list = list.filter((t) => t.category === this.filterCategory);
          if (this.newTitle) {
            const q = this.newTitle.toLowerCase();
            list = list.filter(
              (t) =>
                (t.title || '').toLowerCase().includes(q) ||
                (t.description || '').toLowerCase().includes(q)
            );
          }
          if (this.sortField) {
            list = list.sort((a, b) => {
              const av = a[this.sortField];
              const bv = b[this.sortField];
              if (av == null && bv == null) return 0;
              if (av == null) return this.sortOrder === 'asc' ? -1 : 1;
              if (bv == null) return this.sortOrder === 'asc' ? 1 : -1;
              if (av < bv) return this.sortOrder === 'asc' ? -1 : 1;
              if (av > bv) return this.sortOrder === 'asc' ? 1 : -1;
              return 0;
            });
          }
          this.tasks = list;
          if (this.selectedIndex >= this.tasks.length) {
            this.selectedIndex = this.tasks.length - 1;
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    }
  }

  moveSelection(delta: number) {
    if (!this.tasks || this.tasks.length === 0) return;
    if (this.selectedIndex < 0) this.selectedIndex = 0;
    else {
      let next = this.selectedIndex + delta;
      if (next < 0) next = 0;
      if (next > this.tasks.length - 1) next = this.tasks.length - 1;
      this.selectedIndex = next;
    }
    // Scroll selected item into view
    try {
      const list = document.getElementById('task-list');
      const el = list?.children?.[this.selectedIndex] as
        | HTMLElement
        | undefined;
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {}
  }

  getSelectedTask() {
    if (this.selectedIndex < 0 || this.selectedIndex >= this.tasks.length)
      return null;
    return this.tasks[this.selectedIndex];
  }

  // called by template on input change
  onSearchChange(q: string) {
    this.search$.next(q || '');
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe && s.unsubscribe());
  }

  create() {
    this.editing = {
      title: '',
      description: '',
      status: 'TODO',
      category: 'OTHER',
      priority: '',
      dueDate: '',
    };
    this.showModal = true;
  }

  edit(t: any) {
    this.editing = { ...t };
    this.showModal = true;
  }

  remove(t: any) {
    // deletion confirmation is handled in the task card popover
    this.isLoading = true;
    this.tasksSvc.delete(t.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('Task deleted');
        this.tasksSvc.tasksChanged.next();
        this.load();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to delete task');
      },
    });
  }

  onModalSave(payload: any) {
    const p: any = { ...payload };
    // normalize dueDate to ISO or null
    if (p.dueDate) {
      try {
        p.dueDate = new Date(p.dueDate).toISOString();
      } catch {
        p.dueDate = null;
      }
    } else {
      p.dueDate = null;
    }

    // Add organizationId from user token for new tasks only when not provided
    if (
      !p.id &&
      this.auth.user &&
      this.auth.user.organizationId &&
      !p.organizationId
    ) {
      p.organizationId = this.auth.user.organizationId;
    }

    if (p.id) {
      if (!this.auth.hasPermission('UPDATE_TASK')) {
        alert('Insufficient permissions to edit this task');
        return;
      }
      this.saving = true;
      this.tasksSvc.update(p.id, p).subscribe(
        () => {
          this.saving = false;
          this.toast.success('Task updated');
          this.tasksSvc.tasksChanged.next();
          this.showModal = false;
          this.editing = null;
          this.load();
        },
        () => {
          this.saving = false;
          this.toast.error('Failed to update task');
          this.load();
        }
      );
    } else {
      if (!this.auth.hasPermission('CREATE_TASK')) {
        alert('Insufficient permissions to create tasks');
        return;
      }

      // Debug logging
      console.log('Creating task with payload:', p);
      console.log('User from token:', this.auth.user);

      this.saving = true;
      this.tasksSvc.create(p).subscribe(
        () => {
          this.saving = false;
          this.toast.success('Task created');
          this.tasksSvc.tasksChanged.next();
          this.showModal = false;
          this.editing = null;
          this.load();
        },
        (err) => {
          this.saving = false;
          console.error('Task creation error:', err);
          const msg =
            err?.error?.message || err?.message || 'Failed to create task';
          this.toast.error(msg);
          this.load();
        }
      );
    }
  }

  onModalClose() {
    this.showModal = false;
    this.editing = null;
  }

  onDragStart(ev: DragEvent, index: number) {
    this.dragIndex = index;
    this.draggingId = this.tasks[index]?.id ?? null;
    ev.dataTransfer?.setData('text/plain', String(index));
    // some browsers need effectAllowed
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
    // add dragging class via target
    const target = ev.target as HTMLElement;
    target?.classList?.add('dragging');
  }

  onDragOver(ev: DragEvent, index: number) {
    ev.preventDefault();
    if (this.hoverIndex !== index) this.hoverIndex = index;
  }

  onDragEnter(ev: DragEvent, index: number) {
    ev.preventDefault();
    this.hoverIndex = index;
  }

  onDragLeave(ev: DragEvent, index: number) {
    ev.preventDefault();
    if (this.hoverIndex === index) this.hoverIndex = null;
  }

  onDrop(ev: DragEvent, index: number) {
    ev.preventDefault();
    const from = this.dragIndex;
    const to = index;
    if (from === null || from === to) return;
    // compute stable move
    const item = this.tasks.splice(from, 1)[0];
    this.tasks.splice(to, 0, item);
    this.dragIndex = null;
    this.hoverIndex = null;
    this.draggingId = null;
    // persist ordering to backend
    const ids = this.tasks.map((t) => t.id);
    if ((this.tasksSvc as any).persistOrder) {
      (this.tasksSvc as any).persistOrder(ids).subscribe({
        next: () => {
          this.toast.success('Order updated');
          this.tasksSvc.tasksChanged.next();
        },
        error: () => {
          this.toast.error('Failed to persist order');
          this.load();
        },
      });
    }
  }

  onToggleComplete(task: any) {
    // Use dedicated toggle endpoint when available and permitted
    if (
      task.id &&
      this.auth.hasPermission('TOGGLE_COMPLETE') &&
      (this.tasksSvc as any).toggleComplete
    ) {
      (this.tasksSvc as any).toggleComplete(task.id).subscribe({
        next: () => {
          this.toast.success('Status updated');
          this.tasksSvc.tasksChanged.next();
          this.load();
        },
        error: () => {
          this.toast.error('Failed to update status');
          this.load();
        },
      });
      return;
    }

    // fallback: attempt update if allowed
    const updated = { ...task, completed: !task.completed };
    if (updated.id && this.auth.hasPermission('UPDATE_TASK')) {
      this.tasksSvc.update(updated.id, updated).subscribe({
        next: () => {
          this.toast.success('Status updated');
          this.load();
        },
        error: () => {
          this.toast.error('Failed to update status');
          this.load();
        },
      });
    } else {
      // optimistic local update for unsaved tasks or when no permission to call API
      const idx = this.tasks.findIndex((t) => t === task || t.id === task.id);
      if (idx > -1) {
        this.tasks[idx] = updated;
      }
    }
  }
}
