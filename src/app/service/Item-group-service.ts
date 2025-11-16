import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ItemGroup {
  id: string;
  groupCode: string;
  groupName: string;
  groupNameTamil?: string;
  areaId: string;
  areaName?: string;
  areaCode?: string;
  companyName?: string;
  description?: string;
  isActive: boolean;
  itemCount: number;
  createdDate: string | Date;
  updatedDate: string | Date;
}

export interface ItemGroupStats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

export interface ItemGroupFilter {
  search?: string;
  status?: 'active' | 'inactive' | '';
  areaId?: string;
}

export interface AreaOption {
  id: string;
  code: string;
  name: string;
  companyName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItemGroupService {
  private apiUrl =  `${environment.apiUrl}/itemgroups`; 

  constructor(private http: HttpClient) {}

  // Get all item groups with optional filters
  getItemGroups(filter?: ItemGroupFilter): Observable<ItemGroup[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.search) {
        params = params.set('search', filter.search);
      }
      if (filter.status) {
        params = params.set('status', filter.status);
      }
      if (filter.areaId) {
        params = params.set('areaId', filter.areaId);
      }
    }

    return this.http.get<ItemGroup[]>(this.apiUrl, { params }).pipe(
      map(groups => groups.map(group => ({
        ...group,
        createdDate: new Date(group.createdDate),
        updatedDate: new Date(group.updatedDate)
      })))
    );
  }

  // Get item group by ID
  getItemGroupById(id: string): Observable<ItemGroup> {
    return this.http.get<ItemGroup>(`${this.apiUrl}/${id}`);
  }

  // Get item group statistics
  getItemGroupStats(): Observable<ItemGroupStats> {
    return this.http.get<ItemGroupStats>(`${this.apiUrl}/stats`);
  }

  // Get item groups by area
  getItemGroupsByArea(areaId: string): Observable<ItemGroup[]> {
    return this.http.get<ItemGroup[]>(`${this.apiUrl}/by-area/${areaId}`);
  }

  // Get next group code
  getNextGroupCode(): Observable<{ code: string }> {
    return this.http.get<{ code: string }>(`${this.apiUrl}/next-code`);
  }

  // Get areas for dropdown (calls area API)
  getAreasForDropdown(): Observable<AreaOption[]> {
    return this.http.get<AreaOption[]>('https://localhost:5001/api/areas/dropdown');
  }

  // Get item groups for dropdown
  getItemGroupsForDropdown(): Observable<{ id: string; code: string; name: string }[]> {
    return this.http.get<{ id: string; code: string; name: string }[]>(`${this.apiUrl}/dropdown`);
  }

  // Create new item group
  createItemGroup(groupData: any): Observable<ItemGroup> {
    return this.http.post<ItemGroup>(this.apiUrl, groupData);
  }

  // Update item group
  updateItemGroup(id: string, groupData: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, groupData);
  }

  // Delete item group
  deleteItemGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Bulk activate
  bulkActivate(ids: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/bulk-activate`, ids);
  }

  // Bulk deactivate
  bulkDeactivate(ids: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/bulk-deactivate`, ids);
  }
}