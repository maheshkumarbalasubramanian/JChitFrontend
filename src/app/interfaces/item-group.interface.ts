import { ItemGroup } from "../service/Item-group-service";

// interfaces/item-group.interface.ts - Extended interface with validation
export interface ItemGroupFormData {
    groupCode: string;
    groupName: string;
    groupNameTamil?: string;
    description?: string;
    isActive: boolean;
  }
  
  export interface ItemGroupValidationErrors {
    groupCode?: string[];
    groupName?: string[];
    groupNameTamil?: string[];
    description?: string[];
  }
  
  export interface ItemGroupFilter {
    search?: string;
    status?: 'active' | 'inactive' | '';
    itemCount?: 'hasItems' | 'noItems' | '';
    dateRange?: {
      start: Date;
      end: Date;
    };
  }
  
  export interface ItemGroupSort {
    field: keyof ItemGroup;
    direction: 'asc' | 'desc';
  }