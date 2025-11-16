import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PurityService, Purity, PurityListResponse } from '../../service/purity.service';
import { ItemGroupService, ItemGroup } from '../../service/Item-group-service';

import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

export interface ItemGroupDropdown {
  id: string;
  code: string;
  name: string;
}

export interface PurityStats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

export interface ExtendedPurity extends Purity {
  itemCount?: number;
  itemGroupCode?: string;
}

export interface PurityTemplate {
  name: string;
  percentage: number;
  karat?: string | null;
}

export interface PurityTemplateCategory {
  groupName: string;
  templates: PurityTemplate[];
}

@Component({
  selector: 'app-purity-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './purity-component.html',
  styleUrl: './purity-component.scss'
})
export class PurityComponent implements OnInit {
  private purityService = inject(PurityService);
  private itemGroupService = inject(ItemGroupService);
  private router = inject(Router);
  
  private searchSubject = new Subject<string>();

  // Data properties
  purities: ExtendedPurity[] = [];
  filteredPurities: ExtendedPurity[] = [];
  itemGroups: ItemGroupDropdown[] = [];
  stats: PurityStats = { total: 0, active: 0, inactive: 0, recent: 0 };
  
  // Pagination
  currentPage = 1;
  pageSize = 50; // Load more items for better UX
  totalItems = 0;
  
  // UI state
  isLoading = false;
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  sortBy = 'purityName';
  sortDirection: 'asc' | 'desc' = 'asc';
  showTemplates = false;
  
  // Filters
  showFilters = false;
  statusFilter = '';
  itemGroupFilter = '';
  minPercentage: number | null = null;
  maxPercentage: number | null = null;
  
  // Selection
  selectedPurities = new Set<string>();

  // Templates
  purityTemplates: PurityTemplateCategory[] = [
    {
      groupName: 'Gold Purities',
      templates: [
        { name: '24K Gold', percentage: 99.9, karat: '24K' },
        { name: '22K Gold', percentage: 91.6, karat: '22K' },
        { name: '18K Gold', percentage: 75.0, karat: '18K' },
        { name: '14K Gold', percentage: 58.3, karat: '14K' }
      ]
    },
    {
      groupName: 'Silver Purities',
      templates: [
        { name: 'Fine Silver', percentage: 99.9, karat: null },
        { name: 'Sterling Silver', percentage: 92.5, karat: null },
        { name: 'Coin Silver', percentage: 90.0, karat: null }
      ]
    },
    {
      groupName: 'Platinum Purities',
      templates: [
        { name: 'Pure Platinum', percentage: 99.5, karat: null },
        { name: 'Platinum 950', percentage: 95.0, karat: null },
        { name: 'Platinum 900', percentage: 90.0, karat: null }
      ]
    }
  ];

  ngOnInit() {
    this.setupSearchDebounce();
    this.loadItemGroups();
    this.loadData();
  }

  setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
  }

  // Data loading
  loadData() {
    this.isLoading = true;
    
    const isActiveFilter = this.statusFilter === 'active' ? true : 
                          this.statusFilter === 'inactive' ? false : 
                          undefined;

    this.purityService.getPurities(
      this.currentPage,
      this.pageSize,
      this.searchTerm || undefined,
      this.itemGroupFilter || undefined,
      isActiveFilter
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.purities = response.data.purities as ExtendedPurity[];
          this.totalItems = response.data.total;
          this.calculateStats(); // Calculate stats from loaded data
          this.applyClientSideFiltersAndSorting();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading purities:', error);
        alert('Failed to load purities. Please try again.');
        this.isLoading = false;
      }
    });
  }

  calculateStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    this.stats = {
      total: this.purities.length,
      active: this.purities.filter(p => p.isActive).length,
      inactive: this.purities.filter(p => !p.isActive).length,
      recent: this.purities.filter(p => {
        const createdDate = p.createdDate ? new Date(p.createdDate) : null;
        return createdDate && createdDate >= sevenDaysAgo;
      }).length
    };
  }

  loadStatistics() {
    // Statistics are now calculated from loaded purities data
    // This method can be removed or kept empty for future use
  }

  loadItemGroups(): void {
    this.itemGroupService.getItemGroupsForDropdown().subscribe({
      next: (groups) => {
        this.itemGroups = groups;
      },
      error: (error) => {
        console.error('Error loading item groups:', error);
      }
    });
  }

  refreshData() {
    this.selectedPurities.clear();
    this.currentPage = 1;
    this.loadData(); // This will also recalculate stats
  }

  // Search and filtering
  onSearch() {
    this.searchSubject.next(this.searchTerm);
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters() {
    this.statusFilter = '';
    this.itemGroupFilter = '';
    this.minPercentage = null;
    this.maxPercentage = null;
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadData();
  }

  private applyClientSideFiltersAndSorting() {
    let filtered = [...this.purities];

    // Apply percentage range filter (client-side)
    if (this.minPercentage !== null) {
      filtered = filtered.filter(purity => purity.purityPercentage >= this.minPercentage!);
    }
    if (this.maxPercentage !== null) {
      filtered = filtered.filter(purity => purity.purityPercentage <= this.maxPercentage!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any = a[this.sortBy as keyof ExtendedPurity];
      let valueB: any = b[this.sortBy as keyof ExtendedPurity];
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredPurities = filtered;
  }

  // Sorting
  applySorting() {
    this.applyClientSideFiltersAndSorting();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyClientSideFiltersAndSorting();
  }

  // View mode
  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  toggleFilter() {
    this.showFilters = !this.showFilters;
  }

  // Selection
  isSelected(purityId: string | undefined): boolean {
    return purityId ? this.selectedPurities.has(purityId) : false;
  }

  isAllSelected(): boolean {
    return this.filteredPurities.length > 0 && 
           this.filteredPurities.every(purity => purity.id && this.selectedPurities.has(purity.id));
  }

  isSomeSelected(): boolean {
    return this.selectedPurities.size > 0 && !this.isAllSelected();
  }

  toggleSelection(purityId: string | undefined, event: Event) {
    if (!purityId) return;
    
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedPurities.add(purityId);
    } else {
      this.selectedPurities.delete(purityId);
    }
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.filteredPurities.forEach(purity => {
        if (purity.id) this.selectedPurities.add(purity.id);
      });
    } else {
      this.selectedPurities.clear();
    }
  }

  selectPurity(purity: ExtendedPurity) {
    console.log('Selected purity:', purity);
  }

  // Navigation
  addNewPurity() {
    this.router.navigate(['purity/add']);
  }

  editPurity(purity: ExtendedPurity) {
    this.router.navigate(['purity/edit', purity.id]);
  }

  navigateToGroups() {
    this.router.navigate(['/itemgroups']);
  }

  navigateToItems() {
    this.router.navigate(['/itemtypes']);
  }

  // Actions
  deletePurity(purity: ExtendedPurity) {
    if ((purity.itemCount ?? 0) > 0) {
      alert('Cannot delete purity that is assigned to items. Please remove from items first.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${purity.purityName}"? This action cannot be undone.`)) {
      if (!purity.id) return;
      
      this.purityService.deletePurity(purity.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Purity deleted successfully!');
            this.loadData();
            this.loadStatistics();
          } else {
            alert(`Failed to delete purity: ${response.message}`);
          }
        },
        error: (error) => {
          console.error('Error deleting purity:', error);
          alert('Failed to delete purity. Please try again.');
        }
      });
    }
  }

  // Bulk actions
  bulkActivate() {
    if (confirm(`Activate ${this.selectedPurities.size} selected purity(ies)?`)) {
      const promises = Array.from(this.selectedPurities).map(id => 
        this.purityService.togglePurityStatus(id).toPromise()
      );

      Promise.all(promises).then(() => {
        alert('Purities activated successfully!');
        this.selectedPurities.clear();
        this.loadData();
        this.loadStatistics();
      }).catch(error => {
        console.error('Error activating purities:', error);
        alert('Some purities could not be activated. Please try again.');
      });
    }
  }

  bulkDeactivate() {
    if (confirm(`Deactivate ${this.selectedPurities.size} selected purity(ies)?`)) {
      const promises = Array.from(this.selectedPurities).map(id => 
        this.purityService.togglePurityStatus(id).toPromise()
      );

      Promise.all(promises).then(() => {
        alert('Purities deactivated successfully!');
        this.selectedPurities.clear();
        this.loadData();
        this.loadStatistics();
      }).catch(error => {
        console.error('Error deactivating purities:', error);
        alert('Some purities could not be deactivated. Please try again.');
      });
    }
  }

  bulkDelete() {
    const puritiesWithItems = this.filteredPurities
      .filter(p => p.id && this.selectedPurities.has(p.id) && (p.itemCount ?? 0) > 0);
    
    if (puritiesWithItems.length > 0) {
      alert('Cannot delete purities that are assigned to items. Please remove from items first.');
      return;
    }

    if (confirm(`Delete ${this.selectedPurities.size} selected purity(ies)? This action cannot be undone.`)) {
      const promises = Array.from(this.selectedPurities).map(id => 
        this.purityService.deletePurity(id).toPromise()
      );

      Promise.all(promises).then(() => {
        alert('Purities deleted successfully!');
        this.selectedPurities.clear();
        this.loadData();
        this.loadStatistics();
      }).catch(error => {
        console.error('Error deleting purities:', error);
        alert('Some purities could not be deleted. Please try again.');
      });
    }
  }

  // Templates
  showPurityTemplates() {
    this.showTemplates = true;
  }

  closeTemplates() {
    this.showTemplates = false;
  }

  createFromTemplate(template: PurityTemplate) {
    this.router.navigate(['purity/add'], { 
      queryParams: { 
        template: JSON.stringify(template) 
      }
    });
    this.closeTemplates();
  }

  // Helper methods
  trackByPurityId(index: number, purity: ExtendedPurity): string {
    return purity.id || index.toString();
  }

  getPurityDisplay(purity: ExtendedPurity): string {
    if (purity.karat) {
      return `${purity.karat}K`;
    }
    return purity.purityPercentage.toString();
  }

  getPurityAvatarClass(groupName?: string): string {
    if (!groupName) return 'default';
    const name = groupName.toLowerCase();
    if (name.includes('gold')) return 'gold';
    if (name.includes('silver')) return 'silver';
    if (name.includes('platinum')) return 'platinum';
    if (name.includes('diamond')) return 'diamond';
    return 'default';
  }
}