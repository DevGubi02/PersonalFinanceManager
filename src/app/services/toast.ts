import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);
  private timerId: number | null = null;

  show(message: string, duration = 2500): void {
    this.message.set(message);

    if (this.timerId) {
      window.clearTimeout(this.timerId);
    }

    this.timerId = window.setTimeout(() => {
      this.message.set(null);
    }, duration);
  }

  hide(): void {
    this.message.set(null);
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
