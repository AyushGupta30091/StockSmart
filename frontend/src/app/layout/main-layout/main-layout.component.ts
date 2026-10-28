import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-wrapper">
        <app-navbar></app-navbar>
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Reactive Toasts -->
      <div class="toast-container">
        <div 
          *ngFor="let t of toastService.toasts()" 
          class="toast"
          [ngClass]="'toast-' + t.type"
        >
          <div class="toast-icon">
            <i [class]="getToastIcon(t.type)"></i>
          </div>
          <div class="toast-content">
            <h4>{{ t.title }}</h4>
            <p>{{ t.message }}</p>
          </div>
          <button class="toast-close" (click)="toastService.remove(t.id)">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-main);
    }

    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .content-area {
      flex: 1;
      padding: 24px 32px 48px;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 14px;
      margin-left: auto;
    }
  `]
})
export class MainLayoutComponent {
  toastService = inject(ToastService);

  getToastIcon(type: string): string {
    switch (type) {
      case 'success': return 'fa-solid fa-circle-check text-success';
      case 'warning': return 'fa-solid fa-triangle-exclamation text-warning';
      case 'danger': return 'fa-solid fa-circle-exclamation text-danger';
      default: return 'fa-solid fa-circle-info text-info';
    }
  }
}
