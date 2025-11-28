import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UserFormComponent } from './user-form.component';
import { LayoutComponent } from '../layout/layout.component';

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
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, UserFormComponent, LayoutComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {
  private readonly router: Router;
  private readonly authService: AuthService;
  private readonly http: HttpClient;

  users = signal<User[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  showCreateForm = signal(false);
  editingUser = signal<User | null>(null);

  currentUser = computed(() => this.authService.currentUser());

  constructor(router: Router, authService: AuthService, http: HttpClient) {
    this.router = router;
    this.authService = authService;
    this.http = http;
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.get<User[]>('http://localhost:8080/api/admin/users', {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.users.set(data);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load users');
        console.error('Users error:', error);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  toggleUserStatus(user: User): void {
    this.http.put(`http://localhost:8080/api/admin/users/${user.id}/toggle-status`, {}, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage.set(`User ${user.username} status updated successfully`);
        this.loadUsers();
        this.clearMessages();
      },
      error: (error) => {
        this.errorMessage.set('Failed to update user status');
        console.error('Toggle status error:', error);
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      this.http.delete(`http://localhost:8080/api/admin/users/${user.id}`, {
        headers: this.authService.getAuthHeaders()
      }).subscribe({
        next: () => {
          this.successMessage.set(`User ${user.username} deleted successfully`);
          this.loadUsers();
          this.clearMessages();
        },
        error: (error) => {
          this.errorMessage.set('Failed to delete user');
          console.error('Delete error:', error);
        }
      });
    }
  }

  showCreateUserForm(): void {
    this.showCreateForm.set(true);
    this.editingUser.set(null);
  }

  viewUserDetails(user: User): void {
    this.router.navigate(['/users', user.id]);
  }

  editUser(user: User): void {
    this.editingUser.set(user);
    this.showCreateForm.set(false);
  }

  closeForms(): void {
    this.showCreateForm.set(false);
    this.editingUser.set(null);
  }

  onUserSaved(): void {
    this.closeForms();
    this.loadUsers();
  }

  clearMessages(): void {
    setTimeout(() => {
      this.errorMessage.set('');
      this.successMessage.set('');
    }, 3000);
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

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'PREPAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'POSTPAID':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

}
