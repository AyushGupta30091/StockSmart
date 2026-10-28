import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService, NotificationItem } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="navbar">
      <div class="search-container">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input 
          type="text" 
          placeholder="Search products, orders, suppliers..." 
          [(ngModel)]="searchQuery"
          (keyup.enter)="onSearch()"
          class="search-input"
        />
      </div>

      <div class="nav-actions">
        <!-- Notification Bell & Dropdown -->
        <div class="dropdown-wrapper">
          <button class="icon-btn" (click)="toggleNotifications()" title="Notifications">
            <i class="fa-regular fa-bell"></i>
            <span *ngIf="unreadCount > 0" class="badge-dot">{{ unreadCount }}</span>
          </button>

          <div *ngIf="showNotifications" class="dropdown-menu notifications-menu">
            <div class="dropdown-header">
              <h4>Notifications</h4>
              <button class="text-btn" (click)="markAllAsRead()">Mark all read</button>
            </div>
            <div class="dropdown-list">
              <div *ngIf="notifications.length === 0" class="empty-state">
                No notifications
              </div>
              <div 
                *ngFor="let n of notifications" 
                class="notification-item"
                [class.unread]="!n.readStatus"
              >
                <div class="notif-icon" [ngClass]="n.type.toLowerCase()">
                  <i [class]="getNotifIcon(n.type)"></i>
                </div>
                <div class="notif-content">
                  <div class="notif-title">{{ n.title }}</div>
                  <div class="notif-msg">{{ n.message }}</div>
                  <div class="notif-time">{{ n.createdAt | date:'shortTime' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Profile Dropdown -->
        <div class="dropdown-wrapper">
          <div class="user-profile" (click)="toggleProfileMenu()">
            <img src="/assets/images/avatar.svg" alt="Avatar" class="avatar-img" />
            <div class="user-text">
              <span class="user-name">{{ authService.currentUser()?.fullName || 'User' }}</span>
              <span class="user-role-badge">{{ authService.currentUser()?.role || 'STAFF' }}</span>
            </div>
            <i class="fa-solid fa-chevron-down chevron-icon"></i>
          </div>

          <div *ngIf="showProfileMenu" class="dropdown-menu profile-menu">
            <div class="profile-header">
              <div class="fw-bold">{{ authService.currentUser()?.fullName }}</div>
              <div class="text-muted small">{{ authService.currentUser()?.email }}</div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item danger" (click)="logout()">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: 64px;
      background-color: #ffffff;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .search-container {
      display: flex;
      align-items: center;
      position: relative;
      width: 360px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--text-light);
      font-size: 14px;
    }

    .search-input {
      width: 100%;
      height: 38px;
      background-color: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0 12px 0 34px;
      font-size: 13.5px;
      color: var(--text-main);
    }
    .search-input:focus {
      background-color: #ffffff;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .dropdown-wrapper {
      position: relative;
    }

    .icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      position: relative;
      cursor: pointer;
    }
    .icon-btn:hover {
      color: var(--primary);
      background: #f1f5f9;
    }

    .badge-dot {
      position: absolute;
      top: -3px;
      right: -3px;
      background-color: var(--danger);
      color: white;
      font-size: 10px;
      font-weight: 700;
      border-radius: 50%;
      width: 17px;
      height: 17px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px 4px 4px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .user-profile:hover {
      background-color: #f8fafc;
    }

    .avatar-img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--border-color);
    }

    .user-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .user-name {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-main);
    }

    .user-role-badge {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--primary-text);
      letter-spacing: 0.5px;
    }

    .chevron-icon {
      font-size: 11px;
      color: var(--text-light);
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 100;
      overflow: hidden;
      animation: fadeIn 0.15s ease-out;
    }

    .notifications-menu {
      width: 340px;
    }

    .dropdown-header {
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dropdown-header h4 {
      font-size: 14px;
      font-weight: 600;
    }
    .text-btn {
      background: transparent;
      color: var(--primary);
      font-size: 12px;
      font-weight: 500;
    }
    .text-btn:hover {
      text-decoration: underline;
    }

    .dropdown-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      transition: background-color 0.2s;
    }
    .notification-item:hover {
      background-color: #f8fafc;
    }
    .notification-item.unread {
      background-color: #faf5ff;
    }

    .notif-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
    }
    .notif-icon.info { background: #eff6ff; color: #3b82f6; }
    .notif-icon.success { background: #ecfdf5; color: #10b981; }
    .notif-icon.warning { background: #fffbeb; color: #f59e0b; }
    .notif-icon.danger { background: #fef2f2; color: #ef4444; }

    .notif-content {
      flex: 1;
    }
    .notif-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
    }
    .notif-msg {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .notif-time {
      font-size: 10.5px;
      color: var(--text-light);
      margin-top: 4px;
    }

    .empty-state {
      padding: 24px;
      text-align: center;
      color: var(--text-light);
      font-size: 13px;
    }

    .profile-menu {
      width: 200px;
      padding: 6px 0;
    }
    .profile-header {
      padding: 10px 16px;
    }
    .fw-bold { font-weight: 600; font-size: 13.5px; }
    .small { font-size: 11.5px; }
    .dropdown-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 4px 0;
    }
    .dropdown-item {
      width: 100%;
      text-align: left;
      padding: 9px 16px;
      background: transparent;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text-main);
    }
    .dropdown-item:hover {
      background-color: #f8fafc;
    }
    .dropdown-item.danger {
      color: var(--danger);
    }
    .dropdown-item.danger:hover {
      background-color: #fef2f2;
    }
  `]
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  apiService = inject(ApiService);
  wsService = inject(WebsocketService);
  router = inject(Router);

  searchQuery = '';
  showNotifications = false;
  showProfileMenu = false;
  notifications: NotificationItem[] = [];
  unreadCount = 0;

  ngOnInit() {
    this.loadNotifications();

    // Listen to real-time notifications via WebSocket
    this.wsService.notification$.subscribe((notif) => {
      this.notifications.unshift(notif);
      this.unreadCount++;
    });
  }

  loadNotifications() {
    this.apiService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = data.filter(n => !n.readStatus).length;
      },
      error: (e) => console.error(e)
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false;
  }

  markAllAsRead() {
    this.apiService.markNotificationsRead().subscribe(() => {
      this.notifications.forEach(n => n.readStatus = true);
      this.unreadCount = 0;
    });
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery } });
    }
  }

  logout() {
    this.authService.logout();
  }

  getNotifIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'success': return 'fa-solid fa-circle-check';
      case 'warning': return 'fa-solid fa-triangle-exclamation';
      case 'danger': return 'fa-solid fa-circle-exclamation';
      default: return 'fa-solid fa-circle-info';
    }
  }
}
