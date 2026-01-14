import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css'],
})
export class TaskCardComponent {
  constructor(public auth: AuthService, private toast: ToastService) {}
  @Input() task: any;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() toggleComplete = new EventEmitter<any>();

  menuOpen = false;
  confirmingDelete = false;

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  handleToggleComplete() {
    this.toggleComplete.emit(this.task);
    this.menuOpen = false;
  }

  handleEdit() {
    this.edit.emit(this.task);
    this.menuOpen = false;
  }

  handleDelete() {
    // Show inline confirmation popover instead of immediately emitting
    this.confirmingDelete = true;
    this.menuOpen = false;
  }

  confirmDelete() {
    this.delete.emit(this.task);
    this.confirmingDelete = false;
  }

  cancelDelete() {
    this.confirmingDelete = false;
  }

  priorityClass(priority: string) {
    if (priority === 'High')
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (priority === 'Medium')
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  }

  categoryClass(cat: string) {
    if (!cat) return 'bg-gray-100 text-gray-800';
    if (cat === 'WORK') return 'bg-blue-100 text-blue-800';
    if (cat === 'PERSONAL')
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (cat === 'URGENT')
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    return 'bg-gray-100 text-gray-800';
  }

  statusClass(status: string) {
    if (!status) return 'status-todo';
    if (status === 'DONE') return 'status-done';
    if (status === 'IN_PROGRESS') return 'status-inprogress';
    return 'status-todo';
  }
}
