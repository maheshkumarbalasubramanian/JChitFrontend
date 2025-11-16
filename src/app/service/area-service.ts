import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Area {
  id: string;
  areaCode: string;
  areaName: string;
  areaType: 'PRIMARY' | 'SECONDARY' | 'RURAL' | 'URBAN';
  companyId: string;
  companyName?: string;
  companyCode?: string;
  description?: string;
  pincode?: string;
  isActive: boolean;
  customerCount: number;
  createdDate: string | Date;
  updatedDate: string | Date;
}

export interface AreaStats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}
export interface AreaDropdown {
  id: string;
  areaCode: string;
  areaName: string;
}

export interface AreaFilter {
  search?: string;
  status?: 'active' | 'inactive' | '';
  type?: 'PRIMARY' | 'SECONDARY' | 'RURAL' | 'URBAN' | '';
  companyId?: string;
  minCustomers?: number;
  maxCustomers?: number;
}

export interface CompanyOption {
  id: string;
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private apiUrl =  `${environment.apiUrl}/areas`;   // Update with your API URL

  constructor(private http: HttpClient) {}

  // Get all areas with optional filters
  getAreas(filter?: AreaFilter): Observable<Area[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.search) {
        params = params.set('search', filter.search);
      }
      if (filter.status) {
        params = params.set('status', filter.status);
      }
      if (filter.type) {
        params = params.set('type', filter.type);
      }
      if (filter.companyId) {
        params = params.set('companyId', filter.companyId);
      }
      if (filter.minCustomers !== undefined) {
        params = params.set('minCustomers', filter.minCustomers.toString());
      }
      if (filter.maxCustomers !== undefined) {
        params = params.set('maxCustomers', filter.maxCustomers.toString());
      }
    }

    return this.http.get<Area[]>(this.apiUrl, { params }).pipe(
      map(areas => areas.map(area => ({
        ...area,
        createdDate: new Date(area.createdDate),
        updatedDate: new Date(area.updatedDate)
      })))
    );
  }

  // Get area by ID
  getAreaById(id: string): Observable<Area> {
    return this.http.get<Area>(`${this.apiUrl}/${id}`);
  }

  // Get area statistics
  getAreaStats(): Observable<AreaStats> {
    return this.http.get<AreaStats>(`${this.apiUrl}/stats`);
  }

  // Get areas by company
  getAreasByCompany(companyId: string): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.apiUrl}/by-company/${companyId}`);
  }

  // Get companies for dropdown (calls company API)
  getCompaniesForDropdown(): Observable<CompanyOption[]> {
    return this.http.get<CompanyOption[]>(`${environment.apiUrl}/companies/dropdown`);
  }

  // Create new area
  createArea(areaData: any): Observable<Area> {
    return this.http.post<Area>(this.apiUrl, areaData);
  }

  // Update area
  updateArea(id: string, areaData: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, areaData);
  }

  // Delete area
  deleteArea(id: string): Observable<void> {
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