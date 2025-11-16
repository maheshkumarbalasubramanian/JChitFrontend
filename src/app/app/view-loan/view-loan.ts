import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { GoldLoanService } from '../../service/loan-service';

export interface LoanRecord {
  id: string;
  loanNumber: string;
  refNumber?: string;
  loanDate: Date;
  maturityDate: Date;
  areaId: string;
  areaName: string;
  customerId: string;
  customerName: string;
  schemeId: string;
  schemeName: string;
  itemGroupId: string;
  itemGroupName: string;
  loanAmount: number;
  netPayable: number;
  totalNetWeight: number;
  status: string;
  createdDate: Date;
  itemsCount: number;
  // For display purposes
  loanNo?: string;
  partyName?: string;
  principal?: number;
  groupName?: string;
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected';
}

export interface FilterOptions {
  fromDate?: Date;
  toDate?: Date;
  searchTerm?: string;
  status?: string;
  groupName?: string;
  schemeName?: string;
  approvalStatus?: string;
}

export interface ApiLoanListResponse {
  loans: any[];
  total: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-view-loan',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './view-loan.html',
  styleUrl: './view-loan.scss'
})
export class ViewLoan implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private goldLoanService = inject(GoldLoanService);

  // Data properties
  loans: LoanRecord[] = [];
  filteredLoans: LoanRecord[] = [];
  
  // Filter form
  filterForm!: FormGroup;
  
  // Pagination
  currentPage = 1;
  pageSize = 100;
  totalRecords = 0;
  pageSizeOptions = [10, 25, 50, 100, 200];
  
  // UI state
  isLoading = false;
  showAdvancedFilters = false;
  selectedLoans: Set<string> = new Set();
  errorMessage: string = '';
  
  // Filter options - will be populated from API data
  groupNames: string[] = [];
  schemeNames: string[] = [];
  statusOptions = ['Open', 'Closed', 'Matured', 'Auctioned'];
  approvalStatusOptions = ['Approved', 'Pending', 'Rejected'];

  ngOnInit() {
    this.initializeFilterForm();
    this.loadLoans();
  }

  private initializeFilterForm() {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      fromDate: [''],
      toDate: [''],
      status: [''],
      groupName: [''],
      schemeName: [''],
      approvalStatus: ['']
    });

    // Subscribe to form changes for real-time filtering
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private loadLoans() {
    this.isLoading = true;
    this.errorMessage = '';
    
    const filters = this.filterForm.value;
    
    this.goldLoanService.getGoldLoans(
      this.currentPage,
      this.pageSize,
      filters.searchTerm,
      undefined, // areaId
      undefined, // customerId
      filters.status
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const apiData = response.data as ApiLoanListResponse;
          
          // Map API response to LoanRecord format
          this.loans = apiData.loans.map(loan => this.mapApiLoanToRecord(loan));
          this.filteredLoans = [...this.loans];
          this.totalRecords = apiData.total;
          
          // Extract unique group names and scheme names for filters
          this.extractFilterOptions();
          
          // Apply any active filters
          this.applyFilters();
        } else {
          this.errorMessage = response.message || 'Failed to load loans';
          this.loans = [];
          this.filteredLoans = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading loans:', error);
        this.errorMessage = 'Failed to load loans. Please try again.';
        this.loans = [];
        this.filteredLoans = [];
        this.isLoading = false;
      }
    });
  }

  private mapApiLoanToRecord(apiLoan: any): LoanRecord {
    return {
      id: apiLoan.id,
      loanNumber: apiLoan.loanNumber,
      refNumber: apiLoan.refNumber,
      loanDate: new Date(apiLoan.loanDate),
      maturityDate: new Date(apiLoan.maturityDate),
      areaId: apiLoan.areaId,
      areaName: apiLoan.areaName,
      customerId: apiLoan.customerId,
      customerName: apiLoan.customerName,
      schemeId: apiLoan.schemeId,
      schemeName: apiLoan.schemeName,
      itemGroupId: apiLoan.itemGroupId,
      itemGroupName: apiLoan.itemGroupName,
      loanAmount: apiLoan.loanAmount,
      netPayable: apiLoan.netPayable,
      totalNetWeight: apiLoan.totalNetWeight,
      status: apiLoan.status,
      createdDate: new Date(apiLoan.createdDate),
      itemsCount: apiLoan.itemsCount,
      // Map to display format
      loanNo: apiLoan.loanNumber,
      partyName: apiLoan.customerName,
      principal: apiLoan.loanAmount,
      groupName: apiLoan.itemGroupName,
      approvalStatus: this.getApprovalStatus(apiLoan.status)
    };
  }

  private getApprovalStatus(status: string): 'Approved' | 'Pending' | 'Rejected' {
    // Map status to approval status
    // You can customize this based on your business logic
    if (status === 'Open' || status === 'Closed') {
      return 'Approved';
    } else if (status === 'Draft') {
      return 'Pending';
    }
    return 'Approved'; // Default
  }

  private extractFilterOptions() {
    // Extract unique group names
    const groupSet = new Set<string>();
    const schemeSet = new Set<string>();
    
    this.loans.forEach(loan => {
      if (loan.itemGroupName) groupSet.add(loan.itemGroupName);
      if (loan.schemeName) schemeSet.add(loan.schemeName);
    });
    
    this.groupNames = Array.from(groupSet).sort();
    this.schemeNames = Array.from(schemeSet).sort();
  }

  applyFilters() {
    const filters = this.filterForm.value;
    
    this.filteredLoans = this.loans.filter(loan => {
      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const searchMatch = 
          loan.loanNumber.toLowerCase().includes(searchTerm) ||
          loan.customerName.toLowerCase().includes(searchTerm) ||
          loan.loanAmount.toString().includes(searchTerm) ||
          (loan.refNumber && loan.refNumber.toLowerCase().includes(searchTerm));
        
        if (!searchMatch) return false;
      }

      // Date range filter
      if (filters.fromDate) {
        const fromDate = new Date(filters.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        const loanDate = new Date(loan.loanDate);
        loanDate.setHours(0, 0, 0, 0);
        if (loanDate < fromDate) return false;
      }

      if (filters.toDate) {
        const toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 999);
        const loanDate = new Date(loan.loanDate);
        if (loanDate > toDate) return false;
      }

      // Status filters
      if (filters.status && loan.status !== filters.status) return false;
      if (filters.groupName && loan.itemGroupName !== filters.groupName) return false;
      if (filters.schemeName && loan.schemeName !== filters.schemeName) return false;
      if (filters.approvalStatus && loan.approvalStatus !== filters.approvalStatus) return false;

      return true;
    });

    this.totalRecords = this.filteredLoans.length;
    this.currentPage = 1; // Reset to first page when filtering
  }

  clearFilters() {
    this.filterForm.reset();
    this.selectedLoans.clear();
    this.loadLoans(); // Reload data without filters
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.pageSize = +target.value;
      this.currentPage = 1;
      this.loadLoans(); // Reload with new page size
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get paginatedLoans(): LoanRecord[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredLoans.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get pageInfo(): string {
    if (this.totalRecords === 0) return '0 - 0 of 0';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, this.totalRecords);
    return `${start} - ${end} of ${this.totalRecords}`;
  }

  // Selection methods
  toggleLoanSelection(loanId: string, event: Event) {
    event.stopPropagation();
    if (this.selectedLoans.has(loanId)) {
      this.selectedLoans.delete(loanId);
    } else {
      this.selectedLoans.add(loanId);
    }
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.paginatedLoans.forEach(loan => this.selectedLoans.add(loan.id));
    } else {
      this.paginatedLoans.forEach(loan => this.selectedLoans.delete(loan.id));
    }
  }

  isAllSelected(): boolean {
    return this.paginatedLoans.length > 0 && 
           this.paginatedLoans.every(loan => this.selectedLoans.has(loan.id));
  }

  isIndeterminate(): boolean {
    const selectedCount = this.paginatedLoans.filter(loan => this.selectedLoans.has(loan.id)).length;
    return selectedCount > 0 && selectedCount < this.paginatedLoans.length;
  }

  // Action methods
  createNewLoan() {
    this.router.navigate(['/loans/add']);
  }

  viewLoan(loan: LoanRecord) {
    this.router.navigate(['/loans/view', loan.id]);
  }

  editLoan(loan: LoanRecord, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/loans/edit', loan.id]);
  }

  printLoan(loan: LoanRecord, event: Event) {
    event.stopPropagation();
    console.log('Print loan:', loan.loanNumber);
    this.router.navigate(['/printloan', loan.id]);
  
  }

  deleteLoan(loan: LoanRecord, event: Event) {
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete loan ${loan.loanNumber}?`)) {
      this.isLoading = true;
      
      this.goldLoanService.deleteGoldLoan(loan.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Loan ${loan.loanNumber} deleted successfully!`);
            this.loadLoans(); // Reload the list
          } else {
            alert(`Failed to delete loan: ${response.message}`);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting loan:', error);
          alert('Failed to delete loan. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  bulkDelete() {
    if (this.selectedLoans.size === 0) return;
    
    const count = this.selectedLoans.size;
    if (confirm(`Are you sure you want to delete ${count} selected loan(s)?`)) {
      this.isLoading = true;
      const deletePromises: Promise<any>[] = [];
      
      // Create array of delete observables
      this.selectedLoans.forEach(loanId => {
        deletePromises.push(
          this.goldLoanService.deleteGoldLoan(loanId).toPromise()
        );
      });
      
      // Execute all deletes
      Promise.all(deletePromises)
        .then(results => {
          const successCount = results.filter(r => r?.success).length;
          alert(`Successfully deleted ${successCount} of ${count} loan(s)`);
          this.selectedLoans.clear();
          this.loadLoans();
        })
        .catch(error => {
          console.error('Error in bulk delete:', error);
          alert('Some loans could not be deleted. Please try again.');
          this.loadLoans();
        })
        .finally(() => {
          this.isLoading = false;
        });
    }
  }

  exportData() {
    console.log('Export data:', this.filteredLoans);
    
    // Implement export functionality
    // Example: Export to CSV
    if (this.filteredLoans.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Convert to CSV format
    const headers = ['Loan No', 'Loan Date', 'Party Name', 'Principal', 'Group Name', 'Scheme Name', 'Total Net Weight', 'Maturity Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...this.filteredLoans.map(loan => [
        loan.loanNumber,
        new Date(loan.loanDate).toLocaleDateString(),
        loan.customerName,
        loan.loanAmount,
        loan.itemGroupName,
        loan.schemeName,
        loan.totalNetWeight,
        new Date(loan.maturityDate).toLocaleDateString(),
        loan.status
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gold-loans-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  refreshData() {
    this.loadLoans();
  }

  // Track by function for performance
  trackByLoanId(index: number, loan: LoanRecord): string {
    return loan.id;
  }

  // Generate page numbers for pagination
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    
    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  // Helper to safely get lowercase group name for CSS class
  getGroupClass(groupName: string | undefined): string {
    if (!groupName) return '';
    return 'group-' + groupName.toLowerCase();
  }



  // Status badge helper

  // Status badge helper
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      case 'open': return 'status-active';
      case 'closed': return 'status-closed';
      case 'overdue': return 'status-overdue';
      case 'matured': return 'status-matured';
      case 'auctioned': return 'status-overdue';
      default: return 'status-default';
    }
  }
}