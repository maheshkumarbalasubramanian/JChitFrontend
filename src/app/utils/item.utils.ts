import { Item } from "../service/item.service";
import { Purity } from "../service/purity.service";


export class ItemUtils {
    static generateItemCode(existingCodes: string[]): string {
      let counter = 1;
      let code: string;
      
      do {
        code = `IT${counter.toString().padStart(3, '0')}`;
        counter++;
      } while (existingCodes.includes(code));
      
      return code;
    }
  
    static getItemAvatarClass(groupName: string): string {
      const name = groupName.toLowerCase();
      if (name.includes('gold')) return 'gold';
      if (name.includes('silver')) return 'silver';
      if (name.includes('platinum')) return 'platinum';
      if (name.includes('diamond')) return 'diamond';
      return 'default';
    }
  
    static getItemInitials(itemName: string): string {
      return itemName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
    }
  
    static validateItemName(name: string, existingNames: string[], currentId?: string): string[] {
      const errors: string[] = [];
      
      if (!name || name.trim().length === 0) {
        errors.push('Item name is required');
      } else if (name.trim().length < 2) {
        errors.push('Item name must be at least 2 characters long');
      } else if (name.trim().length > 100) {
        errors.push('Item name must not exceed 100 characters');
      }
      
      // Check for duplicates (case-insensitive)
      const trimmedName = name.trim().toLowerCase();
      const isDuplicate = existingNames.some((existing, index) => 
        existing.toLowerCase() === trimmedName && index.toString() !== currentId
      );
      
      if (isDuplicate) {
        errors.push('Item name already exists');
      }
      
      return errors;
    }
  
    static formatPurityDisplay(purity: Purity): string {
      let display = `${purity.purityName} (${purity.purityPercentage}%)`;
      if (purity.karat) {
        display += `, ${purity.karat}`;
      }
      return display;
    }
  
    static formatDate(date: Date): string {
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  
    static calculateRecentCount(items: Item[], days: number = 7): number {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return items.filter(item => 
        item.createdDate >= cutoffDate
      ).length;
    }
  
    static filterItemsBySearchTerm(items: Item[], searchTerm: string): Item[] {
      if (!searchTerm) return items;
      
      const term = searchTerm.toLowerCase();
      return items.filter(item => 
        item.itemName.toLowerCase().includes(term) ||
        item.itemCode.toLowerCase().includes(term) ||
        item.itemGroupName.toLowerCase().includes(term) ||
        (item.itemNameTamil && item.itemNameTamil.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.purityName && item.purityName.toLowerCase().includes(term))
      );
    }
  
    static sortItems(items: Item[], sortBy: keyof Item, direction: 'asc' | 'desc'): Item[] {
      return [...items].sort((a, b) => {
        let valueA: any = a[sortBy];
        let valueB: any = b[sortBy];
        
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }