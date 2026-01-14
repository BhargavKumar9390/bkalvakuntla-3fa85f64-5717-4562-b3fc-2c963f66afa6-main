import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksService } from '../services/tasks.service';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule],
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.css'],
})
export class AuditComponent implements OnInit {
  entries: any[] = [];
  loading = true;
  displayedColumns = ['timestamp', 'userId', 'action', 'resource', 'resourceId', 'meta'];

  constructor(private tasks: TasksService) {}

  ngOnInit() {
    this.tasks.audit().subscribe({ next: (res) => { this.entries = res || []; this.loading = false; }, error: () => (this.loading = false) });
  }
}
