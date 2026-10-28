import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, LocationItem } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">User Management</h1>
          <p class="page-subtitle">Manage system staff accounts, assign roles and permission boundaries</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <i class="fa-solid fa-user-plus"></i>
          <span>Add User</span>
        </button>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>User / Name</th>
                <th>Role</th>
                <th>Assigned Location</th>
                <th>Status</th>
                <th>Created At</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="6" class="text-center py-4">
                  <i class="fa-solid fa-spinner fa-spin text-primary"></i> Loading users...
                </td>
              </tr>
              <tr *ngFor="let u of users">
                <td>
                  <div class="user-row-meta">
                    <span class="user-display-name">{{ u.fullName }}</span>
                    <span class="user-email text-muted">{{ u.email }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="getRoleBadgeClass(u.role)">
                    {{ u.role }}
                  </span>
                </td>
                <td>{{ u.locationName || 'All Outlets' }}</td>
                <td>
                  <span class="badge" [ngClass]="u.active ? 'badge-active' : 'badge-inactive'">
                    {{ u.active ? 'Active' : 'Deactivated' }}
                  </span>
                </td>
                <td class="text-muted">{{ u.createdAt | date:'mediumDate' }}</td>
                <td class="text-right">
                  <div class="action-buttons">
                    <button class="action-btn edit" title="Edit Role/Location" (click)="openEditModal(u)">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button 
                      class="action-btn" 
                      [ngClass]="u.active ? 'btn-warn' : 'btn-succ'" 
                      [title]="u.active ? 'Deactivate' : 'Activate'" 
                      (click)="toggleStatus(u)"
                    >
                      <i class="fa-solid" [ngClass]="u.active ? 'fa-ban' : 'fa-check'"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit User Modal -->
      <div *ngIf="showModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit User' : 'Create New User' }}</h3>
            <button class="modal-close" (click)="showModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form (ngSubmit)="saveUser()">
            <div class="modal-body">
              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" [(ngModel)]="formData.fullName" name="fullName" class="form-control" required placeholder="e.g. Anand Kumar" />
              </div>

              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="formData.email" name="email" class="form-control" [disabled]="isEditing" required placeholder="e.g. anand@stocksmart.com" />
              </div>

              <div class="form-group" *ngIf="!isEditing">
                <label>Initial Password * (Will be BCrypt hashed)</label>
                <input type="password" [(ngModel)]="formData.password" name="password" class="form-control" required placeholder="••••••••" />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>System Role *</label>
                  <select [(ngModel)]="formData.role" name="role" class="form-control" required>
                    <option value="ADMIN">ADMIN (Full Permissions)</option>
                    <option value="MANAGER">MANAGER (Operations & Approvals)</option>
                    <option value="STAFF">STAFF (Floor / Catalog Entry)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Assigned Location</label>
                  <select [(ngModel)]="formData.locationId" name="locationId" class="form-control">
                    <option [ngValue]="null">All Locations</option>
                    <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving">
                <i *ngIf="saving" class="fa-solid fa-spinner fa-spin"></i>
                <span>Save User</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text-main); }
    .page-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }

    .table-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th {
      background: #f8fafc;
      padding: 12px 18px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .data-table td {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-color);
      font-size: 13.5px;
    }
    .data-table tr:hover td { background-color: #faf5ff; }

    .user-row-meta { display: flex; flex-direction: column; }
    .user-display-name { font-weight: 600; color: var(--text-main); }
    .user-email { font-size: 12px; }

    .action-buttons { display: inline-flex; align-items: center; gap: 8px; }
    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      cursor: pointer;
    }
    .action-btn.edit:hover { background: #ede9fe; color: var(--primary); }
    .btn-warn:hover { background: #fee2e2; color: #dc2626; }
    .btn-succ:hover { background: #dcfce7; color: #16a34a; }

    .text-right { text-align: right; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  `]
})
export class UsersComponent implements OnInit {
  apiService = inject(ApiService);
  toastService = inject(ToastService);

  users: any[] = [];
  locations: LocationItem[] = [];
  loading = false;
  saving = false;

  showModal = false;
  isEditing = false;
  formData: any = {};

  ngOnInit() {
    this.loadUsers();
    this.apiService.getLocations().subscribe(l => this.locations = l);
  }

  loadUsers() {
    this.loading = true;
    this.apiService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  openAddModal() {
    this.isEditing = false;
    this.formData = {
      fullName: '',
      email: '',
      password: '',
      role: 'STAFF',
      locationId: null
    };
    this.showModal = true;
  }

  openEditModal(u: any) {
    this.isEditing = true;
    this.formData = {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      locationId: u.locationId,
      active: u.active
    };
    this.showModal = true;
  }

  saveUser() {
    if (!this.formData.fullName || (!this.isEditing && !this.formData.email)) {
      this.toastService.warning('Validation', 'Please provide required fields.');
      return;
    }

    this.saving = true;
    if (this.isEditing) {
      this.apiService.updateUser(this.formData.id, this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.toastService.success('Saved', 'User updated successfully.');
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          this.toastService.danger('Error', err.error?.message || 'Failed to update user.');
        }
      });
    } else {
      this.apiService.createUser(this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.toastService.success('Created', 'User created successfully.');
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          this.toastService.danger('Error', err.error?.message || 'Failed to create user.');
        }
      });
    }
  }

  toggleStatus(u: any) {
    this.apiService.toggleUserStatus(u.id).subscribe({
      next: () => {
        u.active = !u.active;
        this.toastService.success('Status', `User status toggled.`);
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'badge-purple';
      case 'MANAGER': return 'badge-processing';
      default: return 'badge-warning';
    }
  }
}
