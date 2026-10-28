import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, InventoryItem, Supplier } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Reports & Analytics</h1>
          <p class="page-subtitle">Analyze your inventory performance</p>
        </div>
        <div class="header-right">
          <div class="date-range-badge">
            <i class="fa-regular fa-calendar"></i>
            <span>01 Oct 2026 - 25 Oct 2026</span>
          </div>
          <button class="btn-primary" (click)="exportReport()">
            <i class="fa-solid fa-download"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Navigation Sub-tabs (Matches Image 7) -->
      <div class="tabs-header">
        <button class="tab-btn" [class.active]="activeTab === 'sales'" (click)="setTab('sales')">
          Sales Report
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'inventory'" (click)="setTab('inventory')">
          Inventory Report
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'low_stock'" (click)="setTab('low_stock')">
          Low Stock Report
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'supplier'" (click)="setTab('supplier')">
          Supplier Report
        </button>
      </div>

      <!-- Charts Section (Matches Image 7) -->
      <div class="charts-grid-2">
        <!-- Sales Trend Line/Area Chart -->
        <div class="card chart-card">
          <div class="chart-header">
            <h3>Sales Trend</h3>
            <span class="text-muted small">Daily Revenue</span>
          </div>
          <div class="trend-chart-box">
            <div class="y-axis">
              <span>30K</span>
              <span>20K</span>
              <span>10K</span>
              <span>0</span>
            </div>
            <div class="chart-drawing-area">
              <svg viewBox="0 0 500 160" class="trend-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="repPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0,120 Q 80,140 120,95 T 220,110 T 320,60 T 420,40 T 500,45 L 500,160 L 0,160 Z" fill="url(#repPurpleGrad)" />
                <path d="M 0,120 Q 80,140 120,95 T 220,110 T 320,60 T 420,40 T 500,45" fill="none" stroke="#7c3aed" stroke-width="3" />
              </svg>
              <div class="x-axis">
                <span>Oct 1</span>
                <span>Oct 5</span>
                <span>Oct 10</span>
                <span>Oct 15</span>
                <span>Oct 20</span>
                <span>Oct 25</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Selling Products Horizontal Chart -->
        <div class="card chart-card">
          <div class="chart-header">
            <h3>Top Selling Products</h3>
            <span class="text-muted small">Units Sold</span>
          </div>
          <div class="top-prods-list">
            <div class="top-prod-row" *ngFor="let item of topProducts">
              <span class="prod-title">{{ item.name }}</span>
              <div class="prod-bar-track">
                <div class="prod-bar-fill" [style.width.%]="(item.qty / 350) * 100"></div>
              </div>
              <span class="prod-qty-val">{{ item.qty }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Database-Backed Reports Data Table -->
      <div class="card table-card">
        <div class="card-header-clean">
          <h3>{{ getTabTitle() }} Data</h3>
        </div>
        <div class="table-responsive">
          <!-- Inventory Table -->
          <table *ngIf="activeTab === 'inventory'" class="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Location</th>
                <th>Available Stock</th>
                <th>Reserved</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of allInventory">
                <td class="fw-semibold">{{ item.productName }}</td>
                <td><code>{{ item.sku }}</code></td>
                <td>{{ item.locationName }}</td>
                <td class="fw-semibold">{{ item.availableStock }}</td>
                <td>{{ item.reservedStock }}</td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Low Stock Table -->
          <table *ngIf="activeTab === 'low_stock'" class="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Location</th>
                <th>Current Available</th>
                <th>Reorder Level</th>
                <th>Deficit / Action Needed</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of lowStockItems">
                <td class="fw-semibold">{{ item.productName }}</td>
                <td>{{ item.locationName }}</td>
                <td class="fw-semibold text-danger">{{ item.availableStock }}</td>
                <td>{{ item.reorderLevel }}</td>
                <td>
                  <span class="badge badge-danger">
                    Order {{ item.reorderLevel - item.availableStock + 20 }} units
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Supplier Table -->
          <table *ngIf="activeTab === 'supplier'" class="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Category</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of suppliers">
                <td class="fw-semibold">{{ s.name }}</td>
                <td>{{ s.contactPerson }}</td>
                <td>{{ s.productsSupplied }}</td>
                <td>{{ s.email }}</td>
                <td><span class="badge badge-active">Active</span></td>
              </tr>
            </tbody>
          </table>

          <!-- Sales Summary -->
          <table *ngIf="activeTab === 'sales'" class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Channel</th>
                <th>Total Volume</th>
                <th>Total Value</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>25 Oct 2026</td><td>Main Store Retail</td><td>45 units</td><td class="fw-semibold">₹ 34,800</td><td><span class="badge badge-success">+14%</span></td></tr>
              <tr><td>24 Oct 2026</td><td>Commercial Orders</td><td>82 units</td><td class="fw-semibold">₹ 65,400</td><td><span class="badge badge-success">+8%</span></td></tr>
              <tr><td>23 Oct 2026</td><td>Walk-in Retail</td><td>38 units</td><td class="fw-semibold">₹ 29,200</td><td><span class="badge badge-info">Steady</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
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

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .date-range-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      padding: 8px 14px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
    }

    .tabs-header {
      display: flex;
      gap: 24px;
      border-bottom: 2px solid var(--border-color);
    }
    .tab-btn {
      padding: 10px 4px;
      background: transparent;
      border: none;
      font-size: 14.5px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      position: relative;
    }
    .tab-btn:hover { color: var(--text-main); }
    .tab-btn.active { color: var(--primary); }
    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--primary);
    }

    .charts-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-sm);
    }

    .chart-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .chart-header h3 {
      font-size: 16px;
      font-weight: 700;
    }
    .small { font-size: 12px; }

    /* Trend Chart */
    .trend-chart-box {
      display: flex;
      gap: 12px;
      height: 180px;
    }
    .y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-light);
      padding-bottom: 24px;
    }
    .chart-drawing-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .trend-svg {
      width: 100%;
      height: 140px;
    }
    .x-axis {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-light);
    }

    /* Top prods */
    .top-prods-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      justify-content: space-around;
      height: 180px;
    }
    .top-prod-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }
    .prod-title { width: 140px; color: var(--text-main); font-weight: 500; }
    .prod-bar-track {
      flex: 1;
      height: 8px;
      background: #f1f5f9;
      border-radius: 999px;
      overflow: hidden;
    }
    .prod-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #a78bfa 0%, #7c3aed 100%);
      border-radius: 999px;
    }
    .prod-qty-val { width: 36px; text-align: right; font-weight: 600; color: var(--primary); }

    .table-card {
      padding: 0;
      overflow: hidden;
    }
    .card-header-clean {
      padding: 18px 24px 12px;
    }
    .card-header-clean h3 {
      font-size: 16px;
      font-weight: 700;
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
    .data-table tr:hover td { background-color: #faf5ff; }

    .fw-semibold { font-weight: 600; }
    .text-danger { color: var(--danger); }
  `]
})
export class ReportsComponent implements OnInit {
  apiService = inject(ApiService);
  toastService = inject(ToastService);

  activeTab: 'sales' | 'inventory' | 'low_stock' | 'supplier' = 'sales';

  topProducts = [
    { name: 'Wireless Mouse', qty: 320 },
    { name: 'Cotton T-Shirt', qty: 280 },
    { name: 'Rice 5kg', qty: 240 },
    { name: 'Water Bottle', qty: 180 },
    { name: 'Bluetooth Speaker', qty: 150 }
  ];

  allInventory: InventoryItem[] = [];
  lowStockItems: InventoryItem[] = [];
  suppliers: Supplier[] = [];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.apiService.getReportsData().subscribe({
      next: (data) => {
        this.allInventory = data.allInventory || [];
        this.lowStockItems = data.lowStockItems || [];
        this.suppliers = data.suppliers || [];
      }
    });
  }

  setTab(tab: 'sales' | 'inventory' | 'low_stock' | 'supplier') {
    this.activeTab = tab;
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'sales': return 'Sales Performance';
      case 'inventory': return 'Stock Valuation & Inventory';
      case 'low_stock': return 'Low Stock Urgent Reorder';
      case 'supplier': return 'Supplier Directory & Rating';
    }
  }

  exportReport() {
    this.toastService.success('Export Successful', `Exported ${this.getTabTitle()} CSV successfully.`);
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
