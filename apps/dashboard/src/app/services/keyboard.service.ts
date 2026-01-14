import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type Shortcut =
  | 'newTask'
  | 'focusSearch'
  | 'toggleTheme'
  | 'saveModal'
  | 'editTask'
  | 'deleteTask'
  | 'toggleTask'
  | 'nextTask'
  | 'prevTask'
  | 'unknown';

@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private shortcuts = new Subject<Shortcut>();
  shortcuts$ = this.shortcuts.asObservable();

  emit(s: Shortcut) {
    this.shortcuts.next(s);
  }
}
