import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, DashboardStats } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Overview of your inventory and retail operations</p>
        </div>
      </div>

      <!-- KPI Cards Row -->
      <div class="kpi-grid">
        <!-- KPI 1: Total Products -->
        <div class="kpi-card">
          <div class="kpi-icon-box purple">
            <i class="fa-solid fa-boxes-stacked"></i>
          </div>
          <div class="kpi-details">
            <span class="kpi-label">Total Products</span>
            <span class="kpi-value">{{ (stats?.totalProducts || 1248) | number }}</span>
            <span class="kpi-trend positive">
              <i class="fa-solid fa-arrow-trend-up"></i> {{ stats?.productsChange || '+12% from last month' }}
            </span>
          </div>
        </div>

        <!-- KPI 2: Total Stock Value -->
        <div class="kpi-card">
          <div class="kpi-icon-box green">
            <i class="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div class="kpi-details">
            <span class="kpi-label">Total Stock Value</span>
            <span class="kpi-value">₹ {{ (stats?.totalStockValue || 1285600) | number:'1.0-0' }}</span>
            <span class="kpi-trend positive">
              <i class="fa-solid fa-arrow-trend-up"></i> {{ stats?.stockValueChange || '+8% from last month' }}
            </span>
          </div>
        </div>

        <!-- KPI 3: Pending Orders -->
        <div class="kpi-card">
          <div class="kpi-icon-box orange">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div class="kpi-details">
            <span class="kpi-label">Pending Orders</span>
            <span class="kpi-value">{{ stats?.pendingOrders ?? 24 }}</span>
            <span class="kpi-trend neutral">
              {{ stats?.pendingOrdersChange || '-4% from last month' }}
            </span>
          </div>
        </div>

        <!-- KPI 4: Low Stock Items -->
        <div class="kpi-card">
          <div class="kpi-icon-box red">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="kpi-details">
            <span class="kpi-label">Low Stock Items</span>
            <span class="kpi-value">{{ stats?.lowStockCount ?? 18 }}</span>
            <span class="kpi-trend danger">
              {{ stats?.lowStockNote || 'Immediate attention' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Charts Row 1: Stock by Location & Category Distribution -->
      <div class="charts-grid-2">
        <!-- Stock by Location Bar Chart -->
        <div class="card chart-card">
          <div class="card-header-clean">
            <h3>Stock by Location</h3>
          </div>
          <div class="bar-chart-container">
            <div class="bar-item" *ngFor="let loc of (stats?.stockByLocation || defaultLocations)">
              <div class="bar-value">{{ loc.count }}</div>
              <div class="bar-track">
                <div class="bar-fill" [style.height.%]="getBarHeight(loc.count)"></div>
              </div>
              <div class="bar-label">{{ loc.location }}</div>
            </div>
          </div>
        </div>

        <!-- Product Category Distribution Donut Chart -->
        <div class="card chart-card">
          <div class="card-header-clean">
            <h3>Product Category Distribution</h3>
          </div>
          <div class="donut-container">
            <div class="donut-chart-wrapper">
              <svg viewBox="0 0 160 160" class="donut-svg">
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f1f5f9" stroke-width="20" />
                <!-- Electronics 35% -->
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#6d28d9" stroke-width="20"
                        stroke-dasharray="131.9 376.9" stroke-dashoffset="0" />
                <!-- Apparel 20% -->
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#3b82f6" stroke-width="20"
                        stroke-dasharray="75.4 376.9" stroke-dashoffset="-131.9" />
                <!-- Grocery 18% -->
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#10b981" stroke-width="20"
                        stroke-dasharray="67.8 376.9" stroke-dashoffset="-207.3" />
                <!-- Home & Kitchen 15% -->
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f59e0b" stroke-width="20"
                        stroke-dasharray="56.5 376.9" stroke-dashoffset="-275.1" />
                <!-- Others 12% -->
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#94a3b8" stroke-width="20"
                        stroke-dasharray="45.2 376.9" stroke-dashoffset="-331.6" />
              </svg>
              <div class="donut-center-text">
                <span class="donut-number">{{ (stats?.totalProducts || 1248) | number }}</span>
                <span class="donut-label">Products</span>
              </div>
            </div>

            <div class="donut-legend">
              <div class="legend-item" *ngFor="let cat of (stats?.categoryDistribution || defaultCategories); let i = index">
                <span class="legend-dot" [ngClass]="'dot-' + i"></span>
                <span class="legend-name">{{ cat.category }}</span>
                <span class="legend-pct">{{ cat.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row 2: Sales Trends & Top Selling Products -->
      <div class="charts-grid-2">
        <!-- Sales Trends Area Chart -->
        <div class="card chart-card">
          <div class="card-header-clean">
            <h3>Sales Trends</h3>
          </div>
          <div class="trend-chart-wrapper">
            <svg viewBox="0 0 500 160" class="trend-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M 0,120 Q 80,140 120,95 T 220,110 T 320,60 T 420,40 T 500,45 L 500,160 L 0,160 Z" fill="url(#purpleGrad)" />
              <path d="M 0,120 Q 80,140 120,95 T 220,110 T 320,60 T 420,40 T 500,45" fill="none" stroke="#7c3aed" stroke-width="3" />
            </svg>
            <div class="trend-dates">
              <span>Oct 1</span>
              <span>Oct 5</span>
              <span>Oct 10</span>
              <span>Oct 15</span>
              <span>Oct 20</span>
              <span>Oct 25</span>
            </div>
          </div>
        </div>

        <!-- Top Selling Products Horizontal Progress Bars -->
        <div class="card chart-card">
          <div class="card-header-clean">
            <h3>Top Selling Products</h3>
          </div>
          <div class="top-products-list">
            <div class="top-product-item" *ngFor="let prod of (stats?.topSellingProducts || defaultTopProducts)">
              <div class="top-product-header">
                <span class="prod-name">{{ prod.name }}</span>
                <span class="prod-qty">{{ prod.quantitySold }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-bar purple" [style.width.%]="(prod.quantitySold / 350) * 100"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
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
      letter-spacing: -0.3px;
    }
    .page-subtitle {
      font-size: 13.5px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      box-shadow: var(--shadow-sm);
    }

    .kpi-icon-box {
      width: 46px;
      height: 46px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .kpi-icon-box.purple { background: #f3e8ff; color: #7c3aed; }
    .kpi-icon-box.green { background: #dcfce7; color: #16a34a; }
    .kpi-icon-box.orange { background: #ffedd5; color: #ea580c; }
    .kpi-icon-box.red { background: #fee2e2; color: #dc2626; }

    .kpi-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kpi-label {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .kpi-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.1;
    }
    .kpi-trend {
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 2px;
    }
    .kpi-trend.positive { color: #16a34a; }
    .kpi-trend.danger { color: #dc2626; }
    .kpi-trend.neutral { color: var(--text-muted); }

    /* Charts */
    .charts-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-sm);
    }

    .card-header-clean h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 20px;
    }

    /* Bar Chart */
    .bar-chart-container {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 180px;
      padding-top: 20px;
    }

    .bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 60px;
      height: 100%;
    }
    .bar-value {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }
    .bar-track {
      flex: 1;
      width: 32px;
      background: #f1f5f9;
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }
    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%);
      border-radius: 6px 6px 0 0;
      transition: height 0.6s ease;
    }
    .bar-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
      white-space: nowrap;
    }

    /* Donut Chart */
    .donut-container {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 180px;
    }

    .donut-chart-wrapper {
      position: relative;
      width: 150px;
      height: 150px;
    }
    .donut-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .donut-center-text {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1.1;
    }
    .donut-number {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-main);
    }
    .donut-label {
      font-size: 11px;
      color: var(--text-muted);
    }

    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-0 { background: #6d28d9; }
    .dot-1 { background: #3b82f6; }
    .dot-2 { background: #10b981; }
    .dot-3 { background: #f59e0b; }
    .dot-4 { background: #94a3b8; }
    .legend-name { color: var(--text-muted); min-width: 95px; }
    .legend-pct { font-weight: 600; color: var(--text-main); }

    /* Sales Trend Area */
    .trend-chart-wrapper {
      display: flex;
      flex-direction: column;
      height: 180px;
      justify-content: space-between;
    }
    .trend-svg {
      width: 100%;
      height: 140px;
    }
    .trend-dates {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-light);
      padding: 0 4px;
    }

    /* Top Selling Products */
    .top-products-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 180px;
      justify-content: space-around;
    }
    .top-product-header {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .prod-name { color: var(--text-main); }
    .prod-qty { font-weight: 600; color: var(--primary); }
    .progress-track {
      height: 7px;
      background: #f1f5f9;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar.purple {
      height: 100%;
      background: linear-gradient(90deg, #a78bfa 0%, #7c3aed 100%);
      border-radius: 9999px;
    }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  apiService = inject(ApiService);
  wsService = inject(WebsocketService);

  stats: DashboardStats | null = null;

  defaultLocations = [
    { location: 'Main Store', count: 520 },
    { location: 'Warehouse A', count: 310 },
    { location: 'Store B', count: 280 },
    { location: 'Store C', count: 138 }
  ];

  defaultCategories = [
    { category: 'Electronics', count: 436, percentage: 35 },
    { category: 'Apparel', count: 250, percentage: 20 },
    { category: 'Grocery', count: 224, percentage: 18 },
    { category: 'Home & Kitchen', count: 187, percentage: 15 },
    { category: 'Others', count: 151, percentage: 12 }
  ];

  defaultTopProducts = [
    { name: 'Wireless Mouse', quantitySold: 320 },
    { name: 'Cotton T-Shirt', quantitySold: 280 },
    { name: 'Rice 5kg', quantitySold: 240 },
    { name: 'Water Bottle', quantitySold: 180 },
    { name: 'Bluetooth Speaker', quantitySold: 150 }
  ];

  ngOnInit() {
    this.loadStats();

    // Listen to real-time events to auto-refresh KPI stats
    this.wsService.productChange$.subscribe(() => this.loadStats());
    this.wsService.stockChange$.subscribe(() => this.loadStats());
  }

  loadStats() {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => this.stats = data,
      error: (e) => console.error(e)
    });
  }

  getBarHeight(count: number): number {
    const max = 550;
    return Math.min(100, Math.max(10, Math.round((count / max) * 100)));
  }
}
