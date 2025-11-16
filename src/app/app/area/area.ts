import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AreaService, Area, AreaStats, AreaFilter } from '../../service/area-service';

@Component({
  selector: 'app-area',
  imports: [CommonModule, FormsModule],
  templateUrl: './area.html',
  styleUrl: './area.scss'
})
export class AreaComponent implements OnInit {
  private router = inject(Router);
  private areaService = inject(AreaService);

  // Data properties
  areas: Area[] = [];
  filteredAreas: Area[] = [];
  stats: AreaStats = { total: 0, active: 0, inactive: 0, recent: 0 };
  
  // UI state
  isLoading = false;
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  sortBy = 'areaName';
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
    
    const filter: AreaFilter = {
      search: this.searchTerm || undefined,
      status: this.statusFilter || undefined,
      type: this.typeFilter || undefined,
      minCustomers: this.minCustomers ?? undefined,
      maxCustomers: this.maxCustomers ?? undefined
    };

    this.areaService.getAreas(filter).subscribe({
      next: (areas) => {
        this.areas = areas;
        this.applyLocalSorting();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading areas:', error);
        this.errorMessage = 'Failed to load areas. Please try again.';
        this.isLoading = false;
        this.areas = [];
        this.filteredAreas = [];
      }
    });
  }

  loadStats() {
    this.areaService.getAreaStats().subscribe({
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
      let valueA: any = a[this.sortBy as keyof Area];
      let valueB: any = b[this.sortBy as keyof Area];
      
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

  selectArea(area: Area) {
    // Handle single area selection for navigation
    console.log('Selected area:', area);
  }

  // Navigation
  addNewArea() {
    this.router.navigate(['area/add']);
  }

  editArea(area: Area) {
    this.router.navigate(['area/edit', area.id]);
  }

  navigateToCustomers() {
    this.router.navigate(['/customers']);
  }

  viewAreaCustomers(area: Area) {
    this.router.navigate(['/customers'], { 
      queryParams: { area: area.id }
    });
  }

  // Actions
  deleteArea(area: Area) {
    if (area.customerCount > 0) {
      alert('Cannot delete area that has customers assigned. Please move customers to another area first.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${area.areaName}"?`)) {
      this.areaService.deleteArea(area.id).subscribe({
        next: () => {
          console.log('Area deleted successfully');
          this.refreshData();
        },
        error: (error) => {
          console.error('Error deleting area:', error);
          alert('Failed to delete area. Please try again.');
        }
      });
    }
  }

  exportAreas() {
    // Implement export functionality
    console.log('Exporting areas...');
    alert('Export functionality will be implemented soon!');
  }

  // Bulk actions
  bulkActivate() {
    if (confirm(`Activate ${this.selectedAreas.size} selected area(s)?`)) {
      const ids = Array.from(this.selectedAreas);
      this.areaService.bulkActivate(ids).subscribe({
        next: (response) => {
          console.log(response.message);
          this.selectedAreas.clear();
          this.refreshData();
        },
        error: (error) => {
          console.error('Error activating areas:', error);
          alert('Failed to activate areas. Please try again.');
        }
      });
    }
  }

  bulkDeactivate() {
    if (confirm(`Deactivate ${this.selectedAreas.size} selected area(s)?`)) {
      const ids = Array.from(this.selectedAreas);
      this.areaService.bulkDeactivate(ids).subscribe({
        next: (response) => {
          console.log(response.message);
          this.selectedAreas.clear();
          this.refreshData();
        },
        error: (error) => {
          console.error('Error deactivating areas:', error);
          alert('Failed to deactivate areas. Please try again.');
        }
      });
    }
  }

  bulkDelete() {
    const areasWithCustomers = this.filteredAreas
      .filter(a => this.selectedAreas.has(a.id) && a.customerCount > 0);
    
    if (areasWithCustomers.length > 0) {
      alert('Cannot delete areas that have customers assigned. Please move customers to another area first.');
      return;
    }

    if (confirm(`Delete ${this.selectedAreas.size} selected area(s)? This action cannot be undone.`)) {
      const ids = Array.from(this.selectedAreas);
      let deletedCount = 0;
      let errorCount = 0;

      ids.forEach(id => {
        this.areaService.deleteArea(id).subscribe({
          next: () => {
            deletedCount++;
            if (deletedCount + errorCount === ids.length) {
              this.selectedAreas.clear();
              this.refreshData();
              alert(`Successfully deleted ${deletedCount} area(s).`);
            }
          },
          error: (error) => {
            console.error('Error deleting area:', error);
            errorCount++;
            if (deletedCount + errorCount === ids.length) {
              this.selectedAreas.clear();
              this.refreshData();
              alert(`Deleted ${deletedCount} area(s). ${errorCount} failed.`);
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
    // Navigate to add area with template data
    this.router.navigate(['area/add'], { 
      queryParams: { 
        template: JSON.stringify(template) 
      }
    });
    this.closeTemplates();
  }

  // Helper methods
  trackByAreaId(index: number, area: Area): string {
    return area.id;
  }

  getAreaDisplay(area: Area): string {
    if (!area.areaCode) return '??';
    return area.areaCode.substring(0, 2).toUpperCase();
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
}