import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JewelFaultService, JewelFault } from '../../service/jewel-fault.service';
import { ItemGroupService, ItemGroup } from '../../service/Item-group-service';

export interface JewelFaultStats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

@Component({
  selector: 'app-jewel-fault-view-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './jewel-fault-view-component.html',
  styleUrl: './jewel-fault-view-component.scss'
})
export class JewelFaultViewComponent implements OnInit {
  private router = inject(Router);
  private jewelFaultService = inject(JewelFaultService);
  private itemGroupService = inject(ItemGroupService);

  // Data properties
  faults: JewelFault[] = [];
  filteredFaults: JewelFault[] = [];
  itemGroups: ItemGroup[] = [];
  stats: JewelFaultStats = { total: 0, active: 0, inactive: 0, recent: 0 };
  
  // UI state
  isLoading = false;
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  sortBy = 'faultName';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Filters
  showFilters = false;
  statusFilter = '';
  typeFilter = '';
  severityFilter = '';
  valuationFilter = '';
  itemGroupFilter = '';
  
  // Selection
  selectedFaults = new Set<string>();

  // Pagination
  currentPage = 1;
  pageSize = 100;
  totalFaults = 0;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    
    Promise.all([
      this.loadJewelFaults(),
      this.loadItemGroups()
    ]).then(() => {
      this.calculateStats();
      this.applyFiltersAndSorting();
      this.isLoading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please try again.');
      this.isLoading = false;
    });
  }

  private loadJewelFaults(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.jewelFaultService.getJewelFaults(
        this.currentPage,
        this.pageSize,
        this.searchTerm,
        this.itemGroupFilter,
        this.typeFilter,
        this.severityFilter,
        this.statusFilter ? this.statusFilter === 'active' : undefined
      ).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.faults = response.data.faults.map(fault => ({
              ...fault,
              createdDate: new Date(fault.createdDate!),
              updatedDate: new Date(fault.updatedDate!)
            }));
            this.totalFaults = response.data.total;
            resolve();
          } else {
            reject(new Error(response.message || 'Failed to load jewel faults'));
          }
        },
        error: (error) => {
          console.error('Error loading jewel faults:', error);
          reject(error);
        }
      });
    });
  }

  private loadItemGroups(): Promise<void> {
    return new Promise((resolve, reject) => {
      const filter = {
        status: 'active' as const
      };
      
      this.itemGroupService.getItemGroups(filter).subscribe({
        next: (groups) => {
          this.itemGroups = groups;
          resolve();
        },
        error: (error) => {
          console.error('Error loading item groups:', error);
          reject(error);
        }
      });
    });
  }

  refreshData() {
    this.selectedFaults.clear();
    this.loadData();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadData();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadData();
  }

  clearFilters() {
    this.statusFilter = '';
    this.typeFilter = '';
    this.severityFilter = '';
    this.valuationFilter = '';
    this.itemGroupFilter = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadData();
  }

  private applyFiltersAndSorting() {
    let filtered = [...this.faults];

    // Apply local valuation filter (API doesn't support this)
    if (this.valuationFilter) {
      filtered = filtered.filter(fault => {
        if (this.valuationFilter === 'affects') return fault.affectsValuation;
        if (this.valuationFilter === 'noaffect') return !fault.affectsValuation;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any = a[this.sortBy as keyof JewelFault];
      let valueB: any = b[this.sortBy as keyof JewelFault];
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB ? valueB.toLowerCase() : '';
      }
      
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredFaults = filtered;
  }

  applySorting() {
    this.applyFiltersAndSorting();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFiltersAndSorting();
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  toggleFilter() {
    this.showFilters = !this.showFilters;
  }

  isSelected(faultId?: string): boolean {
    return faultId ? this.selectedFaults.has(faultId) : false;
  }

  isAllSelected(): boolean {
    return this.filteredFaults.length > 0 && 
           this.filteredFaults.every(fault => fault.id && this.selectedFaults.has(fault.id));
  }

  isSomeSelected(): boolean {
    return this.selectedFaults.size > 0 && !this.isAllSelected();
  }

  toggleSelection(faultId: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedFaults.add(faultId);
    } else {
      this.selectedFaults.delete(faultId);
    }
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.filteredFaults.forEach(fault => {
        if (fault.id) this.selectedFaults.add(fault.id);
      });
    } else {
      this.selectedFaults.clear();
    }
  }

  selectFault(fault: JewelFault) {
    console.log('Selected fault:', fault);
  }

  addNewFault() {
    this.router.navigate(['/jewelfault/add']);
  }

  editFault(fault: JewelFault) {
    this.router.navigate(['/jewelfault/edit', fault.id]);
  }

  deleteFault(fault: JewelFault) {
    if (confirm(`Are you sure you want to delete "${fault.faultName}"?`)) {
      if (!fault.id) return;
      
      this.jewelFaultService.deleteJewelFault(fault.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Jewel fault deleted successfully');
            this.loadData();
          } else {
            alert(response.message || 'Failed to delete jewel fault');
          }
        },
        error: (error) => {
          console.error('Error deleting jewel fault:', error);
          alert(error.error?.message || 'An error occurred while deleting the jewel fault');
        }
      });
    }
  }

  exportFaults() {
    console.log('Exporting faults...');
    alert('Export functionality will be implemented soon!');
  }

  bulkActivate() {
    if (confirm(`Activate ${this.selectedFaults.size} selected fault(s)?`)) {
      const faultIds = Array.from(this.selectedFaults);
      let completed = 0;
      
      faultIds.forEach(faultId => {
        const fault = this.faults.find(f => f.id === faultId);
        if (fault && !fault.isActive) {
          this.jewelFaultService.toggleJewelFaultStatus(faultId).subscribe({
            next: () => {
              completed++;
              if (completed === faultIds.length) {
                this.selectedFaults.clear();
                this.loadData();
                alert('Faults activated successfully');
              }
            },
            error: (error) => {
              console.error('Error activating fault:', error);
            }
          });
        } else {
          completed++;
        }
      });
    }
  }

  bulkDeactivate() {
    if (confirm(`Deactivate ${this.selectedFaults.size} selected fault(s)?`)) {
      const faultIds = Array.from(this.selectedFaults);
      let completed = 0;
      
      faultIds.forEach(faultId => {
        const fault = this.faults.find(f => f.id === faultId);
        if (fault && fault.isActive) {
          this.jewelFaultService.toggleJewelFaultStatus(faultId).subscribe({
            next: () => {
              completed++;
              if (completed === faultIds.length) {
                this.selectedFaults.clear();
                this.loadData();
                alert('Faults deactivated successfully');
              }
            },
            error: (error) => {
              console.error('Error deactivating fault:', error);
            }
          });
        } else {
          completed++;
        }
      });
    }
  }

  bulkDelete() {
    if (confirm(`Delete ${this.selectedFaults.size} selected fault(s)? This action cannot be undone.`)) {
      const faultIds = Array.from(this.selectedFaults);
      let completed = 0;
      let errors = 0;
      
      faultIds.forEach(faultId => {
        this.jewelFaultService.deleteJewelFault(faultId).subscribe({
          next: (response) => {
            completed++;
            if (completed === faultIds.length) {
              this.selectedFaults.clear();
              this.loadData();
              if (errors > 0) {
                alert(`Deleted ${completed - errors} faults. ${errors} faults failed to delete.`);
              } else {
                alert('Faults deleted successfully');
              }
            }
          },
          error: (error) => {
            console.error('Error deleting fault:', error);
            completed++;
            errors++;
            if (completed === faultIds.length) {
              this.selectedFaults.clear();
              this.loadData();
              alert(`Deleted ${completed - errors} faults. ${errors} faults failed to delete.`);
            }
          }
        });
      });
    }
  }

  trackByFaultId(index: number, fault: JewelFault): string {
    return fault.id || index.toString();
  }

  getFaultDisplay(fault: JewelFault): string {
    return fault.faultCode.substring(0, 2).toUpperCase();
  }

  getFaultAvatarClass(faultType: string): string {
    const type = faultType.toLowerCase();
    if (type === 'physical') return 'physical';
    if (type === 'quality') return 'quality';
    if (type === 'structural') return 'structural';
    if (type === 'aesthetic') return 'aesthetic';
    return 'default';
  }

  getSeverityClass(severity: string): string {
    return severity.toLowerCase();
  }

  private calculateStats() {
    this.stats = {
      total: this.faults.length,
      active: this.faults.filter(f => f.isActive).length,
      inactive: this.faults.filter(f => !f.isActive).length,
      recent: this.faults.filter(f => {
        if (!f.createdDate) return false;
        const daysDiff = (Date.now() - new Date(f.createdDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      }).length
    };
  }
}