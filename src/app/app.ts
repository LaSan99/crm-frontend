import { Component, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly authService: AuthService;

  currentUser = computed(() => this.authService.currentUser());
  isLoggedIn = computed(() => this.authService.isLoggedIn());

  constructor(authService: AuthService) {
    this.authService = authService;
  }
}
