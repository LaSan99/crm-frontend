import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  enabled: boolean;
  address?: string;
  msisdn?: string;
  category?: string;
  contactDetails?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  user = signal<User | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  currentUser = computed(() => this.authService.currentUser());

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUserDetails(+userId);
    } else {
      this.errorMessage.set('User ID not provided');
      this.isLoading.set(false);
    }
  }

  private loadUserDetails(userId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.get<User>(`http://localhost:8080/api/admin/users/${userId}`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.user.set(data);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load user details');
        console.error('User details error:', error);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  toggleUserStatus(): void {
    const currentUserData = this.user();
    if (!currentUserData) return;

    this.http.put(`http://localhost:8080/api/admin/users/${currentUserData.id}/toggle-status`, {}, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        // Update local user status
        this.user.set({
          ...currentUserData,
          enabled: !currentUserData.enabled
        });
      },
      error: (error) => {
        this.errorMessage.set('Failed to update user status');
        console.error('Toggle status error:', error);
      }
    });
  }

  deleteUser(): void {
    const currentUserData = this.user();
    if (!currentUserData) return;

    if (confirm(`Are you sure you want to delete user "${currentUserData.username}"?`)) {
      this.http.delete(`http://localhost:8080/api/admin/users/${currentUserData.id}`, {
        headers: this.authService.getAuthHeaders()
      }).subscribe({
        next: () => {
          this.router.navigate(['/users']);
        },
        error: (error) => {
          this.errorMessage.set('Failed to delete user');
          console.error('Delete error:', error);
        }
      });
    }
  }

  editUser(): void {
    const currentUserData = this.user();
    if (!currentUserData) return;

    // Navigate to edit form or open modal
    this.router.navigate(['/users'], { 
      queryParams: { edit: currentUserData.id } 
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'USER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBadgeClass(enabled: boolean): string {
    return enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getCategoryBadgeClass(category?: string): string {
    switch (category) {
      case 'PREPAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'POSTPAID':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
