import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Product, LocationItem, InventoryItem } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventory-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Inventory</h1>
          <p class="page-subtitle">Track stock across multiple locations</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="openAdjustmentModal()">
            <i class="fa-solid fa-sliders"></i>
            <span>Stock Adjustment</span>
          </button>
          <button class="btn-primary" (click)="openTransferModal()">
            <i class="fa-solid fa-arrow-right-arrow-left"></i>
            <span>Transfer Stock</span>
          </button>
        </div>
      </div>

      <!-- Filter Controls matching Image 4 -->
      <div class="card filter-card">
        <div class="filter-controls-row">
          <div class="control-group">
            <label>Select Product</label>
            <select [(ngModel)]="selectedProductId" class="form-control select-control" (change)="checkStock()">
              <option *ngFor="let p of products" [ngValue]="p.id">
                {{ p.name }} ({{ p.sku }})
              </option>
            </select>
          </div>

          <div class="control-group">
            <label>Select Location</label>
            <select [(ngModel)]="selectedLocationId" class="form-control select-control" (change)="checkStock()">
              <option [ngValue]="null">All Locations</option>
              <option *ngFor="let loc of locations" [ngValue]="loc.id">
                {{ loc.name }}
              </option>
            </select>
          </div>

          <div class="control-btn-group">
            <button class="btn-primary" (click)="checkStock()">
              <span>Check Stock</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Inventory Table (Matches Reference Image 4) -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Available Stock</th>
                <th>Reserved</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="5" class="text-center py-4">
                  <i class="fa-solid fa-spinner fa-spin text-primary"></i> Loading inventory...
                </td>
              </tr>
              <tr *ngIf="!loading && inventories.length === 0">
                <td colspan="5" class="text-center py-4 text-muted">
                  No inventory records found.
                </td>
              </tr>
              <tr *ngFor="let item of inventories">
                <td class="fw-semibold">{{ item.locationName }}</td>
                <td class="fw-semibold">{{ item.availableStock }}</td>
                <td class="text-muted">{{ item.reservedStock }}</td>
                <td>{{ item.reorderLevel }}</td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bottom Summary Cards matching Image 4 -->
      <div class="summary-cards-grid">
        <div class="card summary-card">
          <div class="summary-icon-box purple">
            <i class="fa-solid fa-boxes-stacked"></i>
          </div>
          <div class="summary-details">
            <span class="summary-label">Total Stock (All Locations)</span>
            <span class="summary-value">{{ totalStockAllLocations }}</span>
          </div>
        </div>

        <div class="card summary-card">
          <div class="summary-icon-box purple">
            <i class="fa-solid fa-cart-shopping"></i>
          </div>
          <div class="summary-details">
            <span class="summary-label">Reorder Level</span>
            <span class="summary-value">{{ currentReorderLevel }}</span>
          </div>
        </div>
      </div>

      <!-- Stock Transfer Modal -->
      <div *ngIf="showTransferModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Stock Transfer</h3>
            <button class="modal-close" (click)="showTransferModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <form (ngSubmit)="submitTransfer()">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Product *</label>
                <select [(ngModel)]="transferData.productId" name="productId" class="form-control" required>
                  <option *ngFor="let p of products" [ngValue]="p.id">{{ p.name }} ({{ p.sku }})</option>
                </select>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Source Location *</label>
                  <select [(ngModel)]="transferData.sourceLocationId" name="sourceLocationId" class="form-control" required>
                    <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Destination Location *</label>
                  <select [(ngModel)]="transferData.destinationLocationId" name="destinationLocationId" class="form-control" required>
                    <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Quantity to Transfer *</label>
                <input type="number" [(ngModel)]="transferData.quantity" name="quantity" class="form-control" min="1" required placeholder="e.g. 10" />
              </div>

              <div class="form-group">
                <label>Transfer Notes</label>
                <input type="text" [(ngModel)]="transferData.notes" name="notes" class="form-control" placeholder="Optional reference notes..." />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showTransferModal = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="submitting">
                <i *ngIf="submitting" class="fa-solid fa-spinner fa-spin"></i>
                <span>Confirm Transfer</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Stock Adjustment Modal -->
      <div *ngIf="showAdjustmentModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Stock Adjustment</h3>
            <button class="modal-close" (click)="showAdjustmentModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <form (ngSubmit)="submitAdjustment()">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Product *</label>
                <select [(ngModel)]="adjustmentData.productId" name="productId" class="form-control" required>
                  <option *ngFor="let p of products" [ngValue]="p.id">{{ p.name }} ({{ p.sku }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Location *</label>
                <select [(ngModel)]="adjustmentData.locationId" name="locationId" class="form-control" required>
                  <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>New Stock Quantity *</label>
                <input type="number" [(ngModel)]="adjustmentData.newStock" name="newStock" class="form-control" min="0" required placeholder="e.g. 100" />
              </div>

              <div class="form-group">
                <label>Reason for Adjustment</label>
                <input type="text" [(ngModel)]="adjustmentData.reason" name="reason" class="form-control" placeholder="e.g. Physical inventory count correction" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showAdjustmentModal = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="submitting">
                <i *ngIf="submitting" class="fa-solid fa-spinner fa-spin"></i>
                <span>Save Adjustment</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inventory-page {
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

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .filter-card {
      padding: 18px 24px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .filter-controls-row {
      display: flex;
      align-items: flex-end;
      gap: 20px;
    }

    .control-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .control-group label {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-muted);
    }
    .select-control {
      height: 40px;
      font-size: 13.5px;
    }

    .control-btn-group {
      margin-bottom: 0;
    }
    .control-btn-group .btn-primary {
      height: 40px;
      padding: 0 20px;
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

    .fw-semibold { font-weight: 600; }

    /* Bottom Summary Cards (Matches Image 4) */
    .summary-cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .summary-card {
      padding: 20px 24px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .summary-icon-box.purple {
      background: #f3e8ff;
      color: var(--primary);
    }

    .summary-details {
      display: flex;
      flex-direction: column;
    }
    .summary-label {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .summary-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.1;
      margin-top: 2px;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
  `]
})
export class InventoryComponent implements OnInit {
  apiService = inject(ApiService);
  toastService = inject(ToastService);
  wsService = inject(WebsocketService);

  products: Product[] = [];
  locations: LocationItem[] = [];
  inventories: InventoryItem[] = [];

  selectedProductId: number | null = null;
  selectedLocationId: number | null = null;
  loading = false;
  submitting = false;

  totalStockAllLocations = 120;
  currentReorderLevel = 20;

  showTransferModal = false;
  transferData: any = {};

  showAdjustmentModal = false;
  adjustmentData: any = {};

  ngOnInit() {
    this.loadInitialData();

    this.wsService.stockChange$.subscribe(() => {
      this.checkStock(false);
    });
  }

  loadInitialData() {
    this.apiService.getProducts().subscribe({
      next: (prods) => {
        this.products = prods;
        if (prods.length > 0) {
          // Default to Wireless Mouse (ELEC001) as shown in image 4
          const mouse = prods.find(p => p.sku === 'ELEC001') || prods[0];
          this.selectedProductId = mouse.id;
          this.currentReorderLevel = mouse.reorderLevel;
        }
        this.checkStock();
      }
    });

    this.apiService.getLocations().subscribe({
      next: (locs) => this.locations = locs
    });
  }

  checkStock(showSpinner = true) {
    if (showSpinner) this.loading = true;
    this.apiService.getInventory(this.selectedProductId || undefined, this.selectedLocationId || undefined).subscribe({
      next: (data) => {
        this.inventories = data;
        this.loading = false;
        this.calculateTotals();
      },
      error: () => this.loading = false
    });
  }

  calculateTotals() {
    this.totalStockAllLocations = this.inventories.reduce((acc, curr) => acc + (curr.availableStock || 0), 0);
    const prod = this.products.find(p => p.id === this.selectedProductId);
    if (prod) {
      this.currentReorderLevel = prod.reorderLevel;
    }
  }

  openTransferModal() {
    this.transferData = {
      productId: this.selectedProductId || (this.products[0]?.id),
      sourceLocationId: this.locations[0]?.id,
      destinationLocationId: this.locations[1]?.id,
      quantity: 10,
      notes: ''
    };
    this.showTransferModal = true;
  }

  submitTransfer() {
    if (!this.transferData.quantity || this.transferData.quantity <= 0) {
      this.toastService.warning('Validation', 'Please enter a valid quantity.');
      return;
    }
    if (this.transferData.sourceLocationId === this.transferData.destinationLocationId) {
      this.toastService.warning('Validation', 'Source and destination locations must be different.');
      return;
    }

    this.submitting = true;
    this.apiService.transferStock(this.transferData).subscribe({
      next: () => {
        this.submitting = false;
        this.showTransferModal = false;
        this.toastService.success('Transfer Complete', 'Stock successfully transferred!');
        this.checkStock();
      },
      error: (err) => {
        this.submitting = false;
        this.toastService.danger('Transfer Failed', err.error?.message || 'Insufficient stock or invalid transfer.');
      }
    });
  }

  openAdjustmentModal() {
    this.adjustmentData = {
      productId: this.selectedProductId || (this.products[0]?.id),
      locationId: this.locations[0]?.id,
      newStock: 100,
      reason: 'Physical inventory recount'
    };
    this.showAdjustmentModal = true;
  }

  submitAdjustment() {
    if (this.adjustmentData.newStock < 0) {
      this.toastService.warning('Validation', 'Stock cannot be negative.');
      return;
    }

    this.submitting = true;
    this.apiService.adjustStock(this.adjustmentData).subscribe({
      next: () => {
        this.submitting = false;
        this.showAdjustmentModal = false;
        this.toastService.success('Stock Adjusted', 'Inventory stock adjusted successfully.');
        this.checkStock();
      },
      error: (err) => {
        this.submitting = false;
        this.toastService.danger('Error', err.error?.message || 'Failed to adjust stock.');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'In Stock': return 'badge-in-stock';
      case 'Low Stock': return 'badge-low-stock';
      case 'Out of Stock': return 'badge-out-of-stock';
      default: return 'badge-info';
    }
  }
}
