import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SchemeService, Scheme } from '../../service/scheme.service';

export interface SchemeStats {
  total: number;
  active: number;
  inactive: number;
  simple: number;
  compound: number;
  emi: number;
}

@Component({
  selector: 'app-schemes-view-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './schemes-view-component.html',
  styleUrl: './schemes-view-component.scss'
})
export class SchemesViewComponent implements OnInit {
  private router = inject(Router);
  private schemeService = inject(SchemeService);

  // Data properties
  schemes: Scheme[] = [];
  filteredSchemes: Scheme[] = [];
  stats: SchemeStats = { total: 0, active: 0, inactive: 0, simple: 0, compound: 0, emi: 0 };
  
  // UI state
  isLoading = false;
  searchTerm = '';
  statusFilter = '';
  calculationFilter = '';
  selectedSchemeId = '';
  
  // Sorting
  sortField: keyof Scheme = 'schemeName';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  ngOnInit() {
    this.loadSchemes();
  }

  // Data loading
  loadSchemes() {
    this.isLoading = true;
    
    this.schemeService.getSchemes(1, 1000).subscribe({
      next: (response) => {
        if (response.success) {
          this.schemes = response.data.schemes;
          this.calculateStats();
          this.applyFiltersAndSorting();
        } else {
          console.error('Failed to load schemes:', response.message);
          alert('Failed to load schemes. Please try again.');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading schemes:', error);
        alert('Failed to load schemes. Please check your connection and try again.');
        this.isLoading = false;
      }
    });
  }

  refreshData() {
    this.loadSchemes();
  }

  // Search and filtering
  onSearch() {
    this.currentPage = 1;
    this.applyFiltersAndSorting();
  }

  applyFilters() {
    this.currentPage = 1;
    this.applyFiltersAndSorting();
  }

  private applyFiltersAndSorting() {
    let filtered = [...this.schemes];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(scheme => 
        scheme.schemeCode.toLowerCase().includes(term) ||
        scheme.schemeName.toLowerCase().includes(term) ||
        scheme.calculationMethod.toLowerCase().includes(term) ||
        (scheme.areaName && scheme.areaName.toLowerCase().includes(term)) ||
        (scheme.itemGroupName && scheme.itemGroupName.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(scheme => {
        if (this.statusFilter === 'active') return scheme.isActive;
        if (this.statusFilter === 'inactive') return !scheme.isActive;
        return true;
      });
    }

    // Apply calculation method filter
    if (this.calculationFilter) {
      filtered = filtered.filter(scheme => scheme.calculationMethod === this.calculationFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any = a[this.sortField];
      let valueB: any = b[this.sortField];
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredSchemes = filtered;
  }

  // Sorting
  sortBy(field: keyof Scheme) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting();
  }

  // Pagination
  updatePagination() {
    this.currentPage = 1;
  }

  getPaginatedSchemes(): Scheme[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredSchemes.slice(start, end);
  }

  getCurrentPageInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.filteredSchemes.length);
    const total = this.filteredSchemes.length;
    return `${start} – ${end} of ${total}`;
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredSchemes.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  // Actions
  addNewScheme() {
    this.router.navigate(['/schemes/add']);
  }

  viewScheme(scheme: Scheme) {
    this.selectedSchemeId = scheme.id || '';
    // Navigate to detail view or show modal
    if (scheme.id) {
      this.router.navigate(['/schemes/view', scheme.id]);
    }
  }

  editScheme(scheme: Scheme) {
    if (scheme.id) {
      this.router.navigate(['/schemes/edit', scheme.id]);
    }
  }

  deleteScheme(scheme: Scheme) {
    if (!scheme.id) return;
    
    if (confirm(`Are you sure you want to delete the scheme "${scheme.schemeName}"?\n\nThis action cannot be undone.`)) {
      this.isLoading = true;
      
      this.schemeService.deleteScheme(scheme.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Scheme deleted successfully!');
            this.loadSchemes(); // Reload the list
          } else {
            alert(`Failed to delete scheme: ${response.message}`);
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error deleting scheme:', error);
          const errorMessage = error.error?.message || 'An unexpected error occurred';
          alert(`Failed to delete scheme: ${errorMessage}`);
          this.isLoading = false;
        }
      });
    }
  }

  toggleSchemeStatus(scheme: Scheme) {
    if (!scheme.id) return;
    
    this.schemeService.toggleSchemeStatus(scheme.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`Scheme ${scheme.isActive ? 'deactivated' : 'activated'} successfully!`);
          this.loadSchemes(); // Reload the list
        } else {
          alert(`Failed to update scheme status: ${response.message}`);
        }
      },
      error: (error) => {
        console.error('Error toggling scheme status:', error);
        alert('Failed to update scheme status. Please try again.');
      }
    });
  }

  // Helper methods
  getCalculationMethodClass(method: string): string {
    return `calc-${method.toLowerCase()}`;
  }

  private calculateStats() {
    this.stats = {
      total: this.schemes.length,
      active: this.schemes.filter(s => s.isActive).length,
      inactive: this.schemes.filter(s => !s.isActive).length,
      simple: this.schemes.filter(s => s.calculationMethod === 'Simple').length,
      compound: this.schemes.filter(s => s.calculationMethod === 'Compound').length,
      emi: this.schemes.filter(s => s.calculationMethod === 'Emi').length
    };
  }
}