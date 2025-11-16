import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RateSet {
  id?: string;
  areaId: string;
  areaCode?: string;
  areaName?: string;
  effectiveDate: string | Date;
  goldRatePerGram: number;
  goldPurityRatePerGram: number;
  silverRatePerGram: number;
  silverPurityRatePerGram: number;
  notes?: string;
  isActive: boolean;
  createdDate?: Date;
  updatedDate?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface AddRateSetRequest {
  areaId: string;
  effectiveDate: string;
  goldRatePerGram: number;
  goldPurityRatePerGram: number;
  silverRatePerGram: number;
  silverPurityRatePerGram: number;
  notes?: string;
}

export interface RateSetListResponse {
  rateSets: RateSet[];
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
export class RateSetService {
  private apiUrl = `${environment.apiUrl}/ratesets`;

  constructor(private http: HttpClient) {}

  // Get all rate sets with optional filters
  getRateSets(
    page: number = 1,
    pageSize: number = 50,
    searchTerm?: string,
    areaId?: string,
    isActive?: boolean
  ): Observable<ApiResponse<RateSetListResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (areaId) {
      params = params.set('areaId', areaId);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<ApiResponse<RateSetListResponse>>(this.apiUrl, { params });
  }

  // Get rate set by ID
  getRateSetById(id: string): Observable<ApiResponse<RateSet>> {
    return this.http.get<ApiResponse<RateSet>>(`${this.apiUrl}/${id}`);
  }

  // Get current/latest rate set for an area
  getCurrentRateSetByArea(areaId: string): Observable<ApiResponse<RateSet>> {
    return this.http.get<ApiResponse<RateSet>>(`${this.apiUrl}/area/${areaId}/current`);
  }

  // Get rate sets by area
  getRateSetsByArea(areaId: string): Observable<ApiResponse<RateSet[]>> {
    return this.http.get<ApiResponse<RateSet[]>>(`${this.apiUrl}/area/${areaId}`);
  }

  // Create new rate set
  createRateSet(rateSet: AddRateSetRequest): Observable<ApiResponse<RateSet>> {
    return this.http.post<ApiResponse<RateSet>>(this.apiUrl, rateSet);
  }

  // Update existing rate set
  updateRateSet(id: string, rateSet: RateSet): Observable<ApiResponse<RateSet>> {
    return this.http.put<ApiResponse<RateSet>>(`${this.apiUrl}/${id}`, rateSet);
  }

  // Delete rate set
  deleteRateSet(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Toggle rate set active status
  toggleRateSetStatus(id: string): Observable<ApiResponse<RateSet>> {
    return this.http.patch<ApiResponse<RateSet>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Get rate set statistics
  getRateSetStatistics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/statistics`);
  }
}