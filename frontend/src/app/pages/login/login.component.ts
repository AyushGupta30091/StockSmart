import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <!-- Left Hero Section with Warehouse Graphic & Branding -->
      <div class="login-hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="brand-badge">
            <i class="fa-solid fa-boxes-stacked logo-icon"></i>
            <span class="brand-name">StockSmart</span>
          </div>
          <h1 class="brand-tagline">Retail Inventory Optimization</h1>
          <p class="brand-subtitle">
            Manage your inventory smarter<br />
            <strong>Track • Analyze • Grow</strong>
          </p>

          <div class="feature-list">
            <div class="feature-item">
              <div class="feat-icon"><i class="fa-solid fa-layer-group"></i></div>
              <span>Multi-location Inventory</span>
            </div>
            <div class="feature-item">
              <div class="feat-icon"><i class="fa-solid fa-barcode"></i></div>
              <span>Barcode/RFID Support</span>
            </div>
            <div class="feature-item">
              <div class="feat-icon"><i class="fa-solid fa-truck-fast"></i></div>
              <span>Supplier Management</span>
            </div>
            <div class="feature-item">
              <div class="feat-icon"><i class="fa-solid fa-chart-pie"></i></div>
              <span>Real-time Analytics</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Login Card Form -->
      <div class="login-container">
        <div class="login-card">
          <div class="card-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="login-form">
            <div class="form-group">
              <label>Email</label>
              <div class="input-icon-wrapper">
                <i class="fa-regular fa-envelope input-icon"></i>
                <input 
                  type="email" 
                  [(ngModel)]="email" 
                  name="email" 
                  class="form-control with-icon" 
                  placeholder="admin@example.com" 
                  required 
                />
              </div>
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-icon-wrapper">
                <i class="fa-solid fa-lock input-icon"></i>
                <input 
                  type="password" 
                  [(ngModel)]="password" 
                  name="password" 
                  class="form-control with-icon" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
                <span>Remember me</span>
              </label>
              <a href="javascript:void(0)" class="forgot-link" (click)="onForgot()">Forgot password?</a>
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading">
              <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
            </button>
          </form>

          <!-- Reference Image Demo Credentials Box -->
          <div class="demo-box">
            <div class="demo-header">
              <i class="fa-solid fa-key text-purple"></i>
              <strong>Demo Credentials:</strong>
            </div>
            <div class="demo-info">
              <div>Email: <code>admin&#64;stocksmart.com</code></div>
              <div>Password: <code>admin123</code></div>
            </div>
            <div class="quick-fill-buttons">
              <button class="fill-btn" (click)="fillCreds('admin@stocksmart.com', 'admin123')">
                <i class="fa-solid fa-shield-halved"></i> Admin
              </button>
              <button class="fill-btn" (click)="fillCreds('manager@stocksmart.com', 'Manager@123')">
                <i class="fa-solid fa-user-tie"></i> Manager
              </button>
              <button class="fill-btn" (click)="fillCreds('staff@stocksmart.com', 'Staff@123')">
                <i class="fa-solid fa-user-tag"></i> Staff
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      min-height: 100vh;
      background-color: #0f172a;
    }

    .login-hero {
      flex: 1.2;
      position: relative;
      background: url('/assets/images/warehouse-bg.svg') center/cover no-repeat;
      display: flex;
      align-items: center;
      padding: 60px 80px;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 27, 75, 0.82) 100%);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 500px;
      color: #ffffff;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .logo-icon {
      font-size: 36px;
      color: #a78bfa;
    }

    .brand-name {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .brand-tagline {
      font-size: 36px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #ffffff 40%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-subtitle {
      font-size: 16px;
      color: #cbd5e1;
      margin-bottom: 40px;
      line-height: 1.6;
    }
    .brand-subtitle strong {
      color: #a78bfa;
    }

    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 15px;
      font-weight: 500;
      color: #f1f5f9;
    }

    .feat-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: rgba(124, 58, 237, 0.25);
      border: 1px solid rgba(139, 92, 246, 0.4);
      color: #c4b5fd;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }

    .login-container {
      flex: 1;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      padding: 40px;
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
      border: 1px solid var(--border-color);
    }

    .card-header {
      margin-bottom: 28px;
    }
    .card-header h2 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-main);
    }
    .card-header p {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .input-icon-wrapper {
      position: relative;
    }
    .input-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-light);
      font-size: 14px;
    }
    .with-icon {
      padding-left: 36px;
    }

    .form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      font-size: 13px;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: var(--text-muted);
    }

    .forgot-link {
      color: var(--primary);
      font-weight: 500;
    }
    .forgot-link:hover {
      text-decoration: underline;
    }

    .btn-submit {
      width: 100%;
      padding: 12px;
      background-color: var(--primary);
      color: white;
      font-size: 15px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background-color 0.2s, transform 0.1s;
    }
    .btn-submit:hover:not(:disabled) {
      background-color: var(--primary-hover);
    }
    .btn-submit:active:not(:disabled) {
      transform: scale(0.99);
    }

    .demo-box {
      margin-top: 28px;
      padding: 16px;
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: var(--radius-md);
      font-size: 12.5px;
    }
    .demo-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-main);
      margin-bottom: 8px;
    }
    .text-purple { color: var(--primary); }
    .demo-info {
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .demo-info code {
      background: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e9d5ff;
      color: var(--primary-text);
      font-weight: 600;
    }

    .quick-fill-buttons {
      display: flex;
      gap: 8px;
    }
    .fill-btn {
      flex: 1;
      padding: 6px 8px;
      background: #ffffff;
      border: 1px solid #d8b4fe;
      color: #6b21a8;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .fill-btn:hover {
      background: #f3e8ff;
      border-color: var(--primary);
    }

    @media (max-width: 900px) {
      .login-page {
        flex-direction: column;
      }
      .login-hero {
        padding: 40px 20px;
      }
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  email = 'admin@stocksmart.com';
  password = 'admin123';
  rememberMe = true;
  loading = false;

  fillCreds(email: string, pass: string) {
    this.email = email;
    this.password = pass;
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.toastService.warning('Validation Error', 'Please enter email and password.');
      return;
    }

    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Welcome Back', 'Login successful!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Invalid email or password';
        this.toastService.danger('Login Failed', msg);
      }
    });
  }

  onForgot() {
    this.toastService.info('Password Reset', 'For demo accounts, use credentials listed below.');
  }
}
