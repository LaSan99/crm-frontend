import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

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

export interface CreatePackageRequest {
  name: string;
  description: string;
  price: number;
  dataLimitGB: number;
  voiceMinutes: number;
  smsCount: number;
}

@Component({
  selector: 'app-package-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './package-form.component.html',
  styleUrl: './package-form.component.css'
})
export class PackageFormComponent {
  private readonly http: HttpClient;
  private readonly authService: AuthService;

  package = input<Package | null>(null);
  packageSaved = output<void>();
  formClosed = output<void>();

  formData = signal<CreatePackageRequest>({
    name: '',
    description: '',
    price: 0,
    dataLimitGB: 0,
    voiceMinutes: 0,
    smsCount: 0
  });

  isEditing = computed(() => !!this.package());
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(http: HttpClient, authService: AuthService) {
    this.http = http;
    this.authService = authService;
    this.initializeForm();
  }

  private initializeForm(): void {
    const editPackage = this.package();
    if (editPackage) {
      this.formData.set({
        name: editPackage.name,
        description: editPackage.description,
        price: editPackage.price,
        dataLimitGB: editPackage.dataLimitGB,
        voiceMinutes: editPackage.voiceMinutes,
        smsCount: editPackage.smsCount
      });
    }
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const data = this.formData();
    
    if (this.isEditing()) {
      this.updatePackage(data);
    } else {
      this.createPackage(data);
    }
  }

  private createPackage(packageData: CreatePackageRequest): void {
    this.http.post<Package>('http://localhost:8080/api/admin/packages', packageData, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage.set('Package created successfully');
        setTimeout(() => {
          this.packageSaved.emit();
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to create package');
        console.error('Create package error:', error);
      }
    });
  }

  private updatePackage(packageData: CreatePackageRequest): void {
    const editPackage = this.package();
    if (!editPackage) return;

    this.http.put<Package>(`http://localhost:8080/api/admin/packages/${editPackage.id}`, packageData, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage.set('Package updated successfully');
        setTimeout(() => {
          this.packageSaved.emit();
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to update package');
        console.error('Update package error:', error);
      }
    });
  }

  private validateForm(): boolean {
    const data = this.formData();
    
    if (!data.name.trim()) {
      this.errorMessage.set('Package name is required');
      return false;
    }
    
    if (!data.description.trim()) {
      this.errorMessage.set('Description is required');
      return false;
    }
    
    if (data.price <= 0) {
      this.errorMessage.set('Price must be greater than 0');
      return false;
    }
    
    if (data.dataLimitGB < 0) {
      this.errorMessage.set('Data limit cannot be negative');
      return false;
    }
    
    if (data.voiceMinutes < 0) {
      this.errorMessage.set('Voice minutes cannot be negative');
      return false;
    }
    
    if (data.smsCount < 0) {
      this.errorMessage.set('SMS count cannot be negative');
      return false;
    }
    
    return true;
  }

  closeForm(): void {
    this.formClosed.emit();
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  formatPriceDisplay(): string {
    const price = this.formData().price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getPackageIcon(): string {
    const data = this.formData();
    if (data.dataLimitGB >= 100) return '📱';
    if (data.voiceMinutes >= 5000) return '📞';
    if (data.smsCount >= 1000) return '💬';
    return '📦';
  }
}
