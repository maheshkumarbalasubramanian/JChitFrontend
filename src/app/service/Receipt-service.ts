import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Receipt {
  id?: string;
  receiptNumber: string;
  receiptDate: Date;
  tillDate: Date;
  goldLoanId: string;
  customerId: string;
  loanNumber: string;
  customerCode: string;
  paymentType: string;
  principalAmount: number;
  interestAmount: number;
  otherCredits: number;
  otherDebits: number;
  defaultAmount: number;
  addLess: number;
  netPayable: number;
  calculatedInterest: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  remarks?: string;
  status?: string;
  interestStatements: InterestStatement[];
  paymentModes: ReceiptPaymentMode[];
}

export interface InterestStatement {
  id?: string;
  receiptId?: string;
  goldLoanId: string;
  fromDate: Date;
  toDate: Date;
  durationDays: number;
  interestAccrued: number;
  totalAccrued: number;
  interestPaid: number;
  principalPaid: number;
  addedPrincipal: number;
  adjustedPrincipal: number;
  newPrincipal: number;
  openingPrincipal: number;
  closingPrincipal: number;
}

export interface ReceiptPaymentMode {
  id?: string;
  receiptId?: string;
  paymentMode: string;
  amount: number;
  referenceNumber?: string;
}

export interface InterestCalculation {
  fromDate: Date;
  tillDate: Date;
  daysCalculated: number;
  effectiveDays: number;
  minCalcDays: number;
  outstandingPrincipal: number;
  interestAmount: number;
  interestStatements: any[];
  lastReceiptDate?: Date;
  lastReceiptNumber?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private apiUrl = `${environment.apiUrl}/receipts`;

  constructor(private http: HttpClient) {}

  // Generate receipt number
  generateReceiptNumber(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/generate-receipt-number`);
  }

  // Calculate interest for a loan
  calculateInterest(loanId: string, tillDate: string): Observable<ApiResponse<InterestCalculation>> {
    const params = new HttpParams().set('tillDate', tillDate);
    return this.http.get<ApiResponse<InterestCalculation>>(`${this.apiUrl}/loan/${loanId}/calculate-interest`, { params });
  }

  // Create new receipt
  createReceipt(receipt: Receipt): Observable<ApiResponse<{ id: string; receiptNumber: string }>> {
    return this.http.post<ApiResponse<{ id: string; receiptNumber: string }>>(this.apiUrl, receipt);
  }

  // Update existing receipt
  updateReceipt(id: string, receipt: Receipt): Observable<ApiResponse<{ id: string; receiptNumber: string }>> {
    return this.http.put<ApiResponse<{ id: string; receiptNumber: string }>>(`${this.apiUrl}/${id}`, receipt);
  }

  // Get all receipts with filters
  getReceipts(
    page: number = 1,
    pageSize: number = 50,
    searchTerm?: string,
    loanId?: string,
    customerId?: string,
    status?: string
  ): Observable<ApiResponse<{ receipts: any[]; total: number; page: number; pageSize: number }>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (loanId) {
      params = params.set('loanId', loanId);
    }
    if (customerId) {
      params = params.set('customerId', customerId);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<{ receipts: any[]; total: number; page: number; pageSize: number }>>(
      this.apiUrl,
      { params }
    );
  }

  // Get receipt by ID
  getReceiptById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  // Delete/Cancel receipt
  deleteReceipt(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Get receipts by loan ID
  getReceiptsByLoanId(loanId: string): Observable<ApiResponse<{ receipts: any[]; total: number }>> {
    const params = new HttpParams().set('loanId', loanId);
    return this.http.get<ApiResponse<{ receipts: any[]; total: number }>>(this.apiUrl, { params });
  }

  // Get receipts by customer ID
  getReceiptsByCustomerId(customerId: string): Observable<ApiResponse<{ receipts: any[]; total: number }>> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.get<ApiResponse<{ receipts: any[]; total: number }>>(this.apiUrl, { params });
  }
}