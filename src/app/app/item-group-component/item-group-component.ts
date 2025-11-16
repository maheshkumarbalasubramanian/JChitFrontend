import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemGroupService, ItemGroup, ItemGroupStats, ItemGroupFilter } from '../../service/Item-group-service';



@Component({
  selector: 'app-item-group-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './item-group-component.html',
  styleUrl: './item-group-component.scss'
})
export class ItemGroupComponent implements OnInit {
  private router = inject(Router);
  private itemGroupService = inject(ItemGroupService);

  // Data properties
  itemGroups: ItemGroup[] = [];
  filteredGroups: ItemGroup[] = [];
  stats: ItemGroupStats = { total: 0, active: 0, inactive: 0, recent: 0 };
  
  // UI state
  isLoading = false;
  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  sortBy = 'groupName';
  sortDirection: 'asc' | 'desc' = 'asc';
  errorMessage = '';
  
  // Filters
  showFilters = false;
  statusFilter: '' | 'active' | 'inactive' = '';
  itemCountFilter = '';
  
  // Selection
  selectedGroups = new Set<string>();

  ngOnInit() {
    this.loadItemGroups();
    this.loadStats();
  }

  // Data loading
  loadItemGroups() {
    this.isLoading = true;
    this.errorMessage = '';
    
    const filter: ItemGroupFilter = {
      search: this.searchTerm || undefined,
      status: this.statusFilter || undefined
    };

    this.itemGroupService.getItemGroups(filter).subscribe({
      next: (groups) => {
        this.itemGroups = groups;
        this.applyLocalSorting();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading item groups:', error);
        this.errorMessage = 'Failed to load item groups. Please try again.';
        this.isLoading = false;
        this.itemGroups = [];
        this.filteredGroups = [];
      }
    });
  }

  loadStats() {
    this.itemGroupService.getItemGroupStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  refreshData() {
    this.selectedGroups.clear();
    this.loadItemGroups();
    this.loadStats();
  }

  // Search and filtering
  onSearch() {
    this.loadItemGroups();
  }

  applyFilters() {
    this.loadItemGroups();
  }

  clearFilters() {
    this.statusFilter = '';
    this.itemCountFilter = '';
    this.searchTerm = '';
    this.loadItemGroups();
  }

  private applyLocalSorting() {
    let filtered = [...this.itemGroups];

    // Apply item count filter (local only, not sent to API)
    if (this.itemCountFilter) {
      filtered = filtered.filter(group => {
        if (this.itemCountFilter === 'hasItems') return group.itemCount > 0;
        if (this.itemCountFilter === 'noItems') return group.itemCount === 0;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA: any = a[this.sortBy as keyof ItemGroup];
      let valueB: any = b[this.sortBy as keyof ItemGroup];
      
      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredGroups = filtered;
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
  isSelected(groupId: string): boolean {
    return this.selectedGroups.has(groupId);
  }

  isAllSelected(): boolean {
    return this.filteredGroups.length > 0 && 
           this.filteredGroups.every(group => this.selectedGroups.has(group.id));
  }

  isSomeSelected(): boolean {
    return this.selectedGroups.size > 0 && !this.isAllSelected();
  }

  toggleSelection(groupId: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedGroups.add(groupId);
    } else {
      this.selectedGroups.delete(groupId);
    }
  }

  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.filteredGroups.forEach(group => this.selectedGroups.add(group.id));
    } else {
      this.selectedGroups.clear();
    }
  }

  selectGroup(group: ItemGroup) {
    // Handle single group selection for navigation
    console.log('Selected group:', group);
  }

  // Actions
  addNewGroup() {
    this.router.navigate(['itemgroups/add']);
  }

  editGroup(group: ItemGroup) {
    this.router.navigate(['itemgroups/edit', group.id]);
  }

  deleteGroup(group: ItemGroup) {
    if (group.itemCount > 0) {
      alert('Cannot delete group with existing items. Please remove all items first.');
      return;
    }

    if (confirm(`Are you sure you want to delete "${group.groupName}"?`)) {
      this.itemGroupService.deleteItemGroup(group.id).subscribe({
        next: () => {
          console.log('Item group deleted successfully');
          this.refreshData();
        },
        error: (error) => {
          console.error('Error deleting item group:', error);
          alert('Failed to delete item group. Please try again.');
        }
      });
    }
  }

  // Bulk actions
  bulkActivate() {
    if (confirm(`Activate ${this.selectedGroups.size} selected group(s)?`)) {
      const ids = Array.from(this.selectedGroups);
      this.itemGroupService.bulkActivate(ids).subscribe({
        next: (response) => {
          console.log(response.message);
          this.selectedGroups.clear();
          this.refreshData();
        },
        error: (error) => {
          console.error('Error activating item groups:', error);
          alert('Failed to activate item groups. Please try again.');
        }
      });
    }
  }

  bulkDeactivate() {
    if (confirm(`Deactivate ${this.selectedGroups.size} selected group(s)?`)) {
      const ids = Array.from(this.selectedGroups);
      this.itemGroupService.bulkDeactivate(ids).subscribe({
        next: (response) => {
          console.log(response.message);
          this.selectedGroups.clear();
          this.refreshData();
        },
        error: (error) => {
          console.error('Error deactivating item groups:', error);
          alert('Failed to deactivate item groups. Please try again.');
        }
      });
    }
  }

  bulkDelete() {
    const groupsWithItems = this.filteredGroups
      .filter(g => this.selectedGroups.has(g.id) && g.itemCount > 0);
    
    if (groupsWithItems.length > 0) {
      alert('Cannot delete groups that contain items. Please remove items first.');
      return;
    }

    if (confirm(`Delete ${this.selectedGroups.size} selected group(s)? This action cannot be undone.`)) {
      const ids = Array.from(this.selectedGroups);
      let deletedCount = 0;
      let errorCount = 0;

      ids.forEach(id => {
        this.itemGroupService.deleteItemGroup(id).subscribe({
          next: () => {
            deletedCount++;
            if (deletedCount + errorCount === ids.length) {
              this.selectedGroups.clear();
              this.refreshData();
              alert(`Successfully deleted ${deletedCount} item group(s).`);
            }
          },
          error: (error) => {
            console.error('Error deleting item group:', error);
            errorCount++;
            if (deletedCount + errorCount === ids.length) {
              this.selectedGroups.clear();
              this.refreshData();
              alert(`Deleted ${deletedCount} item group(s). ${errorCount} failed.`);
            }
          }
        });
      });
    }
  }

  // Helper methods
  trackByGroupId(index: number, group: ItemGroup): string {
    return group.id;
  }

  getGroupInitials(groupName: string): string {
    if (!groupName) return '??';
    return groupName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  getGroupAvatarClass(groupName: string): string {
    if (!groupName) return 'default';
    
    const name = groupName.toLowerCase();
    if (name.includes('gold')) return 'gold';
    if (name.includes('silver')) return 'silver';
    if (name.includes('platinum')) return 'platinum';
    if (name.includes('diamond')) return 'diamond';
    return 'default';
  }
}