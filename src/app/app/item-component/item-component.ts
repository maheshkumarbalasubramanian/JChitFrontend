import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemTypeService,ItemType } from '../../service/item-type.service';
import { ItemGroupService, ItemGroup } from '../../service/Item-group-service';

export interface ItemStats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

@Component({
  selector: 'app-item-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './item-component.html',
  styleUrl: './item-component.scss'
})
export class ItemComponent implements OnInit {
  private router = inject(Router);
  private itemTypeService = inject(ItemTypeService);
  private itemGroupService = inject(ItemGroupService);

  // Data properties
  items: ItemType[] = [];
  filteredItems: ItemType[] = [];
  itemGroups: ItemGroup[] = [];
  stats: ItemStats = { total: 0, active: 0, inactive: 0, recent: 0 };
  
  // UI state
  isLoading = false;
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  sortBy = 'itemName';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Filters
  showFilters = false;
  statusFilter = '';
  itemGroupFilter = '';
  
  // Selection
  selectedItems = new Set<string>();

  // Pagination
  currentPage = 1;
  pageSize = 100;
  totalItems = 0;

  ngOnInit() {
    this.loadData();
  }

  // Data loading
  loadData() {
    this.isLoading = true;
    
    // Load item types and item groups in parallel
    Promise.all([
      this.loadItemTypes(),
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

  private loadItemTypes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.itemTypeService.getItemTypes(
        this.currentPage,
        this.pageSize,
        this.searchTerm,
        this.itemGroupFilter,
        this.statusFilter ? this.statusFilter === 'active' : undefined
      ).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.items = response.data.items.map(item => ({
              ...item,
              createdDate: new Date(item.createdDate!),
              updatedDate: new Date(item.updatedDate!)
            }));
            this.totalItems = response.data.total;
            resolve();
          } else {
            reject(new Error(response.message || 'Failed to load item types'));
          }
        },
        error: (error) => {
          console.error('Error loading item types:', error);
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
    this.selectedItems.clear();
    this.loadData();
  }

  // Search and filtering
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
    this.itemGroupFilter = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadData();
  }

  private applyFiltersAndSorting() {
    let filtered = [...this.items];

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any = a[this.sortBy as keyof ItemType];
      let valueB: any = b[this.sortBy as keyof ItemType];
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB ? valueB.toLowerCase() : '';
      }
      
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredItems = filtered;
  }

  // Sorting
  applySorting() {
    this.applyFiltersAndSorting();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFiltersAndSorting();
  }

  // View mode
  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  toggleFilter() {
    this.showFilters = !this.showFilters;
  }

  // Selection
  isSelected(itemId?: string): boolean {
    return itemId ? this.selectedItems.has(itemId) : false;
  }

  isAllSelected(): boolean {
    return this.filteredItems.length > 0 && 
           this.filteredItems.every(item => item.id && this.selectedItems.has(item.id));
  }

  isSomeSelected(): boolean {
    return this.selectedItems.size > 0 && !this.isAllSelected();
  }

  toggleSelection(itemId: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedItems.add(itemId);
    } else {
      this.selectedItems.delete(itemId);
    }
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.filteredItems.forEach(item => {
        if (item.id) this.selectedItems.add(item.id);
      });
    } else {
      this.selectedItems.clear();
    }
  }

  selectItem(item: ItemType) {
    console.log('Selected item type:', item);
  }

  // Navigation
  addNewItem() {
    this.router.navigate(['/itemtypes/add']);
  }

  editItem(item: ItemType) {
    this.router.navigate(['/itemtypes/edit', item.id]);
  }

  navigateToGroups() {
    this.router.navigate(['/itemgroups']);
  }

  navigateToPurities() {
    // Removed - no longer using purities
  }

  // Actions
  deleteItem(item: ItemType) {
    if (confirm(`Are you sure you want to delete "${item.itemName}"?`)) {
      if (!item.id) return;
      
      this.itemTypeService.deleteItemType(item.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Item type deleted successfully');
            this.loadData();
          } else {
            alert(response.message || 'Failed to delete item type');
          }
        },
        error: (error) => {
          console.error('Error deleting item type:', error);
          alert(error.error?.message || 'An error occurred while deleting the item type');
        }
      });
    }
  }

  // Bulk actions
  bulkActivate() {
    if (confirm(`Activate ${this.selectedItems.size} selected item(s)?`)) {
      const itemIds = Array.from(this.selectedItems);
      let completed = 0;
      
      itemIds.forEach(itemId => {
        const item = this.items.find(i => i.id === itemId);
        if (item && !item.isActive) {
          this.itemTypeService.toggleItemTypeStatus(itemId).subscribe({
            next: () => {
              completed++;
              if (completed === itemIds.length) {
                this.selectedItems.clear();
                this.loadData();
                alert('Items activated successfully');
              }
            },
            error: (error) => {
              console.error('Error activating item:', error);
            }
          });
        } else {
          completed++;
        }
      });
    }
  }

  bulkDeactivate() {
    if (confirm(`Deactivate ${this.selectedItems.size} selected item(s)?`)) {
      const itemIds = Array.from(this.selectedItems);
      let completed = 0;
      
      itemIds.forEach(itemId => {
        const item = this.items.find(i => i.id === itemId);
        if (item && item.isActive) {
          this.itemTypeService.toggleItemTypeStatus(itemId).subscribe({
            next: () => {
              completed++;
              if (completed === itemIds.length) {
                this.selectedItems.clear();
                this.loadData();
                alert('Items deactivated successfully');
              }
            },
            error: (error) => {
              console.error('Error deactivating item:', error);
            }
          });
        } else {
          completed++;
        }
      });
    }
  }

  bulkAssignPurity() {
    // Removed - no longer using purities
    alert('Purity assignment is no longer available in this version');
  }

  bulkDelete() {
    if (confirm(`Delete ${this.selectedItems.size} selected item(s)? This action cannot be undone.`)) {
      const itemIds = Array.from(this.selectedItems);
      let completed = 0;
      let errors = 0;
      
      itemIds.forEach(itemId => {
        this.itemTypeService.deleteItemType(itemId).subscribe({
          next: (response) => {
            completed++;
            if (completed === itemIds.length) {
              this.selectedItems.clear();
              this.loadData();
              if (errors > 0) {
                alert(`Deleted ${completed - errors} items. ${errors} items failed to delete.`);
              } else {
                alert('Items deleted successfully');
              }
            }
          },
          error: (error) => {
            console.error('Error deleting item:', error);
            completed++;
            errors++;
            if (completed === itemIds.length) {
              this.selectedItems.clear();
              this.loadData();
              alert(`Deleted ${completed - errors} items. ${errors} items failed to delete.`);
            }
          }
        });
      });
    }
  }

  // Helper methods
  trackByItemId(index: number, item: ItemType): string {
    return item.id || index.toString();
  }

  getItemInitials(itemName: string): string {
    return itemName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  getItemAvatarClass(groupName?: string): string {
    if (!groupName) return 'default';
    const name = groupName.toLowerCase();
    if (name.includes('gold')) return 'gold';
    if (name.includes('silver')) return 'silver';
    if (name.includes('platinum')) return 'platinum';
    if (name.includes('diamond')) return 'diamond';
    return 'default';
  }

  private calculateStats() {
    this.stats = {
      total: this.items.length,
      active: this.items.filter(i => i.isActive).length,
      inactive: this.items.filter(i => !i.isActive).length,
      recent: this.items.filter(i => {
        if (!i.createdDate) return false;
        const daysDiff = (Date.now() - new Date(i.createdDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      }).length
    };
  }
}