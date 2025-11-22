import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PackageFormComponent } from './package-form.component';

export interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  dataLimitGB: number;
  voiceMinutes: number;
  smsCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-packages',
  standalone: true,
  imports: [CommonModule, PackageFormComponent],
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.css'
})
export class PackagesComponent {
  private readonly router: Router;
  private readonly authService: AuthService;
  private readonly http: HttpClient;

  packages = signal<Package[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  showCreateForm = signal(false);
  editingPackage = signal<Package | null>(null);

  currentUser = computed(() => this.authService.currentUser());

  constructor(router: Router, authService: AuthService, http: HttpClient) {
    this.router = router;
    this.authService = authService;
    this.http = http;
    this.loadPackages();
  }

  private loadPackages(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.get<Package[]>('http://localhost:8080/api/admin/packages', {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.packages.set(data);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load packages');
        console.error('Packages error:', error);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  togglePackageStatus(packageItem: Package): void {
    this.http.put(`http://localhost:8080/api/admin/packages/${packageItem.id}/toggle-status`, {}, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage.set(`Package "${packageItem.name}" status updated successfully`);
        this.loadPackages();
        this.clearMessages();
      },
      error: (error) => {
        this.errorMessage.set('Failed to update package status');
        console.error('Toggle status error:', error);
      }
    });
  }

  deletePackage(packageItem: Package): void {
    if (confirm(`Are you sure you want to delete package "${packageItem.name}"?`)) {
      this.http.delete(`http://localhost:8080/api/admin/packages/${packageItem.id}`, {
        headers: this.authService.getAuthHeaders()
      }).subscribe({
        next: () => {
          this.successMessage.set(`Package "${packageItem.name}" deleted successfully`);
          this.loadPackages();
          this.clearMessages();
        },
        error: (error) => {
          this.errorMessage.set('Failed to delete package');
          console.error('Delete error:', error);
        }
      });
    }
  }

  showCreatePackageForm(): void {
    this.showCreateForm.set(true);
    this.editingPackage.set(null);
  }

  editPackage(packageItem: Package): void {
    this.editingPackage.set(packageItem);
    this.showCreateForm.set(false);
  }

  closeForms(): void {
    this.showCreateForm.set(false);
    this.editingPackage.set(null);
  }

  onPackageSaved(): void {
    this.closeForms();
    this.loadPackages();
  }

  clearMessages(): void {
    setTimeout(() => {
      this.errorMessage.set('');
      this.successMessage.set('');
    }, 3000);
  }

  getStatusBadgeClass(active: boolean): string {
    return active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getPriceClass(price: number): string {
    if (price < 30) return 'text-green-600 font-semibold';
    if (price < 60) return 'text-blue-600 font-semibold';
    return 'text-purple-600 font-semibold';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  refreshPackages(): void {
    this.loadPackages();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
