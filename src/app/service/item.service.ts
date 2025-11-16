import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  itemNameTamil?: string;
  description?: string;
  itemGroupId: string;
  itemGroupName: string;
  itemGroupCode: string;
  purityId?: string;
  purityName?: string;
  purityPercentage?: number;
  karat?: string;
  isActive: boolean;
  createdDate: Date;
  updatedDate: Date;
}

export interface ItemFormData {
  itemCode: string;
  itemName: string;
  itemNameTamil?: string;
  description?: string;
  itemGroupId: string;
  purityId?: string;
  isActive: boolean;
}

export interface ItemStats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

export interface ItemFilter {
  search?: string;
  status?: 'active' | 'inactive' | '';
  itemGroupId?: string;
  purityId?: string;
  hasPurity?: 'yes' | 'no' | '';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private http = inject(HttpClient);
  private baseUrl = '/api/itemtypes'; // Replace with your API URL
  
  // State management
  private itemsSubject = new BehaviorSubject<Item[]>([]);
  private statsSubject = new BehaviorSubject<ItemStats>({ total: 0, active: 0, inactive: 0, recent: 0 });
  
  public items$ = this.itemsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  // API Methods
  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(this.baseUrl);
  }

  getItemById(id: string): Observable<Item> {
    return this.http.get<Item>(`${this.baseUrl}/${id}`);
  }

  createItem(item: ItemFormData): Observable<Item> {
    return this.http.post<Item>(this.baseUrl, item);
  }

  updateItem(id: string, item: Partial<ItemFormData>): Observable<Item> {
    return this.http.put<Item>(`${this.baseUrl}/${id}`, item);
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  bulkUpdateStatus(ids: string[], isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/bulk-status`, { ids, isActive });
  }

  bulkDelete(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bulk`, { body: { ids } });
  }

  bulkAssignPurity(ids: string[], purityId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/bulk-purity`, { ids, purityId });
  }

  getStats(): Observable<ItemStats> {
    return this.http.get<ItemStats>(`${this.baseUrl}/stats`);
  }

  getItemsByGroup(groupId: string): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.baseUrl}/by-group/${groupId}`);
  }

  getItemsByPurity(purityId: string): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.baseUrl}/by-purity/${purityId}`);
  }

  // State management methods
  updateItems(items: Item[]) {
    this.itemsSubject.next(items);
  }

  updateStats(stats: ItemStats) {
    this.statsSubject.next(stats);
  }

  getCurrentItems(): Item[] {
    return this.itemsSubject.value;
  }

  getCurrentStats(): ItemStats {
    return this.statsSubject.value;
  }

  // Helper methods
  generateItemCode(existingCodes: string[]): string {
    let counter = 1;
    let code: string;
    
    do {
      code = `IT${counter.toString().padStart(3, '0')}`;
      counter++;
    } while (existingCodes.includes(code));
    
    return code;
  }
}