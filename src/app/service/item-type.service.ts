import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export interface ItemType {
  id?: string;
  itemCode: string;
  itemName: string;
  itemNameTamil?: string;
  itemGroupId: string;
  itemGroupName?: string;
  description?: string;
  isActive: boolean;
  itemCount?: number;
  createdDate?: Date;
  updatedDate?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface ItemTypeListResponse {
  items: ItemType[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ItemTypeService {
  private apiUrl = `${environment.apiUrl}/itemtypes`;

  constructor(private http: HttpClient) {}

  // Get all item types with optional filters
  getItemTypes(
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    itemGroupId?: string,
    isActive?: boolean
  ): Observable<ApiResponse<ItemTypeListResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (itemGroupId) {
      params = params.set('itemGroupId', itemGroupId);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<ApiResponse<ItemTypeListResponse>>(this.apiUrl, { params });
  }

  // Get item type by ID
  getItemTypeById(id: string): Observable<ApiResponse<ItemType>> {
    return this.http.get<ApiResponse<ItemType>>(`${this.apiUrl}/${id}`);
  }

  // Get item type by code
  getItemTypeByCode(code: string): Observable<ApiResponse<ItemType>> {
    return this.http.get<ApiResponse<ItemType>>(`${this.apiUrl}/code/${code}`);
  }

  // Get item types by item group
  getItemTypesByGroup(itemGroupId: string): Observable<ApiResponse<ItemType[]>> {
    return this.http.get<ApiResponse<ItemType[]>>(`${this.apiUrl}/group/${itemGroupId}`);
  }

  // Create new item type
  createItemType(itemType: ItemType): Observable<ApiResponse<ItemType>> {
    return this.http.post<ApiResponse<ItemType>>(this.apiUrl, itemType);
  }

  // Update existing item type
  updateItemType(id: string, itemType: ItemType): Observable<ApiResponse<ItemType>> {
    return this.http.put<ApiResponse<ItemType>>(`${this.apiUrl}/${id}`, itemType);
  }

  // Delete item type
  deleteItemType(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Toggle item type active status
  toggleItemTypeStatus(id: string): Observable<ApiResponse<ItemType>> {
    return this.http.patch<ApiResponse<ItemType>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Generate unique item code
  generateItemCode(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/generate-code`);
  }

  // Get item type statistics
  getItemTypeStatistics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/statistics`);
  }

  // Export item types to CSV
  exportItemTypes(itemGroupId?: string): Observable<Blob> {
    let params = new HttpParams();
    if (itemGroupId) {
      params = params.set('itemGroupId', itemGroupId);
    }
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}