import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, LocationItem } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="locations-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Locations & Warehouses</h1>
          <p class="page-subtitle">Manage physical store outlets and centralized fulfillment warehouses</p>
        </div>
        <button class="btn-primary" (click)="showModal = true">
          <i class="fa-solid fa-plus"></i>
          <span>Add Location</span>
        </button>
      </div>

      <div class="locations-grid">
        <div class="card location-card" *ngFor="let loc of locations">
          <div class="loc-card-header">
            <div class="loc-icon-pill" [ngClass]="loc.type?.toLowerCase()">
              <i [class]="loc.type === 'WAREHOUSE' ? 'fa-solid fa-warehouse' : 'fa-solid fa-shop'"></i>
            </div>
            <span class="badge" [ngClass]="loc.active ? 'badge-active' : 'badge-inactive'">
              {{ loc.active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <h3 class="loc-name">{{ loc.name }}</h3>
          <div class="loc-code">Code: <code>{{ loc.code }}</code></div>
          <p class="loc-address text-muted">
            <i class="fa-solid fa-location-dot"></i> {{ loc.address || 'Address on file' }}
          </p>

          <div class="loc-stat-divider"></div>

          <div class="loc-stats">
            <div>
              <span class="stat-label">Facility Type</span>
              <span class="stat-val">{{ loc.type }}</span>
            </div>
            <div class="text-right">
              <span class="stat-label">Total Units</span>
              <span class="stat-val text-primary">{{ loc.totalStock || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Location Modal -->
      <div *ngIf="showModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add New Location</h3>
            <button class="modal-close" (click)="showModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form (ngSubmit)="saveLocation()">
            <div class="modal-body">
              <div class="form-group">
                <label>Location / Store Name *</label>
                <input type="text" [(ngModel)]="formData.name" name="name" class="form-control" required placeholder="e.g. West Distribution Hub" />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Location Code *</label>
                  <input type="text" [(ngModel)]="formData.code" name="code" class="form-control" required placeholder="e.g. WDH" />
                </div>
                <div class="form-group">
                  <label>Facility Type *</label>
                  <select [(ngModel)]="formData.type" name="type" class="form-control">
                    <option value="STORE">Retail Store</option>
                    <option value="WAREHOUSE">Warehouse / Hub</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Address</label>
                <textarea [(ngModel)]="formData.address" name="address" class="form-control" rows="2" placeholder="Full street address..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving">
                <i *ngIf="saving" class="fa-solid fa-spinner fa-spin"></i>
                <span>Save Location</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .locations-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text-main); }
    .page-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }

    .locations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .location-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
    }

    .loc-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .loc-icon-pill {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .loc-icon-pill.store { background: #eff6ff; color: #3b82f6; }
    .loc-icon-pill.warehouse { background: #f3e8ff; color: var(--primary); }

    .loc-name { font-size: 17px; font-weight: 700; color: var(--text-main); }
    .loc-code { font-size: 13px; color: var(--text-muted); margin: 2px 0 10px; }
    .loc-address { font-size: 12.5px; margin-bottom: 16px; display: flex; gap: 6px; align-items: baseline; }

    .loc-stat-divider {
      height: 1px;
      background: var(--border-color);
      margin-top: auto;
      margin-bottom: 14px;
    }

    .loc-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; display: block; }
    .stat-val { font-size: 14px; font-weight: 700; }
    .text-right { text-align: right; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  `]
})
export class LocationsComponent implements OnInit {
  apiService = inject(ApiService);
  toastService = inject(ToastService);

  locations: LocationItem[] = [];
  showModal = false;
  saving = false;
  formData: any = { name: '', code: '', type: 'STORE', address: '' };

  ngOnInit() {
    this.loadLocations();
  }

  loadLocations() {
    this.apiService.getLocations().subscribe({
      next: (locs) => this.locations = locs
    });
  }

  saveLocation() {
    if (!this.formData.name || !this.formData.code) {
      this.toastService.warning('Validation', 'Please provide name and code.');
      return;
    }

    this.saving = true;
    this.apiService.createLocation(this.formData).subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.toastService.success('Created', 'Location added successfully.');
        this.formData = { name: '', code: '', type: 'STORE', address: '' };
        this.loadLocations();
      },
      error: (e: any) => {
        this.saving = false;
        this.toastService.danger('Error', e.error?.message || 'Failed to save location.');
      }
    });
  }
}
