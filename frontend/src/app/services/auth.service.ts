import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  locationId?: number;
  locationName?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  private loadStoredUser() {
    const stored = localStorage.getItem('stocksmart_user');
    const token = localStorage.getItem('stocksmart_token');
    if (stored && token) {
      try {
        this.currentUser.set(JSON.parse(stored));
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('stocksmart_token', res.token);
          const user: User = {
            id: res.id,
            email: res.email,
            fullName: res.fullName,
            role: res.role,
            locationId: res.locationId,
            locationName: res.locationName,
            token: res.token
          };
          localStorage.setItem('stocksmart_user', JSON.stringify(user));
          this.currentUser.set(user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('stocksmart_token');
    localStorage.removeItem('stocksmart_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentUser() && !!localStorage.getItem('stocksmart_token');
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return roles.includes(user.role);
  }

  isAdmin(): boolean {
    return this.hasRole(['ADMIN']);
  }

  isManagerOrAdmin(): boolean {
    return this.hasRole(['ADMIN', 'MANAGER']);
  }
}
