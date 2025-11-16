import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RateSet } from './rate-set.service';
import { JewelFault } from './jewel-fault.service';

export interface GoldLoanDetail extends GoldLoan {
  customer?: {
    id: string;
    customerName: string;
    customerCode: string;
  };
}

export interface GoldLoan {
  id?: string;
  series: string;
  loanNumber: string;
  refNumber?: string;
  loanDate: Date;
  maturityDate: Date;
  areaId: string;
  customerId: string;
  customerImage?: string;
  schemeId: string;
  itemGroupId: string;
  loanAmount: number;
  interestRate: number;
  interestAmount: number;
  advanceMonths: number;
  advanceInterestAmount: number;
  processingFeePercent: number;
  processingFeeAmount: number;
  netPayable: number;
  totalQty: number;
  totalGrossWeight: number;
  totalStoneWeight: number;
  totalNetWeight: number;
  totalCalculatedValue: number;
  totalMaximumValue: number;
  dueMonths: number;
  remarks?: string;
  status: string;
  pledgedItems: PledgedItem[];
}

export interface PledgedItem {
  id?: string;
  itemTypeId: string;
  itemName: string;
  purityId: string;
  goldRate: number;
  qty: number;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  calculatedValue: number;
  maximumValue: number;
  remarks?: string;
  jewelFault?: string;
  huid?: string;
  hallmarkPurity?: string;
  hallmarkGrossWeight?: number;
  hallmarkNetWeight?: number;
  images?: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  customerName: string;
  mobile: string;
  relationName:string;
  relationshipName:string;
  address: string;
  address1:string;
  isActive: boolean;
  customerImage?: string;
}

export interface Area {
  id: string;
  areaCode: string;
  areaName: string;
}

export interface ItemGroup {
  id: string;
  groupCode: string;
  groupName: string;
}

export interface Scheme {
  id: string;
  schemeCode: string;
  schemeName: string;
  roi: number;
  calculationMethod: string;
  processingFeePercent: number;
  advanceMonth: number;
  minCalcDays: number;
  graceDays: number;
  minLoanValue: number;
  maxLoanValue: number;
  reductionPercent: number;
  validityInMonths:number;
}

export interface ItemType {
  id: string;
  itemCode: string;
  itemName: string;
  itemNameTamil?: string;
}

export interface Purity {
  id: string;
  purityName: string;
  purityPercentage: number;
  karat: string;
}

export interface CustomerLoanHistory {
  customerName: string;
  customerCode: string;
  mobile:string;
  address:string;
  profileImage:string;
  relationName:string;
  relationshipName:string;
  loanCounts: {
    live: number;
    closed: number;
    matured: number;
    auctioned: number;
  };
  loans: CustomerLoan[];
}

export interface CustomerLoan {
  id: string;
  loanNumber: string;
  loanDate: Date;
  loanAmount: number;
  totalNetWeight: number;
  status: string;
  duration: string;
}

export interface LoanCalculationRequest {
  maximumValue: number;
  roi: number;
  calculationMethod: string;
  dueMonths: number;
  advanceMonths: number;
  processingFeePercent: number;
}

export interface InterestCalculationRequest {
  loanAmount: number;
  roi: number;
  calculationMethod: string;
  dueMonths: number;
  advanceMonths: number;
  processingFeePercent: number;
}

export interface LoanCalculationResponse {
  loanAmount: number;
  interestAmount: number;
  processingFeeAmount: number;
  advanceInterestAmount: number;
  netPayable: number;
  totalRepayable: number;
}

