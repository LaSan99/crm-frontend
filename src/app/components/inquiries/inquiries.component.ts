import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LayoutComponent } from '../layout/layout.component';

export interface Inquiry {
  id: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    msisdn: string;
  };
  subject: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  adminResponse?: string;
  adminRespondedAt?: string;
}

@Component({
  selector: 'app-inquiries',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './inquiries.component.html',
  styleUrl: './inquiries.component.css'
})
export class InquiriesComponent {
  private readonly router: Router;
  private readonly authService: AuthService;
  private readonly http: HttpClient;

  inquiries = signal<Inquiry[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  selectedInquiry = signal<Inquiry | null>(null);
  showReplyForm = signal(false);
  replyText = '';
  filterStatus = signal('ALL');
  filterType = signal('ALL');

  currentUser = computed(() => this.authService.currentUser());

  constructor(router: Router, authService: AuthService, http: HttpClient) {
    this.router = router;
    this.authService = authService;
    this.http = http;
    this.loadInquiries();
  }

  private loadInquiries(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.get<Inquiry[]>('http://localhost:8080/api/admin/inquiries', {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (data) => {
        this.inquiries.set(data);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load inquiries');
        console.error('Inquiries error:', error);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  refreshInquiries(): void {
    this.loadInquiries();
  }

  selectInquiry(inquiry: Inquiry): void {
    this.selectedInquiry.set(inquiry);
    this.showReplyForm.set(false);
    this.replyText = '';
  }

  showReplyToInquiry(inquiry: Inquiry): void {
    this.selectedInquiry.set(inquiry);
    this.showReplyForm.set(true);
    this.replyText = '';
  }

  sendReply(): void {
    const inquiry = this.selectedInquiry();
    if (!inquiry || !this.replyText.trim()) {
      return;
    }

    this.http.put(`http://localhost:8080/api/admin/inquiries/${inquiry.id}/respond`, {
      response: this.replyText
    }, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage.set('Response sent successfully');
        this.loadInquiries();
        this.selectInquiry(inquiry);
        this.clearMessages();
      },
      error: (error) => {
        this.errorMessage.set('Failed to send response');
        console.error('Send reply error:', error);
      }
    });
  }

  updateInquiryStatus(inquiry: Inquiry, newStatus: string): void {
    this.http.put(`http://localhost:8080/api/admin/inquiries/${inquiry.id}/status`, {
      status: newStatus
    }, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.successMessage.set(`Inquiry status updated to ${newStatus}`);
        this.loadInquiries();
        this.clearMessages();
      },
      error: (error) => {
        this.errorMessage.set('Failed to update inquiry status');
        console.error('Update status error:', error);
      }
    });
  }

  cancelReply(): void {
    this.showReplyForm.set(false);
    this.replyText = '';
  }

  clearMessages(): void {
    setTimeout(() => {
      this.errorMessage.set('');
      this.successMessage.set('');
    }, 3000);
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'BILLING':
        return 'bg-orange-100 text-orange-800';
      case 'TECHNICAL':
        return 'bg-red-100 text-red-800';
      case 'GENERAL':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLAINT':
        return 'bg-purple-100 text-purple-800';
      case 'REQUEST':
        return 'bg-yellow-100 text-yellow-800';
      case 'FEEDBACK':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  get filteredInquiries() {
    return computed(() => {
      let filtered = this.inquiries();
      
      if (this.filterStatus() !== 'ALL') {
        filtered = filtered.filter(inquiry => inquiry.status === this.filterStatus());
      }
      
      if (this.filterType() !== 'ALL') {
        filtered = filtered.filter(inquiry => inquiry.type === this.filterType());
      }
      
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
