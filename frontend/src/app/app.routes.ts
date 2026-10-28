import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductsComponent } from './pages/products/products.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { SuppliersComponent } from './pages/suppliers/suppliers.component';
import { LocationsComponent } from './pages/locations/locations.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { BarcodeRfidComponent } from './pages/barcode-rfid/barcode-rfid.component';
import { UsersComponent } from './pages/users/users.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'suppliers', component: SuppliersComponent },
      { path: 'locations', component: LocationsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'barcode-rfid', component: BarcodeRfidComponent },
      { 
        path: 'users', 
        component: UsersComponent,
        data: { roles: ['ADMIN'] }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
