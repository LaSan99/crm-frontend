import { Component, signal, computed, inject, input, output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Input } from '@angular/core';

export interface Package {
  id?: number;
  name: string;
  description: string;
  price: number;
  dataLimitGB: number;
  voiceMinutes: number;
  smsCount: number;
  packageType: 'PREPAID' | 'POSTPAID';
  active?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  category?: string;
}

@Component({
  selector: 'app-user-package-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-package-form.component.html',
  styleUrl: './user-package-form.component.css'
})
export class UserPackageFormComponent implements OnChanges {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  @Input() user: User | null = null;
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  package = signal<Package>({
    name: '',
    description: '',
    price: 0,
    dataLimitGB: 0,
    voiceMinutes: 0,
    smsCount: 0,
    packageType: 'PREPAID'
  });

  packageCreated = output<Package>();
  formClosed = output<void>();

  // Predefined package templates
  packageTemplates = signal<Package[]>([
    {
      name: 'Basic Prepaid',
      description: 'Basic prepaid package for light users',
      price: 29.99,
      dataLimitGB: 5,
      voiceMinutes: 500,
      smsCount: 100,
      packageType: 'PREPAID'
    },
    {
      name: 'Standard Prepaid',
      description: 'Standard prepaid package for moderate users',
      price: 49.99,
      dataLimitGB: 15,
      voiceMinutes: 1000,
      smsCount: 500,
      packageType: 'PREPAID'
    },
    {
      name: 'Premium Prepaid',
      description: 'Premium prepaid package for heavy users',
      price: 79.99,
      dataLimitGB: 50,
      voiceMinutes: 2000,
      smsCount: 1000,
      packageType: 'PREPAID'
    },
    {
      name: 'Basic Postpaid',
      description: 'Basic postpaid package with monthly billing',
      price: 39.99,
      dataLimitGB: 10,
      voiceMinutes: 750,
      smsCount: 250,
      packageType: 'POSTPAID'
    },
    {
      name: 'Standard Postpaid',
      description: 'Standard postpaid package with unlimited features',
      price: 69.99,
      dataLimitGB: 100,
      voiceMinutes: 3000,
      smsCount: 2000,
      packageType: 'POSTPAID'
    },
    {
      name: 'Premium Postpaid',
      description: 'Premium postpaid package with unlimited everything',
      price: 99.99,
      dataLimitGB: 999,
      voiceMinutes: 9999,
      smsCount: 9999,
      packageType: 'POSTPAID'
    }
  ]);

  filteredTemplates = computed(() => {
    const currentUser = this.user;
    if (!currentUser) return [];
    
    return this.packageTemplates().filter(template => 
      template.packageType === currentUser.category
    );
  });

  ngOnChanges(): void {
    // Auto-select package type based on user category
    if (this.user && this.user.category) {
      this.package.update(pkg => ({
        ...pkg,
        packageType: this.user!.category as 'PREPAID' | 'POSTPAID'
      }));
    }
  }

  useTemplate(template: Package): void {
    this.package.set({
      ...template,
      name: '', // Clear name for auto-generation
      description: template.description
    });
  }

  createPackage(): void {
    const currentUser = this.user;
    if (!currentUser) {
      this.errorMessage.set('No user selected');
      return;
    }

    const packageData = this.package();
    
    // Validation
    if (!packageData.description || packageData.price <= 0 || 
        packageData.dataLimitGB <= 0 || packageData.voiceMinutes <= 0 || 
        packageData.smsCount <= 0) {
      this.errorMessage.set('Please fill in all required fields with valid values');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.post<Package>(`http://localhost:8080/api/admin/users/${currentUser.id}/packages`, packageData, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (createdPackage) => {
        this.successMessage.set('Package created successfully for ' + currentUser.fullName);
        this.packageCreated.emit(createdPackage);
        this.resetForm();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'Failed to create package');
        console.error('Package creation error:', error);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  resetForm(): void {
    const currentUser = this.user;
    this.package.set({
      name: '',
      description: '',
      price: 0,
      dataLimitGB: 0,
      voiceMinutes: 0,
      smsCount: 0,
      packageType: currentUser?.category as 'PREPAID' | 'POSTPAID' || 'PREPAID'
    });
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeForm(): void {
    this.formClosed.emit();
  }

  clearMessages(): void {
    setTimeout(() => {
      this.errorMessage.set('');
      this.successMessage.set('');
    }, 3000);
  }

  getPackageTypeBadgeClass(packageType: string): string {
    switch (packageType) {
      case 'PREPAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'POSTPAID':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
