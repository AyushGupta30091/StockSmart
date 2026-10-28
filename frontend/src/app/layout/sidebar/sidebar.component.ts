import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <i class="fa-solid fa-boxes-stacked logo-icon"></i>
          <span class="logo-text">StockSmart</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-table-cells-large"></i>
          <span>Dashboard</span>
        </a>

        <a routerLink="/products" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-box-archive"></i>
          <span>Products</span>
        </a>

        <a routerLink="/inventory" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-layer-group"></i>
          <span>Inventory</span>
        </a>

        <a routerLink="/orders" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-cart-shopping"></i>
          <span>Orders</span>
        </a>

        <a routerLink="/suppliers" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-truck-fast"></i>
          <span>Suppliers</span>
        </a>

        <a routerLink="/locations" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-location-dot"></i>
          <span>Locations</span>
        </a>

        <a routerLink="/reports" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-chart-line"></i>
          <span>Reports</span>
        </a>

        <a routerLink="/barcode-rfid" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-barcode"></i>
          <span>Barcode/RFID</span>
        </a>

        <a *ngIf="authService.isAdmin()" routerLink="/users" routerLinkActive="active" class="nav-item">
          <i class="fa-solid fa-users-gear"></i>
          <span>Users</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-pill">
          <div class="user-avatar-sm">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="user-info-sm">
            <span class="name">{{ authService.currentUser()?.fullName || 'User' }}</span>
            <span class="role">{{ authService.currentUser()?.role || 'STAFF' }}</span>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      height: 100vh;
      background-color: var(--bg-sidebar);
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-dark);
      position: sticky;
      top: 0;
      flex-shrink: 0;
      user-select: none;
    }

    .sidebar-header {
      padding: 24px 20px 20px;
      display: flex;
      align-items: center;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      font-size: 24px;
      color: var(--primary);
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      color: var(--text-sidebar);
      font-weight: 500;
      font-size: 13.5px;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .nav-item i {
      font-size: 16px;
      width: 18px;
      text-align: center;
    }

    .nav-item:hover {
      background-color: var(--bg-sidebar-hover);
      color: #ffffff;
    }

    .nav-item.active {
      background-color: var(--primary);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border-dark);
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-sm);
    }

    .user-avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
    }

    .user-info-sm {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-info-sm .name {
      font-size: 12.5px;
      font-weight: 600;
      color: #f8fafc;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .user-info-sm .role {
      font-size: 11px;
      color: var(--text-light);
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
}
