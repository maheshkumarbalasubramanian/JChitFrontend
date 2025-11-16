// services/gold-loan-scheme.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Scheme } from './scheme.service';
import { SchemeStats } from '../app/schemes-view-component/schemes-view-component';
export interface SchemeFormData {
  schemeCode: string;
  schemeName: string;
  roi: number;
  calculationMethod: 'Simple' | 'Multiple' | 'Compound' | 'Emi' | 'Customized';
  isStdRoi: boolean;
  calculationBased: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
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
  compoundingFrequency?: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
  emiTenure?: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SchemeService {
  private http = inject(HttpClient);
  private baseUrl = '/api/gold-loan-schemes'; // Replace with your API URL
  
  // State management
  private schemesSubject = new BehaviorSubject<Scheme[]>([]);
  private statsSubject = new BehaviorSubject<SchemeStats>({ total: 0, active: 0, inactive: 0, simple: 0, compound: 0, emi: 0 });
  
  public schemes$ = this.schemesSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  // API Methods
  getSchemes(): Observable<Scheme[]> {
    return this.http.get<Scheme[]>(this.baseUrl);
  }

  getSchemeById(id: string): Observable<Scheme> {
    return this.http.get<Scheme>(`${this.baseUrl}/${id}`);
  }

  createScheme(scheme: SchemeFormData): Observable<Scheme> {
    return this.http.post<Scheme>(this.baseUrl, scheme);
  }

  updateScheme(id: string, scheme: Partial<SchemeFormData>): Observable<Scheme> {
    return this.http.put<Scheme>(`${this.baseUrl}/${id}`, scheme);
  }

  deleteScheme(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getStats(): Observable<SchemeStats> {
    return this.http.get<SchemeStats>(`${this.baseUrl}/stats`);
  }

  getActiveSchemes(): Observable<Scheme[]> {
    return this.http.get<Scheme[]>(`${this.baseUrl}/active`);
  }

  duplicateScheme(id: string, newName: string): Observable<Scheme> {
    return this.http.post<Scheme>(`${this.baseUrl}/${id}/duplicate`, { newName });
  }

  validateScheme(scheme: SchemeFormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/validate`, scheme);
  }

  // State management methods
  updateSchemes(schemes: Scheme[]) {
    this.schemesSubject.next(schemes);
  }

  updateStats(stats: SchemeStats) {
    this.statsSubject.next(stats);
  }

  getCurrentSchemes(): Scheme[] {
    return this.schemesSubject.value;
  }

  getCurrentStats(): SchemeStats {
    return this.statsSubject.value;
  }

  // Utility methods
  generateSchemeCode(existingCodes: string[]): string {
    let counter = 1;
    let code: string;
    
    if (existingCodes.length === 0) {
      return 'STD';
    }
    
    do {
      code = `SCH${counter}`;
      counter++;
    } while (existingCodes.includes(code));
    
    return code;
  }

  calculateInterest(principal: number, scheme: Scheme, days: number): number {
    const annualRate = scheme.roi / 100;
    const dailyRate = annualRate / 365;
    
    switch (scheme.calculationMethod) {
      case 'Simple':
        return principal * dailyRate * days;
      
      case 'Compound':
        const frequency = this.getCompoundingFrequency(scheme.compoundingFrequency || 'Monthly');
        const periodicRate = annualRate / frequency;
        const periods = (days / 365) * frequency;
        return principal * (Math.pow(1 + periodicRate, periods) - 1);
      
      case 'Emi':
        const monthlyRate = annualRate / 12;
        const months = scheme.emiTenure || 12;
        const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
        return emi * months - principal;
      
      default:
        return principal * dailyRate * days;
    }
  }

  private getCompoundingFrequency(frequency: string): number {
    switch (frequency) {
      case 'Monthly': return 12;
      case 'Quarterly': return 4;
      case 'Half-yearly': return 2;
      case 'Yearly': return 1;
      default: return 12;
    }
  }

  validateLoanAmount(amount: number, scheme: Scheme): boolean {
    return amount >= scheme.minLoanValue && amount <= scheme.maxLoanValue;
  }

  validateMarketValue(value: number, scheme: Scheme): boolean {
    return value >= scheme.minMarketValue && value <= scheme.maxMarketValue;
  }
}
