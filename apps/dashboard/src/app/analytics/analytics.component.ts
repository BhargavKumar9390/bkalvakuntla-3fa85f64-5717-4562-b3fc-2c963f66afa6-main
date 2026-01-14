import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksService } from '../services/tasks.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';

@Component({
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  tasks: any[] = [];

  // Completed vs Incomplete (bar)
  barData: ChartData<'bar'> = {
    labels: ['Completed', 'Incomplete'],
    datasets: [
      { data: [0, 0], label: 'Tasks', backgroundColor: ['#16a34a', '#f97316'] },
    ],
  };
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val =
              typeof ctx.parsed === 'number' ? ctx.parsed : ctx.parsed?.y ?? 0;
            const dataset0: any =
              ctx.chart.data.datasets && ctx.chart.data.datasets[0];
            const sum = Array.isArray(dataset0?.data)
              ? (dataset0.data as any[]).reduce(
                  (a: number, b: any) => a + Number(b || 0),
                  0
                )
              : 0;
            const pct = sum ? Math.round((Number(val) / sum) * 100) : 0;
            return `${ctx.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  };

  // Category distribution (pie)
  pieData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  // Priority distribution (doughnut)
  doughnutData: ChartData<'doughnut', number[], string | string[]> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  constructor(private tasksSvc: TasksService) {}

  ngOnInit() {
    this.load();
    // subscribe to changes for real-time updates
    if (
      (this.tasksSvc as any).tasksChanged &&
      (this.tasksSvc as any).tasksChanged.subscribe
    ) {
      (this.tasksSvc as any).tasksChanged.subscribe(() => this.load());
    }
  }

  load() {
    const loader = (this.tasksSvc as any).listWithParams
      ? (this.tasksSvc as any).listWithParams({})
      : this.tasksSvc.list();
    loader.subscribe((res: any[]) => {
      this.tasks = res || [];
      this.updateCharts();
    });
  }

  updateCharts() {
    const completed = this.tasks.filter(
      (t) => t.status === 'DONE' || t.completed === true
    ).length;
    const incomplete = this.tasks.length - completed;
    this.barData.datasets = [{ data: [completed, incomplete], label: 'Tasks' }];

    const catMap = new Map<string, number>();
    const priMap = new Map<string, number>();

    for (const t of this.tasks) {
      const c = (t.category || 'OTHER').toUpperCase();
      catMap.set(c, (catMap.get(c) || 0) + 1);
      const p = t.priority || 'Medium';
      priMap.set(p, (priMap.get(p) || 0) + 1);
    }

    const catLabels = Array.from(catMap.keys());
    const catValues = Array.from(catMap.values());
    const palette = ['#3b82f6', '#10b981', '#ef4444', '#9ca3af', '#f59e0b'];
    this.pieData.labels = catLabels;
    this.pieData.datasets = [
      {
        data: catValues,
        backgroundColor: catLabels.map((_, i) => palette[i % palette.length]),
      },
    ];

    const priLabels = Array.from(priMap.keys());
    const priValues = Array.from(priMap.values());
    const priPalette = ['#ef4444', '#f59e0b', '#10b981'];
    this.doughnutData.labels = priLabels;
    this.doughnutData.datasets = [
      {
        data: priValues,
        backgroundColor: priLabels.map(
          (_, i) => priPalette[i % priPalette.length]
        ),
      },
    ];

    // enhance tooltip behavior for pie/doughnut via plugin defaults
    // (ng2-charts/chart.js will use dataset/tooltips configured globally or per-chart if needed)
  }
}
