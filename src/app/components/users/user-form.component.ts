import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  enabled: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: string;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent {
  private readonly http: HttpClient;
  private readonly authService: AuthService;

  user = input<User | null>(null);
  userSaved = output<void>();
  formClosed = output<void>();

  formData = signal<CreateUserRequest>({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'USER'
  });

  isEditing = computed(() => !!this.user());
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(http: HttpClient, authService: AuthService) {
    this.http = http;
    this.authService = authService;
    this.initializeForm();
  }

  private initializeForm(): void {
    const editUser = this.user();
    if (editUser) {
      this.formData.set({
        username: editUser.username,
        password: '',
        email: editUser.email,
        fullName: editUser.fullName,
        role: editUser.role
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
      this.updateUser(data);
    } else {
      this.createUser(data);
    }
  }

  private createUser(userData: CreateUserRequest): void {
    this.http.post<User>('http://localhost:8080/api/admin/users', userData, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage.set('User created successfully');
        setTimeout(() => {
          this.userSaved.emit();
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to create user');
        console.error('Create user error:', error);
      }
    });
  }

  private updateUser(userData: CreateUserRequest): void {
    const editUser = this.user();
    if (!editUser) return;

    // Create a copy without password if it's empty
    const updateData: Partial<CreateUserRequest> = { ...userData };
    if (!updateData.password) {
      delete updateData.password;
    }

    this.http.put<User>(`http://localhost:8080/api/admin/users/${editUser.id}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage.set('User updated successfully');
        setTimeout(() => {
          this.userSaved.emit();
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to update user');
        console.error('Update user error:', error);
      }
    });
  }

  private validateForm(): boolean {
    const data = this.formData();
    
    if (!data.username.trim()) {
      this.errorMessage.set('Username is required');
      return false;
    }
    
    if (!this.isEditing() && !data.password.trim()) {
      this.errorMessage.set('Password is required for new users');
      return false;
    }
    
    if (!data.email.trim()) {
      this.errorMessage.set('Email is required');
      return false;
    }
    
    if (!data.fullName.trim()) {
      this.errorMessage.set('Full name is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      this.errorMessage.set('Please enter a valid email address');
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
}
