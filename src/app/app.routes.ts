import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UsersComponent } from './components/users/users.component';
import { UserDetailsComponent } from './components/users/user-details.component';
import { PackagesComponent } from './components/packages/packages.component';
import { InquiriesComponent } from './components/inquiries/inquiries.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'users', component: UsersComponent, canActivate: [authGuard] },
  { path: 'users/:id', component: UserDetailsComponent, canActivate: [authGuard] },
  { path: 'packages', component: PackagesComponent, canActivate: [authGuard] },
  { path: 'inquiries', component: InquiriesComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
