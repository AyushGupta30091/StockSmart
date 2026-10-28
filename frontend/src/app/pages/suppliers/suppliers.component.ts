import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Supplier } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="suppliers-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Suppliers</h1>
          <p class="page-subtitle">Manage your suppliers and vendors</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <i class="fa-solid fa-plus"></i>
          <span>Add Supplier</span>
        </button>
      </div>

      <!-- Search Filter Bar -->
      <div class="filters-bar">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            placeholder="Search suppliers..." 
            [(ngModel)]="search" 
            class="filter-input"
          />
        </div>
      </div>

      <!-- Suppliers Table (Matches Reference Image 6) -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Products Supplied</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="7" class="text-center py-4">
                  <i class="fa-solid fa-spinner fa-spin text-primary"></i> Loading suppliers...
                </td>
              </tr>
              <tr *ngIf="!loading && filteredSuppliers.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">
                  No suppliers found. Click "+ Add Supplier" to create one.
                </td>
              </tr>
              <tr *ngFor="let s of filteredSuppliers">
                <td class="fw-semibold">{{ s.name }}</td>
                <td>{{ s.contactPerson }}</td>
                <td class="text-muted">{{ s.email }}</td>
                <td>{{ s.phone }}</td>
                <td><span class="category-tag">{{ s.productsSupplied }}</span></td>
                <td>
                  <span class="badge" [ngClass]="s.active ? 'badge-active' : 'badge-inactive'">
                    {{ s.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <button class="action-btn edit" title="Edit" (click)="openEditModal(s)">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn status" title="Toggle Status" (click)="toggleStatus(s)">
                      <i class="fa-solid fa-power-off"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Supplier Modal -->
      <div *ngIf="showModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit Supplier' : 'Add New Supplier' }}</h3>
            <button class="modal-close" (click)="showModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form (ngSubmit)="saveSupplier()">
            <div class="modal-body">
              <div class="form-group">
                <label>Supplier Company Name *</label>
                <input type="text" [(ngModel)]="formData.name" name="name" class="form-control" required placeholder="e.g. Apex Tech Supply" />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Contact Person</label>
                  <input type="text" [(ngModel)]="formData.contactPerson" name="contactPerson" class="form-control" placeholder="e.g. Amit Sharma" />
                </div>
                <div class="form-group">
                  <label>Phone Number</label>
                  <input type="text" [(ngModel)]="formData.phone" name="phone" class="form-control" placeholder="e.g. 9876543210" />
                </div>
              </div>

              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="formData.email" name="email" class="form-control" required placeholder="e.g. contact@apextech.com" />
              </div>

              <div class="form-group">
                <label>Products / Category Supplied</label>
                <input type="text" [(ngModel)]="formData.productsSupplied" name="productsSupplied" class="form-control" placeholder="e.g. Electronics, Peripherals" />
              </div>

              <div class="form-group">
                <label>Physical Address</label>
                <textarea [(ngModel)]="formData.address" name="address" class="form-control" rows="2" placeholder="Street, City, State..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving">
                <i *ngIf="saving" class="fa-solid fa-spinner fa-spin"></i>
                <span>{{ saving ? 'Saving...' : (isEditing ? 'Update Supplier' : 'Create Supplier') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .suppliers-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-main);
    }
    .page-subtitle {
      font-size: 13.5px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .filters-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    .search-box {
      position: relative;
      width: 280px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-light);
      font-size: 13px;
    }
    .filter-input {
      width: 100%;
      height: 38px;
      padding: 0 12px 0 34px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: #ffffff;
      font-size: 13.5px;
    }

    .table-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
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
    .data-table tr:hover td {
      background-color: #faf5ff;
    }

    .category-tag {
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
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
    .action-btn.status:hover { background: #fee2e2; color: #dc2626; }

    .fw-semibold { font-weight: 600; }
    .text-right { text-align: right; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  `]
})
export class SuppliersComponent implements OnInit {
  apiService = inject(ApiService);
  toastService = inject(ToastService);

  suppliers: Supplier[] = [];
  search = '';
  loading = false;
  saving = false;

  showModal = false;
  isEditing = false;
  formData: any = {};

  get filteredSuppliers(): Supplier[] {
    if (!this.search.trim()) return this.suppliers;
    const q = this.search.toLowerCase();
    return this.suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.productsSupplied && s.productsSupplied.toLowerCase().includes(q))
    );
  }

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading = true;
    this.apiService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  openAddModal() {
    this.isEditing = false;
    this.formData = {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      productsSupplied: '',
      address: ''
    };
    this.showModal = true;
  }

  openEditModal(s: Supplier) {
    this.isEditing = true;
    this.formData = { ...s };
    this.showModal = true;
  }

  saveSupplier() {
    if (!this.formData.name || !this.formData.email) {
      this.toastService.warning('Validation', 'Please provide company name and email.');
      return;
    }

    this.saving = true;
    if (this.isEditing) {
      this.apiService.updateSupplier(this.formData.id, this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.toastService.success('Updated', 'Supplier updated successfully!');
          this.loadSuppliers();
        },
        error: (e) => {
          this.saving = false;
          this.toastService.danger('Error', e.error?.message || 'Failed to update supplier.');
        }
      });
    } else {
      this.apiService.createSupplier(this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.toastService.success('Created', 'Supplier created successfully!');
          this.loadSuppliers();
        },
        error: (e) => {
          this.saving = false;
          this.toastService.danger('Error', e.error?.message || 'Failed to create supplier.');
        }
      });
    }
  }

  toggleStatus(s: Supplier) {
    this.apiService.toggleSupplierStatus(s.id).subscribe({
      next: () => {
        s.active = !s.active;
        this.toastService.success('Status Changed', `Supplier status toggled.`);
      }
    });
  }
}
