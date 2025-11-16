import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Purity {
  id?: string;
  purityCode: string;
  purityName: string;
  purityPercentage: number;
  karat?: number;
  itemGroupId: string;
  itemGroupName?: string;
  description?: string;
  isActive: boolean;
  createdDate?: Date;
  updatedDate?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface PurityListResponse {
  purities: Purity[];
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
export class PurityService {
  private apiUrl = `${environment.apiUrl}/purities`;

  constructor(private http: HttpClient) {}

  // Get all purities with optional filters
  getPurities(
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    itemGroupId?: string,
    isActive?: boolean
  ): Observable<ApiResponse<PurityListResponse>> {
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

    return this.http.get<ApiResponse<PurityListResponse>>(this.apiUrl, { params });
  }

  // Get purity by ID
  getPurityById(id: string): Observable<ApiResponse<Purity>> {
    return this.http.get<ApiResponse<Purity>>(`${this.apiUrl}/${id}`);
  }

  // Get purity by code
  getPurityByCode(code: string): Observable<ApiResponse<Purity>> {
    return this.http.get<ApiResponse<Purity>>(`${this.apiUrl}/code/${code}`);
  }

  // Get purities by item group
  getPuritiesByGroup(itemGroupId: string): Observable<ApiResponse<Purity[]>> {
    return this.http.get<ApiResponse<Purity[]>>(`${this.apiUrl}/group/${itemGroupId}`);
  }

  // Create new purity
  createPurity(purity: Purity): Observable<ApiResponse<Purity>> {
    return this.http.post<ApiResponse<Purity>>(this.apiUrl, purity);
  }

  // Update existing purity
  updatePurity(id: string, purity: Purity): Observable<ApiResponse<Purity>> {
    return this.http.put<ApiResponse<Purity>>(`${this.apiUrl}/${id}`, purity);
  }

  // Delete purity
  deletePurity(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Toggle purity active status
  togglePurityStatus(id: string): Observable<ApiResponse<Purity>> {
    return this.http.patch<ApiResponse<Purity>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Generate unique purity code
  generatePurityCode(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/generate-code`);
  }

  // Get purity statistics
  getPurityStatistics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/statistics`);
  }

  // Check if purity code exists
  checkPurityCodeExists(code: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/check-code/${code}`);
  }
}