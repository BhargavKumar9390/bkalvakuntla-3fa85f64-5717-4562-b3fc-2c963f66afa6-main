import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snack: MatSnackBar) {}

  success(message: string, duration = 3000) {
    this.snack.open(message, undefined, { duration, panelClass: ['toast-success'] });
  }

  error(message: string, duration = 5000) {
    this.snack.open(message, undefined, { duration, panelClass: ['toast-error'] });
  }

  info(message: string, duration = 3000) {
    this.snack.open(message, undefined, { duration, panelClass: ['toast-info'] });
  }
}
