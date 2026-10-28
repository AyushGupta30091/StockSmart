import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryId?: number;
  categoryName?: string;
  imageUrl?: string;
  purchasePrice: number;
  sellingPrice: number;
  reorderLevel: number;
  active: boolean;
  totalStock: number;
  status: string; // In Stock, Low Stock, Out of Stock
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
}

export interface LocationItem {
  id: number;
  name: string;
  code: string;
  address?: string;
  type?: string;
  active: boolean;
  totalStock?: number;
}

export interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  locationId: number;
  locationName: string;
  availableStock: number;
  reservedStock: number;
  reorderLevel: number;
  status: string;
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  locationId: number;
  locationName: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  createdBy: string;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  locationId: number;
  locationName: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  createdBy: string;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    receivedQuantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  productsSupplied: string;
  active: boolean;
}

export interface BarcodeLookupResult {
  found: boolean;
  product?: Product;
  locationStocks?: InventoryItem[];
  totalStock?: number;
  overallStatus?: string;
}

export interface RfidTag {
  id: number;
  tagId: string;
  productId: number;
  productName: string;
  sku: string;
  locationId: number;
  locationName: string;
  status: string;
  lastScannedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  productsChange: string;
  totalStockValue: number;
  stockValueChange: string;
  pendingOrders: number;
  pendingOrdersChange: string;
  lowStockCount: number;
  lowStockNote: string;
  stockByLocation: Array<{ location: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number; percentage: number }>;
  salesTrends: Array<{ date: string; amount: number }>;
  topSellingProducts: Array<{ name: string; quantitySold: number }>;
  recentTransactions: SalesOrder[];
  lowStockProducts: Product[];
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  timestamp: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  targetRole?: string;
  readStatus: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // Products
  getProducts(categoryId?: number, search?: string): Observable<Product[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId.toString());
    if (search) params = params.set('search', search);
    return this.http.get<Product[]>('/api/products', { params });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`);
  }

  createProduct(data: any): Observable<Product> {
    return this.http.post<Product>('/api/products', data);
  }

  updateProduct(id: number, data: any): Observable<Product> {
    return this.http.put<Product>(`/api/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`/api/products/${id}`);
  }

  // Categories & Locations
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }

  getLocations(): Observable<LocationItem[]> {
    return this.http.get<LocationItem[]>('/api/locations');
  }

  createLocation(data: any): Observable<LocationItem> {
    return this.http.post<LocationItem>('/api/locations', data);
  }

  // Inventory
  getInventory(productId?: number, locationId?: number): Observable<InventoryItem[]> {
    let params = new HttpParams();
    if (productId) params = params.set('productId', productId.toString());
    if (locationId) params = params.set('locationId', locationId.toString());
    return this.http.get<InventoryItem[]>('/api/inventory', { params });
  }

  getLowStockInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>('/api/inventory/low-stock');
  }

  adjustStock(data: { productId: number; locationId: number; newStock: number; reason?: string }): Observable<InventoryItem> {
    return this.http.post<InventoryItem>('/api/inventory/adjust', data);
  }

  transferStock(data: { productId: number; sourceLocationId: number; destinationLocationId: number; quantity: number; notes?: string }): Observable<void> {
    return this.http.post<void>('/api/inventory/transfer', data);
  }

  // Orders
  getSalesOrders(status?: string, search?: string): Observable<SalesOrder[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<SalesOrder[]>('/api/orders/sales', { params });
  }

  createSalesOrder(data: any): Observable<SalesOrder> {
    return this.http.post<SalesOrder>('/api/orders/sales', data);
  }

  getPurchaseOrders(status?: string, search?: string): Observable<PurchaseOrder[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<PurchaseOrder[]>('/api/orders/purchase', { params });
  }

  createPurchaseOrder(data: any): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>('/api/orders/purchase', data);
  }

  receiveGoods(data: { poId: number; items: Array<{ itemId: number; receiveQuantity: number }> }): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>('/api/orders/purchase/receive', data);
  }

  // Suppliers
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>('/api/suppliers');
  }

  createSupplier(data: any): Observable<Supplier> {
    return this.http.post<Supplier>('/api/suppliers', data);
  }

  updateSupplier(id: number, data: any): Observable<Supplier> {
    return this.http.put<Supplier>(`/api/suppliers/${id}`, data);
  }

  toggleSupplierStatus(id: number): Observable<void> {
    return this.http.patch<void>(`/api/suppliers/${id}/toggle-status`, {});
  }

  // Barcode & RFID
  lookupBarcode(code: string): Observable<BarcodeLookupResult> {
    return this.http.get<BarcodeLookupResult>('/api/barcode-rfid/lookup', {
      params: new HttpParams().set('code', code)
    });
  }

  getRfidTags(): Observable<RfidTag[]> {
    return this.http.get<RfidTag[]>('/api/barcode-rfid/tags');
  }

  scanRfidTag(tagId: string): Observable<RfidTag> {
    return this.http.post<RfidTag>('/api/barcode-rfid/scan-rfid', null, {
      params: new HttpParams().set('tagId', tagId)
    });
  }

  // Dashboard & Reports
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/dashboard/stats');
  }

  getReportsData(): Observable<any> {
    return this.http.get<any>('/api/reports/data');
  }

  // Users (Admin)
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>('/api/users');
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>('/api/users', data);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put<any>(`/api/users/${id}`, data);
  }

  toggleUserStatus(id: number): Observable<void> {
    return this.http.patch<void>(`/api/users/${id}/toggle-status`, {});
  }

  // Notifications & Audit Logs
  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>('/api/notifications');
  }

  markNotificationsRead(): Observable<void> {
    return this.http.post<void>('/api/notifications/mark-read', {});
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>('/api/audit-logs');
  }
}
