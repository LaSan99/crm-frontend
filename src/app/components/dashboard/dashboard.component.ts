import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LayoutComponent } from '../layout/layout.component';

export interface DashboardStats {
  totalUsers: number;
  totalPackages: number;
  activePackages: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly router: Router;
  private readonly authService: AuthService;
  private readonly http: HttpClient;

  stats = signal<DashboardStats>({
    totalUsers: 0,
    totalPackages: 0,
    activePackages: 0
  });

  isLoading = signal(true);
  errorMessage = signal('');

  currentUser = computed(() => this.authService.currentUser());
  isLoggedIn = computed(() => this.authService.isLoggedIn());

  constructor(router: Router, authService: AuthService, http: HttpClient) {
    this.router = router;
    this.authService = authService;
    this.http = http;
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    this.isLoading.set(true);
    
    this.http.get<DashboardStats>('http://localhost:8080/api/admin/dashboard', {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load dashboard statistics');
        console.error('Dashboard error:', error);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  refreshStats(): void {
    this.loadDashboardStats();
  }
}
