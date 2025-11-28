import { Component, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export interface NavigationItem {
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  isActive?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  title = input.required<string>();
  subtitle = input<string>('');

  mobileSidebarOpen = signal(false);

  currentUser = computed(() => this.authService.currentUser());
  currentTime = computed(() => {
    return new Date().toLocaleString();
  });

  navigationItems = computed<NavigationItem[]>(() => [
    {
      label: 'Dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      route: '/dashboard'
    },
    {
      label: 'Users',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      route: '/users'
    }
  ]);

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  isNavItemActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  refreshData(): void {
    // This can be implemented to refresh data across the app
    window.location.reload();
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.set(!this.mobileSidebarOpen());
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  navigateToAndClose(route: string): void {
    this.navigateTo(route);
    this.closeMobileSidebar();
  }

  logoutAndClose(): void {
    this.logout();
    this.closeMobileSidebar();
  }
}