export interface InterestCalculationResponse {
  interestAmount: number;
  processingFeeAmount: number;
  advanceInterestAmount: number;
  netPayable: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class GoldLoanService {
  private apiUrl = `${environment.apiUrl}/goldloans`;
  private helpersUrl = `${environment.apiUrl}/loanhelpers`;
  private rateUrl = `${environment.apiUrl}/ratesets`;
  private customerUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  // Gold Loan CRUD operations
  getGoldLoans(
    page: number = 1,
    pageSize: number = 50,
    searchTerm?: string,
    areaId?: string,
    customerId?: string,
    status?: string
  ): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (areaId) params = params.set('areaId', areaId);
    if (customerId) params = params.set('customerId', customerId);
    if (status) params = params.set('status', status);

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  getGoldLoanById(id: string): Observable<ApiResponse<GoldLoanDetail>> {
    return this.http.get<ApiResponse<GoldLoanDetail>>(`${this.apiUrl}/${id}`);
  }
  getCustomerLoanHistory(customerId: string): Observable<ApiResponse<CustomerLoanHistory>> {
    return this.http.get<ApiResponse<CustomerLoanHistory>>(`${this.apiUrl}/customer/${customerId}/history`);
  }

  getCustomerImage(customerId: string): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.customerUrl}/${customerId}/image`);
  }

  getCurrentRateSetByArea(areaId: string): Observable<ApiResponse<RateSet>> {
    return this.http.get<ApiResponse<RateSet>>(`${this.rateUrl}/area/${areaId}/current`);
  }

  generateLoanNumber(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/generate-loan-number`);
  }

  createGoldLoan(loan: GoldLoan): Observable<ApiResponse<GoldLoan>> {
    return this.http.post<ApiResponse<GoldLoan>>(this.apiUrl, loan);
  }

  updateGoldLoan(id: string, loan: GoldLoan): Observable<ApiResponse<GoldLoan>> {
    return this.http.put<ApiResponse<GoldLoan>>(`${this.apiUrl}/${id}`, loan);
  }

  deleteGoldLoan(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  updateLoanStatus(id: string, status: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/status`, status);
  }

  // Cascading dropdown helpers
  getActiveAreas(): Observable<ApiResponse<Area[]>> {
    return this.http.get<ApiResponse<Area[]>>(`${this.helpersUrl}/active-areas`);
  }

  getCustomersByArea(areaId: string): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(`${this.helpersUrl}/customers-by-area/${areaId}`);
  }

  getItemGroupsByArea(areaId: string): Observable<ApiResponse<ItemGroup[]>> {
    return this.http.get<ApiResponse<ItemGroup[]>>(`${this.helpersUrl}/itemgroups-by-area/${areaId}`);
  }

  getSchemesByItemGroup(itemGroupId: string): Observable<ApiResponse<Scheme[]>> {
    return this.http.get<ApiResponse<Scheme[]>>(`${this.helpersUrl}/schemes-by-itemgroup/${itemGroupId}`);
  }

  getItemTypesByItemGroup(itemGroupId: string): Observable<ApiResponse<ItemType[]>> {
    return this.http.get<ApiResponse<ItemType[]>>(`${this.helpersUrl}/itemtypes-by-itemgroup/${itemGroupId}`);
  }

  getPuritiesByItemGroup(itemGroupId: string): Observable<ApiResponse<Purity[]>> {
    return this.http.get<ApiResponse<Purity[]>>(`${this.helpersUrl}/purities-by-itemgroup/${itemGroupId}`);
  }

  getJewelFaultByItemGroup(itemGroupId: string): Observable<ApiResponse<JewelFault[]>> {
    return this.http.get<ApiResponse<JewelFault[]>>(`${this.helpersUrl}/faults-by-itemgroup/${itemGroupId}`);
  }

  getGoldRatesByItemGroup(itemGroupId: string): Observable<ApiResponse<RateSet[]>> {
    return this.http.get<ApiResponse<RateSet[]>>(`${this.helpersUrl}/gold-rates-by-itemgroup/${itemGroupId}`);
  }

  getSchemeDetails(schemeId: string): Observable<ApiResponse<Scheme>> {
    return this.http.get<ApiResponse<Scheme>>(`${this.helpersUrl}/scheme-details/${schemeId}`);
  }

  calculateLoan(request: LoanCalculationRequest): Observable<ApiResponse<LoanCalculationResponse>> {
    return this.http.post<ApiResponse<LoanCalculationResponse>>(`${this.helpersUrl}/calculate-loan`, request);
  }

  calculateInterestAndFees(request: InterestCalculationRequest): Observable<ApiResponse<InterestCalculationResponse>> {
    return this.http.post<ApiResponse<InterestCalculationResponse>>(`${this.helpersUrl}/calculate-interest-fees`, request);
  }
}