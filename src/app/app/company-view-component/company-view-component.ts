import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyService, Company, CompanyStats, CompanyFilter } from '../../service/company-service';

@Component({
  selector: 'app-company-view-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './company-view-component.html',
  styleUrl: './company-view-component.scss'
})
export class CompanyViewComponent implements OnInit {
  private router = inject(Router);
  private companyService = inject(CompanyService);

  // Data properties
  areas: Company[] = [];
  filteredAreas: Company[] = [];
  stats: CompanyStats = { total: 0, active: 0, inactive: 0, recent: 0 };
  
  // UI state
  isLoading = false;
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  sortBy = 'companyName';
  sortDirection: 'asc' | 'desc' = 'asc';
  showTemplates = false;
  errorMessage = '';
  
  // Filters
  showFilters = false;
  statusFilter: '' | 'active' | 'inactive' = '';
  typeFilter: '' | 'PRIMARY' | 'SECONDARY' | 'RURAL' | 'URBAN' = '';
  minCustomers: number | null = null;
  maxCustomers: number | null = null;
  
  // Selection
  selectedAreas = new Set<string>();

  // Templates
  areaTemplates = [
    {
      categoryName: 'Urban Areas',
      templates: [
        { name: 'City Center', type: 'URBAN' },
        { name: 'Commercial District', type: 'URBAN' },
        { name: 'Residential Zone', type: 'URBAN' },
        { name: 'Industrial Area', type: 'URBAN' }
      ]
    },
    {
      categoryName: 'Rural Areas',
      templates: [
        { name: 'Village Center', type: 'RURAL' },
        { name: 'Agricultural Zone', type: 'RURAL' },
        { name: 'Suburban Area', type: 'RURAL' },
        { name: 'Outskirts', type: 'RURAL' }
      ]
    },
    {
      categoryName: 'Business Areas',
      templates: [
        { name: 'Primary Business District', type: 'PRIMARY' },
        { name: 'Secondary Commercial', type: 'SECONDARY' },
        { name: 'Market Area', type: 'PRIMARY' },
        { name: 'Shopping Complex', type: 'SECONDARY' }
      ]
    }
  ];

  ngOnInit() {
    this.loadData();
    this.loadStats();
  }

  // Data loading
  loadData() {
    this.isLoading = true;
    this.errorMessage = '';
    
    const filter: CompanyFilter = {
      search: this.searchTerm || undefined,
      status: (this.statusFilter || undefined) as 'active' | 'inactive' | undefined,
      type: (this.typeFilter || undefined) as 'PRIMARY' | 'SECONDARY' | 'RURAL' | 'URBAN' | undefined,
      minCustomers: this.minCustomers ?? undefined,
      maxCustomers: this.maxCustomers ?? undefined
    };
  
    this.companyService.getCompanies(filter).subscribe({
      next: (companies) => {
        console.log('Received companies:', companies); // Add this
        this.areas = companies;
        this.applyLocalSorting();
        console.log('Filtered areas:', this.filteredAreas); // Add this
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.errorMessage = 'Failed to load companies. Please try again.';
        this.isLoading = false;
        this.areas = [];
        this.filteredAreas = [];
      }
    });
  }

