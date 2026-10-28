import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Product, Category } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="products-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-subtitle">Manage your product catalog</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <i class="fa-solid fa-plus"></i>
          <span>Add Product</span>
        </button>
      </div>

      <!-- Filters Row -->
      <div class="filters-bar">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            placeholder="Search products..." 
            [(ngModel)]="search" 
            (ngModelChange)="onFilterChange()"
            class="filter-input"
          />
        </div>

        <div class="category-select-wrapper">
          <select [(ngModel)]="selectedCategoryId" (change)="onFilterChange()" class="filter-select">
            <option [ngValue]="null">All Categories</option>
            <option *ngFor="let cat of categories" [ngValue]="cat.id">{{ cat.name }}</option>
          </select>
        </div>
      </div>

      <!-- Products Table (Matches Reference Image 3) -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="8" class="text-center py-4">
                  <i class="fa-solid fa-spinner fa-spin text-primary"></i> Loading products...
                </td>
              </tr>
              <tr *ngIf="!loading && products.length === 0">
                <td colspan="8" class="text-center py-4 text-muted">
                  No products found. Click "+ Add Product" to create one.
                </td>
              </tr>
              <tr *ngFor="let p of products" [class.inactive]="!p.active">
                <td>
                  <img [src]="p.imageUrl || '/assets/images/mouse.svg'" alt="Product" class="product-thumb" />
                </td>
                <td class="fw-semibold">{{ p.name }}</td>
                <td class="text-muted">{{ p.categoryName || 'Unassigned' }}</td>
                <td><code>{{ p.sku }}</code></td>
                <td class="fw-semibold">₹ {{ p.sellingPrice | number:'1.0-0' }}</td>
                <td class="fw-semibold">{{ p.totalStock }}</td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(p.status)">
                    {{ p.status }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <button class="action-btn edit" title="Edit" (click)="openEditModal(p)">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn view" title="View Details" (click)="openViewModal(p)">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                    <button 
                      *ngIf="authService.isManagerOrAdmin()" 
                      class="action-btn delete" 
                      title="Deactivate" 
                      (click)="confirmDelete(p)"
                    >
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Product Modal -->
      <div *ngIf="showModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h3>
            <button class="modal-close" (click)="closeModal()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <form (ngSubmit)="saveProduct()">
            <div class="modal-body">
              <div class="form-group">
                <label>Product Name *</label>
                <input type="text" [(ngModel)]="formData.name" name="name" class="form-control" required placeholder="e.g. Ergonomic Keyboard" />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>SKU (Stock Keeping Unit) *</label>
                  <input type="text" [(ngModel)]="formData.sku" name="sku" class="form-control" required placeholder="e.g. ELEC006" />
                </div>
                <div class="form-group">
                  <label>Barcode / Universal Code</label>
                  <input type="text" [(ngModel)]="formData.barcode" name="barcode" class="form-control" placeholder="e.g. 8901234006" />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Category *</label>
                  <select [(ngModel)]="formData.categoryId" name="categoryId" class="form-control" required>
                    <option *ngFor="let cat of categories" [ngValue]="cat.id">{{ cat.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Reorder Level (Alert Threshold)</label>
                  <input type="number" [(ngModel)]="formData.reorderLevel" name="reorderLevel" class="form-control" min="1" />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Purchase Price (₹)</label>
                  <input type="number" [(ngModel)]="formData.purchasePrice" name="purchasePrice" class="form-control" step="0.01" />
                </div>
                <div class="form-group">
                  <label>Selling Price (₹) *</label>
                  <input type="number" [(ngModel)]="formData.sellingPrice" name="sellingPrice" class="form-control" step="0.01" required />
                </div>
              </div>

              <div class="form-group">
                <label>Image Icon / URL</label>
                <select [(ngModel)]="formData.imageUrl" name="imageUrl" class="form-control">
                  <option value="/assets/images/mouse.svg">Wireless Mouse Icon</option>
                  <option value="/assets/images/tshirt.svg">Apparel T-Shirt Icon</option>
                  <option value="/assets/images/rice.svg">Grocery Rice Bag Icon</option>
                  <option value="/assets/images/bottle.svg">Water Bottle Icon</option>
                  <option value="/assets/images/speaker.svg">Bluetooth Speaker Icon</option>
                </select>
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="formData.description" name="description" class="form-control" rows="3" placeholder="Brief product overview..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="saving">
                <i *ngIf="saving" class="fa-solid fa-spinner fa-spin"></i>
                <span>{{ saving ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- View Product Modal -->
      <div *ngIf="showViewModal && viewedProduct" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Product Details</h3>
            <button class="modal-close" (click)="showViewModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="view-prod-card">
              <img [src]="viewedProduct.imageUrl || '/assets/images/mouse.svg'" alt="Product" class="view-prod-img" />
              <div class="view-prod-meta">
                <h4>{{ viewedProduct.name }}</h4>
                <div class="text-muted">{{ viewedProduct.categoryName }} • SKU: {{ viewedProduct.sku }}</div>
                <div class="price-line">Selling Price: <strong>₹ {{ viewedProduct.sellingPrice | number:'1.0-0' }}</strong></div>
                <div>Status: <span class="badge" [ngClass]="getStatusBadgeClass(viewedProduct.status)">{{ viewedProduct.status }}</span></div>
              </div>
            </div>

            <h5 class="section-title mt-4">Stock Breakdown by Location</h5>
            <div *ngIf="locationStockLoading" class="text-center py-3">
              <i class="fa-solid fa-spinner fa-spin"></i>
            </div>
            <table *ngIf="!locationStockLoading" class="mini-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let loc of locationStocks">
                  <td>{{ loc.locationName }}</td>
                  <td class="fw-semibold">{{ loc.availableStock }}</td>
                  <td>{{ loc.reservedStock }}</td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadgeClass(loc.status)">{{ loc.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showViewModal = false">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .products-page {
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
    .filter-input:focus {
      border-color: var(--primary);
    }

    .category-select-wrapper {
      width: 200px;
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
      vertical-align: middle;
    }

    .data-table tr:hover td {
      background-color: #faf5ff;
    }

    .product-thumb {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      object-fit: contain;
      background: #f1f5f9;
      padding: 2px;
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
      transition: all 0.15s;
    }
    .action-btn.edit:hover { background: #ede9fe; color: var(--primary); border-color: #c4b5fd; }
    .action-btn.view:hover { background: #e0f2fe; color: #0284c7; border-color: #7dd3fc; }
    .action-btn.delete:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

    .text-right { text-align: right; }
    .fw-semibold { font-weight: 600; }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .view-prod-card {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #f8fafc;
      border-radius: var(--radius-md);
      align-items: center;
    }
    .view-prod-img {
      width: 64px;
      height: 64px;
      border-radius: 10px;
      background: #ffffff;
      padding: 6px;
    }
    .view-prod-meta h4 {
      font-size: 16px;
      font-weight: 700;
    }
    .price-line {
      margin: 4px 0 6px;
    }

    .mini-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 13px;
    }
    .mini-table th, .mini-table td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
    }
    .mt-4 { margin-top: 16px; }
  `]
})
export class ProductsComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  wsService = inject(WebsocketService);
  route = inject(ActivatedRoute);

  products: Product[] = [];
  categories: Category[] = [];
  selectedCategoryId: number | null = null;
  search = '';
  loading = false;
  saving = false;

  showModal = false;
  isEditing = false;
  formData: any = {};

  showViewModal = false;
  viewedProduct: Product | null = null;
  locationStocks: any[] = [];
  locationStockLoading = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.search = params['search'];
      }
      this.loadCategories();
      this.loadProducts();
    });

    // Real-time Staff -> Manager -> Admin synchronization (Section 6)
    this.wsService.productChange$.subscribe((event) => {
      console.log('Real-time product change event received:', event);
      this.loadProducts(false);
    });
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (e) => console.error(e)
    });
  }

  loadProducts(showSpinner = true) {
    if (showSpinner) this.loading = true;
    this.apiService.getProducts(this.selectedCategoryId || undefined, this.search || undefined).subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    this.loadProducts();
  }

  openAddModal() {
    this.isEditing = false;
    this.formData = {
      name: '',
      sku: '',
      barcode: '',
      categoryId: this.categories.length > 0 ? this.categories[0].id : null,
      imageUrl: '/assets/images/mouse.svg',
      purchasePrice: 100,
      sellingPrice: 199,
      reorderLevel: 20,
      description: ''
    };
    this.showModal = true;
  }

  openEditModal(p: Product) {
    this.isEditing = true;
    this.formData = {
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      categoryId: p.categoryId,
      imageUrl: p.imageUrl || '/assets/images/mouse.svg',
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      reorderLevel: p.reorderLevel,
      description: p.description
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveProduct() {
    if (!this.formData.name || !this.formData.sku || !this.formData.sellingPrice) {
      this.toastService.warning('Validation', 'Please fill in product name, SKU and price.');
      return;
    }

    this.saving = true;
    if (this.isEditing) {
      this.apiService.updateProduct(this.formData.id, this.formData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.toastService.success('Updated', 'Product updated successfully!');
          this.loadProducts();
        },
        error: (err) => {
          this.saving = false;
          this.toastService.danger('Error', err.error?.message || 'Failed to update product.');
        }
      });
    } else {
      this.apiService.createProduct(this.formData).subscribe({
        next: (created) => {
          this.saving = false;
          this.closeModal();
          this.toastService.success('Success', `Product ${created.name} added!`);
          this.loadProducts();
        },
        error: (err) => {
          this.saving = false;
          this.toastService.danger('Error', err.error?.message || 'Failed to create product.');
        }
      });
    }
  }

  openViewModal(p: Product) {
    this.viewedProduct = p;
    this.showViewModal = true;
    this.locationStockLoading = true;
    this.apiService.getInventory(p.id, undefined).subscribe({
      next: (stocks) => {
        this.locationStocks = stocks;
        this.locationStockLoading = false;
      },
      error: () => this.locationStockLoading = false
    });
  }

  confirmDelete(p: Product) {
    if (confirm(`Are you sure you want to deactivate '${p.name}'?`)) {
      this.apiService.deleteProduct(p.id).subscribe({
        next: () => {
          this.toastService.success('Deactivated', `Product ${p.name} deactivated.`);
          this.loadProducts();
        },
        error: (err) => this.toastService.danger('Error', err.error?.message || 'Failed to deactivate.')
      });
    }
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
