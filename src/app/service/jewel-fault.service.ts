import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface JewelFault {
  id?: string;
  faultCode: string;
  faultName: string;
  faultType: 'PHYSICAL' | 'QUALITY' | 'STRUCTURAL' | 'AESTHETIC';
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectsValuation: boolean;
  valuationImpactPercentage?: number;
  itemGroupId: string;
  itemGroupName?: string;
  isActive: boolean;
  createdDate?: Date;
  updatedDate?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface JewelFaultListResponse {
  faults: JewelFault[];
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
export class JewelFaultService {
  private apiUrl = `${environment.apiUrl}/jewelfaults`;

  constructor(private http: HttpClient) {}

  // Get all jewel faults with optional filters
  getJewelFaults(
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    itemGroupId?: string,
    faultType?: string,
    severity?: string,
    isActive?: boolean
  ): Observable<ApiResponse<JewelFaultListResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (itemGroupId) {
      params = params.set('itemGroupId', itemGroupId);
    }
    if (faultType) {
      params = params.set('faultType', faultType);
    }
    if (severity) {
      params = params.set('severity', severity);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<ApiResponse<JewelFaultListResponse>>(this.apiUrl, { params });
  }

  // Get jewel fault by ID
  getJewelFaultById(id: string): Observable<ApiResponse<JewelFault>> {
    return this.http.get<ApiResponse<JewelFault>>(`${this.apiUrl}/${id}`);
  }

  // Get jewel fault by code
  getJewelFaultByCode(code: string): Observable<ApiResponse<JewelFault>> {
    return this.http.get<ApiResponse<JewelFault>>(`${this.apiUrl}/code/${code}`);
  }

  // Get jewel faults by item group
  getJewelFaultsByGroup(itemGroupId: string): Observable<ApiResponse<JewelFault[]>> {
    return this.http.get<ApiResponse<JewelFault[]>>(`${this.apiUrl}/group/${itemGroupId}`);
  }

  // Get jewel faults by severity
  getJewelFaultsBySeverity(severity: string): Observable<ApiResponse<JewelFault[]>> {
    return this.http.get<ApiResponse<JewelFault[]>>(`${this.apiUrl}/severity/${severity}`);
  }

  // Create new jewel fault
  createJewelFault(fault: JewelFault): Observable<ApiResponse<JewelFault>> {
    return this.http.post<ApiResponse<JewelFault>>(this.apiUrl, fault);
  }

  // Update existing jewel fault
  updateJewelFault(id: string, fault: JewelFault): Observable<ApiResponse<JewelFault>> {
    return this.http.put<ApiResponse<JewelFault>>(`${this.apiUrl}/${id}`, fault);
  }

  // Delete jewel fault
  deleteJewelFault(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Toggle jewel fault active status
  toggleJewelFaultStatus(id: string): Observable<ApiResponse<JewelFault>> {
    return this.http.patch<ApiResponse<JewelFault>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Generate unique fault code
  generateFaultCode(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/generate-code`);
  }

  // Get jewel fault statistics
  getJewelFaultStatistics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/statistics`);
  }

  // Check if fault code exists
  checkFaultCodeExists(code: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/check-code/${code}`);
  }
}