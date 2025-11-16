import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CustomerService, Customer, CustomerSearchFilters } from '../../service/customer-service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockCustomerService } from '../../service/mock-customer-service';

@Component({
  selector: 'app-view-customer',
  imports: [CommonModule,FormsModule,ReactiveFormsModule  ],
  templateUrl: './view-customer.html',
  styleUrl: './view-customer.scss'
})
export class ViewCustomer implements OnInit, OnDestroy {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  isLoading = false;
  selectedCustomers: Set<string> = new Set();
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 0;
  totalCustomers = 0;

  // Make Math available in template
  Math = Math;
  Object = Object; 
  // Search and Filter
  searchTerm = '';
  filters: CustomerSearchFilters = {};
  showFilters = false;
  
  // View Mode
  viewMode: 'grid' | 'list' = 'grid';
  
  // Sort
  sortBy = 'customerName';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Statistics
  customerStats = {
    totalCustomers: 0,
    activeCustomers: 0,
    verifiedCustomers: 0,
    recentCustomers: 0
  };

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
   // private customerService: CustomerService,
    private customerService: CustomerService,
    private router: Router
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadCustomerStats();
    
    // Subscribe to customer updates
    this.customerService.customers$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(customers => {
      this.customers = customers;
      this.applyFiltersAndSort();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
  areAllCurrentPageCustomersSelected(): boolean {
    const currentPageCustomers = this.getCurrentPageCustomers();
    if (currentPageCustomers.length === 0) {
      return false;
    }
    return currentPageCustomers.every(customer => this.isCustomerSelected(customer.id!));
  }
  // Helper method for pagination numbers
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 7;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (this.currentPage > 3) {
        pages.push(-1); // Represents ellipsis
      }
      
      // Show pages around current page
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== this.totalPages) {
          pages.push(i);
        }
      }
      
      if (this.currentPage < this.totalPages - 2) {
        pages.push(-1); // Represents ellipsis
      }
      
      // Always show last page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getCustomers(this.currentPage, 1000, this.filters)
      .subscribe({
        next: (response) => {
          this.customers = response.customers;
          this.totalCustomers = response.totalCount;
          this.totalPages = Math.ceil(this.totalCustomers / this.itemsPerPage);
          this.applyFiltersAndSort();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.isLoading = false;
        }
      });
  }

  loadCustomerStats(): void {
    this.customerService.getCustomerStats().subscribe({
      next: (stats) => {
        this.customerStats = stats;
      },
      error: (error) => {
        console.error('Error loading customer stats:', error);
      }
    });
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  performSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredCustomers = [...this.customers];
    } else {
      this.filteredCustomers = this.customers.filter(customer =>
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile.includes(searchTerm) ||
        (customer.contactInfo.email && customer.contactInfo.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
  }

  applyFilters(): void {
    this.loadCustomers();
  }

  clearFilters(): void {
    this.filters = {};
    this.searchTerm = '';
    this.loadCustomers();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  sortCustomers(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    let result = [...this.customers];

    // Apply search
    if (this.searchTerm.trim()) {
      result = result.filter(customer =>
        customer.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customer.customerCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customer.mobile.includes(this.searchTerm)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortBy) {
        case 'customerName':
          aValue = a.customerName.toLowerCase();
          bValue = b.customerName.toLowerCase();
          break;
        case 'customerCode':
          aValue = a.customerCode;
          bValue = b.customerCode;
          break;
        case 'mobile':
          aValue = a.mobile;
          bValue = b.mobile;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = a.customerName.toLowerCase();
          bValue = b.customerName.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredCustomers = result;
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  selectCustomer(customerId: string): void {
    if (this.selectedCustomers.has(customerId)) {
      this.selectedCustomers.delete(customerId);
    } else {
      this.selectedCustomers.add(customerId);
    }
  }

  selectAllCustomers(): void {
    const currentPageCustomers = this.getCurrentPageCustomers();
    const allSelected = currentPageCustomers.every(customer => 
      this.selectedCustomers.has(customer.id!)
    );

    if (allSelected) {
      currentPageCustomers.forEach(customer => 
        this.selectedCustomers.delete(customer.id!)
      );
    } else {
      currentPageCustomers.forEach(customer => 
        this.selectedCustomers.add(customer.id!)
      );
    }
  }

  isCustomerSelected(customerId: string): boolean {
    return this.selectedCustomers.has(customerId);
  }

  getCurrentPageCustomers(): Customer[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCustomers.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== -1) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  addNewCustomer(): void {
    this.router.navigate(['/customers/add']);
  }

  editCustomer(customer: Customer): void {
    this.router.navigate(['/customers/edit', customer.id]);
  }

  viewCustomer(customer: Customer): void {
    this.router.navigate(['/customers/view', customer.id]);
  }

  deleteCustomer(customer: Customer): void {
    if (confirm(`Are you sure you want to delete customer "${customer.customerName}"?`)) {
      this.customerService.deleteCustomer(customer.id!).subscribe({
        next: () => {
          this.loadCustomers();
          this.selectedCustomers.delete(customer.id!);
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          alert('Failed to delete customer. Please try again.');
        }
      });
    }
  }

  deleteSelectedCustomers(): void {
    if (this.selectedCustomers.size === 0) {
      alert('No customers selected.');
      return;
    }

    if (confirm(`Are you sure you want to delete ${this.selectedCustomers.size} selected customer(s)?`)) {
      const deletePromises = Array.from(this.selectedCustomers).map(id =>
        this.customerService.deleteCustomer(id).toPromise()
      );

      Promise.all(deletePromises).then(() => {
        this.loadCustomers();
        this.selectedCustomers.clear();
      }).catch(error => {
        console.error('Error deleting customers:', error);
        alert('Failed to delete some customers. Please try again.');
      });
    }
  }

  toggleCustomerStatus(customer: Customer): void {
    const newStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.customerService.updateCustomerStatus(customer.id!, newStatus).subscribe({
      next: () => {
        customer.status = newStatus;
      },
      error: (error) => {
        console.error('Error updating customer status:', error);
        alert('Failed to update customer status. Please try again.');
      }
    });
  }

  exportCustomers(): void {
    this.customerService.exportCustomers(this.filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `customers_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting customers:', error);
        alert('Failed to export customers. Please try again.');
      }
    });
  }

  getCustomerImage(customer: Customer): string {
    if (customer.profileImage) {
      return customer.profileImage;
    }
    return this.generateInitialsAvatar(customer.customerName);
  }
  
  generateInitialsAvatar(name: string): string {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#A8E6CF', '#FFB6C1'];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    const svg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="${backgroundColor}"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="32" 
              font-weight="bold" fill="white" text-anchor="middle" 
              dominant-baseline="middle">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  getVerificationBadges(customer: Customer): string[] {
    const badges: string[] = [];
    if (customer.verification.aadharVerified) badges.push('Aadhar');
    if (customer.verification.fingerprintVerified) badges.push('Fingerprint');
    return badges;
  }

  // Add these helper methods to your component class

hasFilters(): boolean {
  return Object.keys(this.filters).length > 0;
}

getFilterCount(): number {
  return Object.keys(this.filters).length;
}

hasSelectedCustomers(): boolean {
  return this.selectedCustomers.size > 0;
}

getSelectedCount(): number {
  return this.selectedCustomers.size;
}





  getStatusClass(status?: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'SUSPENDED': return 'status-suspended';
      default: return 'status-active';
    }
  }

  refreshCustomers(): void {
    this.loadCustomers();
    this.loadCustomerStats();
  }
}