  loadStats() {
    this.companyService.getCompanyStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  refreshData() {
    this.selectedAreas.clear();
    this.loadData();
    this.loadStats();
  }

  // Search and filtering
  onSearch() {
    this.loadData();
  }

  applyFilters() {
    this.loadData();
  }

  clearFilters() {
    this.statusFilter = '';
    this.typeFilter = '';
    this.minCustomers = null;
    this.maxCustomers = null;
    this.searchTerm = '';
    this.loadData();
  }

  private applyLocalSorting() {
    let sorted = [...this.areas];

    // Apply sorting
    sorted.sort((a, b) => {
      let valueA: any = a[this.sortBy as keyof Company];
      let valueB: any = b[this.sortBy as keyof Company];
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredAreas = sorted;
  }

  // Sorting
  applySorting() {
    this.applyLocalSorting();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyLocalSorting();
  }

  // View mode
  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  toggleFilter() {
    this.showFilters = !this.showFilters;
  }

  // Selection
  isSelected(areaId: string): boolean {
    return this.selectedAreas.has(areaId);
  }

  isAllSelected(): boolean {
    return this.filteredAreas.length > 0 && 
           this.filteredAreas.every(area => this.selectedAreas.has(area.id));
  }

  isSomeSelected(): boolean {
    return this.selectedAreas.size > 0 && !this.isAllSelected();
  }

  toggleSelection(areaId: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedAreas.add(areaId);
    } else {
      this.selectedAreas.delete(areaId);
    }
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.filteredAreas.forEach(area => this.selectedAreas.add(area.id));
    } else {
      this.selectedAreas.clear();
    }
  }

  selectArea(company: Company) {
    // Handle single area selection for navigation
    console.log('Selected company:', company);
  }

  // Navigation
  addNewArea() {
    this.router.navigate(['company/add']);
  }

  editArea(company: Company) {
    this.router.navigate(['company/edit', company.id]);
  }

  navigateToCustomers() {
    this.router.navigate(['/customers']);
  }

  viewAreaCustomers(company: Company) {
    this.router.navigate(['/customers'], { 
      queryParams: { company: company.id }
    });
  }

  // Actions
  deleteArea(company: Company) {
    if (company.customerCount > 0) {
      alert('Cannot delete company that has customers assigned. Please move customers to another company first.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${company.companyCode}"?`)) {
      this.companyService.deleteCompany(company.id).subscribe({
        next: () => {
          console.log('Company deleted successfully');
          this.refreshData();
        },
        error: (error) => {
          console.error('Error deleting company:', error);
          alert('Failed to delete company. Please try again.');
        }
      });
    }
  }

  exportAreas() {
    // Implement export functionality
    console.log('Exporting companies...');
    alert('Export functionality will be implemented soon!');
  }

  // Bulk actions
  bulkActivate() {
    if (confirm(`Activate ${this.selectedAreas.size} selected company(s)?`)) {
      const ids = Array.from(this.selectedAreas);
      this.companyService.bulkActivate(ids).subscribe({
        next: (response) => {
          console.log(response.message);
          this.selectedAreas.clear();
          this.refreshData();
        },
        error: (error) => {
          console.error('Error activating companies:', error);
          alert('Failed to activate companies. Please try again.');
        }
      });
    }
  }

  bulkDeactivate() {
    if (confirm(`Deactivate ${this.selectedAreas.size} selected company(s)?`)) {
      const ids = Array.from(this.selectedAreas);
      this.companyService.bulkDeactivate(ids).subscribe({
        next: (response) => {
          console.log(response.message);
          this.selectedAreas.clear();
          this.refreshData();
        },
        error: (error) => {
          console.error('Error deactivating companies:', error);
          alert('Failed to deactivate companies. Please try again.');
        }
      });
    }
  }

  bulkDelete() {
    const areasWithCustomers = this.filteredAreas
      .filter(a => this.selectedAreas.has(a.id) && a.customerCount > 0);
    
    if (areasWithCustomers.length > 0) {
      alert('Cannot delete companies that have customers assigned. Please move customers to another company first.');
      return;
    }

    if (confirm(`Delete ${this.selectedAreas.size} selected company(s)? This action cannot be undone.`)) {
      const ids = Array.from(this.selectedAreas);
      let deletedCount = 0;
      let errorCount = 0;

      ids.forEach(id => {
        this.companyService.deleteCompany(id).subscribe({
          next: () => {
            deletedCount++;
            if (deletedCount + errorCount === ids.length) {
              this.selectedAreas.clear();
              this.refreshData();
              alert(`Successfully deleted ${deletedCount} company(s).`);
            }
          },
          error: (error) => {
            console.error('Error deleting company:', error);
            errorCount++;
            if (deletedCount + errorCount === ids.length) {
              this.selectedAreas.clear();
              this.refreshData();
              alert(`Deleted ${deletedCount} company(s). ${errorCount} failed.`);
            }
          }
        });
      });
    }
  }

  // Templates
  showAreaTemplates() {
    this.showTemplates = true;
  }

  closeTemplates() {
    this.showTemplates = false;
  }

  createFromTemplate(template: any) {
    // Navigate to add company with template data
    this.router.navigate(['company/add'], { 
      queryParams: { 
        template: JSON.stringify(template) 
      }
    });
    this.closeTemplates();
  }

  // Helper methods
  trackByAreaId(index: number, company: Company): string {
    return company.id;
  }

  getAreaDisplay(company: Company): string {
    if (!company.companyCode) return '??'; 
    return company.companyCode.substring(0, 2).toUpperCase();
  }

  getAreaAvatarClass(areaType: string): string {
    if (!areaType) return 'default'; 
    const type = areaType.toLowerCase();
    if (type === 'primary') return 'primary';
    if (type === 'secondary') return 'secondary';
    if (type === 'rural') return 'rural';
    if (type === 'urban') return 'urban';
    return 'default';
  }

  getLogoUrl(company: Company): string | null {
    return company.logoUrl ? this.companyService.getLogoUrl(company.id) : null;
  }
}
