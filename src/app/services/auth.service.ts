import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  message: string;
  username: string;
  authorities: { authority: string }[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api';
  private readonly TOKEN_KEY = 'jwt_token';
  
  private currentUserSignal = signal<User | null>(null);
  private isLoggedInSignal = signal(false);
  
  currentUser = this.currentUserSignal.asReadonly();
  isLoggedIn = this.isLoggedInSignal.asReadonly();

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        this.setToken(response.token);
        this.isLoggedInSignal.set(true);
        this.loadUserProfile();
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSignal.set(null);
    this.isLoggedInSignal.set(false);
    this.router.navigate(['/login']);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private loadUserProfile(): void {
    const token = this.getToken();
    if (token) {
      this.http.get<User>(`${this.API_URL}/admin/profile`, { 
        headers: this.getAuthHeaders() 
      }).subscribe({
        next: (user) => {
          this.currentUserSignal.set(user);
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  private checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      this.isLoggedInSignal.set(true);
      this.loadUserProfile();
    }
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }
}
