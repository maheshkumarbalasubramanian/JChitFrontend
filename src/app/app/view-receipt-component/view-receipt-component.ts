import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReceiptService } from '../../service/Receipt-service';

interface Redemption {
  id: string;
  redemptionNo: string;
  redemptionDate: string;
  loanNo: string;
  loanDate: string;
  customerName: string;
  customerCode: string;
  customerPhoto: string;
  phone: string;
  itemGroup: string;
  scheme: string;
  principal: number;
  interest: number;
  netPayable: number;
  paymentType: 'interest' | 'full' | 'partial';
  status: 'completed' | 'partial' | 'cancelled';
  remarks?: string;
}

interface Filters {
  fromDate: string;
  toDate: string;
  customer: string;
  redemptionNo: string;
  loanNo: string;
  paymentType: string;
  status: string;
}

interface Statistics {
  totalRedemptions: number;
  totalAmount: number;
  totalInterest: number;
  totalPrincipal: number;
}

@Component({
  selector: 'app-view-receipt-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './view-receipt-component.html',
  styleUrl: './view-receipt-component.scss'
})
export class ViewReceiptComponent implements OnInit {
  private receiptService = inject(ReceiptService);
  private router = inject(Router);

  redemptions: Redemption[] = [];
  filteredRedemptions: Redemption[] = [];
  paginatedRedemptions: Redemption[] = [];
  
  filters: Filters = {
    fromDate: '',
    toDate: '',
    customer: '',
    redemptionNo: '',
    loanNo: '',
    paymentType: '',
    status: ''
  };

  statistics: Statistics = {
    totalRedemptions: 0,
    totalAmount: 0,
    totalInterest: 0,
    totalPrincipal: 0
  };

  viewMode: 'table' | 'card' = 'table';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 25;
  totalPages: number = 1;
  totalRedemptions: number = 0;

  // Sorting
  sortColumn: string = 'redemptionDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Modal
  showDetailModal: boolean = false;
  selectedRedemption: Redemption | null = null;

  // Loading state
  isLoading: boolean = false;

