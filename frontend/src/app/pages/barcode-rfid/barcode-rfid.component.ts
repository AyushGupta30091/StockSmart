import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, BarcodeLookupResult, RfidTag } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-barcode-rfid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="barcode-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Barcode & RFID Scanning</h1>
          <p class="page-subtitle">Instant product lookup via hardware USB barcode reader or RFID tag simulation</p>
        </div>
      </div>

      <!-- Main Scanning Grid -->
      <div class="scanner-grid">
        <!-- 1. Barcode Scanning Card (Image 8) -->
        <div class="card scan-card">
          <div class="card-title-row">
            <div class="card-icon-pill">
              <i class="fa-solid fa-barcode"></i>
            </div>
            <div>
              <h3>Barcode Scanner Lookup</h3>
              <p class="text-muted small">Type SKU / Barcode or scan with a USB keyboard scanner</p>
            </div>
          </div>

          <form (ngSubmit)="onBarcodeScan()" class="scan-input-group">
            <div class="input-wrapper">
              <i class="fa-solid fa-qrcode barcode-icon"></i>
              <input 
                type="text" 
                [(ngModel)]="barcodeInput" 
                name="barcodeInput" 
                class="form-control scan-input" 
                placeholder="Enter or scan SKU (e.g. ELEC001)..." 
                autofocus
              />
            </div>
            <button type="submit" class="btn-primary scan-btn" [disabled]="loadingBarcode">
              <i *ngIf="loadingBarcode" class="fa-solid fa-spinner fa-spin"></i>
              <i *ngIf="!loadingBarcode" class="fa-solid fa-magnifying-glass"></i>
              <span>Scan</span>
            </button>
          </form>

          <div class="quick-tags">
            <span class="text-muted small">Quick Test:</span>
            <button class="pill-btn" (click)="testScan('ELEC001')">ELEC001 (Mouse)</button>
            <button class="pill-btn" (click)="testScan('APP002')">APP002 (T-Shirt)</button>
            <button class="pill-btn" (click)="testScan('GRO003')">GRO003 (Rice 5kg)</button>
          </div>

          <!-- Result Card (Matches Image 8) -->
          <div *ngIf="barcodeResult && barcodeResult.found" class="result-card">
            <div class="result-product-row">
              <img [src]="barcodeResult.product?.imageUrl || '/assets/images/mouse.svg'" alt="Product" class="result-thumb" />
              <div class="result-meta">
                <div class="result-title-row">
                  <h4>{{ barcodeResult.product?.name }}</h4>
                  <span class="badge" [ngClass]="getStatusBadgeClass(barcodeResult.overallStatus || 'In Stock')">
                    {{ barcodeResult.overallStatus }}
                  </span>
                </div>
                <div class="sku-text">SKU: <strong>{{ barcodeResult.product?.sku }}</strong> | Barcode: {{ barcodeResult.product?.barcode }}</div>
                <div class="price-stock-row">
                  <span>Price: <strong>₹ {{ barcodeResult.product?.sellingPrice | number:'1.0-0' }}</strong></span>
                  <span>Total Stock: <strong>{{ barcodeResult.totalStock }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Location wise stock breakdown -->
            <div class="location-breakdown mt-3">
              <span class="sub-label">Stock Breakdown Across Locations:</span>
              <div class="loc-badges-row">
                <div *ngFor="let loc of barcodeResult.locationStocks" class="loc-stock-item">
                  <span class="loc-name">{{ loc.locationName }}</span>
                  <span class="loc-qty">{{ loc.availableStock }} in stock</span>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="barcodeResult && !barcodeResult.found" class="alert-box danger">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>No product found matching code '{{ barcodeInput }}'.</span>
          </div>
        </div>

        <!-- 2. RFID Tag Simulation Card -->
        <div class="card scan-card">
          <div class="card-title-row">
            <div class="card-icon-pill purple">
              <i class="fa-solid fa-wifi"></i>
            </div>
            <div>
              <h3>RFID Tag Simulation</h3>
              <p class="text-muted small">Simulate UHF RFID scan events and verify inventory mapping</p>
            </div>
          </div>

          <form (ngSubmit)="onRfidScan()" class="scan-input-group">
            <div class="input-wrapper">
              <i class="fa-solid fa-tower-broadcast barcode-icon"></i>
              <input 
                type="text" 
                [(ngModel)]="rfidInput" 
                name="rfidInput" 
                class="form-control scan-input" 
                placeholder="RFID Tag (e.g. RFID-ELEC001-001)..." 
              />
            </div>
            <button type="submit" class="btn-primary scan-btn" [disabled]="loadingRfid">
              <i *ngIf="loadingRfid" class="fa-solid fa-spinner fa-spin"></i>
              <span>Scan RFID</span>
            </button>
          </form>

          <div class="quick-tags">
            <span class="text-muted small">Sample RFID Tags:</span>
            <button class="pill-btn" (click)="rfidInput = 'RFID-ELEC001-001'">RFID-ELEC001-001</button>
            <button class="pill-btn" (click)="rfidInput = 'RFID-APP002-001'">RFID-APP002-001</button>
          </div>

          <!-- RFID Scan Results Table -->
          <div class="table-card mt-3">
            <div class="sub-label mb-2">Recent RFID Scans (Database Record):</div>
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Tag ID</th>
                  <th>Product</th>
                  <th>Location</th>
                  <th>Last Scanned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tag of rfidTags">
                  <td><code>{{ tag.tagId }}</code></td>
                  <td class="fw-semibold">{{ tag.productName }}</td>
                  <td>{{ tag.locationName }}</td>
                  <td class="text-muted">{{ tag.lastScannedAt | date:'shortTime' }}</td>
                  <td><span class="badge badge-success">{{ tag.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .barcode-page {
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

    .scanner-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .scan-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-sm);
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
    }

    .card-icon-pill {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      background: #f1f5f9;
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .card-icon-pill.purple {
      background: #f3e8ff;
      color: var(--primary);
    }

    .card-title-row h3 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
    }
    .small { font-size: 12px; }

    .scan-input-group {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }

    .input-wrapper {
      position: relative;
      flex: 1;
    }
    .barcode-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-light);
    }
    .scan-input {
      height: 44px;
      padding-left: 36px;
      font-size: 14px;
      font-weight: 500;
    }
    .scan-btn {
      height: 44px;
      padding: 0 20px;
    }

    .quick-tags {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .pill-btn {
      padding: 4px 10px;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 999px;
      font-size: 12px;
      color: var(--primary);
      font-weight: 500;
      cursor: pointer;
    }
    .pill-btn:hover {
      background: #ede9fe;
      border-color: var(--primary);
    }

    /* Result Card (Image 8) */
    .result-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      padding: 20px;
      animation: fadeIn 0.25s ease-out;
    }

    .result-product-row {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .result-thumb {
      width: 70px;
      height: 70px;
      border-radius: 12px;
      background: #ffffff;
      padding: 8px;
      border: 1px solid var(--border-color);
    }
    .result-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .result-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .result-title-row h4 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
    }
    .sku-text {
      font-size: 13px;
      color: var(--text-muted);
    }
    .price-stock-row {
      display: flex;
      gap: 20px;
      font-size: 13.5px;
      margin-top: 4px;
    }

    .loc-badges-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .loc-stock-item {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 6px 12px;
      display: flex;
      flex-direction: column;
      font-size: 12px;
    }
    .loc-name { font-weight: 600; color: var(--text-main); }
    .loc-qty { color: var(--success-text); }

    .sub-label {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .alert-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      border-radius: var(--radius-sm);
      font-size: 13px;
    }
    .alert-box.danger {
      background: #fef2f2;
      color: var(--danger-text);
      border: 1px solid #fecaca;
    }

    .mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    .mini-table th, .mini-table td {
      padding: 8px 10px;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }

    .mt-3 { margin-top: 14px; }
    .mb-2 { margin-bottom: 8px; }
  `]
})
export class BarcodeRfidComponent implements OnInit {
  apiService = inject(ApiService);
  toastService = inject(ToastService);

  barcodeInput = 'ELEC001';
  barcodeResult: BarcodeLookupResult | null = null;
  loadingBarcode = false;

  rfidInput = 'RFID-ELEC001-001';
  rfidTags: RfidTag[] = [];
  loadingRfid = false;

  ngOnInit() {
    this.onBarcodeScan();
    this.loadRfidTags();
  }

  onBarcodeScan() {
    if (!this.barcodeInput.trim()) return;
    this.loadingBarcode = true;
    this.apiService.lookupBarcode(this.barcodeInput).subscribe({
      next: (res) => {
        this.barcodeResult = res;
        this.loadingBarcode = false;
        if (res.found) {
          this.toastService.success('Product Found', `${res.product?.name} (Stock: ${res.totalStock})`);
        } else {
          this.toastService.warning('Not Found', 'No product matches this barcode/SKU.');
        }
      },
      error: () => this.loadingBarcode = false
    });
  }

  testScan(sku: string) {
    this.barcodeInput = sku;
    this.onBarcodeScan();
  }

  loadRfidTags() {
    this.apiService.getRfidTags().subscribe({
      next: (tags) => this.rfidTags = tags
    });
  }

  onRfidScan() {
    if (!this.rfidInput.trim()) return;
    this.loadingRfid = true;
    this.apiService.scanRfidTag(this.rfidInput).subscribe({
      next: (tag) => {
        this.loadingRfid = false;
        this.toastService.success('RFID Verified', `Tag ${tag.tagId} scanned: ${tag.productName} (Simulation)`);
        this.loadRfidTags();
      },
      error: (err) => {
        this.loadingRfid = false;
        this.toastService.danger('Scan Failed', err.error?.message || 'RFID tag not found.');
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
