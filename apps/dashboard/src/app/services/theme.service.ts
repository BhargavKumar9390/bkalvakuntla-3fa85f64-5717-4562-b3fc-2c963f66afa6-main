import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private key = 'theme';

  constructor() {
    const t = this.get();
    if (t) this.apply(t);
  }

  get(): 'dark' | 'light' | null {
    const v = localStorage.getItem(this.key);
    if (v === 'dark') return 'dark';
    if (v === 'light') return 'light';
    return null;
  }

  isDark(): boolean {
    const theme = this.get();
    if (theme) return theme === 'dark';
    // default to system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggle() {
    const next = this.isDark() ? 'light' : 'dark';
    this.set(next);
    this.apply(next);
  }

  set(theme: 'dark' | 'light') {
    localStorage.setItem(this.key, theme);
  }

  apply(theme: 'dark' | 'light') {
    const doc = document.documentElement;
    if (theme === 'dark') {
      doc.classList.add('dark');
    } else {
      doc.classList.remove('dark');
    }
  }
}
