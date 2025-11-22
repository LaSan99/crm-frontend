import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly router: Router;
  private readonly authService: AuthService;

  credentials = signal<LoginRequest>({
    username: '',
    password: ''
  });

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(router: Router, authService: AuthService) {
    this.router = router;
    this.authService = authService;
  }

  onSubmit(): void {
    if (!this.credentials().username || !this.credentials().password) {
      this.errorMessage.set('Please enter both username and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.login(this.credentials()).subscribe({
      next: (response) => {
        this.successMessage.set('Login successful! Redirecting...');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Invalid username or password');
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
