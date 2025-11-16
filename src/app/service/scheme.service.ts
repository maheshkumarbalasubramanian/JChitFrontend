import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Scheme {
  id?: string;
  schemeCode: string;
  schemeName: string;
  areaId: string;
  areaCode?: string;
  areaName?: string;
  itemGroupId: string;
  itemGroupCode?: string;
  itemGroupName?: string;
  roi: number;
  calculationMethod: string;
  isStdRoi: boolean;
  calculationBased: string;
  customizedStyle?: string;
  processingFeeSlab: boolean;
  minCalcDays: number;
  graceDays: number;
  advanceMonth: number;
  processingFeePercent: number;
  minMarketValue: number;
  maxMarketValue: number;
  minLoanValue: number;
  maxLoanValue: number;
  penaltyRate?: number;
  penaltyGraceDays?: number;
  compoundingFrequency?: string;
  emiTenure?: number;
  reductionPercent: number;
  validityInMonths: number;
  interestPercentAfterValidity: number;
  isActive: boolean;
  createdDate?: Date;
  updatedDate?: Date;
}

export interface SchemeListResponse {
  schemes: Scheme[];
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
export class SchemeService {
  private apiUrl = `${environment.apiUrl}/schemes`;

  constructor(private http: HttpClient) {}

  // Get all schemes with optional filters
  getSchemes(
    page: number = 1,
    pageSize: number = 50,
    searchTerm?: string,
    areaId?: string,
    itemGroupId?: string,
    isActive?: boolean
  ): Observable<ApiResponse<SchemeListResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (areaId) {
      params = params.set('areaId', areaId);
    }
    if (itemGroupId) {
      params = params.set('itemGroupId', itemGroupId);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<ApiResponse<SchemeListResponse>>(this.apiUrl, { params });
  }

  // Get scheme by ID
  getSchemeById(id: string): Observable<ApiResponse<Scheme>> {
    return this.http.get<ApiResponse<Scheme>>(`${this.apiUrl}/${id}`);
  }

  // Get scheme by code
  getSchemeByCode(code: string): Observable<ApiResponse<Scheme>> {
    return this.http.get<ApiResponse<Scheme>>(`${this.apiUrl}/code/${code}`);
  }

  // Get schemes by area
  getSchemesByArea(areaId: string): Observable<ApiResponse<Scheme[]>> {
    return this.http.get<ApiResponse<Scheme[]>>(`${this.apiUrl}/area/${areaId}`);
  }

  // Get schemes by item group
  getSchemesByItemGroup(itemGroupId: string): Observable<ApiResponse<Scheme[]>> {
    return this.http.get<ApiResponse<Scheme[]>>(`${this.apiUrl}/item-group/${itemGroupId}`);
  }

  // Create new scheme
  createScheme(scheme: Scheme): Observable<ApiResponse<Scheme>> {
    return this.http.post<ApiResponse<Scheme>>(this.apiUrl, scheme);
  }

  // Update existing scheme
  updateScheme(id: string, scheme: Scheme): Observable<ApiResponse<Scheme>> {
    return this.http.put<ApiResponse<Scheme>>(`${this.apiUrl}/${id}`, scheme);
  }

  // Delete scheme
  deleteScheme(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Toggle scheme active status
  toggleSchemeStatus(id: string): Observable<ApiResponse<Scheme>> {
    return this.http.patch<ApiResponse<Scheme>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Generate unique scheme code
  generateSchemeCode(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/generate-code`);
  }

  // Get scheme statistics
  getSchemeStatistics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/statistics`);
  }
}