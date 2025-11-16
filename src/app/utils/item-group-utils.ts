import { ItemGroup } from "../service/Item-group-service";

export class ItemGroupUtils {
    static generateGroupCode(existingCodes: string[]): string {
      let counter = 1;
      let code: string;
      
      do {
        code = `GRP${counter.toString().padStart(3, '0')}`;
        counter++;
      } while (existingCodes.includes(code));
      
      return code;
    }
  
    static getGroupAvatarClass(groupName: string): string {
      const name = groupName.toLowerCase();
      if (name.includes('gold')) return 'gold';
      if (name.includes('silver')) return 'silver';
      if (name.includes('platinum')) return 'platinum';
      if (name.includes('diamond')) return 'diamond';
      return 'default';
    }
  
    static getGroupInitials(groupName: string): string {
      return groupName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
    }
  
    static validateGroupName(name: string, existingNames: string[], currentId?: string): string[] {
      const errors: string[] = [];
      
      if (!name || name.trim().length === 0) {
        errors.push('Group name is required');
      } else if (name.trim().length < 2) {
        errors.push('Group name must be at least 2 characters long');
      } else if (name.trim().length > 50) {
        errors.push('Group name must not exceed 50 characters');
      }
      
      // Check for duplicates (case-insensitive)
      const trimmedName = name.trim().toLowerCase();
      const isDuplicate = existingNames.some((existing, index) => 
        existing.toLowerCase() === trimmedName && index.toString() !== currentId
      );
      
      if (isDuplicate) {
        errors.push('Group name already exists');
      }
      
      return errors;
    }
  
    static formatDate(date: Date): string {
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  
    static calculateRecentCount(itemGroups: ItemGroup[], days: number = 7): number {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return itemGroups.filter(group => 
        group.createdDate >= cutoffDate
      ).length;
    }
  }