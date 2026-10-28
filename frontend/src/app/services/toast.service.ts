import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(title: string, message: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') {
    const id = Date.now();
    const newToast: Toast = { id, title, message, type };
    this.toasts.update(current => [...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, 4500);
  }

  success(title: string, message: string) {
    this.show(title, message, 'success');
  }

  warning(title: string, message: string) {
    this.show(title, message, 'warning');
  }

  danger(title: string, message: string) {
    this.show(title, message, 'danger');
  }

  info(title: string, message: string) {
    this.show(title, message, 'info');
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
