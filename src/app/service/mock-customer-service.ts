import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { CustomerService, Customer, CustomerSearchFilters, CustomerListResponse} from './customer-service';

@Injectable({
  providedIn: 'root'
})
export class MockCustomerService {
  // Create mock customers data
  private mockCustomers: Customer[] = [
    {
      id: '1',
      customerCode: 'PR001',
      customerName: 'Vaisnavi Maheshkumar',
      relationName: 'Maheshkumar',
      relationshipName: 'S/o',
      mobile: '9876543210',
      profileImage: '',
      addressInfo: {
        address1: '123 Main St',
        address2: '',
        address3: '',
        address4: '',
        area: 'PRIMARY',
        state: 'Telangana',
        pincode: '500001',
        city: 'Hyderabad'
      },
      contactInfo: {
        primaryPhone: '9876543210',
        email: 'john@example.com'
      },
      otherInfo: {},
      documents: {},
      verification: {
        aadharVerified: false,
        fingerprintVerified: false
      },
      status: 'ACTIVE'
    },
    {
      id: '2',
      customerCode: 'PR002',
      customerName: 'Parikshit Maheshkumar',
      relationshipName: 'D/o',
      relationName: 'Maheshkumar',
      mobile: '9876543211',
      profileImage: '',
      addressInfo: {
        address1: '456 Oak St',
        address2: '',
        address3: '',
        address4: '',
        area: 'SECONDARY',
        state: 'Telangana',
        pincode: '500002',
        city: 'Hyderabad'
      },
      documents: {},
      contactInfo: {
        primaryPhone: '9876543211',
        email: 'jane@example.com'
      },
      otherInfo: {},
      verification: {
        aadharVerified: true,
        fingerprintVerified: false
      },
      status: 'ACTIVE'
    }
  ];

  // Fix this line - return the actual mock customers
  customers$ = of(this.mockCustomers);

  getCustomers(page: number = 1, limit: number = 10, filters?: CustomerSearchFilters): Observable<CustomerListResponse> {
    return of({
      customers: this.mockCustomers,
      totalCount: this.mockCustomers.length,
      currentPage: page,
      totalPages: 1
    });
  }

  getCustomerStats() {
    return of({
      totalCustomers: this.mockCustomers.length,
      activeCustomers: this.mockCustomers.filter(c => c.status === 'ACTIVE').length,
      verifiedCustomers: this.mockCustomers.filter(c => c.verification.aadharVerified).length,
      recentCustomers: this.mockCustomers.length
    });
  }

  // Add other required methods with mock implementations
  deleteCustomer(id: string) { return of({}); }
  updateCustomerStatus(id: string, status: string) { return of({}); }
  exportCustomers(filters?: any) { return of(new Blob()); }
}