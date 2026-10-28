import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, SalesOrder, PurchaseOrder, Product, LocationItem, Supplier } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="orders-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Orders</h1>
          <p class="page-subtitle">Manage purchase and sales orders</p>
        </div>
        <button class="btn-primary" (click)="openCreateModal()">
          <i class="fa-solid fa-plus"></i>
          <span>New Order</span>
        </button>
      </div>

      <!-- Navigation Tabs (Image 5) -->
      <div class="tabs-header">
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'sales'" 
          (click)="setTab('sales')"
        >
          Sales Orders
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'purchase'" 
          (click)="setTab('purchase')"
        >
          Purchase Orders
        </button>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            placeholder="Search orders..." 
            [(ngModel)]="search" 
            (ngModelChange)="loadOrders()"
            class="filter-input"
          />
        </div>

        <div class="status-select-wrapper">
          <select [(ngModel)]="selectedStatus" (change)="loadOrders()" class="filter-select">
            <option value="">All Status</option>
            <option *ngIf="activeTab === 'sales'" value="COMPLETED">Completed</option>
            <option *ngIf="activeTab === 'sales'" value="PROCESSING">Processing</option>
            <option *ngIf="activeTab === 'sales'" value="SHIPPED">Shipped</option>
            <option *ngIf="activeTab === 'sales'" value="PENDING">Pending</option>
            <option *ngIf="activeTab === 'purchase'" value="ORDERED">Ordered</option>
            <option *ngIf="activeTab === 'purchase'" value="PARTIALLY_RECEIVED">Partially Received</option>
            <option *ngIf="activeTab === 'purchase'" value="RECEIVED">Received</option>
            <option *ngIf="activeTab === 'purchase'" value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <!-- Sales Orders Table (Image 5) -->
      <div *ngIf="activeTab === 'sales'" class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="7" class="text-center py-4">
                  <i class="fa-solid fa-spinner fa-spin text-primary"></i> Loading orders...
                </td>
              </tr>
              <tr *ngIf="!loading && salesOrders.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">
                  No sales orders found.
                </td>
              </tr>
              <tr *ngFor="let order of salesOrders">
                <td><code>{{ order.orderNumber }}</code></td>
                <td class="text-muted">{{ order.orderDate | date:'mediumDate' }}</td>
                <td class="fw-semibold">{{ order.customerName }}</td>
                <td>{{ order.items?.length || 1 }}</td>
                <td class="fw-semibold">₹ {{ order.totalAmount | number:'1.0-0' }}</td>
                <td>
                  <span class="badge" [ngClass]="getOrderStatusClass(order.status)">
                    {{ formatStatus(order.status) }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <button class="action-btn view" title="View Details" (click)="viewSalesOrder(order)">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn print" title="Receipt" (click)="printOrder(order)">
                      <i class="fa-solid fa-receipt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Purchase Orders Table -->
      <div *ngIf="activeTab === 'purchase'" class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Destination</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="7" class="text-center py-4">
                  <i class="fa-solid fa-spinner fa-spin text-primary"></i> Loading purchase orders...
                </td>
              </tr>
              <tr *ngIf="!loading && purchaseOrders.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">
                  No purchase orders found. Click "+ New Order" to create one.
                </td>
              </tr>
              <tr *ngFor="let po of purchaseOrders">
                <td><code>{{ po.poNumber }}</code></td>
                <td class="text-muted">{{ po.orderDate | date:'mediumDate' }}</td>
                <td class="fw-semibold">{{ po.supplierName }}</td>
                <td>{{ po.locationName }}</td>
                <td class="fw-semibold">₹ {{ po.totalAmount | number:'1.0-0' }}</td>
                <td>
                  <span class="badge" [ngClass]="getOrderStatusClass(po.status)">
                    {{ formatStatus(po.status) }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <button 
                      *ngIf="po.status !== 'RECEIVED' && po.status !== 'CANCELLED'" 
                      class="btn-primary btn-sm" 
                      title="Receive Stock" 
                      (click)="openReceiveModal(po)"
                    >
                      <i class="fa-solid fa-box-open"></i> Receive
                    </button>
                    <button class="action-btn view" title="View" (click)="viewPurchaseOrder(po)">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Sales Order Modal -->
      <div *ngIf="showSalesModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>New Sales Order</h3>
            <button class="modal-close" (click)="showSalesModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form (ngSubmit)="submitSalesOrder()">
            <div class="modal-body">
              <div class="form-group">
                <label>Customer Name *</label>
                <input type="text" [(ngModel)]="salesFormData.customerName" name="customerName" class="form-control" required placeholder="e.g. Retail Mart" />
              </div>

              <div class="form-group">
                <label>Dispatch Location *</label>
                <select [(ngModel)]="salesFormData.locationId" name="locationId" class="form-control" required>
                  <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }}</option>
                </select>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Product *</label>
                  <select [(ngModel)]="salesFormData.productId" name="productId" class="form-control" (change)="onSalesProductChange()" required>
                    <option *ngFor="let p of products" [ngValue]="p.id">{{ p.name }} (₹ {{ p.sellingPrice }})</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Quantity *</label>
                  <input type="number" [(ngModel)]="salesFormData.quantity" name="quantity" class="form-control" min="1" required />
                </div>
              </div>

              <div class="order-summary-box">
                <div>Selected Product Price: <strong>₹ {{ selectedProductPrice }}</strong></div>
                <div>Calculated Total: <strong class="text-primary fs-5">₹ {{ selectedProductPrice * salesFormData.quantity }}</strong></div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showSalesModal = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="submitting">
                <i *ngIf="submitting" class="fa-solid fa-spinner fa-spin"></i>
                <span>Confirm & Deduct Stock</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create Purchase Order Modal -->
      <div *ngIf="showPoModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>New Purchase Order</h3>
            <button class="modal-close" (click)="showPoModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form (ngSubmit)="submitPoOrder()">
            <div class="modal-body">
              <div class="form-group">
                <label>Supplier *</label>
                <select [(ngModel)]="poFormData.supplierId" name="supplierId" class="form-control" required>
                  <option *ngFor="let s of suppliers" [ngValue]="s.id">{{ s.name }} ({{ s.productsSupplied }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Receiving Destination Location *</label>
                <select [(ngModel)]="poFormData.locationId" name="locationId" class="form-control" required>
                  <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }}</option>
                </select>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Product *</label>
                  <select [(ngModel)]="poFormData.productId" name="productId" class="form-control" (change)="onPoProductChange()" required>
                    <option *ngFor="let p of products" [ngValue]="p.id">{{ p.name }} ({{ p.sku }})</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Order Quantity *</label>
                  <input type="number" [(ngModel)]="poFormData.quantity" name="quantity" class="form-control" min="1" required />
                </div>
              </div>

              <div class="form-group">
                <label>Purchase Unit Price (₹) *</label>
                <input type="number" [(ngModel)]="poFormData.unitPrice" name="unitPrice" class="form-control" step="0.01" required />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showPoModal = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="submitting">
                <i *ngIf="submitting" class="fa-solid fa-spinner fa-spin"></i>
                <span>Place Purchase Order</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Receive Goods Modal (Partial Receiving Support) -->
      <div *ngIf="showReceiveModal && receivingPo" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Receive Goods — {{ receivingPo.poNumber }}</h3>
            <button class="modal-close" (click)="showReceiveModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form (ngSubmit)="submitGoodsReceipt()">
            <div class="modal-body">
              <p class="text-muted mb-3">
                Supplier: <strong>{{ receivingPo.supplierName }}</strong> | Destination: <strong>{{ receivingPo.locationName }}</strong>
              </p>

              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Ordered</th>
                    <th>Received</th>
                    <th>Receive Now</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of receiveItems">
                    <td>{{ item.productName }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.receivedQuantity }}</td>
                    <td>
                      <input 
                        type="number" 
                        [(ngModel)]="item.receiveNow" 
                        [name]="'recv_' + item.itemId" 
                        class="form-control input-sm" 
                        [max]="item.quantity - item.receivedQuantity" 
                        min="0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showReceiveModal = false">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="submitting">
                <i *ngIf="submitting" class="fa-solid fa-spinner fa-spin"></i>
                <span>Confirm & Increase Stock</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-page {
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

    /* Tabs Header */
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
    .tab-btn:hover {
      color: var(--text-main);
    }
    .tab-btn.active {
      color: var(--primary);
    }
    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--primary);
    }

    /* Filters */
    .filters-bar {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .search-box {
      position: relative;
      width: 320px;
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
    .status-select-wrapper {
      width: 180px;
    }
    .filter-select {
      width: 100%;
      height: 38px;
      padding: 0 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: #ffffff;
      font-size: 13.5px;
      cursor: pointer;
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
    .action-btn:hover { background: #ede9fe; color: var(--primary); }
    .btn-sm {
      padding: 4px 10px;
      font-size: 12px;
      height: 30px;
    }

    .fw-semibold { font-weight: 600; }
    .text-right { text-align: right; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .order-summary-box {
      background: #f8fafc;
      padding: 14px;
      border-radius: var(--radius-sm);
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 10px;
    }
    .mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .mini-table th, .mini-table td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }
    .input-sm {
      width: 80px;
      padding: 4px 8px;
    }
  `]
})
export class OrdersComponent implements OnInit {
  apiService = inject(ApiService);
  toastService = inject(ToastService);

  activeTab: 'sales' | 'purchase' = 'sales';
  salesOrders: SalesOrder[] = [];
  purchaseOrders: PurchaseOrder[] = [];
  products: Product[] = [];
  locations: LocationItem[] = [];
  suppliers: Supplier[] = [];

  search = '';
  selectedStatus = '';
  loading = false;
  submitting = false;

  showSalesModal = false;
  salesFormData: any = {};
  selectedProductPrice = 0;

  showPoModal = false;
  poFormData: any = {};

  showReceiveModal = false;
  receivingPo: PurchaseOrder | null = null;
  receiveItems: any[] = [];

  ngOnInit() {
    this.loadCommonData();
    this.loadOrders();
  }

  loadCommonData() {
    this.apiService.getProducts().subscribe(p => this.products = p);
    this.apiService.getLocations().subscribe(l => this.locations = l);
    this.apiService.getSuppliers().subscribe(s => this.suppliers = s);
  }

  setTab(tab: 'sales' | 'purchase') {
    this.activeTab = tab;
    this.selectedStatus = '';
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    if (this.activeTab === 'sales') {
      this.apiService.getSalesOrders(this.selectedStatus || undefined, this.search || undefined).subscribe({
        next: (data) => {
          this.salesOrders = data;
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      this.apiService.getPurchaseOrders(this.selectedStatus || undefined, this.search || undefined).subscribe({
        next: (data) => {
          this.purchaseOrders = data;
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  openCreateModal() {
    if (this.activeTab === 'sales') {
      const p = this.products[0];
      this.salesFormData = {
        customerName: 'Walk-in Customer',
        locationId: this.locations[0]?.id,
        productId: p?.id,
        quantity: 1
      };
      this.selectedProductPrice = p?.sellingPrice || 799;
      this.showSalesModal = true;
    } else {
      const p = this.products[0];
      this.poFormData = {
        supplierId: this.suppliers[0]?.id,
        locationId: this.locations[0]?.id,
        productId: p?.id,
        quantity: 100,
        unitPrice: p?.purchasePrice || 500
      };
      this.showPoModal = true;
    }
  }

  onSalesProductChange() {
    const p = this.products.find(prod => prod.id === this.salesFormData.productId);
    if (p) this.selectedProductPrice = p.sellingPrice;
  }

  onPoProductChange() {
    const p = this.products.find(prod => prod.id === this.poFormData.productId);
    if (p) this.poFormData.unitPrice = p.purchasePrice;
  }

  submitSalesOrder() {
    if (!this.salesFormData.quantity || this.salesFormData.quantity <= 0) {
      this.toastService.warning('Validation', 'Quantity must be at least 1.');
      return;
    }

    this.submitting = true;
    const payload = {
      customerName: this.salesFormData.customerName,
      locationId: this.salesFormData.locationId,
      items: [
        {
          productId: this.salesFormData.productId,
          quantity: this.salesFormData.quantity,
          unitPrice: this.selectedProductPrice
        }
      ]
    };

    this.apiService.createSalesOrder(payload).subscribe({
      next: (order) => {
        this.submitting = false;
        this.showSalesModal = false;
        this.toastService.success('Order Placed', `Order ${order.orderNumber} confirmed! Stock deducted.`);
        this.loadOrders();
      },
      error: (err) => {
        this.submitting = false;
        this.toastService.danger('Order Failed', err.error?.message || 'Insufficient stock.');
      }
    });
  }

  submitPoOrder() {
    this.submitting = true;
    const payload = {
      supplierId: this.poFormData.supplierId,
      locationId: this.poFormData.locationId,
      items: [
        {
          productId: this.poFormData.productId,
          quantity: this.poFormData.quantity,
          unitPrice: this.poFormData.unitPrice
        }
      ]
    };

    this.apiService.createPurchaseOrder(payload).subscribe({
      next: (po) => {
        this.submitting = false;
        this.showPoModal = false;
        this.toastService.success('PO Created', `Purchase order ${po.poNumber} placed successfully.`);
        this.loadOrders();
      },
      error: (err) => {
        this.submitting = false;
        this.toastService.danger('Error', err.error?.message || 'Failed to place purchase order.');
      }
    });
  }

  openReceiveModal(po: PurchaseOrder) {
    this.receivingPo = po;
    this.receiveItems = (po.items || []).map(i => ({
      itemId: i.id,
      productName: i.productName,
      quantity: i.quantity,
      receivedQuantity: i.receivedQuantity || 0,
      receiveNow: (i.quantity - (i.receivedQuantity || 0))
    }));
    this.showReceiveModal = true;
  }

  submitGoodsReceipt() {
    if (!this.receivingPo) return;
    this.submitting = true;

    const payload = {
      poId: this.receivingPo.id,
      items: this.receiveItems.map(i => ({
        itemId: i.itemId,
        receiveQuantity: Number(i.receiveNow) || 0
      }))
    };

    this.apiService.receiveGoods(payload).subscribe({
      next: (updatedPo) => {
        this.submitting = false;
        this.showReceiveModal = false;
        this.toastService.success('Goods Received', `Stock added to inventory! Status: ${updatedPo.status}`);
        this.loadOrders();
      },
      error: (err) => {
        this.submitting = false;
        this.toastService.danger('Error', err.error?.message || 'Failed to receive goods.');
      }
    });
  }

  viewSalesOrder(order: SalesOrder) {
    this.toastService.info('Order Info', `Order ${order.orderNumber} for ${order.customerName} - Total ₹ ${order.totalAmount}`);
  }

  viewPurchaseOrder(po: PurchaseOrder) {
    this.toastService.info('PO Info', `PO ${po.poNumber} from ${po.supplierName} - Status ${po.status}`);
  }

  printOrder(order: SalesOrder) {
    window.print();
  }

  getOrderStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'RECEIVED':
        return 'badge-completed';
      case 'PROCESSING':
        return 'badge-processing';
      case 'SHIPPED':
      case 'PARTIALLY_RECEIVED':
        return 'badge-shipped';
      case 'PENDING':
      case 'ORDERED':
        return 'badge-pending';
      default:
        return 'badge-danger';
    }
  }

  formatStatus(status: string): string {
    if (!status) return '';
    return status.replace(/_/g, ' ');
  }
}