  Math = Math;

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadRedemptions();
  }

  setDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filters.fromDate = this.formatDate(firstDay);
    this.filters.toDate = this.formatDate(today);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  loadRedemptions(): void {
    this.isLoading = true;
    
    // Call API with filters
    this.receiptService.getReceipts(
      this.currentPage,
      1000, // Get all records for client-side filtering
      this.filters.redemptionNo || this.filters.customer || this.filters.loanNo || undefined
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Map API response to component model
          this.redemptions = response.data.receipts.map((receipt: any) => ({
            id: receipt.id,
            redemptionNo: receipt.receiptNumber,
            redemptionDate: this.formatDisplayDate(receipt.receiptDate),
            loanNo: receipt.loanNumber,
            loanDate: receipt.goldLoan?.loanDate ? this.formatDisplayDate(receipt.goldLoan.loanDate) : 'N/A',
            customerName: receipt.customerName || receipt.customer?.customerName || 'N/A',
            customerCode: receipt.customerCode,
            customerPhoto: receipt.customerImage || receipt.profileImage ||'assets/customer-photo.jpg',
            phone: receipt.customer?.mobile || 'N/A',
            itemGroup: receipt.goldLoan?.itemGroup?.itemGroupName || 'N/A',
            scheme: receipt.goldLoan?.scheme?.schemeName || 'N/A',
            principal: receipt.principalAmount || 0,
            interest: receipt.interestAmount || 0,
            netPayable: receipt.netPayable || 0,
            paymentType: receipt.paymentType || 'interest',
            status: (receipt.status?.toLowerCase() || 'completed') as 'completed' | 'partial' | 'cancelled',
            remarks: receipt.remarks || ''
          }));

          this.totalRedemptions = this.redemptions.length;
          this.applyFilters();
        } else {
          console.error('Failed to load receipts:', response.message);
          this.redemptions = [];
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading receipts:', error);
        alert('Failed to load receipts. Please try again.');
        this.redemptions = [];
        this.applyFilters();
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredRedemptions = this.redemptions.filter(redemption => {
      let matches = true;

      if (this.filters.fromDate) {
        const redemptionDate = this.parseDate(redemption.redemptionDate);
        const fromDate = new Date(this.filters.fromDate);
        matches = matches && redemptionDate >= fromDate;
      }

      if (this.filters.toDate) {
        const redemptionDate = this.parseDate(redemption.redemptionDate);
        const toDate = new Date(this.filters.toDate);
        matches = matches && redemptionDate <= toDate;
      }

      if (this.filters.customer) {
        matches = matches && (
          redemption.customerName.toLowerCase().includes(this.filters.customer.toLowerCase()) ||
          redemption.customerCode.toLowerCase().includes(this.filters.customer.toLowerCase())
        );
      }

      if (this.filters.redemptionNo) {
        matches = matches && redemption.redemptionNo.toLowerCase().includes(this.filters.redemptionNo.toLowerCase());
      }

      if (this.filters.loanNo) {
        matches = matches && redemption.loanNo.toLowerCase().includes(this.filters.loanNo.toLowerCase());
      }

      if (this.filters.paymentType) {
        matches = matches && redemption.paymentType === this.filters.paymentType;
      }

      if (this.filters.status) {
        matches = matches && redemption.status === this.filters.status;
      }

      return matches;
    });

    this.calculateStatistics();
    this.applySorting();
    this.currentPage = 1;
    this.updatePagination();
  }

  parseDate(dateStr: string): Date {
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }

  resetFilters(): void {
    this.filters = {
      fromDate: '',
      toDate: '',
      customer: '',
      redemptionNo: '',
      loanNo: '',
      paymentType: '',
      status: ''
    };
    this.setDefaultDates();
    this.loadRedemptions(); // Reload data
  }

  calculateStatistics(): void {
    this.statistics.totalRedemptions = this.filteredRedemptions.length;
    this.statistics.totalAmount = this.filteredRedemptions.reduce((sum, r) => sum + r.netPayable, 0);
    this.statistics.totalInterest = this.filteredRedemptions.reduce((sum, r) => sum + r.interest, 0);
    this.statistics.totalPrincipal = this.filteredRedemptions.reduce((sum, r) => {
      return sum + (r.paymentType === 'full' || r.paymentType === 'partial' ? r.principal : 0);
    }, 0);
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
    this.updatePagination();
  }

  applySorting(): void {
    this.filteredRedemptions.sort((a, b) => {
      let valueA: any = a[this.sortColumn as keyof Redemption];
      let valueB: any = b[this.sortColumn as keyof Redemption];

      // Handle date sorting
      if (this.sortColumn === 'redemptionDate') {
        valueA = this.parseDate(valueA as string).getTime();
        valueB = this.parseDate(valueB as string).getTime();
      }

      // Handle string sorting
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRedemptions.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRedemptions = this.filteredRedemptions.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  viewDetails(redemption: Redemption): void {
    this.selectedRedemption = redemption;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedRedemption = null;
  }

  editRedemption(redemption: Redemption | null): void {
    if (!redemption) return;
    console.log('Edit redemption:', redemption);
    // Navigate to edit receipt page with receipt ID
    this.router.navigate(['/receipt/edit', redemption.id]);
    this.closeDetailModal();
  }

  printRedemption(redemption: Redemption | null): void {
    if (!redemption) return;
    
    // Open print page in new window without sidebar
    const printUrl = `/printreceipt/${redemption.id}`;
    const printWindow = window.open(
      printUrl, 
      '_blank',
      'width=900,height=800,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
    );
    
    // Optional: Focus the new window
    if (printWindow) {
      printWindow.focus();
    }
  }

  deleteRedemption(redemption: Redemption | null): void {
    if (!redemption) return;
    if (confirm(`Are you sure you want to cancel receipt ${redemption.redemptionNo}?`)) {
      this.isLoading = true;
      
      this.receiptService.deleteReceipt(redemption.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Receipt cancelled successfully');
            this.loadRedemptions(); // Reload data
          } else {
            alert(`Failed to cancel receipt: ${response.message}`);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cancelling receipt:', error);
          alert('Failed to cancel receipt. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  createNew(): void {
    console.log('Create new redemption');
    // Navigate to receipt component for creating new receipt
    this.router.navigate(['/receipt/add']);
  }

  exportData(): void {
    console.log('Export data');
    // Implement export functionality
    const csvData = this.generateCSV();
    this.downloadCSV(csvData, 'receipts-export.csv');
  }

  generateCSV(): string {
    const headers = ['Receipt No', 'Date', 'Loan No', 'Customer', 'Code', 'Item Group', 'Principal', 'Interest', 'Net Payable', 'Payment Type', 'Status'];
    const rows = this.filteredRedemptions.map(r => [
      r.redemptionNo,
      r.redemptionDate,
      r.loanNo,
      r.customerName,
      r.customerCode,
      r.itemGroup,
      r.principal.toString(),
      r.interest.toString(),
      r.netPayable.toString(),
      r.paymentType,
      r.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  }

  downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  printData(): void {
    console.log('Print all data');
    window.print();
  }
}