import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Customer {
  id?: string;
  customerCode: string;
  customerName: string;
  relationName: string;
  relationshipName: string;
  dateOfBirth?: Date;
  mobile: string;
  profileImage?: string;
  addressInfo: {
    address1: string;
    address2: string;
    address3: string;
    address4: string;
    area: string;
    state: string;
    pincode: string;
    city: string;
  };
  contactInfo: {
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    whatsapp?: string;
  };
  documents: {
    aadharDocument?: string;
    panDocument?: string;
    incomeProof?: string;
    addressProof?: string;
    otherDocument?: string;
  };
  otherInfo: {
    aadharNumber?: string;
    panNumber?: string;
    occupation?: string;
    monthlyIncome?: number;
    referenceBy?: string;
  };
  verification: {
    aadharVerified: boolean;
    fingerprintVerified: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface CustomerSearchFilters {
  customerCode?: string;
  customerName?: string;
  mobile?: string;
  area?: string;
  status?: string;
}

export interface CustomerListResponse {
  customers: Customer[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl =  `${environment.apiUrl}/customers`; // Replace with your actual API URL
  private customersSubject = new BehaviorSubject<Customer[]>([]);
  public customers$ = this.customersSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    this.loadCustomers();
  }

  /**
   * Get all customers with optional filters and pagination
   */
  getCustomers(
    page: number = 1, 
    limit: number = 10, 
    filters?: CustomerSearchFilters
  ): Observable<CustomerListResponse> {
    let params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', limit.toString());
  
    if (filters) {
      if (filters.customerCode) params = params.set('customerCode', filters.customerCode);
      if (filters.area) params = params.set('area', filters.area);
      if (filters.status) params = params.set('status', filters.status);
    }
  
    return this.http.get<any>(`${this.apiUrl}`, { params })
    .pipe(
      map(response => {
        console.log('API Response:', response); // Debug log
        return {
          customers: response.data || [],  // Map 'data' to 'customers'
          totalCount: response.totalCount || 0,
          currentPage: response.pageNumber || 1,  // Map 'pageNumber' to 'currentPage'
          totalPages: response.totalPages || 0
        };
      }),
      catchError(error => {
        console.error('Error fetching customers:', error);
        return of({
          customers: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0
        });
      })
    );
  }

  /**
   * Get customer by ID
   */
  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<Customer>('getCustomerById'))
      );
  }

  /**
   * Get customer by customer code
   */
  getCustomerByCode(customerCode: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/code/${customerCode}`)
      .pipe(
        catchError(this.handleError<Customer>('getCustomerByCode'))
      );
  }

  /**
   * Add new customer
   */
  addCustomer(customer: Customer): Observable<Customer> {
    // Map to backend structure
    const payload = {
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      relationshipName: customer.relationshipName,
      relationName: customer.relationName,
      mobile: customer.mobile,
      dateOfBirth: customer.dateOfBirth,
      profileImage: customer.profileImage,
      addressInfo: customer.addressInfo,
      contactInfo: customer.contactInfo,
      otherInfo: customer.otherInfo,
      documents: customer.documents || {},
      verification: customer.verification
    };
  
    return this.http.post<Customer>(this.apiUrl, payload, this.httpOptions)
    .pipe(
      map(response => {
        this.loadCustomers();
        return response;
      })
      );
  }

  /**
   * Update existing customer
   */
  updateCustomer(id: string, customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer, this.httpOptions)
      .pipe(
        map(response => {
          this.loadCustomers(); // Refresh the customers list
          return response;
        }),
      );
  }

  /**
   * Delete customer
   */
  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.httpOptions)
      .pipe(
        map(response => {
          this.loadCustomers(); // Refresh the customers list
          return response;
        }),
      );
  }

  /**
   * Update customer status
   */
  updateCustomerStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Observable<Customer> {
    return this.http.patch<Customer>(`${this.apiUrl}/${id}/status`, { status }, this.httpOptions)
      .pipe(
        map(response => {
          this.loadCustomers(); // Refresh the customers list
          return response;
        }),
      );
  }

  /**
   * Verify customer's Aadhar
   */
  verifyAadhar(id: string, verified: boolean): Observable<Customer> {
    return this.http.patch<Customer>(`${this.apiUrl}/${id}/verify-aadhar`, { verified }, this.httpOptions)
      .pipe(
        map(response => {
          this.loadCustomers(); // Refresh the customers list
          return response;
        }),
      );
  }

  /**
   * Verify customer's fingerprint
   */
  verifyFingerprint(id: string, verified: boolean): Observable<Customer> {
    return this.http.patch<Customer>(`${this.apiUrl}/${id}/verify-fingerprint`, { verified }, this.httpOptions)
      .pipe(
        map(response => {
          this.loadCustomers(); // Refresh the customers list
          return response;
        }),
      );
  }

  /**
   * Upload customer profile image
   */
  uploadProfileImage(customerId: string, imageFile: File): Observable<{imageUrl: string}> {
    const formData = new FormData();
    formData.append('profileImage', imageFile);

    return this.http.post<{imageUrl: string}>(`${this.apiUrl}/${customerId}/upload-image`, formData)
      .pipe(
        catchError(this.handleError<{imageUrl: string}>('uploadProfileImage'))
      );
  }

  /**
   * Search customers by name or mobile
   */
  searchCustomers(searchTerm: string): Observable<Customer[]> {
    if (!searchTerm.trim()) {
      return of([]);
    }

    return this.http.get<Customer[]>(`${this.apiUrl}/search?q=${encodeURIComponent(searchTerm)}`)
      .pipe(
        catchError(this.handleError<Customer[]>('searchCustomers', []))
      );
  }

  /**
   * Generate unique customer code
   */
  generateCustomerCode(): Observable<{customerCode: string}> {
    return this.http.get<{customerCode: string}>(`${this.apiUrl}/generate-code`)
      .pipe(
        catchError(this.handleError<{customerCode: string}>('generateCustomerCode', {
          customerCode: `PR${Date.now().toString().slice(-6)}`
        }))
      );
  }

  /**
   * Check if customer code exists
   */
  checkCustomerCodeExists(customerCode: string): Observable<{exists: boolean}> {
    return this.http.get<{exists: boolean}>(`${this.apiUrl}/check-code/${customerCode}`)
      .pipe(
        catchError(this.handleError<{exists: boolean}>('checkCustomerCodeExists', { exists: false }))
      );
  }

  /**
   * Get customer statistics
   */
  getCustomerStats(): Observable<{
    totalCustomers: number;
    activeCustomers: number;
    verifiedCustomers: number;
    recentCustomers: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/statistics`)
      .pipe(
        catchError(this.handleError<any>('getCustomerStats', {
          totalCustomers: 0,
          activeCustomers: 0,
          verifiedCustomers: 0,
          recentCustomers: 0
        }))
      );
  }

  /**
   * Export customers to Excel
   */
  exportCustomers(filters?: CustomerSearchFilters): Observable<Blob> {
    let params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof CustomerSearchFilters];
        if (value) {
          params.append(key, value);
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export?${params.toString()}`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError<Blob>('exportCustomers'))
    );
  }

  /**
   * Load customers into subject for reactive updates
   */
  private loadCustomers(): void {
    this.getCustomers(1, 1000).subscribe(response => {
      this.customersSubject.next(response.customers);
    });
  }

  
  /**
   * Handle Http operation that failed
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // You can add more sophisticated error handling here
      // such as sending errors to a logging service
      
      return of(result as T);
    };
  }

  /**
   * Validate customer data before submission
   */
  validateCustomer(customer: Customer): string[] {
    const errors: string[] = [];

    if (!customer.customerCode?.trim()) {
      errors.push('Customer code is required');
    }

    if (!customer.customerName?.trim()) {
      errors.push('Customer name is required');
    }

    if (!customer.mobile?.trim()) {
      errors.push('Mobile number is required');
    } else if (!/^[6-9]\d{9}$/.test(customer.mobile)) {
      errors.push('Invalid mobile number format');
    }

    if (!customer.relationName?.trim()) {
      errors.push('Relation name is required');
    }

    if (!customer.addressInfo?.address1?.trim()) {
      errors.push('Address line 1 is required');
    }

    if (!customer.addressInfo?.pincode?.trim()) {
      errors.push('Pincode is required');
    } else if (!/^\d{6}$/.test(customer.addressInfo.pincode)) {
      errors.push('Invalid pincode format');
    }

    if (customer.otherInfo?.aadharNumber && !/^\d{12}$/.test(customer.otherInfo.aadharNumber)) {
      errors.push('Invalid Aadhar number format');
    }

    if (customer.otherInfo?.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(customer.otherInfo.panNumber)) {
      errors.push('Invalid PAN number format');
    }

    if (customer.contactInfo?.email && !/\S+@\S+\.\S+/.test(customer.contactInfo.email)) {
      errors.push('Invalid email format');
    }

    return errors;
  }
}