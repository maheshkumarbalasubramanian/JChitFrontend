import { ItemType } from "../service/item-type.service";

export interface ItemValidationErrors {
    itemCode?: string[];
    itemName?: string[];
    itemNameTamil?: string[];
    description?: string[];
    itemGroupId?: string[];
    purityId?: string[];
  }
  
  export interface ItemSort {
    field: keyof ItemType;
    direction: 'asc' | 'desc';
  }
  
  export interface BulkOperationResult {
    success: boolean;
    updatedCount: number;
    errors?: string[];
  }