import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Company {
  id: string;
  companyCode: string;
  companyName: string;
  companyType: 'PRIMARY' | 'SECONDARY' | 'RURAL' | 'URBAN';
  description?: string;
  logoUrl?: string;
  pincode?: string;
  isActive: boolean;
  customerCount: number;
  createdDate: string | Date;  // Changed from Date
  updatedDate: string | Date;   // Changed from Date
}

export interface CompanyStats {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

export interface CompanyFilter {
  search?: string;
  status?: 'active' | 'inactive' | '';
  type?: 'PRIMARY' | 'SECONDARY' | 'RURAL' | 'URBAN' | '';
  minCustomers?: number;
  maxCustomers?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl =  `${environment.apiUrl}/companies`;   // Update with your API URL

  constructor(private http: HttpClient) {}

  // Get all companies with optional filters
  getCompanies(filter?: CompanyFilter): Observable<Company[]> {
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
      if (filter.minCustomers !== undefined) {
        params = params.set('minCustomers', filter.minCustomers.toString());
      }
      if (filter.maxCustomers !== undefined) {
        params = params.set('maxCustomers', filter.maxCustomers.toString());
      }
    }
  
    return this.http.get<Company[]>(this.apiUrl, { params }).pipe(
      map((companies:any) => companies.map((company:any) => ({
        ...company,
        createdDate: new Date(company.createdDate),
        updatedDate: new Date(company.updatedDate)
      })))
    );
  }

  // Get company by ID
  getCompanyById(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  // Get company statistics
  getCompanyStats(): Observable<CompanyStats> {
    return this.http.get<CompanyStats>(`${this.apiUrl}/stats`);
  }

  // Create new company
  createCompany(formData: FormData): Observable<Company> {
    return this.http.post<Company>(this.apiUrl, formData);
  }

  // Update company
  updateCompany(id: string, formData: FormData): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, formData);
  }

  // Delete company
  deleteCompany(id: string): Observable<void> {
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

  // Get company logo URL
  getLogoUrl(companyId: string): string {
    return `${this.apiUrl}/${companyId}/logo`;
  }
}